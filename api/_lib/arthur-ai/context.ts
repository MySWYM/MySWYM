/**
 * Construction du contexte Arthur AI (pas d’historique illimité).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext, ArthurContextPayload, ArthurRecentMessage } from "./types.js";
import { conversationBelongsToAuth } from "./security.js";
import { arthurLog } from "./logging.js";
import {
  getUserProfile,
  getCurrentPlan,
  getTrainingHistory,
  getSubscriptionStatus,
} from "./tools/index.js";
import { fetchRelevantKnowledge } from "./optimization/knowledge.js";

export const RECENT_MESSAGES_LIMIT = 12;

export interface BuildArthurContextInput {
  admin: SupabaseClient;
  auth: AuthContext;
  conversationId: string;
  /** Message courant (pas encore en DB au moment du build). */
  currentMessage?: string;
}

export async function buildArthurContext(
  input: BuildArthurContextInput,
): Promise<ArthurContextPayload> {
  const { admin, auth, conversationId } = input;

  const [
    user_profile,
    planPreview,
    history,
    subscription,
    memory,
    recent_messages,
    lead_context,
    knowledge,
  ] = await Promise.all([
    getUserProfile(admin, auth.userId),
    getCurrentPlan(admin, auth.userId),
    getTrainingHistory(admin, auth.userId),
    getSubscriptionStatus(admin, auth.userId),
    loadUserContext(admin, auth),
    loadRecentMessages(admin, conversationId, auth),
    loadLeadContext(admin, auth, conversationId),
    fetchRelevantKnowledge(admin, {
      intent: null,
      message: input.currentMessage || "",
      limit: 2,
    }),
  ]);

  return {
    user_profile: {
      ...user_profile,
      plan_preview: planPreview,
      training_history_preview: history,
    },
    subscription,
    summary: memory.summary || "",
    facts: memory.facts || {},
    recent_messages,
    lead_context,
    knowledge_hints: knowledge.map((k) => ({
      topic: k.topic,
      title: k.title,
      content: k.content,
    })),
  };
}

async function loadUserContext(
  admin: SupabaseClient,
  auth: AuthContext,
): Promise<{ summary: string; facts: Record<string, unknown>; last_intent: string | null }> {
  try {
    let query = admin
      .from("ai_user_context")
      .select("summary, facts, last_intent, user_id, external_user_id")
      .limit(1);

    if (auth.userId) {
      query = query.eq("user_id", auth.userId);
    } else if (auth.externalUserId) {
      query = query.eq("external_user_id", auth.externalUserId).is("user_id", null);
    } else {
      return { summary: "", facts: {}, last_intent: null };
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      arthurLog("warn", "load_user_context_error", { code: error.code });
      return { summary: "", facts: {}, last_intent: null };
    }
    if (!data) return { summary: "", facts: {}, last_intent: null };

    // Double check anti cross-user
    if (auth.userId && data.user_id && data.user_id !== auth.userId) {
      return { summary: "", facts: {}, last_intent: null };
    }
    if (
      !auth.userId &&
      auth.externalUserId &&
      data.external_user_id !== auth.externalUserId
    ) {
      return { summary: "", facts: {}, last_intent: null };
    }

    return {
      summary: typeof data.summary === "string" ? data.summary : "",
      facts:
        data.facts && typeof data.facts === "object" && !Array.isArray(data.facts)
          ? (data.facts as Record<string, unknown>)
          : {},
      last_intent: typeof data.last_intent === "string" ? data.last_intent : null,
    };
  } catch (err) {
    arthurLog("warn", "load_user_context_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { summary: "", facts: {}, last_intent: null };
  }
}

async function loadRecentMessages(
  admin: SupabaseClient,
  conversationId: string,
  auth: AuthContext,
): Promise<ArthurRecentMessage[]> {
  try {
    const { data: conv, error: convErr } = await admin
      .from("ai_conversations")
      .select("id, user_id, external_user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (convErr || !conv || !conversationBelongsToAuth(conv, auth)) {
      return [];
    }

    const { data, error } = await admin
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(RECENT_MESSAGES_LIMIT);

    if (error) {
      arthurLog("warn", "load_recent_messages_error", { code: error.code });
      return [];
    }

    return (data || [])
      .reverse()
      .map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 2000) : "",
        created_at: m.created_at,
      }));
  } catch (err) {
    arthurLog("warn", "load_recent_messages_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return [];
  }
}

async function loadLeadContext(
  admin: SupabaseClient,
  auth: AuthContext,
  conversationId: string,
): Promise<Record<string, unknown>> {
  try {
    let query = admin
      .from("ai_leads")
      .select(
        "id, source, campaign, reel_id, intent, goal, level, frequency, status, email",
      )
      .limit(1);

    if (auth.userId) {
      query = query.eq("user_id", auth.userId);
    } else if (auth.externalUserId) {
      query = query.eq("external_user_id", auth.externalUserId);
    } else {
      return {};
    }

    const { data, error } = await query
      .order("updated_at", { ascending: false })
      .maybeSingle();

    if (error) {
      // fallback conversation
      const byConv = await admin
        .from("ai_leads")
        .select(
          "id, source, campaign, reel_id, intent, goal, level, frequency, status, email",
        )
        .eq("conversation_id", conversationId)
        .maybeSingle();
      return byConv.data || {};
    }

    return data || {};
  } catch {
    return {};
  }
}

/** Sérialise le contexte pour le modèle (taille bornée). */
export function serializeContextForModel(
  ctx: ArthurContextPayload,
  currentMessage: string,
): string {
  const payload = {
    current_message: currentMessage.slice(0, 4000),
    summary: (ctx.summary || "").slice(0, 1500),
    facts: ctx.facts,
    user_profile: trimDeep(ctx.user_profile, 2),
    subscription: ctx.subscription,
    lead_context: ctx.lead_context,
    knowledge_hints: (ctx.knowledge_hints || []).slice(0, 3).map((k) => ({
      topic: k.topic,
      title: k.title,
      content: String(k.content || "").slice(0, 400),
    })),
    recent_messages: ctx.recent_messages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, 800),
    })),
  };
  return JSON.stringify(payload);
}

function trimDeep(value: unknown, depth: number): unknown {
  if (depth <= 0) return null;
  if (value == null) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 12).map((v) => trimDeep(v, depth - 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = trimDeep(v, depth - 1);
  }
  return out;
}
