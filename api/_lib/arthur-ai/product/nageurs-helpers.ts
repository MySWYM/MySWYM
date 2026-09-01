/**
 * Helpers purs du cockpit admin nageurs (argent, courbes, files).
 */

export type AccessLike = {
  user_id?: string | null;
  access_status?: string | null;
  status?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
  cancel_at_period_end?: boolean | null;
};

export type PriceTier = "monthly_flex" | "monthly_commit" | "annual" | "unknown";

const FLEX_IDS = new Set(
  [
    process.env.STRIPE_PRICE_MONTHLY_FLEX,
    process.env.VITE_STRIPE_PRICE_MONTHLY_FLEX,
    "price_1U3N2tAS4mfgF2TwyaI2hf22",
    "price_1U67kYAS4mfgF2Twaw269yaU",
  ].filter(Boolean) as string[],
);
const COMMIT_IDS = new Set(
  [
    process.env.STRIPE_PRICE_MONTHLY_COMMIT,
    process.env.VITE_STRIPE_PRICE_MONTHLY_COMMIT,
    "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
    "price_1U67kZAS4mfgF2Twi5Px8ZvG",
  ].filter(Boolean) as string[],
);
const ANNUAL_IDS = new Set(
  [
    process.env.STRIPE_PRICE_ANNUAL,
    process.env.VITE_STRIPE_PRICE_ANNUAL,
    "price_1U7E38AS4mfgF2TwpJGYoMpE",
    "price_1U67kaAS4mfgF2TwvUsVQ3vE",
  ].filter(Boolean) as string[],
);

export const TIER_MRR: Record<Exclude<PriceTier, "unknown">, number> = {
  monthly_flex: 9.99,
  monthly_commit: 4.99,
  annual: Math.round((52.99 / 12) * 100) / 100,
};

export function accessStatusOf(row: AccessLike | null | undefined): string {
  if (!row) return "";
  return String(row.access_status || row.status || "").trim();
}

export function isIsoFuture(iso: string | null | undefined, now: Date): boolean {
  if (!iso) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms > now.getTime();
}

export function hasEntitlement(row: AccessLike, now: Date): boolean {
  const status = accessStatusOf(row);
  if (status === "trial") return isIsoFuture(row.trial_ends_at, now);
  if (status === "active") {
    return isIsoFuture(row.subscription_ends_at, now) || row.subscription_ends_at == null;
  }
  if (status === "canceled") return isIsoFuture(row.subscription_ends_at, now);
  return false;
}

export function classifyPriceId(raw: unknown): PriceTier {
  const id = String(raw || "").trim();
  if (!id) return "unknown";
  if (FLEX_IDS.has(id) || /flex/i.test(id)) return "monthly_flex";
  if (COMMIT_IDS.has(id) || /commit/i.test(id)) return "monthly_commit";
  if (ANNUAL_IDS.has(id) || /annual|year/i.test(id)) return "annual";
  return "unknown";
}

export function priceIdFromProperties(properties: unknown): string | null {
  if (!properties || typeof properties !== "object") return null;
  const p = properties as Record<string, unknown>;
  const id = p.price_id ?? p.priceId ?? p.price;
  const s = String(id || "").trim();
  return s || null;
}

export function referralFlagFromProperties(properties: unknown): boolean {
  if (!properties || typeof properties !== "object") return false;
  const p = properties as Record<string, unknown>;
  const code = p.referralCode ?? p.referral_code ?? p.referred_by;
  return Boolean(String(code || "").trim());
}

export function lastPriceByUser(
  events: Array<{
    user_id?: string | null;
    created_at?: string | null;
    properties?: unknown;
  }>,
): Map<string, PriceTier> {
  const sorted = [...events].sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || "")),
  );
  const map = new Map<string, PriceTier>();
  for (const e of sorted) {
    if (!e.user_id || map.has(e.user_id)) continue;
    const id = priceIdFromProperties(e.properties);
    if (!id) continue;
    map.set(e.user_id, classifyPriceId(id));
  }
  return map;
}

export function moneyMix(
  paying: AccessLike[],
  priceByUser: Map<string, PriceTier>,
): {
  flex: number;
  commit: number;
  annual: number;
  unknown: number;
  estimated_mrr: number;
} {
  let flex = 0;
  let commit = 0;
  let annual = 0;
  let unknown = 0;
  let mrr = 0;
  for (const row of paying) {
    if (!row.user_id) continue;
    const tier = priceByUser.get(row.user_id) || "unknown";
    if (tier === "monthly_flex") {
      flex += 1;
      mrr += TIER_MRR.monthly_flex;
    } else if (tier === "monthly_commit") {
      commit += 1;
      mrr += TIER_MRR.monthly_commit;
    } else if (tier === "annual") {
      annual += 1;
      mrr += TIER_MRR.annual;
    } else {
      unknown += 1;
    }
  }
  return {
    flex,
    commit,
    annual,
    unknown,
    estimated_mrr: Math.round(mrr * 100) / 100,
  };
}

export function trialsEndingSoon(
  access: AccessLike[],
  now: Date,
  withinHours = 48,
): AccessLike[] {
  const until = now.getTime() + withinHours * 3600_000;
  return access.filter((row) => {
    if (accessStatusOf(row) !== "trial") return false;
    const ends = row.trial_ends_at ? Date.parse(row.trial_ends_at) : NaN;
    return Number.isFinite(ends) && ends > now.getTime() && ends <= until;
  });
}

export function dayKey(iso: string): string {
  return String(iso || "").slice(0, 10);
}

export function dailyBuckets(
  events: Array<{ event_name?: string | null; created_at?: string | null }>,
  days: number,
  now: Date,
): Array<{
  day: string;
  signups: number;
  first_session: number;
  trials: number;
  payments: number;
  sessions_done: number;
}> {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 864e5);
    keys.push(d.toISOString().slice(0, 10));
  }
  const map = new Map(
    keys.map((day) => [
      day,
      { day, signups: 0, first_session: 0, trials: 0, payments: 0, sessions_done: 0 },
    ]),
  );
  for (const e of events) {
    const day = dayKey(e.created_at || "");
    const row = map.get(day);
    if (!row) continue;
    const name = String(e.event_name || "");
    if (name === "signup_completed" || name === "signup") row.signups += 1;
    else if (name === "first_session_completed") row.first_session += 1;
    else if (name === "trial_started") row.trials += 1;
    else if (name === "payment_succeeded") row.payments += 1;
  }
  return keys.map((k) => map.get(k)!);
}

export function sessionSourceLabel(row: {
  session_payload?: Record<string, unknown> | null;
  composedBy?: string | null;
} = {}): string {
  const payload = row.session_payload && typeof row.session_payload === "object"
    ? row.session_payload
    : {};
  const by = String(row.composedBy || payload.composedBy || "").trim();
  if (by === "natation-sheet") return "Sheet";
  if (by === "session-composer") return "Composeur";
  if (by === "arthur-bank") return "Banque Arthur";
  if (by === "legacy-generator") return "Legacy";
  if (by) return by;
  return "inconnu";
}

export type GenderId = "homme" | "femme" | "";

export function normalizeGender(value: unknown): GenderId {
  if (value == null || value === "") return "";
  const s = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s === "homme" || s === "male" || s === "man" || s === "h") return "homme";
  if (s === "femme" || s === "female" || s === "woman" || s === "f") return "femme";
  return "";
}

export function genderLabelFr(value: unknown): string {
  const id = normalizeGender(value);
  if (id === "homme") return "Homme";
  if (id === "femme") return "Femme";
  return "Non renseigné";
}

export function ageBandLabel(age: unknown): string {
  if (age == null || age === "") return "Non renseigné";
  const n = Number(age);
  if (!Number.isFinite(n) || n < 0 || n > 120) return "Non renseigné";
  if (n < 25) return "< 25";
  if (n < 35) return "25-34";
  if (n < 45) return "35-44";
  if (n < 55) return "45-54";
  return "55+";
}

export function resolveProfileAge(row: { age?: unknown; extra?: unknown } | null | undefined): number | null {
  if (!row) return null;
  const extra = row.extra && typeof row.extra === "object"
    ? (row.extra as Record<string, unknown>)
    : {};
  const n = Number(row.age ?? extra.age);
  if (Number.isFinite(n) && n >= 0 && n <= 120) return n;
  return null;
}

export function resolveProfileGender(row: { gender?: unknown; extra?: unknown } | null | undefined): GenderId {
  if (!row) return "";
  const extra = row.extra && typeof row.extra === "object"
    ? (row.extra as Record<string, unknown>)
    : {};
  return normalizeGender(row.gender ?? extra.gender);
}

const AGE_BAND_ORDER = ["< 25", "25-34", "35-44", "45-54", "55+", "Non renseigné"];
const GENDER_LABEL_ORDER = ["Homme", "Femme", "Non renseigné"];

export function orderedTallies(
  map: Map<string, number>,
  order: string[],
): Array<{ type: string; count: number }> {
  const seen = new Set<string>();
  const out: Array<{ type: string; count: number }> = [];
  for (const key of order) {
    const count = map.get(key);
    if (count) {
      out.push({ type: key, count });
      seen.add(key);
    }
  }
  for (const [type, count] of map) {
    if (!seen.has(type) && count) out.push({ type, count });
  }
  return out;
}

export function genderSliceEntries(map: Map<string, number>) {
  return orderedTallies(map, GENDER_LABEL_ORDER);
}

export function ageSliceEntries(map: Map<string, number>) {
  return orderedTallies(map, AGE_BAND_ORDER);
}

export function weekMondayKey(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Rétention par cohorte d’inscription, via activité réelle (séance terminée).
 * rates[i] = part des inscrits encore éligibles ayant nagé en semaine i (S0…S4).
 * null si la semaine n’est pas encore écoulée.
 */
export function retentionCohorts(
  signupAt: Map<string, string>,
  completedAt: Array<{ user_id?: string | null; completed_at?: string | null }>,
  now: Date,
  weeks = 5,
): Array<{ cohort: string; size: number; rates: Array<number | null> }> {
  const activity = new Map<string, string[]>();
  for (const row of completedAt) {
    if (!row.user_id || !row.completed_at) continue;
    const list = activity.get(row.user_id) || [];
    list.push(row.completed_at);
    activity.set(row.user_id, list);
  }
  const groups = new Map<string, string[]>();
  for (const [uid, iso] of signupAt) {
    const key = weekMondayKey(iso);
    if (!key) continue;
    const list = groups.get(key) || [];
    list.push(uid);
    groups.set(key, list);
  }
  const nowMs = now.getTime();
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([cohort, uids]) => {
      const size = uids.length;
      const rates = Array.from({ length: weeks }, (_, week) => {
        const start = Date.parse(cohort) + week * 7 * 864e5;
        const end = start + 7 * 864e5;
        if (!Number.isFinite(start) || end > nowMs) return null;
        let active = 0;
        for (const uid of uids) {
          const times = activity.get(uid) || [];
          if (times.some((t) => {
            const ms = Date.parse(t);
            return Number.isFinite(ms) && ms >= start && ms < end;
          })) active += 1;
        }
        return size ? active / size : null;
      });
      return { cohort, size, rates };
    });
}

export function feedbackCategoryFr(rating: unknown): string {
  const s = String(rating || "").trim().toLowerCase();
  if (s === "too_hard" || s === "hard" || s === "too_difficult") return "Trop difficile";
  if (s === "too_easy" || s === "easy") return "Trop facile";
  if (s === "too_long" || s === "long") return "Trop longue";
  if (s === "too_short" || s === "short") return "Trop courte";
  if (s === "repetitive" || s === "too_repetitive") return "Trop répétitive";
  if (s === "unclear" || s === "incompris") return "Exercice incompris";
  if (s === "ok" || s === "good" || s === "adapted" || s === "juste") return "Adaptée";
  if (s === "bug") return "Bug";
  if (!s) return "Autre";
  return "Autre";
}

export function generatorVersionOf(row: {
  generator_version?: string | null;
  session_payload?: Record<string, unknown> | null;
}): string {
  const col = String(row.generator_version || "").trim();
  if (col) return col;
  const payload = row.session_payload && typeof row.session_payload === "object"
    ? row.session_payload
    : {};
  const fromPayload = String(payload.generator_version || "").trim();
  return fromPayload || "inconnue";
}

export function buildProductInsights(input: {
  allTime: boolean;
  completion?: number | null;
  prevCompletion?: number | null;
  tooHardRate?: number | null;
  prevTooHardRate?: number | null;
  payingNoSession?: number;
  byObjective?: Array<{ type: string; pct_actifs: number | null; nageurs: number }>;
  byVersion?: Array<{ type: string; generated: number; completion: number | null }>;
}): string[] {
  const out: string[] = [];
  if (!input.allTime && input.completion != null && input.prevCompletion != null && input.prevCompletion > 0) {
    const delta = (input.completion - input.prevCompletion) / input.prevCompletion;
    if (Math.abs(delta) >= 0.08) {
      const pct = Math.round(Math.abs(delta) * 100);
      out.push(
        delta < 0
          ? `Le taux de complétion a baissé de ${pct} % vs la période précédente.`
          : `Le taux de complétion a augmenté de ${pct} % vs la période précédente.`,
      );
    }
  }
  if (!input.allTime && input.tooHardRate != null && input.prevTooHardRate != null && input.prevTooHardRate > 0) {
    const delta = (input.tooHardRate - input.prevTooHardRate) / input.prevTooHardRate;
    if (delta >= 0.15) {
      out.push(`Les retours « trop difficile » ont augmenté de ${Math.round(delta * 100)} % vs la période précédente.`);
    }
  }
  const segs = (input.byObjective || []).filter((s) => s.nageurs >= 8 && s.pct_actifs != null);
  if (segs.length >= 2) {
    const avg =
      segs.reduce((sum, s) => sum + (s.pct_actifs || 0), 0) / segs.length;
    const best = [...segs].sort((a, b) => (b.pct_actifs || 0) - (a.pct_actifs || 0))[0];
    if (best && avg > 0 && (best.pct_actifs || 0) >= avg * 1.15) {
      const lift = Math.round((((best.pct_actifs || 0) - avg) / avg) * 100);
      out.push(`Les nageurs « ${best.type} » sont ${lift} % plus actifs que la moyenne des segments.`);
    }
  }
  const versions = (input.byVersion || []).filter((v) => v.type !== "inconnue" && v.generated >= 8);
  if (versions.length >= 2) {
    const sorted = [...versions].sort((a, b) => (a.completion || 0) - (b.completion || 0));
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    if (low && high && high.completion != null && low.completion != null && high.completion > 0) {
      const delta = (high.completion - low.completion) / high.completion;
      if (delta >= 0.05) {
        out.push(
          `Generator ${high.type} complète ${Math.round(delta * 100)} % de plus que ${low.type}.`,
        );
      }
    }
  }
  if ((input.payingNoSession || 0) > 0) {
    out.push(`${input.payingNoSession} essai(s) ou payant(s) sans séance. À relancer.`);
  }
  return out.slice(0, 5);
}

export function queueItem(
  row: AccessLike & { email?: string | null; hint?: string | null },
): { user_id: string; email: string | null; hint: string | null } {
  return {
    user_id: String(row.user_id || ""),
    email: row.email || null,
    hint: row.hint || row.trial_ends_at || null,
  };
}
