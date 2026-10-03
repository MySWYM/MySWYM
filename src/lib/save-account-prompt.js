/**
 * Relances « sauvegarde ton plan » (anonyme → compte).
 * - Snooze court après dismiss (même session)
 * - Après un retour app assez long, on peut relancer même si snoozé
 */

/** Entre deux pops dans la même session (évite le spam immédiat). */
export const SAVE_ACCOUNT_SNOOZE_MS = 45 * 60 * 1000; // 45 min
/** Temps en arrière-plan avant de forcer une nouvelle relance. */
export const SAVE_ACCOUNT_RESUME_MS = 20 * 60 * 1000; // 20 min

const KEY = "myswym_save_account_snooze_until";

export function saveAccountSnoozeKey(userId) {
  return userId ? `${KEY}_${userId}` : KEY;
}

export function isSaveAccountSnoozed(userId) {
  try {
    const raw = localStorage.getItem(saveAccountSnoozeKey(userId));
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

export function snoozeSaveAccountPrompt(userId, ms = SAVE_ACCOUNT_SNOOZE_MS) {
  try {
    localStorage.setItem(saveAccountSnoozeKey(userId), String(Date.now() + ms));
  } catch {
    /* ignore */
  }
}

export function clearSaveAccountSnooze(userId) {
  try {
    localStorage.removeItem(saveAccountSnoozeKey(userId));
  } catch {
    /* ignore */
  }
}

/**
 * Retour au premier plan après un long arrière-plan → autorise une relance.
 * @returns {boolean} true si le snooze a été levé
 */
export function releaseSaveAccountSnoozeOnResume(userId, backgroundedAtMs) {
  if (!backgroundedAtMs || !Number.isFinite(backgroundedAtMs)) return false;
  if (Date.now() - backgroundedAtMs < SAVE_ACCOUNT_RESUME_MS) return false;
  clearSaveAccountSnooze(userId);
  return true;
}
