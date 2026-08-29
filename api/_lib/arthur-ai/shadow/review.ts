/**
 * Validation humaine Shadow proposals (H1), approve/reject/edit, jamais d’envoi.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";

export type ShadowReviewAction = "approve" | "reject" | "edit_approve" | "cancel";

export async function reviewShadowProposal(
  admin: SupabaseClient,
  input: {
    proposalId: string;
    action: ShadowReviewAction;
    notes?: string | null;
    finalMessage?: string | null;
    reviewedBy?: string | null;
  },
): Promise<{ ok: boolean; error?: string; status?: string }> {
  try {
    const { data: row, error } = await admin
      .from("ai_shadow_proposals")
      .select("id, status, conversation_id, user_id, proposed_message")
      .eq("id", input.proposalId)
      .maybeSingle();

    if (error || !row) {
      return { ok: false, error: "proposal_not_found" };
    }
    if (row.status !== "pending") {
      return { ok: false, error: `invalid_status_${row.status}` };
    }

    const now = new Date().toISOString();
    let status: string;
    let final_message: string | null = null;

    if (input.action === "approve") {
      status = "approved";
      final_message = row.proposed_message;
    } else if (input.action === "edit_approve") {
      const msg = String(input.finalMessage || "").trim();
      if (!msg || msg.length > 4000) {
        return { ok: false, error: "final_message_required" };
      }
      status = "edited_approved";
      final_message = msg;
    } else if (input.action === "reject") {
      status = "rejected";
    } else if (input.action === "cancel") {
      status = "cancelled";
    } else {
      return { ok: false, error: "invalid_action" };
    }

    await admin
      .from("ai_shadow_proposals")
      .update({
        status,
        final_message,
        review_notes: input.notes || null,
        reviewed_by: input.reviewedBy || "admin",
        reviewed_at: now,
        updated_at: now,
        // H1: jamais d’envoi
        sent_at: null,
        send_blocked_reason: "shadow_mode_h1_no_auto_send",
      })
      .eq("id", input.proposalId);

    const eventType =
      status === "rejected" || status === "cancelled"
        ? "shadow_proposal_rejected"
        : "shadow_proposal_approved";

    await trackAiEvent(admin, {
      conversationId: row.conversation_id,
      userId: row.user_id,
      eventType,
      metadata: {
        proposal_id: input.proposalId,
        status,
        action: input.action,
        // Explicit: review ≠ send
        sent: false,
      },
    });

    return { ok: true, status };
  } catch (err) {
    arthurLog("warn", "shadow_review_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false, error: "review_failed" };
  }
}

export async function listShadowProposals(
  admin: SupabaseClient,
  opts: { status?: string; limit?: number; days?: number } = {},
): Promise<Record<string, unknown>[]> {
  const limit = Math.min(100, Math.max(1, opts.limit || 40));
  const days = Math.min(90, Math.max(1, opts.days || 14));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let q = admin
    .from("ai_shadow_proposals")
    .select(
      "id, conversation_id, external_user_id, inbound_message, proposed_message, final_message, intent, lead_temperature, suggested_action, recommended_action, lead_score_snapshot, lead_band_snapshot, lead_status_guess, classification, attribution, status, review_notes, reviewed_by, reviewed_at, model, created_at, send_blocked_reason, sent_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.status) q = q.eq("status", opts.status);

  const { data } = await q;
  return data || [];
}

export async function buildShadowReport(
  admin: SupabaseClient,
  days = 14,
): Promise<Record<string, unknown>> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: rows } = await admin
    .from("ai_shadow_proposals")
    .select("status, recommended_action, lead_temperature, intent, sent_at")
    .gte("created_at", since)
    .limit(1000);

  const list = rows || [];
  const byStatus: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  let sentCount = 0;
  for (const r of list) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byAction[r.recommended_action] =
      (byAction[r.recommended_action] || 0) + 1;
    if (r.sent_at) sentCount += 1;
  }

  return {
    days,
    total: list.length,
    by_status: byStatus,
    by_recommended_action: byAction,
    pending: byStatus.pending || 0,
    approved: (byStatus.approved || 0) + (byStatus.edited_approved || 0),
    rejected: byStatus.rejected || 0,
    /** Doit rester 0 en H1 */
    sent_count: sentCount,
    note: "H1 Shadow, validation humaine sans envoi automatique",
  };
}

/** Événements Instagram / Shadow récents (même sans proposition). */
export async function listRecentInstagramEvents(
  admin: SupabaseClient,
  opts: { limit?: number; days?: number } = {},
): Promise<Record<string, unknown>[]> {
  const limit = Math.min(50, Math.max(1, opts.limit || 25));
  const days = Math.min(90, Math.max(1, opts.days || 14));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await admin
    .from("ai_events")
    .select("id, event_type, metadata, created_at, conversation_id")
    .gte("created_at", since)
    .in("event_type", [
      "instagram_webhook_received",
      "dm_received",
      "shadow_proposal_created",
      "shadow_send_blocked",
      "instagram_message_failed",
      "instagram_message_sent",
      "offline_fallback",
    ])
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}
