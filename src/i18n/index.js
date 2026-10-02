import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { isNativeApp } from "../lib/native-platform.js";
import { isAppPath, languageFromNavigator, localeFromPathname, LANG_COOKIE } from "./locale-path.js";
import { SUPPORTED_LANGS } from "./languages.js";
import { setSessionDisplayLang } from "./session-display-lang.js";
import { APP_COPY } from "./app-copy.js";

export { SUPPORTED_LANGS };

const localeModules = import.meta.glob("./locales/*/*.json", { eager: true });

function buildResources() {
  const resources = {};
  for (const [path, mod] of Object.entries(localeModules)) {
    const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, lng, ns] = match;
    if (!SUPPORTED_LANGS.includes(lng)) continue;
    if (!resources[lng]) resources[lng] = {};
    resources[lng][ns] = mod.default ?? mod;
  }
  for (const lng of SUPPORTED_LANGS) {
    if (!APP_COPY[lng]) continue;
    if (!resources[lng]) resources[lng] = {};
    resources[lng].app = APP_COPY[lng];
  }
  return resources;
}

export const LANG_STORAGE_KEY = "myswym_lang";
export const NATIVE_LANG_STORAGE_KEY = "myswym_lang_native";

function persistLanguageCookie(lng) {
  try {
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LANG_COOKIE}=${encodeURIComponent(lng)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

export function readPersistedLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
    if (match && SUPPORTED_LANGS.includes(decodeURIComponent(match[1]))) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function readPersistedNativeLanguage() {
  try {
    const stored = localStorage.getItem(NATIVE_LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function getStoredLanguage() {
  return readPersistedLanguage() || "fr";
}

export function languageFromDevice() {
  const lang =
    (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage)) || "";
  return languageFromNavigator(lang);
}

/** Marketing web : l’URL impose la langue. iOS : iPhone (clé dédiée, ignore le cookie site). */
export function detectInitialLanguage() {
  if (typeof window === "undefined") return "en";
  if (isNativeApp()) return readPersistedNativeLanguage() || languageFromDevice();
  const path = window.location.pathname || "/";
  if (!isAppPath(path)) return localeFromPathname(path);
  return getStoredLanguage();
}

export function setAppLanguage(lng) {
  const next = SUPPORTED_LANGS.includes(lng) ? lng : "en";
  try {
    if (isNativeApp()) localStorage.setItem(NATIVE_LANG_STORAGE_KEY, next);
    else localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  persistLanguageCookie(next);
  document.documentElement.lang = next;
  return i18n.changeLanguage(next);
}

void i18n.use(initReactI18next).init({
  resources: buildResources(),
  lng: detectInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGS,
  nonExplicitSupportedLngs: true,
  load: "currentOnly",
  defaultNS: "common",
  ns: ["common", "landing", "settings", "onboarding", "app"],
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = i18n.language;
setSessionDisplayLang(i18n.language);

i18n.on("languageChanged", (lng) => {
  setSessionDisplayLang(lng);
  document.documentElement.lang = lng;
  try {
    if (isNativeApp()) localStorage.setItem(NATIVE_LANG_STORAGE_KEY, lng);
    else localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  persistLanguageCookie(lng);
});

export default i18n;
