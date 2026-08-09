/**
 * get_current_plan — lecture seule user_plans (aperçu, pas le blob complet).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";

export async function getCurrentPlan(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<Record<string, unknown>> {
  if (!userId || !isUuid(userId)) return {};

  try {
    const { data, error } = await admin
      .from("user_plans")
      .select("active_plan_id, plans_json, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      arthurLog("warn", "get_current_plan_error", { code: error.code });
      return {};
    }
    if (!data) return { has_plan: false };

    const plans = Array.isArray(data.plans_json) ? data.plans_json : [];
    const activeId = data.active_plan_id || null;
    const active =
      plans.find(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          (p as { id?: string }).id === activeId,
      ) || plans[0] || null;

    if (!active || typeof active !== "object") {
      return {
        has_plan: plans.length > 0,
        plan_count: plans.length,
        active_plan_id: activeId,
        updated_at: data.updated_at,
      };
    }

    const plan = active as Record<string, unknown>;
    const weeks = Array.isArray(plan.weeks) ? plan.weeks : [];
    const profile =
      plan.profile && typeof plan.profile === "object"
        ? (plan.profile as Record<string, unknown>)
        : {};

    return {
      has_plan: true,
      plan_count: plans.length,
      active_plan_id: activeId || plan.id || null,
      title: plan.title || plan.name || null,
      goal: profile.goal || profile.objectifV1 || plan.goal || null,
      level: profile.level || null,
      week_count: weeks.length,
      current_week: plan.currentWeek ?? plan.weekIndex ?? null,
      updated_at: data.updated_at,
    };
  } catch (err) {
    arthurLog("warn", "get_current_plan_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return {};
  }
}
