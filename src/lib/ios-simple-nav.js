import { isNativeIos } from "./native-platform.js";
import { ACCESS_STATUS } from "./access.js";

/** IA GOWOD : 3 onglets, chrome allégé, uniquement dans le wrapper iOS. */
export function isIosSimpleNav() {
  return isNativeIos();
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
