/**
 * Préservation de progression, extrait de la politique App.jsx
 * (shouldPreserveWeek / mergePreservingProgress).
 * Aucune règle d'entraînement ici.
 */

export function isSessionResolved(session) {
  if (!session) return false;
  return !!(session.completed || session.skipped);
}

/** Garde une semaine dès qu'il y a du progrès, un feedback ou une satisfaction. */
export function shouldPreserveWeek(week) {
  if (!week) return false;
  if (week.feedback || week.satisfaction) return true;
  return week.sessions?.some(isSessionResolved) ?? false;
}

export function mergePreservingProgress(oldWeeks, newWeeks) {
  const next = Array.isArray(newWeeks) ? newWeeks : [];
  const prev = Array.isArray(oldWeeks) ? oldWeeks : [];
  return next.map((week, i) => (shouldPreserveWeek(prev[i]) ? prev[i] : week));
}

export function countPreservedWeeks(oldWeeks, newWeeks) {
  const merged = mergePreservingProgress(oldWeeks, newWeeks);
  const prev = Array.isArray(oldWeeks) ? oldWeeks : [];
  let n = 0;
  for (let i = 0; i < merged.length; i++) {
    if (shouldPreserveWeek(prev[i]) && merged[i] === prev[i]) n += 1;
  }
  return n;
}
