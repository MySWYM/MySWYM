import { isNativeApp, isNativeIos } from "./native-platform.js";
import { ACCESS_STATUS } from "./access.js";

/**
 * Chrome produit façon iPhone (3 onglets Analyse / Nager / Profil).
 * - iOS Capacitor : oui
 * - Navigateur web : oui (même DA, paiement Stripe)
 * - Autre natif (Android plus tard) : non jusqu’à la DA Play
 * Billing IAP reste derrière isNativeApp() / nativeBillingBlocked().
 */
export function isIosSimpleNav() {
  if (isNativeIos()) return true;
  if (isNativeApp()) return false;
  return true;
}

export function iosDockActive(tab) {
  if (tab === "plan" || tab === "buddies") return "home";
  if (tab === "history") return "analyse";
  return tab;
}

export function iosResolveTab(tab) {
  if (tab === "history") return "analyse";
  return tab;
}

/** Essai 7j ou essai terminé : barre or. Abonné payant : non. */
export function iosShowPremiumBar(accessState) {
  if (!accessState) return false;
  if (accessState.status === ACCESS_STATUS.TRIAL) return true;
  return accessState.hasPremiumAccess !== true;
}
