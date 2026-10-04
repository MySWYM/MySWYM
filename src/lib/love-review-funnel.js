/**
 * Funnel avis iOS : like/dislike après 7 j d’usage,
 * oui → Store après 24 h, non → page Contact.
 */

import { hasAskedAppStoreReview } from "./app-store-review.js";

export const LOVE_REVIEW_STORAGE_KEY = "myswym_love_review_v1";
export const LOVE_REVIEW_MIN_USAGE_MS = 7 * 24 * 3600_000;
export const LOVE_REVIEW_STORE_DELAY_MS = 24 * 3600_000;
export const LOVE_REVIEW_LATER_MS = 7 * 24 * 3600_000;
export const LOVE_REVIEW_MAX_LATER = 2;
export const LOVE_REVIEW_MIN_SESSIONS = 1;

/**
 * @typedef {{
 *   firstOpenAt: number,
 *   laterCount: number,
 *   laterUntil: number|null,
 *   answer: null|"yes"|"no",
 *   storeAskAt: number|null,
 *   funnelDone: boolean,
 *   lovePromptShownAt: number|null,
 * }} LoveReviewState
 */

/** @returns {LoveReviewState} */
export function blankLoveReviewState(now = Date.now()) {
  return {
    firstOpenAt: now,
    laterCount: 0,
    laterUntil: null,
    answer: null,
    storeAskAt: null,
    funnelDone: false,
    lovePromptShownAt: null,
  };
}

export function readLoveReviewState() {
  try {
    const raw = localStorage.getItem(LOVE_REVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      firstOpenAt: Number(parsed.firstOpenAt) || 0,
      laterCount: Math.max(0, Number(parsed.laterCount) || 0),
      laterUntil: Number(parsed.laterUntil) > 0 ? Number(parsed.laterUntil) : null,
      answer: parsed.answer === "yes" || parsed.answer === "no" ? parsed.answer : null,
      storeAskAt: Number(parsed.storeAskAt) > 0 ? Number(parsed.storeAskAt) : null,
      funnelDone: parsed.funnelDone === true,
      lovePromptShownAt: Number(parsed.lovePromptShownAt) > 0 ? Number(parsed.lovePromptShownAt) : null,
    };
  } catch {
    return null;
  }
}

/** @param {LoveReviewState} state */
export function writeLoveReviewState(state) {
  try {
    localStorage.setItem(LOVE_REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch { /* private mode */ }
  return state;
}

/** Enregistre la 1ʳᵉ ouverture si absente. */
export function ensureLoveReviewFirstOpen(now = Date.now()) {
  const cur = readLoveReviewState();
  if (cur?.firstOpenAt) return cur;
  return writeLoveReviewState(blankLoveReviewState(now));
}

/**
 * Popup « tu aimes ? »
 * @param {{
 *   isNative?: boolean,
 *   now?: number,
 *   finishedSessions?: number,
 *   state?: LoveReviewState|null,
 *   storeAlreadyAsked?: boolean,
 * }} [opts]
 */
export function shouldShowLovePrompt({
  isNative = false,
  now = Date.now(),
  finishedSessions = 0,
  state = null,
  storeAlreadyAsked = hasAskedAppStoreReview(),
} = {}) {
  if (!isNative) return false;
  if (storeAlreadyAsked) return false;
  const s = state || readLoveReviewState();
  if (!s?.firstOpenAt || s.funnelDone) return false;
  if (s.answer === "yes" || s.answer === "no") return false;
  if (finishedSessions < LOVE_REVIEW_MIN_SESSIONS) return false;
  if (now < s.firstOpenAt + LOVE_REVIEW_MIN_USAGE_MS) return false;
  if ((s.laterCount || 0) >= LOVE_REVIEW_MAX_LATER) return false;
  if (s.laterUntil && now < s.laterUntil) return false;
  return true;
}

/**
 * Étape Store (après oui + 24 h).
 * @param {{
 *   isNative?: boolean,
 *   now?: number,
 *   state?: LoveReviewState|null,
 *   storeAlreadyAsked?: boolean,
 * }} [opts]
 */
export function shouldShowLoveStoreAsk({
  isNative = false,
  now = Date.now(),
  state = null,
  storeAlreadyAsked = hasAskedAppStoreReview(),
} = {}) {
  if (!isNative) return false;
  if (storeAlreadyAsked) return false;
  const s = state || readLoveReviewState();
  if (!s || s.funnelDone) return false;
  if (s.answer !== "yes") return false;
  if (!s.storeAskAt || now < s.storeAskAt) return false;
  return true;
}

/** Bloque l’ancien auto-review séances si non / pas encore éligible Store. */
export function loveReviewBlocksSessionStoreAsk(state = null, now = Date.now()) {
  const s = state || readLoveReviewState();
  if (!s) return false;
  if (s.answer === "no") return true;
  if (s.funnelDone && s.answer !== "yes") return true;
  if (s.answer === "yes" && s.storeAskAt && now < s.storeAskAt) return true;
  if (s.answer == null && s.firstOpenAt && now >= s.firstOpenAt + LOVE_REVIEW_MIN_USAGE_MS) {
    return true;
  }
  return false;
}

export function markLovePromptShown(now = Date.now()) {
  const s = ensureLoveReviewFirstOpen(now);
  return writeLoveReviewState({ ...s, lovePromptShownAt: now });
}

export function answerLoveYes(now = Date.now()) {
  const s = ensureLoveReviewFirstOpen(now);
  return writeLoveReviewState({
    ...s,
    answer: "yes",
    storeAskAt: now + LOVE_REVIEW_STORE_DELAY_MS,
    laterUntil: null,
  });
}

export function answerLoveNo(now = Date.now()) {
  const s = ensureLoveReviewFirstOpen(now);
  return writeLoveReviewState({
    ...s,
    answer: "no",
    storeAskAt: null,
  });
}

export function snoozeLovePrompt(now = Date.now()) {
  const s = ensureLoveReviewFirstOpen(now);
  const laterCount = Math.min(LOVE_REVIEW_MAX_LATER, (s.laterCount || 0) + 1);
  return writeLoveReviewState({
    ...s,
    laterCount,
    laterUntil: now + LOVE_REVIEW_LATER_MS,
  });
}

export function completeLoveFunnel(now = Date.now()) {
  const s = ensureLoveReviewFirstOpen(now);
  return writeLoveReviewState({ ...s, funnelDone: true });
}

/** Timestamp notif Store (ms) ou null. */
export function loveStoreAskAtMs(state = null) {
  const s = state || readLoveReviewState();
  if (!s || s.answer !== "yes" || s.funnelDone) return null;
  if (hasAskedAppStoreReview()) return null;
  return s.storeAskAt;
}
