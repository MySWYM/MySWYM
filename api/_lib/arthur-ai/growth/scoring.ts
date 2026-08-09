/**
 * Scoring leads Arthur AI (Growth Engine F1).
 * Pure function + persist — pas de relances.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";

export type ScoreBand = "cold" | "warm" | "hot";

export interface LeadScoreInput {
  status?: string | null;
  intent?: string | null;
  goal?: string | null;
  level?: string | null;
  frequency?: number | null;
  target_date?: string | null;
  email?: string | null;
  source?: string | null;
  campaign?: string | null;
  reel_id?: string | null;
  keyword?: string | null;
  lead_temperature?: string | null;
  message_count?: number | null;
  has_identity_link?: boolean;
  has_premium?: boolean;
}

export interface LeadScoreResult {
  score: number;
  band: ScoreBand;
  reasons: string[];
}

const HOT_INTENTS = new Set(["plan_request", "subscription", "goal"]);
const WARM_INTENTS = new Set(["myswym_question", "training", "technique"]);

/** Score 0–100 déterministe (mesurable, pas d’IA). */
export function scoreLead(input: LeadScoreInput): LeadScoreResult {
  let score = 10;
  const reasons: string[] = ["base"];

  if (input.status === "premium" || input.has_premium) {
    score += 40;
    reasons.push("premium");
  } else if (input.status === "signup" || input.has_identity_link) {
    score += 25;
    reasons.push("signup_or_linked");
  } else if (input.status === "qualified") {
    score += 15;
    reasons.push("qualified");
  }

  if (input.goal) {
    score += 10;
    reasons.push("has_goal");
  }
  if (input.level) {
    score += 8;
    reasons.push("has_level");
  }
  if (input.frequency != null && Number(input.frequency) > 0) {
    score += 8;
    reasons.push("has_frequency");
  }
  if (input.target_date) {
    score += 10;
    reasons.push("has_target_date");
  }
  if (input.email) {
    score += 5;
    reasons.push("has_email");
  }

  if (input.reel_id) {
    score += 8;
    reasons.push("has_reel");
  }
  if (input.campaign) {
    score += 5;
    reasons.push("has_campaign");
  }
  if (input.keyword) {
    score += 6;
    reasons.push(`keyword_${String(input.keyword).toLowerCase()}`);
  }

  const intent = input.intent || "";
  if (HOT_INTENTS.has(intent)) {
    score += 12;
    reasons.push(`intent_${intent}`);
  } else if (WARM_INTENTS.has(intent)) {
    score += 6;
    reasons.push(`intent_${intent}`);
  }

  const temp = input.lead_temperature || "";
  if (temp === "hot") {
    score += 8;
    reasons.push("temp_hot");
  } else if (temp === "warm") {
    score += 4;
    reasons.push("temp_warm");
  }

  const msgs = Number(input.message_count) || 0;
  if (msgs >= 6) {
    score += 8;
    reasons.push("engaged_6plus");
  } else if (msgs >= 3) {
    score += 4;
    reasons.push("engaged_3plus");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const band: ScoreBand = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

  return { score, band, reasons };
}

export async function persistLeadScore(
  admin: SupabaseClient,
  leadId: string,
  input: LeadScoreInput,
): Promise<LeadScoreResult | null> {
  const result = scoreLead(input);
  try {
    const { error } = await admin
      .from("ai_leads")
      .update({
        score: result.score,
        score_band: result.band,
        score_reasons: result.reasons,
        scored_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);
    if (error) {
      arthurLog("warn", "lead_score_persist_failed", { code: error.code });
      return null;
    }
    return result;
  } catch (err) {
    arthurLog("warn", "lead_score_persist_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return null;
  }
}

/** Recalcule le score d’un lead à partir de la row + contexte optionnel. */
export async function rescoreLeadById(
  admin: SupabaseClient,
  leadId: string,
  extras: Partial<LeadScoreInput> = {},
): Promise<LeadScoreResult | null> {
  const { data, error } = await admin
    .from("ai_leads")
    .select(
      "id, status, intent, goal, level, frequency, target_date, email, source, campaign, reel_id, keyword, conversation_id, user_id",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) return null;

  let message_count = extras.message_count ?? null;
  if (message_count == null && data.conversation_id) {
    const { count } = await admin
      .from("ai_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", data.conversation_id);
    message_count = count ?? 0;
  }

  let has_identity_link = extras.has_identity_link;
  let has_premium = extras.has_premium;
  if (data.user_id && (has_identity_link == null || has_premium == null)) {
    if (has_identity_link == null) {
      const { data: link } = await admin
        .from("ai_identity_links")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle();
      has_identity_link = !!link;
    }
    if (has_premium == null) {
      const { data: access } = await admin
        .from("user_access_state")
        .select("access_status, trial_ends_at, subscription_ends_at")
        .eq("user_id", data.user_id)
        .maybeSingle();
      has_premium = isPremiumAccess(access);
    }
  }

  return persistLeadScore(admin, leadId, {
    status: data.status,
    intent: data.intent,
    goal: data.goal,
    level: data.level,
    frequency: data.frequency,
    target_date: data.target_date,
    email: data.email,
    source: data.source,
    campaign: data.campaign,
    reel_id: data.reel_id,
    keyword: data.keyword,
    message_count,
    has_identity_link: !!has_identity_link,
    has_premium: !!has_premium,
    ...extras,
  });
}

export function isPremiumAccess(
  access:
    | {
        access_status?: string | null;
        trial_ends_at?: string | null;
        subscription_ends_at?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!access?.access_status) return false;
  const now = Date.now();
  if (access.access_status === "active") return true;
  if (access.access_status === "trial") {
    const t = access.trial_ends_at ? Date.parse(access.trial_ends_at) : NaN;
    return Number.isFinite(t) && t > now;
  }
  if (access.access_status === "canceled") {
    const t = access.subscription_ends_at
      ? Date.parse(access.subscription_ends_at)
      : NaN;
    return !Number.isFinite(t) || t > now;
  }
  return false;
}
