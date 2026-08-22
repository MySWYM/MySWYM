import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import frCommon from "./locales/fr/common.json";
import enCommon from "./locales/en/common.json";
import frLanding from "./locales/fr/landing.json";
import enLanding from "./locales/en/landing.json";
import frSettings from "./locales/fr/settings.json";
import enSettings from "./locales/en/settings.json";
import frOnboarding from "./locales/fr/onboarding.json";
import enOnboarding from "./locales/en/onboarding.json";
import { isAppPath, localeFromPathname, LANG_COOKIE } from "./locale-path.js";

export const LANG_STORAGE_KEY = "myswym_lang";
export const SUPPORTED_LANGS = ["fr", "en"];

function persistLanguageCookie(lng) {
  try {
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LANG_COOKIE}=${lng}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=(en|fr)`));
    if (match) return match[1];
  } catch {
    /* ignore */
  }
  return "fr";
}

/** Marketing : l’URL impose la langue. App : cookie / localStorage. */
export function detectInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const path = window.location.pathname || "/";
  if (!isAppPath(path)) return localeFromPathname(path);
  return getStoredLanguage();
}

export function setAppLanguage(lng) {
  const next = SUPPORTED_LANGS.includes(lng) ? lng : "en";
  try {
    localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  persistLanguageCookie(next);
  document.documentElement.lang = next;
  return i18n.changeLanguage(next);
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon, landing: frLanding, settings: frSettings, onboarding: frOnboarding },
    en: { common: enCommon, landing: enLanding, settings: enSettings, onboarding: enOnboarding },
  },
  lng: detectInitialLanguage(),
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "landing", "settings", "onboarding"],
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  persistLanguageCookie(lng);
});

export default i18n;
