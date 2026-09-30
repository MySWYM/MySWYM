/**
 * Décide quand demander l’avis App Store (feuille système, iOS seulement).
 * Apple limite l’affichage : on n’appelle qu’une fois, après assez de séances faites,
 * et pas sur un retour trop dur ou une douleur.
 */

export const APP_STORE_REVIEW_MIN_SESSIONS = 3;
export const APP_STORE_REVIEW_ASKED_KEY = "myswym_app_store_review_asked";

const NEGATIVE_RATINGS = new Set(["hard", "too_hard"]);

export function countFinishedSessions(plan) {
  const inWeeks = (plan?.weeks || []).reduce(
    (n, week) => n + (week.sessions || []).filter((s) => s?.completed).length,
    0,
  );
  if (!plan?.isSessionLoop) return inWeeks;
  const inHistory = (plan.history || []).filter((s) => s?.completed).length;
  return inWeeks + inHistory;
}

export function shouldRequestAppStoreReview({
  isNative = false,
  alreadyAsked = false,
  completedCount = 0,
  rating = null,
  hasPain = false,
} = {}) {
  if (!isNative || alreadyAsked) return false;
  if (completedCount < APP_STORE_REVIEW_MIN_SESSIONS) return false;
  if (hasPain) return false;
  if (rating && NEGATIVE_RATINGS.has(rating)) return false;
  return true;
}

export function hasAskedAppStoreReview() {
  try {
    return localStorage.getItem(APP_STORE_REVIEW_ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAppStoreReviewAsked() {
  try {
    localStorage.setItem(APP_STORE_REVIEW_ASKED_KEY, "1");
  } catch { /* ignore */ }
}
