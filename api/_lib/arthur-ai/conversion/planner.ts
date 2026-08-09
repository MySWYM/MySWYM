/**
 * Planifie des followups (insert ai_followups) — jamais d’envoi ici.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { decideFollowup } from "./decide.js";

export interface PlanFollowupsResult {
  scanned: number;
  planned: number;
  suppressed: number;
  decisions: Array<{
    lead_id: string;
    action: string;
    reason: string;
    template_key?: string;
    suppress_reason?: string;
  }>;
}

function hoursSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (now.getTime() - t) / 3600000;
}

export async function planFollowupsForLeads(
  admin: SupabaseClient,
  opts: { limit?: number; dryRun?: boolean } = {},
): Promise<PlanFollowupsResult> {
  const limit = Math.min(200, Math.max(1, opts.limit || 50));
  const dryRun = opts.dryRun === true;
  const now = new Date();
  const result: PlanFollowupsResult = {
    scanned: 0,
    planned: 0,
    suppressed: 0,
    decisions: [],
  };

  const { data: leads, error } = await admin
    .from("ai_leads")
    .select(
      "id, external_user_id, user_id, status, score, score_band, intent, goal, conversation_id, updated_at, last_event_at",
    )
    .not("status", "eq", "premium")
    .not("status", "eq", "inactive")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    arthurLog("error", "plan_followups_leads_failed", { code: error.code });
    return result;
  }

  for (const lead of leads || []) {
    result.scanned += 1;
    const ext = lead.external_user_id as string;

    const { count: sentCount } = await admin
      .from("ai_followups")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("status", "sent");

    const { count: openCount } = await admin
      .from("ai_followups")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .in("status", ["planned", "approved", "queued"]);

    const { data: lastSent } = await admin
      .from("ai_followups")
      .select("sent_at")
      .eq("lead_id", lead.id)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let hours_since_last_user_message: number | null = null;
    let hours_since_last_assistant_message: number | null = null;
    if (lead.conversation_id) {
      const { data: lastUser } = await admin
        .from("ai_messages")
        .select("created_at")
        .eq("conversation_id", lead.conversation_id)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: lastAsst } = await admin
        .from("ai_messages")
        .select("created_at")
        .eq("conversation_id", lead.conversation_id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      hours_since_last_user_message = hoursSince(lastUser?.created_at, now);
      hours_since_last_assistant_message = hoursSince(lastAsst?.created_at, now);
    }

    const decision = decideFollowup({
      external_user_id: ext,
      status: lead.status,
      score: lead.score,
      score_band: lead.score_band,
      intent: lead.intent,
      goal: lead.goal,
      sent_count: sentCount || 0,
      open_count: openCount || 0,
      hours_since_last_sent: hoursSince(lastSent?.sent_at, now),
      hours_since_last_user_message,
      hours_since_last_assistant_message,
      now,
    });

    if (decision.action === "suppress") {
      result.suppressed += 1;
      result.decisions.push({
        lead_id: lead.id,
        action: "suppress",
        reason: decision.decision_reason,
        suppress_reason: decision.suppress_reason,
      });

      if (!dryRun) {
        // Pas de ligne ai_followups pour chaque suppress (évite le bruit) —
        // tracking via ai_events uniquement.
        await trackAiEvent(admin, {
          conversationId: lead.conversation_id,
          userId: lead.user_id,
          eventType: "followup_suppressed",
          metadata: {
            lead_id: lead.id,
            reason: decision.suppress_reason,
            decision_reason: decision.decision_reason,
          },
        });
      }
      continue;
    }

    result.planned += 1;
    result.decisions.push({
      lead_id: lead.id,
      action: "plan",
      reason: decision.decision_reason,
      template_key: decision.template_key,
    });

    if (!dryRun) {
      const { data: row } = await admin
        .from("ai_followups")
        .insert({
          lead_id: lead.id,
          conversation_id: lead.conversation_id,
          external_user_id: ext,
          user_id: lead.user_id,
          channel: "instagram",
          template_key: decision.template_key,
          decision_reason: decision.decision_reason,
          score_at_decision: lead.score,
          score_band_at_decision: lead.score_band,
          intent_at_decision: lead.intent,
          funnel_stage: decision.funnel_stage,
          message_preview: decision.message_preview,
          status: "planned",
          outcome: "pending",
          scheduled_for: decision.scheduled_for,
          metadata: { delay_hours: decision.delay_hours },
          updated_at: now.toISOString(),
        })
        .select("id")
        .maybeSingle();

      await trackAiEvent(admin, {
        conversationId: lead.conversation_id,
        userId: lead.user_id,
        eventType: "followup_planned",
        metadata: {
          lead_id: lead.id,
          followup_id: row?.id || null,
          template_key: decision.template_key,
          scheduled_for: decision.scheduled_for,
        },
      });
    }
  }

  return result;
}
