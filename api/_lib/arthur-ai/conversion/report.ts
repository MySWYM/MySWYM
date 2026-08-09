/**
 * Rapport d’impact des relances (mesure avant automatisation complète).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFollowupSendMode } from "./send.js";

export async function buildFollowupImpactReport(
  admin: SupabaseClient,
  days = 30,
): Promise<{
  send_gate: string;
  counts: Record<string, number>;
  outcomes: Record<string, number>;
  rates: {
    reply_rate: number | null;
    signup_rate: number | null;
    premium_rate: number | null;
  };
  suppress_reasons: Record<string, number>;
  recent: Record<string, unknown>[];
}> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: rows } = await admin
    .from("ai_followups")
    .select(
      "id, status, outcome, template_key, decision_reason, suppress_reason, send_mode, score_at_decision, funnel_stage, scheduled_for, sent_at, created_at, external_user_id",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  const list = rows || [];
  const counts: Record<string, number> = {
    planned: 0,
    approved: 0,
    suppressed: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    queued: 0,
  };
  const outcomes: Record<string, number> = {
    pending: 0,
    replied: 0,
    signup: 0,
    premium: 0,
    ignored: 0,
    opted_out: 0,
  };
  const suppress_reasons: Record<string, number> = {};

  for (const r of list) {
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.outcome) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    if (r.status === "suppressed" && r.suppress_reason) {
      suppress_reasons[r.suppress_reason] =
        (suppress_reasons[r.suppress_reason] || 0) + 1;
    }
  }

  // Suppressions journalisées dans ai_events (pas de ligne followup)
  const { data: suppressEvents } = await admin
    .from("ai_events")
    .select("metadata")
    .eq("event_type", "followup_suppressed")
    .gte("created_at", since)
    .limit(1000);

  for (const ev of suppressEvents || []) {
    counts.suppressed += 1;
    const reason = String(
      (ev.metadata as Record<string, unknown>)?.reason || "unknown",
    );
    suppress_reasons[reason] = (suppress_reasons[reason] || 0) + 1;
  }

  const sent = counts.sent || 0;
  const replied =
    (outcomes.replied || 0) + (outcomes.signup || 0) + (outcomes.premium || 0);
  const signup = (outcomes.signup || 0) + (outcomes.premium || 0);
  const premium = outcomes.premium || 0;

  return {
    send_gate: resolveFollowupSendMode(),
    counts,
    outcomes,
    rates: {
      reply_rate: sent > 0 ? Number((replied / sent).toFixed(3)) : null,
      signup_rate: sent > 0 ? Number((signup / sent).toFixed(3)) : null,
      premium_rate: sent > 0 ? Number((premium / sent).toFixed(3)) : null,
    },
    suppress_reasons,
    recent: list.slice(0, 40).map((r) => ({
      id: r.id,
      status: r.status,
      outcome: r.outcome,
      template_key: r.template_key,
      decision_reason: r.decision_reason,
      suppress_reason: r.suppress_reason,
      send_mode: r.send_mode,
      funnel_stage: r.funnel_stage,
      score: r.score_at_decision,
      scheduled_for: r.scheduled_for,
      sent_at: r.sent_at,
      created_at: r.created_at,
    })),
  };
}
