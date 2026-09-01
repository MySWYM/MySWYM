/**
 * Fiche nageur admin : lookup email / uuid, pas de 13e fonction.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { getCurrentPlan } from "../tools/get-current-plan.js";
import { accessStatusOf, genderLabelFr, hasEntitlement, resolveProfileAge, resolveProfileGender, sessionSourceLabel } from "./nageurs-helpers.js";
import { lookupDirectoryUser } from "./nageur-search.js";
import {
  accessLabelFr,
  frequencyLabelFr,
  goalLabelFr,
  levelLabelFr,
  poolLabelFr,
  swimStyleLabelFr,
} from "./product-labels.js";
import { sessionLabel } from "./nageurs-report.js";

export type NageurFiche = {
  found: boolean;
  query: string;
  user?: {
    id: string;
    email: string | null;
    firstname: string | null;
    created_at: string | null;
    tenure_days: number | null;
    referred_by: string | null;
    referral_code: string | null;
  };
  access?: Record<string, unknown>;
  profile?: Record<string, unknown> | null;
  plan?: Record<string, unknown>;
  sessions?: Array<Record<string, unknown>>;
  feedback?: Array<Record<string, unknown>>;
  adaptations?: Array<Record<string, unknown>>;
  support?: { open: number; last_at: string | null };
  kpis?: {
    generated: number;
    completed: number;
    skipped: number;
    completion: number | null;
    distance_m: number | null;
    distance_scope: "last_12";
  };
  timeline?: Array<{ at: string; label: string }>;
  error?: string;
};

function metaString(meta: Record<string, unknown> | undefined, key: string): string | null {
  if (!meta) return null;
  const v = meta[key];
  const s = String(v || "").trim();
  return s || null;
}

export async function findAuthUser(
  admin: SupabaseClient,
  raw: string,
): Promise<{
  id: string;
  email: string | null;
  created_at: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null> {
  const query = String(raw || "").trim();
  if (!query) return null;
  const authAdmin = admin.auth?.admin;

  const fromDir = await lookupDirectoryUser(admin, query);
  if (fromDir && authAdmin) {
    const { data } = await authAdmin.getUserById(fromDir.user_id);
    const u = data?.user;
    if (u) {
      return {
        id: u.id,
        email: u.email || fromDir.email || null,
        created_at: u.created_at || fromDir.created_at || null,
        app_metadata: (u.app_metadata || {}) as Record<string, unknown>,
        user_metadata: (u.user_metadata || {}) as Record<string, unknown>,
      };
    }
    return {
      id: fromDir.user_id,
      email: fromDir.email,
      created_at: fromDir.created_at,
      app_metadata: {},
      user_metadata: fromDir.firstname ? { firstname: fromDir.firstname } : {},
    };
  }

  if (!authAdmin) return fromDir
    ? {
        id: fromDir.user_id,
        email: fromDir.email,
        created_at: fromDir.created_at,
        user_metadata: fromDir.firstname ? { firstname: fromDir.firstname } : {},
      }
    : null;

  if (isUuid(query)) {
    const { data, error } = await authAdmin.getUserById(query);
    if (error || !data?.user) return null;
    const u = data.user;
    return {
      id: u.id,
      email: u.email || null,
      created_at: u.created_at || null,
      app_metadata: (u.app_metadata || {}) as Record<string, unknown>,
      user_metadata: (u.user_metadata || {}) as Record<string, unknown>,
    };
  }

  if (query.includes("@")) {
    const email = query.toLowerCase();
    let page = 1;
    while (page <= 8) {
      const { data } = await authAdmin.listUsers({ page, perPage: 1000 });
      const batch = data?.users || [];
      const hit = batch.find((u) => String(u.email || "").toLowerCase() === email);
      if (hit) {
        return {
          id: hit.id,
          email: hit.email || null,
          created_at: hit.created_at || null,
          app_metadata: (hit.app_metadata || {}) as Record<string, unknown>,
          user_metadata: (hit.user_metadata || {}) as Record<string, unknown>,
        };
      }
      if (batch.length < 1000) break;
      page += 1;
    }
  }

  return null;
}

export async function buildNageurFiche(
  admin: SupabaseClient,
  { query, now = new Date() }: { query: string; now?: Date },
): Promise<NageurFiche> {
  const q = String(query || "").trim().slice(0, 254);
  if (!q) return { found: false, query: q, error: "Email ou id requis" };

  const user = await findAuthUser(admin, q);
  if (!user) return { found: false, query: q };

  const uid = user.id;
  let [
    accessRes,
    profileRes,
    plan,
    sessionsRes,
    feedbackRes,
    adaptRes,
    supportRes,
  ] = await Promise.all([
    admin
      .from("user_access_state")
      .select(
        "user_id, access_status, trial_started_at, trial_ends_at, trial_used, subscription_started_at, subscription_ends_at, cancel_at_period_end, stripe_customer_id, updated_at",
      )
      .eq("user_id", uid)
      .maybeSingle(),
    admin
      .from("sport_profiles")
      .select("level, objective, frequency, session_duration, pool_length, swim_style, preferred_stroke, age, gender, extra, updated_at")
      .eq("user_id", uid)
      .maybeSingle(),
    getCurrentPlan(admin, uid),
    admin
      .from("planned_sessions")
      .select(
        "status, session_type, family, intent, week_index, session_index, volume, training_distance, completed_at, created_at, generator_version, session_payload",
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("session_feedback")
      .select("rating, pain, session_type, session_title, week_number, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("weekly_adaptations")
      .select("week_index, action, volume_mul, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(6),
    admin
      .from("support_conversations")
      .select("status, updated_at")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  if (profileRes.error) {
    profileRes = await admin
      .from("sport_profiles")
      .select("level, objective, frequency, session_duration, pool_length, swim_style, preferred_stroke, age, extra, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
  }

  if (sessionsRes.error) {
    sessionsRes = await admin
      .from("planned_sessions")
      .select(
        "status, session_type, family, intent, week_index, session_index, volume, training_distance, completed_at, created_at, session_payload",
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(12);
  }

  const accessRow = (accessRes.data || null) as Record<string, unknown> | null;
  const accessLike = (accessRow || {}) as {
    access_status?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  };
  const sessions = (sessionsRes.data || []).map((row: Record<string, unknown>) => ({
    status: row.status,
    label: sessionLabel(row),
    source: sessionSourceLabel(row as { session_payload?: Record<string, unknown> }),
    week_index: row.week_index,
    volume: row.volume ?? row.training_distance,
    completed_at: row.completed_at,
    created_at: row.created_at,
  }));

  const supportRows = supportRes.data || [];
  const supportOpen = supportRows.filter((r: { status?: string }) => r.status === "open").length;
  const rawProfile = (profileRes.data || null) as Record<string, unknown> | null;
  const genderId = resolveProfileGender(rawProfile);
  const age = resolveProfileAge(rawProfile);
  const firstname =
    metaString(user.user_metadata, "firstname")
    || metaString(user.user_metadata, "first_name");

  const [countAll, countDone, countSkip] = await Promise.all([
    admin.from("planned_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid),
    admin.from("planned_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "completed"),
    admin.from("planned_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["skipped", "missed"]),
  ]);

  const generated = countAll.count ?? sessions.length;
  const completed = countDone.count ?? sessions.filter((s) => s.status === "completed").length;
  const skipped = countSkip.count ?? sessions.filter((s) => s.status === "skipped" || s.status === "missed").length;
  const distance = sessions.reduce((sum, s) => {
    const n = Number(s.volume);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const timeline: Array<{ at: string; label: string }> = [];
  const pushTl = (at: unknown, label: string) => {
    const iso = String(at || "");
    if (!iso) return;
    timeline.push({ at: iso, label });
  };
  pushTl(user.created_at, "Inscription");
  if (plan && (plan as { has_plan?: boolean; updated_at?: string }).has_plan) {
    pushTl((plan as { updated_at?: string }).updated_at, "Plan créé");
  }
  for (const s of [...sessions].reverse()) {
    if (s.status === "completed") pushTl(s.completed_at || s.created_at, `Séance terminée · ${s.label}`);
    else if (s.status === "skipped" || s.status === "missed") pushTl(s.created_at, `Séance sautée · ${s.label}`);
    else pushTl(s.created_at, `Séance générée · ${s.label}`);
  }
  for (const f of (feedbackRes.data || []) as Array<Record<string, unknown>>) {
    pushTl(f.created_at, `Feedback ${f.rating || ""}`.trim());
  }
  for (const a of (adaptRes.data || []) as Array<Record<string, unknown>>) {
    pushTl(a.created_at, `Adaptation ${a.action || ""}`.trim());
  }
  pushTl(accessRow?.trial_started_at, "Trial démarré");
  pushTl(accessRow?.subscription_started_at, "Abonnement");
  if (accessStatusOf(accessLike) === "canceled") pushTl(accessRow?.updated_at, "Annulation");
  if (supportRows[0]?.updated_at) pushTl(supportRows[0].updated_at, "Ticket support");
  timeline.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  return {
    found: true,
    query: q,
    user: {
      id: uid,
      email: user.email,
      firstname,
      created_at: user.created_at,
      tenure_days: user.created_at
        ? Math.max(0, Math.floor((now.getTime() - Date.parse(user.created_at)) / 864e5))
        : null,
      referred_by: metaString(user.app_metadata, "referred_by"),
      referral_code: metaString(user.app_metadata, "referral_code"),
    },
    access: accessRow
      ? {
          ...accessRow,
          status: accessStatusOf(accessLike),
          status_label: accessLabelFr(accessStatusOf(accessLike)),
          entitled: hasEntitlement(accessLike, now),
        }
      : { status: "inconnu", status_label: accessLabelFr(""), entitled: false },
    profile: {
      firstname,
      gender: genderId || null,
      gender_label: genderLabelFr(genderId) === "Non renseigné" ? "Non renseigné" : genderLabelFr(genderId),
      age: age ?? "Non renseigné",
      level: rawProfile?.level ?? null,
      level_label: levelLabelFr(rawProfile?.level),
      objective: rawProfile?.objective ?? null,
      objective_label: goalLabelFr(rawProfile?.objective),
      frequency: rawProfile?.frequency ?? null,
      frequency_label: frequencyLabelFr(rawProfile?.frequency),
      pool_length: rawProfile?.pool_length ?? null,
      pool_label: poolLabelFr(rawProfile?.pool_length),
      swim_style: rawProfile?.swim_style ?? null,
      swim_style_label: swimStyleLabelFr(rawProfile?.swim_style),
      preferred_stroke: rawProfile?.preferred_stroke ?? null,
      session_duration: rawProfile?.session_duration ?? null,
      updated_at: rawProfile?.updated_at ?? null,
    },
    plan,
    sessions,
    feedback: (feedbackRes.data || []).map((f: Record<string, unknown>) => ({
      rating: f.rating,
      pain: f.pain,
      label: sessionLabel(f),
      week_number: f.week_number,
      created_at: f.created_at,
    })),
    adaptations: adaptRes.data || [],
    support: {
      open: supportOpen,
      last_at: supportRows[0]?.updated_at || null,
    },
    kpis: {
      generated,
      completed,
      skipped,
      completion: generated ? completed / generated : null,
      distance_m: distance || null,
      distance_scope: "last_12",
    },
    timeline: timeline.slice(-24),
  };
}
