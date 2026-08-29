/**
 * Politique anti-spam Conversion Engine F2.
 * Règles dures, jamais de spam.
 */

export const FOLLOWUP_POLICY = {
  /** Max relances envoyées / lead (lifetime). */
  maxSentPerLead: 3,
  /** Max relances planned+approved+queued ouvertes / lead. */
  maxOpenPerLead: 1,
  /** Délai min entre deux envois (h). */
  minHoursBetweenSent: 48,
  /** Silence min après dernier message user (h) avant relance. */
  minHoursAfterUserMessage: 24,
  /** Silence min après dernier message assistant (h). */
  minHoursAfterAssistantMessage: 36,
  /** Score minimum pour relancer un cold. */
  minScoreCold: 25,
  /** Fenêtre attribution outcome reply (jours). */
  replyAttributionDays: 7,
  /** Fenêtre attribution conversion (jours). */
  conversionAttributionDays: 14,
  /** Quiet hours Europe/Paris (pas de scheduled_for dans la nuit). */
  quietHoursStart: 22,
  quietHoursEnd: 8,
} as const;

export type FunnelStage = "new" | "qualified" | "signup" | "premium" | "inactive";

export type FollowupTemplateKey =
  | "convert_hot"
  | "nurture_warm"
  | "reengage_cold"
  | "signup_to_premium"
  | "plan_nudge";

export type SuppressReason =
  | "premium"
  | "inactive"
  | "no_external_id"
  | "score_too_low"
  | "max_sent_reached"
  | "open_followup_exists"
  | "too_soon_after_sent"
  | "user_active_recently"
  | "assistant_recent"
  | "no_template"
  | "opted_out";
