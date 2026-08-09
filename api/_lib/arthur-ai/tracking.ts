/**
 * Tracking événements Arthur AI → ai_events.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "./logging.js";
import type { AiEventType } from "./types.js";

export interface TrackAiEventInput {
  conversationId?: string | null;
  userId?: string | null;
  eventType: AiEventType;
  metadata?: Record<string, unknown>;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  model?: string | null;
  costEstimate?: number | null;
}

export async function trackAiEvent(
  admin: SupabaseClient,
  input: TrackAiEventInput,
): Promise<{ ok: boolean; id?: string }> {
  try {
    const row = {
      conversation_id: input.conversationId || null,
      user_id: input.userId || null,
      event_type: input.eventType,
      metadata: sanitizeMetadata(input.metadata || {}),
      tokens_input: input.tokensInput ?? null,
      tokens_output: input.tokensOutput ?? null,
      model: input.model ?? null,
      cost_estimate: input.costEstimate ?? null,
    };

    const { data, error } = await admin
      .from("ai_events")
      .insert(row)
      .select("id")
      .maybeSingle();

    if (error) {
      arthurLog("error", "ai_event_insert_failed", {
        eventType: input.eventType,
        code: error.code,
      });
      return { ok: false };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    arthurLog("error", "ai_event_exception", {
      eventType: input.eventType,
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false };
  }
}

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (
      ["content", "message", "prompt", "messages", "authorization", "apiKey"].includes(
        k,
      )
    ) {
      continue;
    }
    if (v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20);
    } else if (typeof v === "object") {
      out[k] = v;
    }
  }
  return out;
}
