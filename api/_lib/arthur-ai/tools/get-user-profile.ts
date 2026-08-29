/**
 * get_user_profile, lecture seule sport_profiles (filtrée userId).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";

export async function getUserProfile(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<Record<string, unknown>> {
  if (!userId || !isUuid(userId)) return {};

  try {
    const { data, error } = await admin
      .from("sport_profiles")
      .select(
        "level, objective, frequency, session_duration, equipment, pool_length, preferred_stroke, race_target, injury_status, pace100, readiness_profile, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      arthurLog("warn", "get_user_profile_error", { code: error.code });
      return {};
    }
    if (!data) return {};

    return {
      level: data.level,
      objective: data.objective,
      frequency: data.frequency,
      session_duration: data.session_duration,
      equipment: data.equipment,
      pool_length: data.pool_length,
      preferred_stroke: data.preferred_stroke,
      race_target: data.race_target,
      injury_status: data.injury_status,
      pace100: data.pace100,
      readiness_profile: data.readiness_profile,
      updated_at: data.updated_at,
    };
  } catch (err) {
    arthurLog("warn", "get_user_profile_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return {};
  }
}
