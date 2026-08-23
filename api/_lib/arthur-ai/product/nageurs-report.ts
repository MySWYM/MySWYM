/**
 * Rapport produit « Nageurs » — activation, habitude, moteur, argent.
 * Servi par GET /api/admin/arthur-readiness?nageurs=1 (pas de 13e fonction Hobby).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNUP_EVENTS = ["signup_completed", "signup"];
const PLAN_EVENTS = ["plan_generated"];
const FIRST_SESSION_EVENTS = ["first_session_completed"];
const SECOND_SESSION_EVENTS = ["second_session_completed"];
const CHECKOUT_EVENTS = ["checkout_started", "checkout_session_created"];
const TRIAL_EVENTS = ["trial_started"];
const CANCEL_EVENTS = ["cancel_survey"];
const PAYMENT_EVENTS = ["payment_succeeded"];

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
  usage: {
    swimmers_7d: number;
    swimmers_period: number;
    sessions_planned: number;
    sessions_done: number;
    sessions_skipped: number;
    completion_rate: number | null;
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
  };
  notes: string[];
};

export function clampDays(raw: unknown, fallback = 30): number {
  const n = Number(raw);
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
  const since = sinceIso(windowDays, now);
  const since7 = sinceIso(7, now);
  const notes: string[] = [];

  const allEventNames = [
    ...SIGNUP_EVENTS,
    ...PLAN_EVENTS,
    ...FIRST_SESSION_EVENTS,
    ...SECOND_SESSION_EVENTS,
    ...CHECKOUT_EVENTS,
    ...TRIAL_EVENTS,
    ...CANCEL_EVENTS,
    ...PAYMENT_EVENTS,
  ];

  let conversions: any[] = [];
  let planned: any[] = [];
  let feedbacks: any[] = [];
  let access: any[] = [];

  try {
    conversions = await listRows(
      admin,
      "conversion_events",
      "user_id, event_name, created_at, properties",
      (q) => q.gte("created_at", since).in("event_name", allEventNames),
    );
  } catch {
    notes.push("Événements d’inscription / checkout indisponibles.");
  }

  try {
    planned = await listRows(
      admin,
      "planned_sessions",
      "user_id, status, completed_at, created_at, session_type",
      (q) => q.or(`created_at.gte.${since},completed_at.gte.${since}`),
    );
  } catch {
    notes.push("Table des séances planifiées absente ou illisible.");
  }

  try {
    feedbacks = await listRows(
      admin,
      "session_feedback",
      "user_id, rating, pain, session_type, created_at",
      (q) => q.gte("created_at", since),
    );
  } catch {
    notes.push("Retours de séances indisponibles.");
  }

  try {
    access = await listRows(admin, "user_access_state", "user_id, status", (q) => q);
  } catch {
    notes.push("Statuts d’abonnement indisponibles.");
  }

  const byEvent = (names: string[]) =>
    conversions.filter((r) => names.includes(String(r.event_name || "")));

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

  const donePlanned = planned.filter((r) => r.status === "completed");
  const skipPlanned = planned.filter((r) => r.status === "skipped" || r.status === "missed");
  const swimmersPeriod = new Set<string>();
  const swimmers7 = new Set<string>();
  for (const r of donePlanned) {
    if (!r.user_id) continue;
    swimmersPeriod.add(r.user_id);
    const when = r.completed_at || r.created_at;
    if (when && when >= since7) swimmers7.add(r.user_id);
  }
  for (const r of feedbacks) {
    if (!r.user_id) continue;
    swimmersPeriod.add(r.user_id);
    if (r.created_at && r.created_at >= since7) swimmers7.add(r.user_id);
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
  for (const r of feedbacks) {
    const rating = String(r.rating || "");
    if (TOO_HARD.has(rating)) {
      tooHard += 1;
      tally(hardByType, String(r.session_type || "non classé"));
    } else if (TOO_EASY.has(rating)) tooEasy += 1;
    else if (OK_RATING.has(rating)) ok += 1;
    if (r.pain === true) pain += 1;
  }

  const accessBy = (status: string) => access.filter((r) => r.status === status).length;
  const payingOrTrial = access.filter((r) => r.status === "trial" || r.status === "active");
  const everSwam = new Set<string>([...swimmersPeriod, ...firstAt.keys()]);
  for (const r of feedbacks) if (r.user_id) everSwam.add(r.user_id);
  const noSession = payingOrTrial.filter((r) => r.user_id && !everSwam.has(r.user_id)).length;

  const reasonMap = new Map<string, number>();
  for (const r of byEvent(CANCEL_EVENTS)) {
    tally(reasonMap, cancelReasonFromProperties(r.properties));
  }

  const sessionsDone = donePlanned.length || feedbacks.length;
  const sessionsPlanned = planned.length;

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
    usage: {
      swimmers_7d: swimmers7.size,
      swimmers_period: swimmersPeriod.size,
      sessions_planned: sessionsPlanned,
      sessions_done: sessionsDone,
      sessions_skipped: skipPlanned.length,
      completion_rate: ratio(
        sessionsDone,
        sessionsPlanned || sessionsDone + skipPlanned.length,
      ),
    },
    engine: {
      feedbacks: feedbacks.length,
      too_hard: tooHard,
      too_easy: tooEasy,
      ok,
      pain,
      too_hard_rate: ratio(tooHard, feedbacks.length),
      too_easy_rate: ratio(tooEasy, feedbacks.length),
      pain_rate: ratio(pain, feedbacks.length),
      hard_by_type: topEntries(hardByType),
    },
    money: {
      trial: accessBy("trial"),
      active: accessBy("active"),
      canceled: accessBy("canceled"),
      expired: accessBy("expired"),
      checkouts: byEvent(CHECKOUT_EVENTS).length,
      trials_started: distinctUsers(byEvent(TRIAL_EVENTS)),
      payments: byEvent(PAYMENT_EVENTS).length,
      paying_or_trial_no_session: noSession,
      cancel_reasons: topEntries(reasonMap).map((x) => ({
        reason: x.type,
        count: x.count,
      })),
    },
    notes,
  };
}
