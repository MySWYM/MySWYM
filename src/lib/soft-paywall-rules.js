/**
 * Règles soft paywall essai (option C) + freeze (option B).
 * Pures : testables sans iPhone.
 */
import { ACCESS_STATUS } from "./access.js";

export const SOFT_PAYWALL_DAY_KEY = "myswym_soft_paywall_day";
export const FREEZE_BG_MS = 30 * 60 * 1000;

export function calendarDayKey(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function softPaywallDayStorageKey(userId) {
  return `${SOFT_PAYWALL_DAY_KEY}_${userId || "anon"}`;
}

export function readSoftPaywallDay(userId) {
  try {
    return localStorage.getItem(softPaywallDayStorageKey(userId)) || "";
  } catch {
    return "";
  }
}

export function writeSoftPaywallDay(userId, dayKey = calendarDayKey()) {
  try {
    localStorage.setItem(softPaywallDayStorageKey(userId), dayKey);
  } catch { /* ignore */ }
}

export function trialStatusJ2Key(userId, trialEndsAt) {
  return `myswym_trial_status_j2_${userId || "anon"}_${trialEndsAt || "none"}`;
}

export function readTrialStatusJ2(userId, trialEndsAt) {
  try {
    return localStorage.getItem(trialStatusJ2Key(userId, trialEndsAt)) === "1";
  } catch {
    return false;
  }
}

export function writeTrialStatusJ2(userId, trialEndsAt) {
  try {
    localStorage.setItem(trialStatusJ2Key(userId, trialEndsAt), "1");
  } catch { /* ignore */ }
}

/**
 * Une seule fiche essai automatique, à J-2, si l'essai n'est pas résilié.
 * iOS et web. Pas de soft paywall J-3..J-1 ni après la première séance.
 */
export function shouldOpenTrialStatusAtJ2({
  accessState = null,
  alreadyShown = false,
} = {}) {
  if (!accessState || alreadyShown) return false;
  if (accessState.status !== ACCESS_STATUS.TRIAL) return false;
  if (accessState.cancelAtPeriodEnd) return false;
  return Number(accessState.trialDaysLeft) === 2;
}

/** Après ≥ FREEZE_BG_MS en arrière-plan, on peut re-proposer le sheet freeze. */
export function shouldRepromptFreezeOnForeground({
  isFrozen = false,
  backgroundedAtMs = null,
  nowMs = Date.now(),
  minAwayMs = FREEZE_BG_MS,
} = {}) {
  if (!isFrozen) return false;
  if (backgroundedAtMs == null || !Number.isFinite(backgroundedAtMs)) return false;
  return nowMs - backgroundedAtMs >= minAwayMs;
}
