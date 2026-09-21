/**
 * Rang all-time MySWYM : km × coef séances × bonus allure.
 * Source de vérité runtime : RPC `weekly_rank_me` (même constantes).
 */

export const SESSION_COEF = {
  1: 1,
  2: 1.2,
  3: 1.5,
  4: 1.9,
  5: 2.4,
};

export const PACE_BONUS_MAX = 1.25;

export function sessionCoef(sessions) {
  const n = Math.max(0, Math.floor(Number(sessions) || 0));
  if (n <= 0) return 0;
  if (n >= 5) return SESSION_COEF[5];
  return SESSION_COEF[n];
}

/**
 * Plus rapide que la médiane → jusqu’à ×1,25.
 * Pas de T100, ou plus lent que la médiane → ×1 (pas de malus).
 */
export function paceBonus(pace100, medianPace, p10Pace) {
  const pace = Number(pace100);
  const median = Number(medianPace);
  if (!(pace > 0) || !(median > 0) || pace >= median) return 1;
  const fast = Number(p10Pace);
  const floor = fast > 0 && fast < median ? fast : median * 0.75;
  const span = median - floor;
  if (!(span > 0)) return 1;
  const t = Math.min(1, Math.max(0, (median - pace) / span));
  return 1 + (PACE_BONUS_MAX - 1) * t;
}

export function weeklyScore({ meters = 0, sessions = 0, pace100 = null, medianPace = null, p10Pace = null }) {
  const coef = sessionCoef(sessions);
  if (coef <= 0) return 0;
  const km = Math.max(0, Number(meters) || 0) / 1000;
  return km * coef * paceBonus(pace100, medianPace, p10Pace);
}

/** Top X % : 1 = meilleur, 100 = dernier / pas nagé. */
export function topPercent(myScore, allScores) {
  const list = Array.isArray(allScores) ? allScores : [];
  const n = list.length;
  if (!n) return 100;
  const mine = Number(myScore) || 0;
  if (!(mine > 0)) return 100;
  const better = list.filter((score) => Number(score) > mine).length;
  return Math.min(100, Math.max(1, Math.ceil((100 * (better + 1)) / n)));
}

export function rankRingRatio(topPct) {
  const n = Number(topPct);
  if (!Number.isFinite(n) || n >= 100) return 0;
  return Math.min(1, Math.max(0, (100 - n) / 100));
}

export function rankCenterLabel(topPct, hasScore) {
  if (!hasScore) return "-";
  const n = Number(topPct);
  if (!Number.isFinite(n)) return "-";
  return `Top ${Math.round(n)}%`;
}
