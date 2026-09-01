/**
 * Rapport produit « Nageurs », activation, habitude, moteur, argent.
 * Servi par GET /api/admin/arthur-readiness?nageurs=1 (pas de 13e fonction Hobby).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  accessStatusOf,
  ageBandLabel,
  ageSliceEntries,
  buildProductInsights,
  dailyBuckets,
  feedbackCategoryFr,
  genderLabelFr,
  genderSliceEntries,
  generatorVersionOf,
  resolveProfileAge,
  resolveProfileGender,
  retentionCohorts,
} from "./nageurs-helpers.js";
import {
  frequencyLabelFr,
  goalLabelFr,
  levelLabelFr,
  poolLabelFr,
} from "./product-labels.js";
import { dropInternalUsers, loadInternalTestUserIds } from "./internal-test-accounts.js";

const SIGNUP_EVENTS = ["signup_completed", "signup"];
const SIGNUP_STARTED_EVENTS = ["signup_started"];
const PLAN_EVENTS = ["plan_generated", "plan_generated"];
const FIRST_SESSION_EVENTS = ["first_session_completed", "first_session_completed"];
const SECOND_SESSION_EVENTS = ["second_session_completed", "second_session_completed"];
const PAYWALL_EVENTS = ["paywall_shown"];
const CHECKOUT_EVENTS = [
  "checkout_started",
  "checkout_session_created",
  "checkout_session_created",
];
const CHECKOUT_ABANDONED_EVENTS = ["checkout_abandoned"];
const TRIAL_EVENTS = ["trial_started"];
const CANCEL_EVENTS = ["cancel_survey", "cancel_survey"];
const PAYMENT_EVENTS = ["payment_succeeded", "payment_succeeded"];

const TOO_HARD = new Set(["too_hard", "hard"]);
const TOO_EASY = new Set(["too_easy", "easy"]);
const OK_RATING = new Set(["ok", "good"]);

export type NageursReport = {
  days: number;
  since: string;
  activation: {
    signups: number;
    plans: number;
    first_session: number;
    second_session: number;
    signup_to_plan: number | null;
    plan_to_first: number | null;
    first_to_second: number | null;
    median_hours_to_first: number | null;
  };
  dropoff: {
    signup_started: number;
    signups: number;
    plans: number;
    paywalls: number;
    checkouts: number;
    abandoned: number;
    first_session: number;
    started_to_account: number | null;
    account_to_plan: number | null;
    plan_to_first: number | null;
    paywall_to_checkout: number | null;
    checkout_to_paid: number | null;
  };
  usage: {
    swimmers_1d: number;
    swimmers_7d: number;
    swimmers_period: number;
    swimmers_30d: number;
    sessions_planned: number;
    sessions_done: number;
    sessions_skipped: number;
    completion_rate: number | null;
    weekly: {
      users: number;
      zero: number;
      one: number;
      two: number;
      three_plus: number;
    };
  };
  engine: {
    feedbacks: number;
    too_hard: number;
    too_easy: number;
    ok: number;
    pain: number;
    too_hard_rate: number | null;
    too_easy_rate: number | null;
    pain_rate: number | null;
    hard_by_type: Array<{ type: string; count: number }>;
    hard_by_level: Array<{ type: string; count: number }>;
    hard_by_goal: Array<{ type: string; count: number }>;
    hard_by_week: Array<{ type: string; count: number }>;
    top_skipped: Array<{ type: string; count: number }>;
    top_liked: Array<{ type: string; count: number }>;
    adaptations: { total: number; lowered: number; raised: number; hold: number };
    feedback_categories: Array<{ type: string; count: number }>;
    by_version: Array<{
      type: string;
      generated: number;
      completed: number;
      skipped: number;
      completion: number | null;
    }>;
  };
  money: {
    trial: number;
    active: number;
    canceled: number;
    expired: number;
    checkouts: number;
    trials_started: number;
    payments: number;
    paying_or_trial_no_session: number;
    cancel_reasons: Array<{ reason: string; count: number }>;
    d7: { eligible: number; converted: number; rate: number | null };
    d30_churn: { eligible: number; churned: number; rate: number | null };
    by_objective: Array<{
      type: string;
      nageurs: number;
      payants: number;
      conversion: number | null;
    }>;
  };
  slices: {
    scope: "all_profiles";
    by_gender: Array<{ type: string; count: number }>;
    by_age: Array<{ type: string; count: number }>;
    by_level: Array<{ type: string; count: number }>;
    by_goal: Array<{ type: string; count: number }>;
    by_objective: Array<{
      type: string;
      nageurs: number;
      actifs: number;
      pct_actifs: number | null;
      seances_moy: number | null;
      completion: number | null;
    }>;
    by_level_usage: Array<{
      type: string;
      nageurs: number;
      actifs: number;
      pct_actifs: number | null;
      seances_moy: number | null;
      completion: number | null;
    }>;
    by_pool: Array<{
      type: string;
      nageurs: number;
      actifs: number;
      pct_actifs: number | null;
      seances_moy: number | null;
      completion: number | null;
    }>;
    by_frequency: Array<{
      type: string;
      nageurs: number;
      actifs: number;
      pct_actifs: number | null;
      seances_moy: number | null;
      completion: number | null;
    }>;
  };
  funnel: Array<{
    key: string;
    label: string;
    value: number | null;
    available: boolean;
    proxy?: string | null;
  }>;
  compare: {
    previous_days: number | null;
    signups: number | null;
    first_session: number | null;
    sessions_done: number | null;
    sessions_planned: number | null;
    swimmers_period: number | null;
    completion_rate: number | null;
    too_hard_rate: number | null;
  };
  daily: Array<{
    day: string;
    signups: number;
    first_session: number;
    trials: number;
    payments: number;
    sessions_done: number;
  }>;
  cohorts: Array<{ cohort: string; size: number; rates: Array<number | null> }>;
  insights: string[];
  instrumentation: Array<{ event: string; status: "ok" | "proxy" | "missing"; note: string }>;
  notes: string[];
};

export function clampDays(raw: unknown, fallback = 30): number {
  const token = String(raw ?? "").trim().toLowerCase();
  if (token === "all" || token === "tout") return 0;
  const n = Number(raw);
  if (n === 0) return 0;
  if (!Number.isFinite(n)) return fallback;
  if (n <= 7) return 7;
  if (n <= 30) return 30;
  return 90;
}

export function medianNumber(values: number[]): number | null {
  const xs = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  if (xs.length % 2) return xs[mid];
  return (xs[mid - 1] + xs[mid]) / 2;
}

export function ratio(num: number, den: number): number | null {
  if (!den) return null;
  return num / den;
}

export function tally(map: Map<string, number>, key: string) {
  const k = key || "autre";
  map.set(k, (map.get(k) || 0) + 1);
}

export function topEntries(
  map: Map<string, number>,
  limit = 6,
): Array<{ type: string; count: number }> {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ type, count }));
}

export function cancelReasonFromProperties(properties: unknown): string {
  if (!properties || typeof properties !== "object") return "non précisé";
  const p = properties as Record<string, unknown>;
  const raw = p.reason ?? p.cancel_reason ?? p.why;
  const s = String(raw || "").trim();
  return s || "non précisé";
}

export function hoursBetween(aIso: string, bIso: string): number | null {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return (b - a) / 36e5;
}

export function sessionLabel(row: Record<string, any> = {}): string {
  const payload = row.session_payload || row.session_payload || {};
  const raw =
    row.session_title ||
    payload.title ||
    payload.name ||
    row.session_type ||
    row.family ||
    row.intent ||
    "";
  const s = String(raw).trim();
  return s || "séance";
}

export function classifyAdaptation(row: {
  action?: string | null;
  volume_mul?: number | null;
}): "lowered" | "raised" | "hold" {
  const action = String(row.action || "").toUpperCase();
  if (/REDUCE|DOWN|LOWER|DECREASE|PROTECT|RECOVER/.test(action)) return "lowered";
  if (/PROGRESS|INCREASE|UP|RAISE/.test(action) && !/HOLD/.test(action)) return "raised";
  if (/HOLD|MAINTAIN|ADJUST/.test(action)) return "hold";
  const mul = Number(row.volume_mul ?? (row as { volume_mul?: number }).volume_mul);
  if (Number.isFinite(mul)) {
    if (mul < 0.98) return "lowered";
    if (mul > 1.02) return "raised";
  }
  return "hold";
}

export function weeklyVolumeBuckets(
  planned: Array<{
    user_id?: string | null;
    status?: string | null;
    completed_at?: string | null;
    created_at?: string | null;
  }>,
  since7: string,
): { users: number; zero: number; one: number; two: number; three_plus: number } {
  const users = new Set<string>();
  const done = new Map<string, number>();
  for (const r of planned) {
    if (!r.user_id) continue;
    const created = r.created_at || "";
    const completed = r.completed_at || "";
    const inWeek = created >= since7 || completed >= since7;
    if (!inWeek) continue;
    users.add(r.user_id);
    if (r.status === "completed" && (completed >= since7 || (!completed && created >= since7))) {
      done.set(r.user_id, (done.get(r.user_id) || 0) + 1);
    }
  }
  let zero = 0;
  let one = 0;
  let two = 0;
  let three_plus = 0;
  for (const uid of users) {
    const n = done.get(uid) || 0;
    if (n === 0) zero += 1;
    else if (n === 1) one += 1;
    else if (n === 2) two += 1;
    else three_plus += 1;
  }
  return { users: users.size, zero, one, two, three_plus };
}

export function trialToPaidD7(
  access: Array<{
    trial_started_at?: string | null;
    subscription_started_at?: string | null;
    status?: string | null;
    access_status?: string | null;
  }>,
  now: Date,
): { eligible: number; converted: number; rate: number | null } {
  const cutoff = new Date(now.getTime() - 7 * 864e5).toISOString();
  const eligible = access.filter((r) => r.trial_started_at && r.trial_started_at <= cutoff);
  const converted = eligible.filter(
    (r) => r.subscription_started_at || accessStatusOf(r) === "active",
  );
  return {
    eligible: eligible.length,
    converted: converted.length,
    rate: ratio(converted.length, eligible.length),
  };
}

export function paidChurnD30(
  access: Array<{
    subscription_started_at?: string | null;
    status?: string | null;
    access_status?: string | null;
  }>,
  now: Date,
): { eligible: number; churned: number; rate: number | null } {
  const cutoff = new Date(now.getTime() - 30 * 864e5).toISOString();
  const eligible = access.filter(
    (r) => r.subscription_started_at && r.subscription_started_at <= cutoff,
  );
  const churned = eligible.filter((r) => {
    const s = accessStatusOf(r);
    return s === "canceled" || s === "expired";
  });
  return {
    eligible: eligible.length,
    churned: churned.length,
    rate: ratio(churned.length, eligible.length),
  };
}

type FilterFn = (q: any) => any;

async function listRows(
  admin: SupabaseClient,
  table: string,
  columns: string,
  apply: FilterFn,
  cap = 8000,
): Promise<any[]> {
  const out: any[] = [];
  let from = 0;
  const page = 1000;
  while (from < cap) {
    let q = admin.from(table).select(columns);
    q = apply(q);
    const { data, error } = await q.range(from, from + page - 1);
    if (error) throw error;
    const batch = data || [];
    out.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return out;
}

function sinceIso(days: number, now = new Date()): string {
  return new Date(now.getTime() - days * 864e5).toISOString();
}

function distinctUsers(rows: { user_id?: string | null }[]): number {
  return new Set(rows.map((r) => r.user_id).filter(Boolean) as string[]).size;
}

async function usersWhoCompleted(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200);
    const { data, error } = await admin
      .from("planned_sessions")
      .select("user_id")
      .in("user_id", chunk)
      .eq("status", "completed");
    if (error) throw error;
    for (const r of data || []) {
      if (r.user_id) out.add(String(r.user_id));
    }
  }
  return out;
}

function earliestByUser(
  rows: { user_id?: string | null; created_at?: string | null }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (!r.user_id || !r.created_at) continue;
    const prev = map.get(r.user_id);
    if (!prev || r.created_at < prev) map.set(r.user_id, r.created_at);
  }
  return map;
}

export async function buildNageursReport(
  admin: SupabaseClient,
  { days = 30, now = new Date() }: { days?: number; now?: Date } = {},
): Promise<NageursReport> {
  const windowDays = clampDays(days);
  const allTime = windowDays === 0;
  const since = allTime ? "2015-01-01T00:00:00.000Z" : sinceIso(windowDays, now);
  const fetchSince = allTime ? since : sinceIso(windowDays * 2, now);
  const since7 = sinceIso(7, now);
  const since1 = sinceIso(1, now);
  const since30 = sinceIso(30, now);
  const notes: string[] = [];

  const allEventNames = [
    ...SIGNUP_STARTED_EVENTS,
    ...SIGNUP_EVENTS,
    ...PLAN_EVENTS,
    ...FIRST_SESSION_EVENTS,
    ...SECOND_SESSION_EVENTS,
    ...PAYWALL_EVENTS,
    ...CHECKOUT_EVENTS,
    ...CHECKOUT_ABANDONED_EVENTS,
    ...TRIAL_EVENTS,
    ...CANCEL_EVENTS,
    ...PAYMENT_EVENTS,
  ];

  let conversions: any[] = [];
  let planned: any[] = [];
  let feedbacks: any[] = [];
  let access: any[] = [];
  let profiles: any[] = [];
  let adaptations: any[] = [];

  try {
    conversions = await listRows(
      admin,
      "conversion_events",
      "user_id, event_name, created_at, properties",
      (q) => q.gte("created_at", fetchSince).in("event_name", allEventNames),
    );
  } catch {
    notes.push("Événements d’inscription / checkout indisponibles.");
  }

  try {
    planned = await listRows(
      admin,
      "planned_sessions",
      "user_id, status, completed_at, created_at, session_type, week_index, family, intent, generator_version, session_payload",
      (q) => q.or(`created_at.gte.${fetchSince},completed_at.gte.${fetchSince}`),
    );
  } catch {
    try {
      planned = await listRows(
        admin,
        "planned_sessions",
        "user_id, status, completed_at, created_at, session_type, week_index, family, intent, session_payload",
        (q) => q.or(`created_at.gte.${fetchSince},completed_at.gte.${fetchSince}`),
      );
      notes.push("Colonne generator_version absente. Relance la migration planned_sessions.");
    } catch {
      notes.push("Table des séances planifiées absente ou illisible.");
    }
  }

  try {
    feedbacks = await listRows(
      admin,
      "session_feedback",
      "user_id, rating, pain, session_type, session_title, week_number, created_at",
      (q) => q.gte("created_at", fetchSince),
    );
  } catch {
    notes.push("Retours de séances indisponibles.");
  }

  try {
    access = await listRows(
      admin,
      "user_access_state",
      "user_id, access_status, trial_started_at, trial_ends_at, subscription_started_at, subscription_ends_at, cancel_at_period_end",
      (q) => q,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    notes.push(
      msg
        ? `Statuts d’abonnement indisponibles (${msg.slice(0, 80)}).`
        : "Statuts d’abonnement indisponibles.",
    );
  }

  try {
    profiles = await listRows(
      admin,
      "sport_profiles",
      "user_id, level, objective, frequency, pool_length, age, gender, extra",
      (q) => q,
    );
  } catch {
    try {
      profiles = await listRows(
        admin,
        "sport_profiles",
        "user_id, level, objective, frequency, pool_length, age, extra",
        (q) => q,
      );
      notes.push("Colonne sexe pas encore en base. Relance la migration sport_profiles.gender.");
    } catch {
      notes.push("Profils nageur (niveau, objectif, âge, sexe) indisponibles.");
    }
  }

  try {
    adaptations = await listRows(
      admin,
      "weekly_adaptations",
      "user_id, action, volume_mul, created_at",
      (q) => q.gte("created_at", since),
    );
  } catch {
    notes.push("Adaptations moteur indisponibles.");
  }

  const internal = await loadInternalTestUserIds(admin);
  const skip = internal.ids;
  if (skip.size) {
    conversions = dropInternalUsers(conversions, skip);
    planned = dropInternalUsers(planned, skip);
    feedbacks = dropInternalUsers(feedbacks, skip);
    access = dropInternalUsers(access, skip);
    profiles = dropInternalUsers(profiles, skip);
    adaptations = dropInternalUsers(adaptations, skip);
    notes.push(
      internal.source === "directory"
        ? `${skip.size} compte(s) de test exclus des stats (y compris les +alias).`
        : `${skip.size} compte(s) de test exclus des stats. +alias exclus seulement après migration admin_user_directory.`,
    );
  } else if (internal.source === "none") {
    notes.push(
      "Comptes de test (arthur.no / j.wiackowska / admin) non exclus : index nageurs absent.",
    );
  }

  const conversionsNow = conversions.filter((r) => allTime || String(r.created_at || "") >= since);
  const conversionsPrev = allTime
    ? []
    : conversions.filter((r) => {
      const t = String(r.created_at || "");
      return t >= fetchSince && t < since;
    });
  const plannedNow = planned.filter((r) => {
    const t = String(r.completed_at || r.created_at || "");
    return allTime || t >= since;
  });
  const plannedPrev = allTime
    ? []
    : planned.filter((r) => {
      const t = String(r.completed_at || r.created_at || "");
      return t >= fetchSince && t < since;
    });
  const feedbacksNow = feedbacks.filter((r) => allTime || String(r.created_at || "") >= since);
  const feedbacksPrev = allTime
    ? []
    : feedbacks.filter((r) => {
      const t = String(r.created_at || "");
      return t >= fetchSince && t < since;
    });

  const byEvent = (names: string[], rows = conversionsNow) =>
    rows.filter((r) => names.includes(String(r.event_name || "")));

  const signups = distinctUsers(byEvent(SIGNUP_EVENTS));
  const plans = distinctUsers(byEvent(PLAN_EVENTS));
  const first = distinctUsers(byEvent(FIRST_SESSION_EVENTS));
  const second = distinctUsers(byEvent(SECOND_SESSION_EVENTS));

  const firstAt = earliestByUser(byEvent(FIRST_SESSION_EVENTS));
  const signupAt = earliestByUser(byEvent(SIGNUP_EVENTS));
  const delays: number[] = [];
  for (const [uid, t1] of firstAt) {
    const t0 = signupAt.get(uid);
    if (!t0) continue;
    const h = hoursBetween(t0, t1);
    if (h != null) delays.push(h);
  }

  const donePlanned = plannedNow.filter((r) => r.status === "completed");
  const skipPlanned = plannedNow.filter((r) => r.status === "skipped" || r.status === "missed");
  const swimmersPeriod = new Set<string>();
  const swimmers7 = new Set<string>();
  const swimmers1 = new Set<string>();
  const swimmers30 = new Set<string>();
  const markSwimmer = (uid: string, when: string) => {
    if (!uid) return;
    swimmersPeriod.add(uid);
    if (when >= since1) swimmers1.add(uid);
    if (when >= since7) swimmers7.add(uid);
    if (when >= since30) swimmers30.add(uid);
  };
  for (const r of donePlanned) {
    if (!r.user_id) continue;
    markSwimmer(r.user_id, String(r.completed_at || r.created_at || ""));
  }
  for (const r of feedbacksNow) {
    if (!r.user_id) continue;
    markSwimmer(r.user_id, String(r.created_at || ""));
  }
  for (const uid of firstAt.keys()) swimmersPeriod.add(uid);

  if (!planned.length) {
    notes.push(
      "Peu ou pas de séances en base (planned_sessions). « Cette semaine » s’appuie surtout sur les retours et la 1re séance.",
    );
  }

  let tooHard = 0;
  let tooEasy = 0;
  let ok = 0;
  let pain = 0;
  const hardByType = new Map<string, number>();
  const hardByLevel = new Map<string, number>();
  const hardByGoal = new Map<string, number>();
  const hardByWeek = new Map<string, number>();
  const likedByLabel = new Map<string, number>();
  const profileByUser = new Map<string, { level?: string; objective?: string }>();
  for (const p of profiles) {
    if (p.user_id) profileByUser.set(p.user_id, p);
  }
  const categoryMap = new Map<string, number>();
  for (const r of feedbacksNow) {
    const rating = String(r.rating || "");
    const label = sessionLabel(r);
    tally(categoryMap, feedbackCategoryFr(rating));
    if (TOO_HARD.has(rating)) {
      tooHard += 1;
      tally(hardByType, String(r.session_type || "non classé"));
      const prof = profileByUser.get(r.user_id) || {};
      tally(hardByLevel, levelLabelFr((prof as { level?: string }).level));
      tally(hardByGoal, goalLabelFr((prof as { objective?: string }).objective));
      const week = r.week_number != null ? `S${r.week_number}` : "semaine ?";
      tally(hardByWeek, week);
    } else if (TOO_EASY.has(rating)) tooEasy += 1;
    else if (OK_RATING.has(rating)) {
      ok += 1;
      tally(likedByLabel, label);
    }
    if (r.pain === true) pain += 1;
  }

  const skippedByLabel = new Map<string, number>();
  for (const r of skipPlanned) {
    tally(
      skippedByLabel,
      sessionLabel({
        session_type: r.session_type,
        family: r.family,
        intent: r.intent,
        session_payload: r.session_payload,
      }),
    );
  }

  const adaptCounts = { total: adaptations.length, lowered: 0, raised: 0, hold: 0 };
  for (const r of adaptations) {
    adaptCounts[classifyAdaptation(r)] += 1;
  }

  const weekly = weeklyVolumeBuckets(plannedNow, since7);
  const signupStarted = distinctUsers(byEvent(SIGNUP_STARTED_EVENTS));
  const paywalls = distinctUsers(byEvent(PAYWALL_EVENTS));
  const checkoutRows = byEvent(CHECKOUT_EVENTS);
  const checkoutUsers = distinctUsers(checkoutRows);
  const checkouts = checkoutRows.length;
  const abandoned = byEvent(CHECKOUT_ABANDONED_EVENTS).length;
  const paidish = distinctUsers([...byEvent(TRIAL_EVENTS), ...byEvent(PAYMENT_EVENTS)]);

  const accessBy = (status: string) => access.filter((r) => accessStatusOf(r) === status).length;
  const payingOrTrial = access.filter((r) => {
    const s = accessStatusOf(r);
    return s === "trial" || s === "active";
  });
  const everSwam = new Set<string>([...swimmersPeriod, ...firstAt.keys()]);
  for (const r of feedbacksNow) if (r.user_id) everSwam.add(r.user_id);
  const payingIds = payingOrTrial.map((r) => String(r.user_id || "")).filter(Boolean);
  try {
    const swamEver = await usersWhoCompleted(admin, payingIds);
    for (const id of swamEver) everSwam.add(id);
  } catch {
    notes.push("Contrôle « payent sans séance » limité à la période (requête lifetime indisponible).");
  }
  const noSession = payingOrTrial.filter((r) => r.user_id && !everSwam.has(r.user_id)).length;

  const reasonMap = new Map<string, number>();
  for (const r of byEvent(CANCEL_EVENTS)) {
    tally(reasonMap, cancelReasonFromProperties(r.properties));
  }

  const sessionsDone = donePlanned.length;
  const sessionsPlanned = plannedNow.length;
  const d7 = trialToPaidD7(access, now);
  const d30 = paidChurnD30(access, now);

  const genderMap = new Map<string, number>();
  const ageMap = new Map<string, number>();
  const levelMap = new Map<string, number>();
  const goalMap = new Map<string, number>();
  for (const p of profiles) {
    tally(genderMap, genderLabelFr(resolveProfileGender(p)));
    tally(ageMap, ageBandLabel(resolveProfileAge(p)));
    tally(levelMap, levelLabelFr(p.level));
    tally(goalMap, goalLabelFr(p.objective));
  }

  const doneByUser = new Map<string, number>();
  const plannedByUser = new Map<string, number>();
  for (const r of plannedNow) {
    if (!r.user_id) continue;
    plannedByUser.set(r.user_id, (plannedByUser.get(r.user_id) || 0) + 1);
    if (r.status === "completed") {
      doneByUser.set(r.user_id, (doneByUser.get(r.user_id) || 0) + 1);
    }
  }

  const usageSegment = (
    keyFn: (p: any) => string,
  ): Array<{
    type: string;
    nageurs: number;
    actifs: number;
    pct_actifs: number | null;
    seances_moy: number | null;
    completion: number | null;
  }> => {
    const groups = new Map<string, any[]>();
    for (const p of profiles) {
      const key = keyFn(p);
      const list = groups.get(key) || [];
      list.push(p);
      groups.set(key, list);
    }
    return [...groups.entries()]
      .map(([type, rows]) => {
        const nageurs = rows.length;
        let actifs = 0;
        let plannedCount = 0;
        let doneCount = 0;
        for (const p of rows) {
          const uid = String(p.user_id || "");
          const done = doneByUser.get(uid) || 0;
          const plannedN = plannedByUser.get(uid) || 0;
          if (done > 0 || swimmersPeriod.has(uid)) actifs += 1;
          plannedCount += plannedN;
          doneCount += done;
        }
        return {
          type,
          nageurs,
          actifs,
          pct_actifs: ratio(actifs, nageurs),
          seances_moy: nageurs ? Math.round((doneCount / nageurs) * 10) / 10 : null,
          completion: ratio(doneCount, plannedCount),
        };
      })
      .sort((a, b) => b.nageurs - a.nageurs)
      .slice(0, 12);
  };

  const prevSignups = distinctUsers(byEvent(SIGNUP_EVENTS, conversionsPrev));
  const prevFirst = distinctUsers(byEvent(FIRST_SESSION_EVENTS, conversionsPrev));
  const prevDone = plannedPrev.filter((r) => r.status === "completed").length;
  const prevPlanned = plannedPrev.length;
  const prevSwimmers = new Set(
    plannedPrev.filter((r) => r.status === "completed" && r.user_id).map((r) => r.user_id),
  ).size;
  const prevCompletion = ratio(
    prevDone,
    prevPlanned || prevDone + plannedPrev.filter((r) => r.status === "skipped" || r.status === "missed").length,
  );
  const prevTooHard = feedbacksPrev.filter((r) => TOO_HARD.has(String(r.rating || ""))).length;
  const prevTooHardRate = ratio(prevTooHard, feedbacksPrev.length);

  const paidPeriodIds = new Set(
    byEvent(PAYMENT_EVENTS).map((r) => r.user_id).filter(Boolean) as string[],
  );
  const paidPeriod = paidPeriodIds.size;
  const trialsPeriod = distinctUsers(byEvent(TRIAL_EVENTS));
  const generatedUsers = distinctUsers(plannedNow);
  const completedUsers = distinctUsers(donePlanned);

  const versionMap = new Map<string, { generated: number; completed: number; skipped: number }>();
  for (const r of plannedNow) {
    const ver = generatorVersionOf(r);
    const cur = versionMap.get(ver) || { generated: 0, completed: 0, skipped: 0 };
    cur.generated += 1;
    if (r.status === "completed") cur.completed += 1;
    if (r.status === "skipped" || r.status === "missed") cur.skipped += 1;
    versionMap.set(ver, cur);
  }
  const byVersion = [...versionMap.entries()]
    .map(([type, v]) => ({
      type,
      generated: v.generated,
      completed: v.completed,
      skipped: v.skipped,
      completion: ratio(v.completed, v.generated),
    }))
    .sort((a, b) => b.generated - a.generated);

  const byObjectiveUsage = usageSegment((p) => goalLabelFr(p.objective));
  const moneyByObjective = byObjectiveUsage.map((row) => {
    const nageursOf = profiles.filter((p) => goalLabelFr(p.objective) === row.type);
    const payants = nageursOf.filter((p) => p.user_id && paidPeriodIds.has(p.user_id)).length;
    return {
      type: row.type,
      nageurs: row.nageurs,
      payants,
      conversion: ratio(payants, row.nageurs),
    };
  });

  const daily = dailyBuckets(conversionsNow, allTime ? 30 : windowDays, now);
  const dailyDays = allTime ? 30 : windowDays;
  const dailySince = sinceIso(dailyDays, now);
  for (const r of donePlanned) {
    const day = String(r.completed_at || r.created_at || "").slice(0, 10);
    const bucket = daily.find((d) => d.day === day);
    if (bucket && (allTime || String(r.completed_at || r.created_at || "") >= dailySince)) {
      bucket.sessions_done += 1;
    }
  }

  const allSignupAt = earliestByUser(byEvent(SIGNUP_EVENTS, conversions));
  const cohorts = retentionCohorts(
    allSignupAt,
    planned
      .filter((r) => r.status === "completed")
      .map((r) => ({ user_id: r.user_id, completed_at: r.completed_at || r.created_at })),
    now,
  );

  const completionRate = ratio(
    sessionsDone,
    sessionsPlanned || sessionsDone + skipPlanned.length,
  );
  const tooHardRate = ratio(tooHard, feedbacksNow.length);
  const insights = buildProductInsights({
    allTime,
    completion: completionRate,
    prevCompletion,
    tooHardRate,
    prevTooHardRate,
    payingNoSession: noSession,
    byObjective: byObjectiveUsage,
    byVersion,
  });

  return {
    days: windowDays,
    since,
    activation: {
      signups,
      plans,
      first_session: first,
      second_session: second,
      signup_to_plan: ratio(plans, signups),
      plan_to_first: ratio(first, plans || signups),
      first_to_second: ratio(second, first),
      median_hours_to_first: medianNumber(delays),
    },
    dropoff: {
      signup_started: signupStarted,
      signups,
      plans,
      paywalls,
      checkouts,
      abandoned,
      first_session: first,
      started_to_account: ratio(signups, signupStarted),
      account_to_plan: ratio(plans, signups),
      plan_to_first: ratio(first, plans || signups),
      paywall_to_checkout: ratio(checkoutUsers, paywalls),
      checkout_to_paid: ratio(paidish, checkoutUsers),
    },
    usage: {
      swimmers_1d: swimmers1.size,
      swimmers_7d: swimmers7.size,
      swimmers_30d: swimmers30.size,
      swimmers_period: swimmersPeriod.size,
      sessions_planned: sessionsPlanned,
      sessions_done: sessionsDone,
      sessions_skipped: skipPlanned.length,
      completion_rate: completionRate,
      weekly,
    },
    engine: {
      feedbacks: feedbacksNow.length,
      too_hard: tooHard,
      too_easy: tooEasy,
      ok,
      pain,
      too_hard_rate: tooHardRate,
      too_easy_rate: ratio(tooEasy, feedbacksNow.length),
      pain_rate: ratio(pain, feedbacksNow.length),
      hard_by_type: topEntries(hardByType),
      hard_by_level: topEntries(hardByLevel),
      hard_by_week: topEntries(hardByWeek),
      hard_by_goal: topEntries(hardByGoal),
      top_skipped: topEntries(skippedByLabel, 10),
      top_liked: topEntries(likedByLabel, 10),
      adaptations: adaptCounts,
      feedback_categories: topEntries(categoryMap, 12),
      by_version: byVersion,
    },
    money: {
      trial: accessBy("trial"),
      active: accessBy("active"),
      canceled: accessBy("canceled"),
      expired: accessBy("expired"),
      checkouts,
      trials_started: distinctUsers(byEvent(TRIAL_EVENTS)),
      payments: byEvent(PAYMENT_EVENTS).length,
      paying_or_trial_no_session: noSession,
      cancel_reasons: topEntries(reasonMap).map((x) => ({
        reason: x.type,
        count: x.count,
      })),
      d7,
      d30_churn: d30,
      by_objective: moneyByObjective,
    },
    slices: {
      scope: "all_profiles",
      by_gender: genderSliceEntries(genderMap),
      by_age: ageSliceEntries(ageMap),
      by_level: topEntries(levelMap),
      by_goal: topEntries(goalMap),
      by_objective: byObjectiveUsage,
      by_level_usage: usageSegment((p) => levelLabelFr(p.level)),
      by_pool: usageSegment((p) => poolLabelFr(p.pool_length ?? p.extra?.pool_length)),
      by_frequency: usageSegment((p) => frequencyLabelFr(p.frequency)),
    },
    funnel: [
      { key: "signup", label: "Inscription", value: signups, available: true },
      {
        key: "onboarding",
        label: "Onboarding terminé",
        value: null,
        available: false,
        proxy: null,
      },
      { key: "plan", label: "Plan créé", value: plans, available: true },
      {
        key: "generated",
        label: "Séance générée (nageurs)",
        value: generatedUsers,
        available: true,
        proxy: "planned_sessions distinct users",
      },
      {
        key: "opened",
        label: "Séance ouverte",
        value: null,
        available: false,
        proxy: null,
      },
      {
        key: "started",
        label: "Séance commencée",
        value: null,
        available: false,
        proxy: null,
      },
      {
        key: "completed",
        label: "Séance terminée (nageurs)",
        value: completedUsers,
        available: true,
        proxy: "planned_sessions.completed distinct users",
      },
      { key: "trial", label: "Trial", value: trialsPeriod, available: true },
      { key: "paid", label: "Payant", value: paidPeriod, available: true },
    ],
    compare: {
      previous_days: allTime ? null : windowDays,
      signups: allTime ? null : prevSignups,
      first_session: allTime ? null : prevFirst,
      sessions_done: allTime ? null : prevDone,
      sessions_planned: allTime ? null : prevPlanned,
      swimmers_period: allTime ? null : prevSwimmers,
      completion_rate: allTime ? null : prevCompletion,
      too_hard_rate: allTime ? null : prevTooHardRate,
    },
    daily,
    cohorts,
    insights,
    instrumentation: [
      { event: "signup_completed", status: "ok", note: "conversion_events" },
      { event: "onboarding_completed", status: "missing", note: "Pas encore émis. À ajouter après le dernier step questionnaire." },
      { event: "plan_generated", status: "ok", note: "conversion_events" },
      { event: "workout_generated", status: "proxy", note: "planned_sessions.created_at. Pas d’event dédié." },
      { event: "workout_opened", status: "missing", note: "À émettre à l’ouverture de la séance." },
      { event: "workout_started", status: "missing", note: "À émettre au premier chrono / premier bloc." },
      { event: "workout_completed", status: "proxy", note: "planned_sessions.status=completed + first_session_completed." },
      { event: "workout_abandoned", status: "proxy", note: "skipped/missed. Pas d’abandon mid-séance." },
      { event: "workout_regenerated", status: "missing", note: "À émettre si une séance est régénérée." },
      { event: "generator_version", status: "proxy", note: "Tampon 1.9 à la persistance. Anciennes séances : inconnue tant que non remigrées." },
      { event: "trial_started", status: "ok", note: "conversion_events" },
      { event: "subscription_started", status: "proxy", note: "payment_succeeded + user_access_state.access_status." },
    ],
    notes,
  };
}
