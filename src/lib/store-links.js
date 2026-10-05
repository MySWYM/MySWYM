/**
 * Liens stores pour le SITE web uniquement.
 * Pas de redirect auto au land. Capacitor : ne pas afficher d’UI Store.
 */
import { isNativeApp } from "./native-platform.js";

export const APP_STORE_URL = "https://apps.apple.com/fr/app/myswym/id6812897499";
export const APP_STORE_ID = "6812897499";
export const IOS_BUNDLE_ID = "app.myswym.ios";

/** @typedef {"ios" | "android" | "other"} ClientPlatform */

/**
 * @param {string} [ua]
 * @returns {ClientPlatform}
 */
export function detectClientPlatform(ua) {
  const raw =
    ua ??
    (typeof navigator !== "undefined" ? navigator.userAgent || "" : "");
  const s = String(raw);
  if (/android/i.test(s)) return "android";
  // iPadOS 13+ peut se présenter comme Macintosh + touch
  if (/iPhone|iPod/i.test(s)) return "ios";
  if (/iPad/i.test(s)) return "ios";
  if (
    typeof navigator !== "undefined" &&
    /Macintosh/i.test(s) &&
    Number(navigator.maxTouchPoints || 0) > 1
  ) {
    return "ios";
  }
  return "other";
}

/** UI Store / badges sur le site public, jamais dans l’app Capacitor. */
export function shouldShowWebStoreUi() {
  return !isNativeApp();
}

/** CTA principal iPhone/iPad Safari → App Store (pas de redirect auto). */
export function prefersAppStorePrimary(platform = detectClientPlatform()) {
  return shouldShowWebStoreUi() && platform === "ios";
}

export function appStoreHref() {
  return APP_STORE_URL;
}

/**
 * Cible de https://www.myswym.app/go (et /fr/go).
 * iPhone/iPad web → App Store. Android → webapp /app. Desktop → landing.
 * Capacitor : rester dans l’app, pas de lien Store.
 * @param {ClientPlatform} [platform]
 * @returns {string}
 */
export function goStoreTarget(platform = detectClientPlatform()) {
  if (isNativeApp()) return "/app";
  if (platform === "ios") return APP_STORE_URL;
  if (platform === "android") return "/app";
  return "/";
}

/** Page d’écriture d’avis App Store (CTA Support + funnel avis). */
export function appStoreWriteReviewHref() {
  const base = String(APP_STORE_URL || "").split("?")[0];
  return `${base}?action=write-review`;
}
