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

/**
 * Soft paywall pendant l’essai :
 * - J-7→J-4 (trialDaysLeft >= 4) : seulement après action à valeur
 * - J-3→J-1 (trialDaysLeft <= 3) : aussi à l’ouverture d’app
 * Max 1× / jour calendaire.
 *
 * @param {'app_open'|'value_action'} trigger
 */
export function shouldOfferTrialSoftPaywall({
  accessState = null,
  isPremium = false,
  trigger = "app_open",
  lastShownDayKey = "",
  nowMs = Date.now(),
} = {}) {
  if (isPremium || !accessState) return false;
  if (accessState.status !== ACCESS_STATUS.TRIAL) return false;
  const days = Number(accessState.trialDaysLeft) || 0;
  if (days <= 0) return false;
  const today = calendarDayKey(nowMs);
  if (lastShownDayKey && lastShownDayKey === today) return false;
  if (days <= 3) return trigger === "app_open" || trigger === "value_action";
  return trigger === "value_action";
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
