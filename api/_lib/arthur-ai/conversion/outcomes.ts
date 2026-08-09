/**
 * Tracking outcomes des relances (reply / signup / premium).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { FOLLOWUP_POLICY } from "./policy.js";

export async function markFollowupReplied(
  admin: SupabaseClient,
  input: { externalUserId: string; conversationId?: string | null },
): Promise<{ updated: number }> {
  try {
    const since = new Date(
      Date.now() - FOLLOWUP_POLICY.replyAttributionDays * 86400000,
    ).toISOString();

    const { data: candidates } = await admin
      .from("ai_followups")
      .select("id, conversation_id, user_id, outcome")
      .eq("external_user_id", input.externalUserId)
      .eq("status", "sent")
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(5);

    const targets = (candidates || []).filter(
      (r) => !r.outcome || r.outcome === "pending",
    );

    let updated = 0;
    const now = new Date().toISOString();
    for (const row of targets.slice(0, 1)) {
      await admin
        .from("ai_followups")
        .update({
          outcome: "replied",
          replied_at: now,
          updated_at: now,
        })
        .eq("id", row.id);

      await trackAiEvent(admin, {
        conversationId: input.conversationId || row.conversation_id,
        userId: row.user_id,
        eventType: "followup_replied",
        metadata: { followup_id: row.id },
      });
      updated += 1;
    }
    return { updated };
  } catch (err) {
    arthurLog("warn", "mark_followup_replied_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { updated: 0 };
  }
}

export async function markFollowupConverted(
  admin: SupabaseClient,
  input: {
    externalUserId?: string | null;
    userId?: string | null;
    outcome: "signup" | "premium";
  },
): Promise<{ updated: number }> {
  try {
    const since = new Date(
      Date.now() - FOLLOWUP_POLICY.conversionAttributionDays * 86400000,
    ).toISOString();

    let q = admin
      .from("ai_followups")
      .select("id, conversation_id, user_id, outcome")
      .eq("status", "sent")
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(5);

    if (input.externalUserId) {
      q = q.eq("external_user_id", input.externalUserId);
    } else if (input.userId) {
      q = q.eq("user_id", input.userId);
    } else {
      return { updated: 0 };
    }

    const { data: candidates } = await q;
    const targets = (candidates || []).filter(
      (r) =>
        !r.outcome ||
        r.outcome === "pending" ||
        r.outcome === "replied" ||
        (input.outcome === "premium" && r.outcome === "signup"),
    );

    let updated = 0;
    const now = new Date().toISOString();
    for (const row of targets.slice(0, 1)) {
      await admin
        .from("ai_followups")
        .update({
          outcome: input.outcome,
          converted_at: now,
          updated_at: now,
        })
        .eq("id", row.id);

      await trackAiEvent(admin, {
        conversationId: row.conversation_id,
        userId: input.userId || row.user_id,
        eventType: "followup_converted",
        metadata: { followup_id: row.id, outcome: input.outcome },
      });
      updated += 1;
    }
    return { updated };
  } catch (err) {
    arthurLog("warn", "mark_followup_converted_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { updated: 0 };
  }
}
