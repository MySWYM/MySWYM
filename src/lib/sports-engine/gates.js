/**
 * Portes de progression — une seule difficulté principale à la fois.
 */

/**
 * @param {object} history
 * @returns {{ open: Record<string, boolean>, nextLever: string }}
 */
export function evaluateGates(history = {}) {
  const completed = Number(history.completedSessions) || 0;
  const easyStreak = Number(history.easyStreak) || 0;
  const hardStreak = Number(history.hardStreak) || 0;
  const finishedRate = Number(history.finishedRate);
  const maxDist = Number(history.maxContinuousDistance) || 0;
  const level = history.level || "regulier";

  const tolerance = hardStreak < 2 && (Number.isNaN(finishedRate) || finishedRate >= 0.7);
  const regularite = completed >= 3 && easyStreak + (history.okStreak || 0) >= 2;
  const capacite =
    (level === "decouverte" && maxDist >= 200) ||
    (level === "regulier" && maxDist >= 400) ||
    (level === "sportif" && maxDist >= 1000) ||
    (level === "performance" && maxDist >= 1500) ||
    completed >= 6;
  const intensite = tolerance && regularite && capacite && completed >= 5 && level !== "decouverte";
  const specificite = intensite && completed >= 8;

  const open = { tolerance, regularite, capacite, intensite, specificite };

  let nextLever = "volume";
  if (!tolerance || hardStreak >= 2) nextLever = "volume"; // maintain / reduce via adapt
  else if (!capacite) nextLever = "volume";
  else if (!intensite) nextLever = "effort_duration";
  else if (!specificite) nextLever = "intensity";
  else nextLever = "specificity";

  // Une porte fermée → ne pas sauter vers intensité
  if (!open.tolerance || !open.regularite) nextLever = "volume";

  return { open, nextLever };
}
