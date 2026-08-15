/**
 * Merge de plan à la migration / régénération.
 * Séance validée (completed / skipped) → conservée telle quelle.
 * Séance non validée → contenu régénéré.
 * Semaine avec feedback / satisfaction → semaine entière conservée.
 * Nombre de séances différent → fallback semaine entière (évite un décalage d'index).
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
  return next.map((week, i) => {
    const oldWeek = prev[i];
    if (!oldWeek) return week;
    if (oldWeek.feedback || oldWeek.satisfaction) return oldWeek;
    const oldSessions = oldWeek.sessions ?? [];
    const newSessions = week.sessions ?? [];
    if (oldSessions.length !== newSessions.length) {
      console.warn(
        `[MySWYM] mergePreservingProgress: semaine ${i} structure incompatible (${oldSessions.length} vs ${newSessions.length} séances) — fallback semaine entière`,
      );
      return shouldPreserveWeek(oldWeek) ? oldWeek : week;
    }
    const mergedSessions = newSessions.map((s, si) =>
      (isSessionResolved(oldSessions[si]) ? oldSessions[si] : s),
    );
    return { ...week, sessions: mergedSessions };
  });
}
