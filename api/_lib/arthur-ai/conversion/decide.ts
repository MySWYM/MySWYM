/**
 * Moteur de décision relances — pure function (testable).
 * Ne spamme jamais : suppress avant plan.
 */
import {
  FOLLOWUP_POLICY,
  type FunnelStage,
  type FollowupTemplateKey,
  type SuppressReason,
} from "./policy.js";
import { renderFollowupMessage } from "./templates.js";

export interface FollowupDecisionInput {
  external_user_id?: string | null;
  status?: string | null;
  score?: number | null;
  score_band?: string | null;
  intent?: string | null;
  goal?: string | null;
  /** Nombre de followups déjà sent. */
  sent_count?: number;
  /** Nombre de followups open (planned|approved|queued). */
  open_count?: number;
  /** Heures depuis dernier sent followup (null = jamais). */
  hours_since_last_sent?: number | null;
  /** Heures depuis dernier message user. */
  hours_since_last_user_message?: number | null;
  /** Heures depuis dernier message assistant. */
  hours_since_last_assistant_message?: number | null;
  /** Opt-out explicite. */
  opted_out?: boolean;
  now?: Date;
}

export type FollowupDecision =
  | {
      action: "plan";
      template_key: FollowupTemplateKey;
      decision_reason: string;
      funnel_stage: FunnelStage;
      scheduled_for: string;
      message_preview: string;
      delay_hours: number;
    }
  | {
      action: "suppress";
      suppress_reason: SuppressReason;
      decision_reason: string;
      funnel_stage: FunnelStage | null;
    };

function asStage(status: string | null | undefined): FunnelStage {
  if (status === "qualified") return "qualified";
  if (status === "signup") return "signup";
  if (status === "premium") return "premium";
  if (status === "inactive") return "inactive";
  return "new";
}

function hoursFromNow(hours: number, now: Date): string {
  const d = new Date(now.getTime() + hours * 3600000);
  return bumpOutOfQuietHours(d).toISOString();
}

/** Décale hors quiet hours (Europe approximative UTC+1/+2 non gérée — simple local offset via UTC hours). */
export function bumpOutOfQuietHours(date: Date): Date {
  const d = new Date(date.getTime());
  // Utilise l’heure UTC+2 approximative (CEST) pour F2 ; suffisant pour éviter 22h–8h locales FR été.
  const parisHour = (d.getUTCHours() + 2) % 24;
  const { quietHoursStart, quietHoursEnd } = FOLLOWUP_POLICY;
  if (parisHour >= quietHoursStart || parisHour < quietHoursEnd) {
    // pousser à 9h Paris ≈ 7h UTC
    const dayOffset = parisHour >= quietHoursStart ? 1 : 0;
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(7, 0, 0, 0);
  }
  return d;
}

export function decideFollowup(input: FollowupDecisionInput): FollowupDecision {
  const now = input.now || new Date();
  const stage = asStage(input.status);
  const score = typeof input.score === "number" ? input.score : 0;
  const band = input.score_band || (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold");
  const intent = input.intent || "other";
  const sent = input.sent_count || 0;
  const open = input.open_count || 0;

  if (!input.external_user_id) {
    return {
      action: "suppress",
      suppress_reason: "no_external_id",
      decision_reason: "missing_external_user_id",
      funnel_stage: stage,
    };
  }
  if (input.opted_out) {
    return {
      action: "suppress",
      suppress_reason: "opted_out",
      decision_reason: "user_opted_out",
      funnel_stage: stage,
    };
  }
  if (stage === "premium") {
    return {
      action: "suppress",
      suppress_reason: "premium",
      decision_reason: "already_premium",
      funnel_stage: stage,
    };
  }
  if (stage === "inactive") {
    return {
      action: "suppress",
      suppress_reason: "inactive",
      decision_reason: "lead_inactive",
      funnel_stage: stage,
    };
  }
  if (sent >= FOLLOWUP_POLICY.maxSentPerLead) {
    return {
      action: "suppress",
      suppress_reason: "max_sent_reached",
      decision_reason: `max_sent_${FOLLOWUP_POLICY.maxSentPerLead}`,
      funnel_stage: stage,
    };
  }
  if (open >= FOLLOWUP_POLICY.maxOpenPerLead) {
    return {
      action: "suppress",
      suppress_reason: "open_followup_exists",
      decision_reason: "pending_followup_open",
      funnel_stage: stage,
    };
  }
  if (
    input.hours_since_last_sent != null &&
    input.hours_since_last_sent < FOLLOWUP_POLICY.minHoursBetweenSent
  ) {
    return {
      action: "suppress",
      suppress_reason: "too_soon_after_sent",
      decision_reason: "cooldown_between_sent",
      funnel_stage: stage,
    };
  }
  if (
    input.hours_since_last_user_message != null &&
    input.hours_since_last_user_message < FOLLOWUP_POLICY.minHoursAfterUserMessage
  ) {
    return {
      action: "suppress",
      suppress_reason: "user_active_recently",
      decision_reason: "wait_user_silence",
      funnel_stage: stage,
    };
  }
  if (
    input.hours_since_last_assistant_message != null &&
    input.hours_since_last_assistant_message <
      FOLLOWUP_POLICY.minHoursAfterAssistantMessage
  ) {
    return {
      action: "suppress",
      suppress_reason: "assistant_recent",
      decision_reason: "wait_after_assistant",
      funnel_stage: stage,
    };
  }

  // ── Choix template selon stade / score / intent ─────────────
  let template: FollowupTemplateKey | null = null;
  let delay = 48;
  let reason = "";

  if (stage === "signup") {
    template = "signup_to_premium";
    delay = 48;
    reason = "signup_without_premium";
  } else if (
    (band === "hot" || score >= 70) &&
    ["plan_request", "goal", "subscription"].includes(intent)
  ) {
    template = intent === "plan_request" ? "plan_nudge" : "convert_hot";
    delay = 24;
    reason = `hot_${intent}`;
  } else if (band === "hot" || score >= 70) {
    template = "convert_hot";
    delay = 36;
    reason = "hot_general";
  } else if (band === "warm" || score >= 40) {
    template = "nurture_warm";
    delay = 48;
    reason = "warm_nurture";
  } else if (score >= FOLLOWUP_POLICY.minScoreCold) {
    template = "reengage_cold";
    delay = 72;
    reason = "cold_reengage";
  } else {
    return {
      action: "suppress",
      suppress_reason: "score_too_low",
      decision_reason: "below_min_cold_score",
      funnel_stage: stage,
    };
  }

  if (!template) {
    return {
      action: "suppress",
      suppress_reason: "no_template",
      decision_reason: "no_matching_template",
      funnel_stage: stage,
    };
  }

  const message_preview = renderFollowupMessage(template, { goal: input.goal });
  return {
    action: "plan",
    template_key: template,
    decision_reason: reason,
    funnel_stage: stage,
    delay_hours: delay,
    scheduled_for: hoursFromNow(delay, now),
    message_preview,
  };
}
