import { isNativeIos } from "./native-platform.js";

/** IA GOWOD : 3 onglets, chrome allégé, uniquement dans le wrapper iOS. */
export function isIosSimpleNav() {
  return isNativeIos();
}

export function iosDockActive(tab) {
  if (tab === "plan") return "home";
  if (tab === "history") return "analyse";
  if (tab === "buddies") return "profile";
  return tab;
}

export function iosResolveTab(tab) {
  if (tab === "history") return "analyse";
  return tab;
}
