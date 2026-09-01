/**
 * update_user_profile, whitelist stricte, userId serveur uniquement.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EQUIPMENT_IDS,
  normalizeProfileEquipment,
} from "../../../../src/lib/sports-engine/types.js";
import { createSportsPersistence } from "../../../../src/lib/sports-persistence/index.js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { toolFail, toolOk } from "./result.js";

const ALLOWED_LEVELS = new Set([
  "découverte",
  "beginner",
  "régulier",
  "sportif",
  "intermediate",
  "performance",
  "advanced",
]);

/** Champs coaching autorisés (jamais abo / email / stripe / rôle / sexe / âge). */
const FIELD_MAP: Record<
  string,
  {
    sportColumn?: string;
    profileKey: string;
    validate: (v: unknown) => { ok: true; value: unknown } | { ok: false; error: string };
  }
> = {
  goal: {
    sportColumn: "objective",
    profileKey: "goal",
    validate: (v) =>
      typeof v === "string" && v.trim().length > 0 && v.length <= 80
        ? { ok: true, value: v.trim() }
        : { ok: false, error: "invalid_goal" },
  },
  level: {
    sportColumn: "level",
    profileKey: "level",
    validate: (v) =>
      typeof v === "string" && ALLOWED_LEVELS.has(v)
        ? { ok: true, value: v }
        : { ok: false, error: "invalid_level" },
  },
  frequency: {
    sportColumn: "frequency",
    profileKey: "sessionsPerWeek",
    validate: (v) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) && n >= 1 && n <= 5
        ? { ok: true, value: n }
        : { ok: false, error: "invalid_frequency" };
    },
  },
  sessions_per_week: {
    sportColumn: "frequency",
    profileKey: "sessionsPerWeek",
    validate: (v) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) && n >= 1 && n <= 5
        ? { ok: true, value: n }
        : { ok: false, error: "invalid_frequency" };
    },
  },
  target_date: {
    profileKey: "eventDate",
    validate: (v) => {
      if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) {
        return { ok: false, error: "invalid_target_date" };
      }
      return { ok: true, value: v.slice(0, 10) };
    },
  },
  event_date: {
    profileKey: "eventDate",
    validate: (v) => {
      if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) {
        return { ok: false, error: "invalid_target_date" };
      }
      return { ok: true, value: v.slice(0, 10) };
    },
  },
  pool_length: {
    sportColumn: "pool_length",
    profileKey: "pool",
    validate: (v) => {
      const n = Number(v);
      return n === 25 || n === 50
        ? { ok: true, value: n }
        : { ok: false, error: "invalid_pool_length" };
    },
  },
  equipment: {
    sportColumn: "equipment",
    profileKey: "equipment",
    validate: (v) => {
      if (!Array.isArray(v)) return { ok: false, error: "invalid_equipment" };
      const norm = normalizeProfileEquipment(v);
      if (!norm) return { ok: false, error: "invalid_equipment" };
      const bad = norm.filter((e) => !EQUIPMENT_IDS.includes(e));
      if (bad.length) return { ok: false, error: "invalid_equipment" };
      return { ok: true, value: norm };
    },
  },
  preferred_stroke: {
    sportColumn: "preferred_stroke",
    profileKey: "preferredStroke",
    validate: (v) =>
      typeof v === "string" && v.trim().length > 0 && v.length <= 40
        ? { ok: true, value: v.trim() }
        : { ok: false, error: "invalid_preferred_stroke" },
  },
  preferred_strokes: {
    sportColumn: "preferred_stroke",
    profileKey: "preferredStroke",
    validate: (v) => {
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") {
        return { ok: true, value: String(v[0]).trim() };
      }
      if (typeof v === "string" && v.trim()) {
        return { ok: true, value: v.trim() };
      }
      return { ok: false, error: "invalid_preferred_stroke" };
    },
  },
};

const FORBIDDEN = new Set([
  "email",
  "password",
  "role",
  "subscription",
  "stripe",
  "stripe_customer_id",
  "user_id",
  "id",
  "access_status",
  "trial_used",
  "app_metadata",
  "user_metadata",
]);

export async function updateUserProfile(
  admin: SupabaseClient,
  ctx: { userId: string | null; conversationId?: string | null },
  args: { fields?: Record<string, unknown> } = {},
) {
  const userId = ctx.userId;
  if (!userId || !isUuid(userId)) {
    return toolFail("unauthenticated", { requires_auth: true });
  }

  const fields = args.fields && typeof args.fields === "object" ? args.fields : {};
  const keys = Object.keys(fields);
  if (!keys.length) return toolFail("no_fields");

  for (const k of keys) {
    if (FORBIDDEN.has(k) || k.includes("stripe") || k.includes("password")) {
      return toolFail("forbidden_field", { field: k });
    }
    if (!FIELD_MAP[k]) {
      return toolFail("field_not_allowed", { field: k });
    }
  }

  const patchSport: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  const patchProfile: Record<string, unknown> = {};
  const applied: Record<string, unknown> = {};

  for (const k of keys) {
    const spec = FIELD_MAP[k];
    const validated = spec.validate(fields[k]);
    if (!validated.ok) {
      return toolFail(validated.error, { field: k });
    }
    applied[k] = validated.value;
    patchProfile[spec.profileKey] = validated.value;
    if (spec.sportColumn) patchSport[spec.sportColumn] = validated.value;
    if (spec.profileKey === "eventDate") {
      patchSport.extra = {
        ...((patchSport.extra as object) || {}),
        eventDate: validated.value,
      };
    }
  }

  // Merge extra.eventDate properly from existing row
  if (patchProfile.eventDate) {
    const { data: existing } = await admin
      .from("sport_profiles")
      .select("extra")
      .eq("user_id", userId)
      .maybeSingle();
    const prevExtra =
      existing?.extra && typeof existing.extra === "object" ? existing.extra : {};
    patchSport.extra = { ...prevExtra, eventDate: patchProfile.eventDate };
  }

  const { error: sportErr } = await admin
    .from("sport_profiles")
    .upsert(patchSport, { onConflict: "user_id" });

  if (sportErr) {
    arthurLog("error", "update_profile_sport_failed", { code: sportErr.code });
    return toolFail("persistence_error");
  }

  // Miroir dans user_plans.plans_json[].profile + colonne profile si présente
  try {
    const { data: plansRow } = await admin
      .from("user_plans")
      .select("plans_json, active_plan_id, profile")
      .eq("user_id", userId)
      .maybeSingle();

    if (plansRow) {
      const plans = Array.isArray(plansRow.plans_json) ? plansRow.plans_json : [];
      const activeId = plansRow.active_plan_id;
      const nextPlans = plans.map((entry: { id?: string; profile?: object }) => {
        if (activeId && entry.id !== activeId) return entry;
        if (!activeId && entry !== plans[0]) return entry;
        return {
          ...entry,
          profile: { ...(entry.profile || {}), ...patchProfile },
        };
      });
      await admin
        .from("user_plans")
        .update({
          plans_json: nextPlans,
          profile: { ...(plansRow.profile || {}), ...patchProfile },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    const persist = createSportsPersistence(admin);
    await persist.upsertSportProfile(userId, {
      ...patchProfile,
      goal: patchProfile.goal,
      sessionsPerWeek: patchProfile.sessionsPerWeek,
      pool: patchProfile.pool,
      equipment: patchProfile.equipment,
      preferredStroke: patchProfile.preferredStroke,
      eventDate: patchProfile.eventDate,
    });
  } catch (err) {
    arthurLog("warn", "update_profile_mirror_partial", {
      name: err instanceof Error ? err.name : "Error",
    });
  }

  await trackAiEvent(admin, {
    conversationId: ctx.conversationId,
    userId,
    eventType: "profile_updated",
    metadata: { fields: Object.keys(applied) },
  });

  return toolOk({ updated: applied });
}
