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

function countResolvedInWeeks(plan) {
  return (plan?.weeks || []).reduce(
    (n, w) => n + (w.sessions?.filter(isSessionResolved).length ?? 0),
    0,
  );
}

/**
 * Score de fusion local/remote.
 * Boucle « une séance à la fois » : le curseur + l'historique doivent battre
 * une séance courante seulement marquée completed (état coincé après feedback).
 * Plans multi-semaines : inchangé (nombre de séances validées).
 */
export function planProgressScore(entry) {
  const plan = entry?.plan;
  if (!plan?.weeks) return 0;
  const weekResolved = countResolvedInWeeks(plan);
  if (plan.isSessionLoop) {
    const cursor = Number(plan.sessionCursor) || 0;
    const hist = Array.isArray(plan.history) ? plan.history.length : 0;
    return cursor * 1000 + hist * 10 + weekResolved;
  }
  return weekResolved;
}

/** Semaine boucle entièrement validée, il faut générer la suivante. */
export function loopSessionNeedsAdvance(plan) {
  if (!plan?.isSessionLoop) return false;
  const sessions = plan.weeks?.[0]?.sessions || [];
  if (!sessions.length) return false;
  return sessions.every(isSessionResolved);
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
        `[MySWYM] mergePreservingProgress: semaine ${i} structure incompatible (${oldSessions.length} vs ${newSessions.length} séances), fallback semaine entière`,
      );
      return shouldPreserveWeek(oldWeek) ? oldWeek : week;
    }
    const mergedSessions = newSessions.map((s, si) =>
      (isSessionResolved(oldSessions[si]) ? oldSessions[si] : s),
    );
    return { ...week, sessions: mergedSessions };
  });
}
