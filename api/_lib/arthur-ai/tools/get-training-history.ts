/**
 * get_training_history, lecture seule (faits K récents), filtrée userId.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";

export async function getTrainingHistory(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<Record<string, unknown>> {
  if (!userId || !isUuid(userId)) return {};

  try {
    const [feedback, planned, adaptations] = await Promise.all([
      admin
        .from("session_feedback")
        .select("rating, difficulty, pain, completed, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("planned_sessions")
        .select("status, session_type, volume, training_distance, completed_at, week_index")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(12),
      admin
        .from("weekly_adaptations")
        .select("week_index, action, primary_lever, magnitude, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

    if (feedback.error) {
      arthurLog("warn", "get_training_history_feedback_error", {
        code: feedback.error.code,
      });
    }
    if (planned.error) {
      arthurLog("warn", "get_training_history_planned_error", {
        code: planned.error.code,
      });
    }

    const feedbackRows = feedback.data || [];
    const plannedRows = planned.data || [];
    const completed = plannedRows.filter((r) => r.status === "completed").length;
    const skipped = plannedRows.filter(
      (r) => r.status === "skipped" || r.status === "missed",
    ).length;

    return {
      recent_feedback: feedbackRows.map((f) => ({
        rating: f.rating,
        difficulty: f.difficulty,
        pain: f.pain,
        completed: f.completed,
        created_at: f.created_at,
      })),
      recent_sessions_sample: plannedRows.slice(0, 6).map((s) => ({
        status: s.status,
        session_type: s.session_type,
        volume: s.volume,
        training_distance: s.training_distance,
        week_index: s.week_index,
        completed_at: s.completed_at,
      })),
      recent_adaptations: adaptations.data || [],
      stats: {
        sample_completed: completed,
        sample_skipped_or_missed: skipped,
        feedback_count: feedbackRows.length,
      },
    };
  } catch (err) {
    arthurLog("warn", "get_training_history_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return {};
  }
}
