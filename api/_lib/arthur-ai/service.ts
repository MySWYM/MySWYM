/**
 * arthurAIService — cœur Phase C + Production Readiness (G).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertProcessInput,
  conversationBelongsToAuth,
} from "./security.js";
import { buildArthurContext, serializeContextForModel } from "./context.js";
import { getActiveArthurPrompt } from "./prompt.js";
import { callArthurOpenAI, isArthurMockMode } from "./openai.js";
import { normalizeExtractedData } from "./intent.js";
import { trackAiEvent } from "./tracking.js";
import { arthurLog } from "./logging.js";
import { createArthurAdminClient } from "./supabase.js";
import { rescoreLeadById } from "./growth/scoring.js";
import { recordResponseOptimization } from "./optimization/run.js";
import { fetchRelevantKnowledge } from "./optimization/knowledge.js";
import {
  getArthurFeatureFlags,
  assertChannelEnabled,
  checkRateLimit,
  recordUsage,
  checkCostBudget,
  bumpCostDaily,
  emitCostBudgetEvent,
  buildOfflineResponse,
  hasOpenAiApiKey,
  detectsHumanTakeoverRequest,
  takeoverHoldMessage,
  isConversationInTakeover,
  startHumanTakeover,
  type OfflineReason,
} from "./production/index.js";
import type {
  AuthContext,
  ExtractedLeadData,
  ProcessArthurMessageInput,
  ProcessArthurMessageResult,
  ArthurStructuredOutput,
} from "./types.js";

export async function processArthurMessage(
  input: ProcessArthurMessageInput,
  deps?: { admin?: SupabaseClient },
): Promise<ProcessArthurMessageResult> {
  const validated = assertProcessInput(input);
  if (!validated.ok) {
    throw new ArthurAIError(validated.error, 400);
  }

  const { message, auth, conversationId: requestedId } = validated;
  const admin = deps?.admin || createArthurAdminClient();
  const flags = getArthurFeatureFlags();

  const conversationId = await getOrCreateConversation(
    admin,
    auth,
    requestedId,
  );

  await insertMessage(admin, conversationId, "user", message);

  if (auth.channel === "instagram") {
    await trackAiEvent(admin, {
      conversationId,
      userId: auth.userId,
      eventType: "dm_received",
      metadata: {
        channel: auth.channel,
        source: input.attribution?.source || null,
        campaign: input.attribution?.campaign || null,
        reel_id: input.attribution?.reel_id || null,
        keyword: input.attribution?.keyword || null,
      },
    });
  }

  const channelOk = assertChannelEnabled(
    auth.channel === "instagram" ? "instagram" : "web",
    flags,
  );
  if (!channelOk.ok) {
    await trackAiEvent(admin, {
      conversationId,
      userId: auth.userId,
      eventType: "feature_flag_blocked",
      metadata: { reason: channelOk.reason, channel: auth.channel },
    });
    return finishWithStructured(admin, input, auth, conversationId, {
      structured: buildOfflineResponse(message, { reason: "channel_disabled" }),
      model: "offline",
      offlineReason: "channel_disabled",
      promptSource: "offline",
      promptName: "channel_disabled",
    });
  }

  // Human takeover (global flag ou conversation déjà en pause)
  const inTakeover =
    flags.human_takeover_all ||
    (await isConversationInTakeover(admin, conversationId));

  if (flags.human_takeover_all && !(await isConversationInTakeover(admin, conversationId))) {
    await startHumanTakeover(admin, {
      conversationId,
      auth,
      reason: "global_flag",
      requestedBy: "flag",
    });
    await bumpCostDaily(admin, { takeover: true, requests: 1 });
  }

  if (inTakeover || flags.human_takeover_all) {
    return finishWithStructured(admin, input, auth, conversationId, {
      structured: takeoverHoldMessage(),
      model: "human_takeover",
      promptSource: "takeover",
      promptName: "human_hold",
      skipOptimization: true,
    });
  }

  if (detectsHumanTakeoverRequest(message)) {
    await startHumanTakeover(admin, {
      conversationId,
      auth,
      reason: "user_keyword",
      requestedBy: "user_keyword",
    });
    await bumpCostDaily(admin, { takeover: true, requests: 1 });
    return finishWithStructured(admin, input, auth, conversationId, {
      structured: takeoverHoldMessage(),
      model: "human_takeover",
      promptSource: "takeover",
      promptName: "user_request",
      skipOptimization: true,
    });
  }

  const rate = await checkRateLimit(admin, auth);
  if (!rate.allowed) {
    await trackAiEvent(admin, {
      conversationId,
      userId: auth.userId,
      eventType: "rate_limited",
      metadata: { reason: rate.reason, hour: rate.hourCount, day: rate.dayCount },
    });
    await bumpCostDaily(admin, { rateLimited: true, requests: 1 });
    return finishWithStructured(admin, input, auth, conversationId, {
      structured: buildOfflineResponse(message, { reason: "rate_limited" }),
      model: "rate_limited",
      offlineReason: "rate_limited",
      promptSource: "offline",
      promptName: "rate_limited",
    });
  }

  const costStatus = await checkCostBudget(admin);
  if (costStatus.level !== "ok") {
    await emitCostBudgetEvent(admin, costStatus);
  }

  const forceOffline =
    flags.offline_force ||
    costStatus.level === "hard" ||
    (!hasOpenAiApiKey() && !isArthurMockMode());

  let openaiResult: {
    structured: ArthurStructuredOutput;
    model: string;
    tokensInput: number | null;
    tokensOutput: number | null;
    costEstimate: number | null;
    rawText: string;
    mock: boolean;
    toolCalls: Array<{ name: string; result: Record<string, unknown> }>;
  };
  let promptSource = "database";
  let promptName = "unknown";
  let offlineReason: OfflineReason | undefined;

  if (forceOffline) {
    offlineReason = flags.offline_force
      ? "flag_offline"
      : costStatus.level === "hard"
        ? "cost_budget_hard"
        : "no_api_key";
    const snippets = await fetchRelevantKnowledge(admin, {
      message,
      limit: 1,
    });
    openaiResult = {
      structured: buildOfflineResponse(message, {
        reason: offlineReason,
        snippets,
      }),
      model: "offline",
      tokensInput: null,
      tokensOutput: null,
      costEstimate: 0,
      rawText: "",
      mock: false,
      toolCalls: [],
    };
    promptSource = "offline";
    promptName = offlineReason;
    await trackAiEvent(admin, {
      conversationId,
      userId: auth.userId,
      eventType: "offline_fallback",
      metadata: { reason: offlineReason },
    });
    await bumpCostDaily(admin, { offline: true, requests: 1 });
  } else {
    const [ctx, prompt] = await Promise.all([
      buildArthurContext({
        admin,
        auth,
        conversationId,
        currentMessage: message,
      }),
      getActiveArthurPrompt(admin),
    ]);
    promptSource = prompt.source;
    promptName = prompt.name;
    const userPayload = serializeContextForModel(ctx, message);

    try {
      openaiResult = await callArthurOpenAI({
        systemPrompt: prompt.content,
        userPayload,
        auth,
        toolCtx: {
          admin,
          auth,
          conversationId,
          accessToken: input.accessToken || null,
        },
      });
    } catch (err) {
      arthurLog("error", "process_openai_fallback", {
        conversationId,
        name: err instanceof Error ? err.name : "Error",
      });
      offlineReason = "openai_error";
      const snippets = await fetchRelevantKnowledge(admin, {
        message,
        limit: 1,
      });
      openaiResult = {
        structured: buildOfflineResponse(message, {
          reason: "openai_error",
          snippets,
        }),
        model: "offline",
        tokensInput: null,
        tokensOutput: null,
        costEstimate: null,
        rawText: "",
        mock: false,
        toolCalls: [],
      };
      promptSource = "offline";
      promptName = "openai_error";
      await trackAiEvent(admin, {
        conversationId,
        userId: auth.userId,
        eventType: "offline_fallback",
        metadata: { reason: "openai_error" },
      });
      await bumpCostDaily(admin, { offline: true, requests: 1 });
    }
  }

  const structured = openaiResult.structured;

  if (structured.suggested_action === "handoff_human") {
    await startHumanTakeover(admin, {
      conversationId,
      auth,
      reason: "suggested_action",
      requestedBy: "suggested_action",
    });
    await bumpCostDaily(admin, { takeover: true });
  }

  await recordUsage(admin, auth, {
    tokensIn: openaiResult.tokensInput,
    tokensOut: openaiResult.tokensOutput,
    costUsd: openaiResult.costEstimate,
  });
  if (!offlineReason) {
    await bumpCostDaily(admin, {
      requests: 1,
      tokensIn: openaiResult.tokensInput || 0,
      tokensOut: openaiResult.tokensOutput || 0,
      costUsd: openaiResult.costEstimate || 0,
    });
  }

  return finishWithStructured(admin, input, auth, conversationId, {
    structured,
    model: openaiResult.model,
    tokensInput: openaiResult.tokensInput,
    tokensOutput: openaiResult.tokensOutput,
    costEstimate: openaiResult.costEstimate,
    mock: openaiResult.mock,
    toolCalls: openaiResult.toolCalls,
    promptSource,
    promptName,
    offlineReason,
    skipOptimization: !flags.optimization,
  });
}

async function finishWithStructured(
  admin: SupabaseClient,
  input: ProcessArthurMessageInput,
  auth: AuthContext,
  conversationId: string,
  opts: {
    structured: ArthurStructuredOutput;
    model: string;
    tokensInput?: number | null;
    tokensOutput?: number | null;
    costEstimate?: number | null;
    mock?: boolean;
    toolCalls?: Array<{ name: string; result: Record<string, unknown> }>;
    promptSource: string;
    promptName: string;
    offlineReason?: OfflineReason;
    skipOptimization?: boolean;
  },
): Promise<ProcessArthurMessageResult> {
  let structured = opts.structured;
  if (auth.channel === "instagram") {
    const { applyShadowReplyPolicy } = await import("./shadow/reply-policy.js");
    structured = applyShadowReplyPolicy(structured, input.message);
  }

  await insertMessage(admin, conversationId, "assistant", structured.message, {
    intent: structured.intent,
    lead_temperature: structured.lead_temperature,
    suggested_action: structured.suggested_action,
    extracted_data: structured.extracted_data,
    prompt_source: opts.promptSource,
    prompt_name: opts.promptName,
    offline_reason: opts.offlineReason || null,
    tool_calls: (opts.toolCalls || []).map((t) => t.name),
  });

  await trackAiEvent(admin, {
    conversationId,
    userId: auth.userId,
    eventType: "ai_response",
    metadata: {
      intent: structured.intent,
      lead_temperature: structured.lead_temperature,
      suggested_action: structured.suggested_action,
      prompt_source: opts.promptSource,
      mock: opts.mock === true,
      offline: Boolean(opts.offlineReason),
      offline_reason: opts.offlineReason || null,
      tools: (opts.toolCalls || []).map((t) => t.name),
    },
    tokensInput: opts.tokensInput ?? null,
    tokensOutput: opts.tokensOutput ?? null,
    model: opts.model,
    costEstimate: opts.costEstimate ?? null,
  });

  await upsertUserContext(admin, auth, structured.intent, structured.extracted_data);
  await touchConversation(admin, conversationId);
  await maybeUpsertLead(admin, auth, conversationId, structured, input.attribution);

  if (!opts.skipOptimization) {
    await recordResponseOptimization(admin, {
      conversationId,
      userId: auth.userId,
      externalUserId: auth.externalUserId,
      channel: auth.channel,
      message: structured.message,
      intent: structured.intent,
      suggestedAction: structured.suggested_action,
      leadTemperature: structured.lead_temperature,
      reelId: input.attribution?.reel_id,
      campaign: input.attribution?.campaign,
    });
  }

  return {
    conversationId,
    message: structured.message,
    intent: structured.intent,
    lead_temperature: structured.lead_temperature,
    extracted_data: structured.extracted_data,
    suggested_action: structured.suggested_action,
    model: opts.model,
    mock: opts.mock,
    toolCalls: opts.toolCalls || [],
  };
}

export class ArthurAIError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ArthurAIError";
    this.status = status;
  }
}

async function getOrCreateConversation(
  admin: SupabaseClient,
  auth: AuthContext,
  requestedId: string | null,
): Promise<string> {
  if (requestedId) {
    const { data, error } = await admin
      .from("ai_conversations")
      .select("id, user_id, external_user_id, status")
      .eq("id", requestedId)
      .maybeSingle();

    if (error) {
      arthurLog("error", "conversation_fetch_failed", { code: error.code });
      throw new ArthurAIError("Conversation inaccessible", 500);
    }
    if (!data) throw new ArthurAIError("Conversation introuvable", 404);
    if (!conversationBelongsToAuth(data, auth)) {
      throw new ArthurAIError("Accès conversation refusé", 403);
    }
    return data.id;
  }

  // Réutiliser conversation active OU en takeover/pause (ne pas en créer une 2e)
  let existingQuery = admin
    .from("ai_conversations")
    .select("id, user_id, external_user_id")
    .eq("channel", auth.channel)
    .in("status", ["active", "human_takeover", "paused"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (auth.channel === "instagram" && auth.externalUserId) {
    existingQuery = existingQuery.eq("external_user_id", auth.externalUserId);
  } else if (auth.userId) {
    existingQuery = existingQuery.eq("user_id", auth.userId);
  } else if (auth.externalUserId) {
    existingQuery = existingQuery.eq("external_user_id", auth.externalUserId);
  }

  const { data: existing } = await existingQuery.maybeSingle();
  if (existing?.id && conversationBelongsToAuth(existing, auth)) {
    // Rattache user_id si lien verified récent (sans créer de compte)
    if (
      auth.userId &&
      auth.externalUserId &&
      existing.external_user_id === auth.externalUserId &&
      !existing.user_id
    ) {
      await admin
        .from("ai_conversations")
        .update({ user_id: auth.userId, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error: createErr } = await admin
    .from("ai_conversations")
    .insert({
      user_id: auth.userId,
      external_user_id: auth.externalUserId,
      channel: auth.channel,
      status: "active",
    })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    arthurLog("error", "conversation_create_failed", {
      code: createErr?.code,
    });
    throw new ArthurAIError("Impossible de créer la conversation", 500);
  }

  return created.id;
}

async function insertMessage(
  admin: SupabaseClient,
  conversationId: string,
  role: "user" | "assistant" | "system" | "tool",
  content: string,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    metadata: metadata || null,
  });
  if (error) {
    arthurLog("error", "message_insert_failed", { role, code: error.code });
    throw new ArthurAIError("Échec sauvegarde message", 500);
  }
}

async function touchConversation(
  admin: SupabaseClient,
  conversationId: string,
): Promise<void> {
  await admin
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

async function upsertUserContext(
  admin: SupabaseClient,
  auth: AuthContext,
  intent: string,
  extracted: ExtractedLeadData,
): Promise<void> {
  try {
    const factsPatch = compactFacts(extracted);
    const now = new Date().toISOString();

    let existingQuery = admin
      .from("ai_user_context")
      .select("id, facts, summary")
      .limit(1);

    if (auth.userId) {
      existingQuery = existingQuery.eq("user_id", auth.userId);
    } else if (auth.externalUserId) {
      existingQuery = existingQuery
        .eq("external_user_id", auth.externalUserId)
        .is("user_id", null);
    } else {
      return;
    }

    const { data: existing } = await existingQuery.maybeSingle();
    const prevFacts =
      existing?.facts && typeof existing.facts === "object"
        ? (existing.facts as Record<string, unknown>)
        : {};
    const mergedFacts = { ...prevFacts, ...factsPatch };

    const summaryBits: string[] = [];
    if (mergedFacts.goal) summaryBits.push(`Objectif: ${mergedFacts.goal}`);
    if (mergedFacts.level) summaryBits.push(`Niveau: ${mergedFacts.level}`);
    if (mergedFacts.frequency != null) {
      summaryBits.push(`Fréquence: ${mergedFacts.frequency}/sem`);
    }
    const summary =
      summaryBits.length > 0
        ? summaryBits.join(" · ")
        : existing?.summary || null;

    if (existing?.id) {
      await admin
        .from("ai_user_context")
        .update({
          facts: mergedFacts,
          last_intent: intent,
          summary,
          updated_at: now,
        })
        .eq("id", existing.id);
    } else {
      await admin.from("ai_user_context").insert({
        user_id: auth.userId,
        external_user_id: auth.externalUserId,
        facts: mergedFacts,
        last_intent: intent,
        summary,
        updated_at: now,
      });
    }
  } catch (err) {
    arthurLog("warn", "upsert_user_context_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

function compactFacts(extracted: ExtractedLeadData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const data = normalizeExtractedData(extracted);
  if (data.goal) out.goal = data.goal;
  if (data.level) out.level = data.level;
  if (data.frequency != null) out.frequency = data.frequency;
  if (data.target_date) out.target_date = data.target_date;
  if (data.distance) out.distance = data.distance;
  if (data.pace) out.pace = data.pace;
  if (data.equipment?.length) out.equipment = data.equipment;
  if (data.injury) out.injury = data.injury;
  if (data.needs_plan) out.needs_plan = true;
  if (data.needs_human) out.needs_human = true;
  return out;
}

async function maybeUpsertLead(
  admin: SupabaseClient,
  auth: AuthContext,
  conversationId: string,
  structured: {
    intent: string;
    lead_temperature: string;
    extracted_data: ExtractedLeadData;
  },
  attribution?: ProcessArthurMessageInput["attribution"],
): Promise<void> {
  if (!auth.externalUserId && auth.channel !== "instagram") {
    return;
  }
  if (!auth.externalUserId) return;

  try {
    const { data: existing } = await admin
      .from("ai_leads")
      .select(
        "id, status, goal, level, frequency, intent, source, campaign, reel_id, keyword",
      )
      .eq("external_user_id", auth.externalUserId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const extracted = normalizeExtractedData(structured.extracted_data);
    const now = new Date().toISOString();
    const patch = {
      conversation_id: conversationId,
      external_user_id: auth.externalUserId,
      user_id: auth.userId,
      source: attribution?.source || existing?.source || auth.channel,
      campaign: attribution?.campaign || existing?.campaign || null,
      reel_id: attribution?.reel_id || existing?.reel_id || null,
      keyword: attribution?.keyword || existing?.keyword || null,
      intent: structured.intent,
      goal: extracted.goal,
      level: extracted.level,
      frequency: extracted.frequency,
      target_date: extracted.target_date,
      updated_at: now,
      last_event_at: now,
      status:
        structured.lead_temperature === "hot" && existing?.status === "new"
          ? "qualified"
          : existing?.status || "new",
    };

    let leadId: string | null = existing?.id || null;

    if (existing?.id) {
      await admin.from("ai_leads").update(patch).eq("id", existing.id);
      if (patch.status === "qualified" && existing.status !== "qualified") {
        await trackAiEvent(admin, {
          conversationId,
          userId: auth.userId,
          eventType: "lead_qualified",
          metadata: {
            intent: structured.intent,
            source: patch.source,
            campaign: patch.campaign,
            reel_id: patch.reel_id,
            keyword: patch.keyword,
          },
        });
      }
    } else {
      const { data: inserted } = await admin
        .from("ai_leads")
        .insert({
          ...patch,
          first_touch_at: now,
          status: structured.lead_temperature === "hot" ? "qualified" : "new",
        })
        .select("id")
        .maybeSingle();
      leadId = inserted?.id || null;
    }

    if (leadId) {
      await rescoreLeadById(admin, leadId, {
        lead_temperature: structured.lead_temperature,
        keyword: patch.keyword,
        status: patch.status,
      });
    }
  } catch (err) {
    arthurLog("warn", "upsert_lead_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}
