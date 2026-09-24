import { supabase } from "../supabase.js";

export async function fetchWeeklyRank() {
  const { data, error } = await supabase.rpc("weekly_rank_me");
  if (error) throw error;
  let row = data;
  if (typeof row === "string") {
    try {
      row = JSON.parse(row);
    } catch {
      return null;
    }
  }
  if (!row || typeof row !== "object") return null;
  const sessions = Number(row.sessions) || 0;
  const topPercent = Number(row.top_percent);
  return {
    population: Number(row.population) || 0,
    sessions,
    meters: Number(row.meters) || 0,
    sessionCoef: Number(row.session_coef) || 0,
    pace100: row.pace100 == null ? null : Number(row.pace100),
    paceBonus: Number(row.pace_bonus) || 1,
    score: Number(row.score) || 0,
    topPercent: Number.isFinite(topPercent) ? topPercent : 100,
    hasScore: sessions > 0 && Number(row.score) > 0,
  };
}
