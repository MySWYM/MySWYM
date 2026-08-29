/**
 * Orchestration F3, scorer / CTA / insights (pas d’envoi auto).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { scoreResponseQuality } from "./quality.js";
import { analyzeConversation } from "./analyze.js";
import { trackCtaSent } from "./cta.js";
import { fetchRelevantKnowledge } from "./knowledge.js";

export async function recordResponseOptimization(
  admin: SupabaseClient,
  input: {
    conversationId: string;
    userId?: string | null;
    externalUserId?: string | null;
    channel?: string | null;
    message: string;
    intent?: string | null;
    suggestedAction?: string | null;
    leadTemperature?: string | null;
    reelId?: string | null;
    campaign?: string | null;
  },
): Promise<void> {
  try {
    const knowledge = await fetchRelevantKnowledge(admin, {
      intent: input.intent,
      message: input.message,
      limit: 2,
    });

    const quality = scoreResponseQuality({
      message: input.message,
      intent: input.intent,
      suggested_action: input.suggestedAction,
      lead_temperature: input.leadTemperature,
      channel: input.channel,
      knowledge_topics: knowledge.map((k) => k.topic),
    });

    await admin.from("ai_response_scores").insert({
      conversation_id: input.conversationId,
      user_id: input.userId || null,
      channel: input.channel || null,
      intent: input.intent || null,
      suggested_action: input.suggestedAction || null,
      message_length: quality.message_length,
      quality_score: quality.quality_score,
      quality_band: quality.quality_band,
      reasons: quality.reasons,
      cta_detected: quality.cta_detected,
      cta_type: quality.cta_type,
      knowledge_topic_hit: quality.knowledge_topic_hit,
    });

    await trackAiEvent(admin, {
      conversationId: input.conversationId,
      userId: input.userId,
      eventType: "response_scored",
      metadata: {
        quality_score: quality.quality_score,
        quality_band: quality.quality_band,
        cta_detected: quality.cta_detected,
      },
    });

    if (knowledge.length) {
      await trackAiEvent(admin, {
        conversationId: input.conversationId,
        userId: input.userId,
        eventType: "knowledge_served",
        metadata: {
          topics: knowledge.map((k) => k.topic),
          titles: knowledge.map((k) => k.title),
        },
      });
    }

    await trackCtaSent(admin, {
      conversationId: input.conversationId,
      userId: input.userId,
      externalUserId: input.externalUserId,
      channel: input.channel || "instagram",
      message: input.message,
      suggestedAction: input.suggestedAction,
      reelId: input.reelId,
      campaign: input.campaign,
    });
  } catch (err) {
    arthurLog("warn", "record_response_optimization_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

export async function analyzeAndPersistConversation(
  admin: SupabaseClient,
  conversationId: string,
): Promise<{ ok: boolean; drop_risk?: string }> {
  try {
    const { data: conv } = await admin
      .from("ai_conversations")
      .select("id, external_user_id, user_id, channel")
      .eq("id", conversationId)
      .maybeSingle();

    const { data: messages } = await admin
      .from("ai_messages")
      .select("role, content, created_at, metadata")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(80);

    const analysis = analyzeConversation(messages || []);

    const { data: scores } = await admin
      .from("ai_response_scores")
      .select("quality_score")
      .eq("conversation_id", conversationId);
    const avgQuality =
      scores && scores.length
        ? Number(
            (
              scores.reduce((a, s) => a + (s.quality_score || 0), 0) /
              scores.length
            ).toFixed(1),
          )
        : null;

    await admin.from("ai_conversation_insights").upsert(
      {
        conversation_id: conversationId,
        external_user_id: conv?.external_user_id || null,
        user_id: conv?.user_id || null,
        channel: conv?.channel || null,
        message_count: analysis.message_count,
        user_message_count: analysis.user_message_count,
        assistant_message_count: analysis.assistant_message_count,
        drop_risk: analysis.drop_risk,
        avg_quality: avgQuality,
        cta_count: analysis.cta_count,
        intents: analysis.intents,
        findings: analysis.findings,
        recommendations: analysis.recommendations,
        analyzed_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" },
    );

    await trackAiEvent(admin, {
      conversationId,
      userId: conv?.user_id,
      eventType: "conversation_analyzed",
      metadata: {
        drop_risk: analysis.drop_risk,
        findings: analysis.findings.slice(0, 10),
      },
    });

    return { ok: true, drop_risk: analysis.drop_risk };
  } catch (err) {
    arthurLog("warn", "analyze_conversation_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false };
  }
}

export async function batchAnalyzeRecentConversations(
  admin: SupabaseClient,
  opts: { limit?: number; days?: number } = {},
): Promise<{ scanned: number; analyzed: number }> {
  const limit = Math.min(100, Math.max(1, opts.limit || 30));
  const days = Math.min(90, Math.max(1, opts.days || 14));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: convs } = await admin
    .from("ai_conversations")
    .select("id")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(limit);

  let analyzed = 0;
  for (const c of convs || []) {
    const r = await analyzeAndPersistConversation(admin, c.id);
    if (r.ok) analyzed += 1;
  }
  return { scanned: (convs || []).length, analyzed };
}
