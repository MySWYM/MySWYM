/**
 * Human takeover, pause Arthur, main humaine (Phase G).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { fallbackStructured } from "../intent.js";
import type { ArthurStructuredOutput, AuthContext } from "../types.js";
import {
  HUMAN_HANDOFF_CLIENT_MESSAGE,
  isLegitimateHandoffDm,
} from "../shadow/reply-policy.js";

/** @deprecated préférer isLegitimateHandoffDm, conservé pour imports existants. */
export function detectsHumanTakeoverRequest(message: string): boolean {
  return isLegitimateHandoffDm(message);
}

export function takeoverHoldMessage(): ArthurStructuredOutput {
  const s = fallbackStructured(HUMAN_HANDOFF_CLIENT_MESSAGE);
  s.suggested_action = "handoff_human";
  s.intent = "support";
  s.lead_temperature = "warm";
  return s;
}

export async function isConversationInTakeover(
  admin: SupabaseClient,
  conversationId: string,
): Promise<boolean> {
  try {
    const { data } = await admin
      .from("ai_conversations")
      .select("status")
      .eq("id", conversationId)
      .maybeSingle();
    return data?.status === "human_takeover";
  } catch {
    return false;
  }
}

export async function startHumanTakeover(
  admin: SupabaseClient,
  input: {
    conversationId: string;
    auth: AuthContext;
    reason: string;
    requestedBy: "user_keyword" | "admin" | "suggested_action" | "flag" | "system";
    notes?: string;
  },
): Promise<void> {
  try {
    await admin
      .from("ai_conversations")
      .update({
        status: "human_takeover",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.conversationId);

    await admin.from("ai_human_takeovers").insert({
      conversation_id: input.conversationId,
      external_user_id: input.auth.externalUserId,
      user_id: input.auth.userId,
      status: "active",
      reason: input.reason,
      requested_by: input.requestedBy,
      notes: input.notes || null,
    });

    await trackAiEvent(admin, {
      conversationId: input.conversationId,
      userId: input.auth.userId,
      eventType: "human_takeover_started",
      metadata: {
        reason: input.reason,
        requested_by: input.requestedBy,
      },
    });
  } catch (err) {
    arthurLog("warn", "human_takeover_start_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

export async function releaseHumanTakeover(
  admin: SupabaseClient,
  conversationId: string,
  notes?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    await admin
      .from("ai_conversations")
      .update({ status: "active", updated_at: now })
      .eq("id", conversationId);

    await admin
      .from("ai_human_takeovers")
      .update({ status: "released", released_at: now, notes: notes || null })
      .eq("conversation_id", conversationId)
      .eq("status", "active");

    await trackAiEvent(admin, {
      conversationId,
      eventType: "human_takeover_released",
      metadata: { notes: notes || null },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "release_failed",
    };
  }
}

export async function listActiveTakeovers(
  admin: SupabaseClient,
  limit = 40,
): Promise<Record<string, unknown>[]> {
  const { data } = await admin
    .from("ai_human_takeovers")
    .select(
      "id, conversation_id, external_user_id, user_id, reason, requested_by, notes, created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}
