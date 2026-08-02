import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import frCommon from "./locales/fr/common.json";
import enCommon from "./locales/en/common.json";
import frLanding from "./locales/fr/landing.json";
import enLanding from "./locales/en/landing.json";
import frSettings from "./locales/fr/settings.json";
import enSettings from "./locales/en/settings.json";

export const LANG_STORAGE_KEY = "myswym_lang";
export const SUPPORTED_LANGS = ["fr", "en"];

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "fr";
}

export function setAppLanguage(lng) {
  const next = SUPPORTED_LANGS.includes(lng) ? lng : "fr";
  try {
    localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = next;
  return i18n.changeLanguage(next);
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon, landing: frLanding, settings: frSettings },
    en: { common: enCommon, landing: enLanding, settings: enSettings },
  },
  lng: getStoredLanguage(),
  fallbackLng: "fr",
  defaultNS: "common",
  ns: ["common", "landing", "settings"],
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
});

export default i18n;
