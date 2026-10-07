import { normalizeAppLanguage } from "./languages.js";

/** EN à la racine (`/pricing`). FR sous `/fr` (`/fr/tarifs`). Autres langues : préfixe + slug EN (`/es/pricing`). */
export const FR_PREFIX = "/fr";
export const LEGACY_EN_PREFIX = "/en";
export const LANG_COOKIE = "myswym_lang";

/** Préfixe d’URL par langue du site (EN = racine, sans préfixe). */
export const URL_PREFIX_BY_LANG = {
  fr: "/fr",
  de: "/de",
  es: "/es",
  it: "/it",
  ja: "/ja",
  nl: "/nl",
  pt: "/pt",
  "pt-BR": "/pt-br",
  sv: "/sv",
  da: "/da",
  nb: "/nb",
  fi: "/fi",
};

const LANG_BY_URL_PREFIX = Object.fromEntries(
  Object.entries(URL_PREFIX_BY_LANG).map(([lang, prefix]) => [prefix, lang]),
);

/** Langues du site public, EN en premier (x-default). */
export const SITE_LANGS = ["en", ...Object.keys(URL_PREFIX_BY_LANG)];

function prefixOf(pathname) {
  const seg = `/${String(pathname || "/").split("/")[1] || ""}`.toLowerCase();
  return LANG_BY_URL_PREFIX[seg] ? seg : null;
}

/** Slug interne = FR. L’anglais a un slug distinct quand le mot change. */
export const EN_SLUG_BY_FR = {
  "/": "/",
  "/comment-ca-marche": "/how-it-works",
  "/tarifs": "/pricing",
  "/merci": "/thanks",
  "/avis": "/reviews",
  "/mentions-legales": "/legal-notice",
  "/politique-confidentialite": "/privacy",
  "/politique-cookies": "/cookies",
  "/cgu": "/terms",
  "/cgv": "/terms-of-sale",
};

export const FR_SLUG_BY_EN = Object.fromEntries(
  Object.entries(EN_SLUG_BY_FR).filter(([fr, en]) => fr !== en).map(([fr, en]) => [en, fr]),
);

const APP_PREFIXES = ["/app", "/admin", "/prototype"];
const APP_EXACT = ["/connexion", "/inscription", "/login", "/register"];

function stripKnownPrefix(pathname, prefix) {
  const p = pathname || "/";
  if (p === prefix || p === `${prefix}/`) return "/";
  if (p.startsWith(`${prefix}/`)) {
    const rest = p.slice(prefix.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return p;
}

/** Sans préfixe de langue (`/fr`, `/es`…, `/en`), en slug FR canonique (`/pricing` → `/tarifs`). */
export function stripLocalePrefix(pathname = "/") {
  let p = pathname || "/";
  const prefix = prefixOf(p);
  if (prefix) p = stripKnownPrefix(p.replace(/^\/[^/]+/, prefix), prefix);
  p = stripKnownPrefix(p, LEGACY_EN_PREFIX);
  if (FR_SLUG_BY_EN[p]) return FR_SLUG_BY_EN[p];
  return p || "/";
}

export function localeFromPathname(pathname = "/") {
  const prefix = prefixOf(pathname);
  return prefix ? LANG_BY_URL_PREFIX[prefix] : "en";
}

export function isAppPath(pathname = "/") {
  const p = stripLocalePrefix(pathname);
  if (APP_EXACT.includes(p)) return true;
  return APP_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

const LEGAL_BARE = new Set([
  "/mentions-legales",
  "/politique-confidentialite",
  "/politique-cookies",
  "/cgu",
  "/cgv",
  "/legal-notice",
  "/privacy",
  "/cookies",
  "/terms",
  "/terms-of-sale",
]);

export function isLegalPath(pathname = "/") {
  return LEGAL_BARE.has(stripLocalePrefix(pathname));
}

/** Tag navigateur / iPhone → langue supportée (sinon en). */
export function languageFromNavigator(language) {
  return normalizeAppLanguage(language);
}

/** Pages marketing (header/footer) : oui. App / auth : non. */
export function shouldLocalizePath(pathname = "/") {
  if (!pathname || pathname.startsWith("http") || pathname.startsWith("mailto:")) return false;
  return !isAppPath(pathname);
}

export function withLocalePrefix(pathname = "/", locale = "en") {
  if (!shouldLocalizePath(pathname)) {
    const prefix = prefixOf(pathname);
    const bare = prefix ? stripKnownPrefix(pathname.replace(/^\/[^/]+/, prefix), prefix) : pathname || "/";
    return stripKnownPrefix(bare, LEGACY_EN_PREFIX);
  }
  const frBare = stripLocalePrefix(pathname) || "/";
  const lang = normalizeAppLanguage(locale);
  if (lang === "fr") {
    return frBare === "/" ? FR_PREFIX : `${FR_PREFIX}${frBare}`;
  }
  const enBare = EN_SLUG_BY_FR[frBare] || frBare;
  const prefix = URL_PREFIX_BY_LANG[lang];
  if (!prefix) return enBare;
  return enBare === "/" ? prefix : `${prefix}${enBare}`;
}
