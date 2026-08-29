/**
 * create_training_plan, persiste un plan via generateArthurPlan (moteur existant).
 * userId = contexte serveur uniquement (jamais depuis le modèle).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSportsPersistence } from "../../../../src/lib/sports-persistence/index.js";
import { generateArthurPlan } from "../../../../src/lib/sports-engine/server-adapter/generateArthurPlan.js";
import { replaceActivePlan } from "../../../../src/lib/swimmer-profile.js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { getUserProfile } from "./get-user-profile.js";
import { getSubscriptionStatus } from "./get-subscription-status.js";
import { toolFail, toolOk } from "./result.js";

export interface CreateTrainingPlanArgs {
  confirmed?: boolean;
  replace_existing?: boolean;
  weeks?: number | null;
  goal?: string | null;
  frequency?: number | null;
  target_date?: string | null;
  level?: string | null;
}

export async function createTrainingPlan(
  admin: SupabaseClient,
  ctx: {
    userId: string | null;
    conversationId?: string | null;
    accessToken?: string | null;
  },
  args: CreateTrainingPlanArgs = {},
) {
  const userId = ctx.userId;
  if (!userId || !isUuid(userId)) {
    return toolFail("unauthenticated", {
      requires_auth: true,
      reason: "MySWYM login required",
    });
  }

  if (args.confirmed !== true) {
    await trackAiEvent(admin, {
      conversationId: ctx.conversationId,
      userId,
      eventType: "plan_requested",
      metadata: { blocked: "confirmation_required" },
    });
    return {
      success: false,
      requires_confirmation: true,
      reason: "confirmation_required",
      data: {
        prompt:
          "Je peux te générer ton plan personnalisé. Tu veux que je le crée ?",
      },
      error: "confirmation_required",
    };
  }

  const sub = await getSubscriptionStatus(admin, userId);
  if (!sub.has_premium_access) {
    await trackAiEvent(admin, {
      conversationId: ctx.conversationId,
      userId,
      eventType: "plan_creation_blocked",
      metadata: { reason: "no_premium_access", status: sub.status },
    });
    return toolFail("premium_required", {
      reason: "premium_required",
      subscription: sub,
    });
  }

  const { data: plansRow, error: plansErr } = await admin
    .from("user_plans")
    .select("plans_json, active_plan_id, plan_history, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (plansErr) {
    arthurLog("error", "create_plan_load_failed", { code: plansErr.code });
    return toolFail("persistence_error");
  }

  const plans = Array.isArray(plansRow?.plans_json) ? plansRow.plans_json : [];
  const planHistory = Array.isArray(plansRow?.plan_history)
    ? plansRow.plan_history
    : [];
  const activeId = plansRow?.active_plan_id || null;
  const activeEntry =
    plans.find((p: { id?: string }) => p?.id === activeId) || plans[0] || null;

  if (activeEntry && args.replace_existing !== true) {
    await trackAiEvent(admin, {
      conversationId: ctx.conversationId,
      userId,
      eventType: "plan_creation_blocked",
      metadata: { reason: "active_plan_exists", plan_id: activeEntry.id },
    });
    return {
      success: false,
      requires_confirmation: true,
      reason: "active_plan_exists",
      data: {
        plan_id: activeEntry.id,
        prompt:
          "Tu as déjà un plan actif. Tu confirmes que je génère un nouveau plan (en conservant les semaines déjà réalisées) ?",
      },
      error: "active_plan_exists",
    };
  }

  const sportProfile = await getUserProfile(admin, userId);
  const existingProfile =
    activeEntry?.profile && typeof activeEntry.profile === "object"
      ? activeEntry.profile
      : {};

  const mergedProfile = {
    ...existingProfile,
    ...mapSportRowToProfile(sportProfile),
    ...(args.goal ? { goal: args.goal } : {}),
    ...(args.level ? { level: args.level } : {}),
    ...(args.frequency != null ? { sessionsPerWeek: args.frequency } : {}),
    ...(args.target_date ? { eventDate: args.target_date } : {}),
    volumeAdj: activeEntry?.plan?.volumeAdj ?? existingProfile.volumeAdj ?? 1,
    _engineHistory: activeEntry?.plan?._engineHistory || null,
  };

  const generated = await generateArthurPlan({
    userId,
    profile: mergedProfile,
    goal: args.goal || mergedProfile.goal,
    targetDate: args.target_date || mergedProfile.eventDate,
    weeks: args.weeks ?? undefined,
    frequency: args.frequency ?? mergedProfile.sessionsPerWeek,
    isPremium: true,
    existingPlan:
      args.replace_existing && activeEntry?.plan ? activeEntry.plan : null,
    supabase: admin,
  });

  if (!generated.success || !generated.plan) {
    return toolFail(generated.error || "generation_failed", {
      message: generated.message,
    });
  }

  // Nouveau plan_id à chaque génération, l'ancien part en plan_history
  const planId = `plan_${Date.now()}`;

  const entryProfile = { ...generated.profile };
  delete entryProfile.taste;
  delete entryProfile._engineHistory;

  const entry = {
    id: planId,
    profile: entryProfile,
    plan: generated.plan,
    startDate: generated.plan.startDate || Date.now(),
  };

  const replaced = replaceActivePlan(
    plans,
    planHistory,
    entry,
    activeEntry?.id || activeId,
  );

  const { error: upsertErr } = await admin.from("user_plans").upsert(
    {
      user_id: userId,
      plans_json: replaced.plans,
      active_plan_id: replaced.activeId,
      plan_history: replaced.history,
      updated_at: new Date().toISOString(),
      profile: entryProfile,
      plan: generated.plan,
    },
    { onConflict: "user_id" },
  );

  if (upsertErr) {
    arthurLog("error", "create_plan_upsert_failed", { code: upsertErr.code });
    return toolFail("persistence_error");
  }

  try {
    const persist = createSportsPersistence(admin);
    await persist.upsertSportProfile(userId, entryProfile);
    await persist.upsertPlannedSessionsFromPlan(userId, planId, generated.plan);
  } catch (err) {
    arthurLog("warn", "create_plan_facts_partial", {
      name: err instanceof Error ? err.name : "Error",
    });
  }

  await trackAiEvent(admin, {
    conversationId: ctx.conversationId,
    userId,
    eventType: "plan_created",
    metadata: {
      plan_id: planId,
      weeks_created: generated.weeks_created,
      preserved_weeks: generated.preserved_weeks,
    },
  });

  return toolOk({
    plan_id: planId,
    weeks_created: generated.weeks_created,
    preserved_weeks: generated.preserved_weeks,
    total_real_weeks: generated.plan.totalRealWeeks,
    goal: entryProfile.goal,
    level: entryProfile.level,
    frequency: entryProfile.sessionsPerWeek,
    app_path: "/app",
  });
}

function mapSportRowToProfile(row: Record<string, unknown>) {
  if (!row || Object.keys(row).length === 0) return {};
  const extra =
    row.extra && typeof row.extra === "object"
      ? (row.extra as Record<string, unknown>)
      : {};
  return {
    level: row.level,
    goal: row.objective,
    sessionsPerWeek: row.frequency,
    sessionDuration: row.session_duration,
    pool: row.pool_length,
    equipment: row.equipment || [],
    preferredStroke: row.preferred_stroke,
    swimStyle: row.swim_style || extra.swimStyle || null,
    birthMonth: extra.birthMonth ?? null,
    birthYear: extra.birthYear ?? null,
    age: row.age ?? extra.age ?? null,
    weightKg: extra.weightKg ?? null,
    heightCm: extra.heightCm ?? null,
    raceTarget: row.race_target,
    injuryStatus: row.injury_status,
    pace100: row.pace100,
    readinessProfile: row.readiness_profile,
    category: extra.category ?? null,
    eventDate: extra.eventDate ?? null,
    trainingFocus: extra.trainingFocus ?? null,
  };
}
