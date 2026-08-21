/** EN à la racine (`/pricing`). FR sous `/fr` (`/fr/tarifs`). */
export const FR_PREFIX = "/fr";
export const LEGACY_EN_PREFIX = "/en";
export const LANG_COOKIE = "myswym_lang";

/** Slug interne = FR. L’anglais a un slug distinct quand le mot change. */
export const EN_SLUG_BY_FR = {
  "/": "/",
  "/comment-ca-marche": "/how-it-works",
  "/tarifs": "/pricing",
  "/merci": "/thanks",
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

/** Sans `/fr` ni `/en`, en slug FR canonique (`/pricing` → `/tarifs`). */
export function stripLocalePrefix(pathname = "/") {
  let p = pathname || "/";
  p = stripKnownPrefix(p, FR_PREFIX);
  p = stripKnownPrefix(p, LEGACY_EN_PREFIX);
  if (FR_SLUG_BY_EN[p]) return FR_SLUG_BY_EN[p];
  return p || "/";
}

export function localeFromPathname(pathname = "/") {
  const p = pathname || "/";
  if (p === FR_PREFIX || p.startsWith(`${FR_PREFIX}/`)) return "fr";
  if (p === LEGACY_EN_PREFIX || p.startsWith(`${LEGACY_EN_PREFIX}/`)) return "en";
  return "en";
}

export function isAppPath(pathname = "/") {
  const p = stripLocalePrefix(pathname);
  if (APP_EXACT.includes(p)) return true;
  return APP_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Pages marketing (header/footer) : oui. App / auth : non. */
export function shouldLocalizePath(pathname = "/") {
  if (!pathname || pathname.startsWith("http") || pathname.startsWith("mailto:")) return false;
  return !isAppPath(pathname);
}

export function withLocalePrefix(pathname = "/", locale = "en") {
  if (!shouldLocalizePath(pathname)) {
    return stripKnownPrefix(stripKnownPrefix(pathname || "/", FR_PREFIX), LEGACY_EN_PREFIX);
  }
  const frBare = stripLocalePrefix(pathname) || "/";
  if (locale === "fr") {
    return frBare === "/" ? FR_PREFIX : `${FR_PREFIX}${frBare}`;
  }
  if (EN_SLUG_BY_FR[frBare]) return EN_SLUG_BY_FR[frBare];
  return frBare;
}
