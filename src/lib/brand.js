/**
 * Identité nominale ForSwim (ex-MySWYM).
 * Affichage / URLs canoniques / support. Ne pas y mettre de clés storage
 * ni de bundle ID (héritage technique volontairement conservé).
 */

export const BRAND_NAME = "ForSwim";
/** Identifiant technique minuscule (URLs, slugs). */
export const BRAND_ID = "forswim";

export const BRAND_DOMAIN = "forswim.app";
export const BRAND_SITE_ORIGIN = `https://www.${BRAND_DOMAIN}`;
export const BRAND_SITE_APEX = `https://${BRAND_DOMAIN}`;

/** Ancien domaine : reste accepté (301, CORS, sessions, e-mails déjà partis). */
export const LEGACY_DOMAIN = "myswym.app";
export const LEGACY_SITE_ORIGIN = `https://www.${LEGACY_DOMAIN}`;
export const LEGACY_SITE_APEX = `https://${LEGACY_DOMAIN}`;

/** Boîtes encore sur le domaine legacy jusqu’à DNS Resend forswim. */
export const BRAND_SUPPORT_EMAIL = `support@${LEGACY_DOMAIN}`;
export const BRAND_CONTACT_EMAIL = `contact@${LEGACY_DOMAIN}`;
export const BRAND_NOREPLY_EMAIL = `noreply@${LEGACY_DOMAIN}`;
/** Nom d’expéditeur Resend : « ForSwim <noreply@…> ». */
export const BRAND_EMAIL_FROM = `${BRAND_NAME} <${BRAND_NOREPLY_EMAIL}>`;

/**
 * Redirects OAuth / reset encore ancrés sur le domaine legacy tant que
 * Supabase / Apple / Google n’ont pas forswim en allowlist (Phase 5 Arthur).
 */
export const AUTH_SITE_ORIGIN = LEGACY_SITE_ORIGIN;

export const BRAND_HOSTS = new Set([
  `www.${BRAND_DOMAIN}`,
  BRAND_DOMAIN,
  `staging.${BRAND_DOMAIN}`,
  `www.${LEGACY_DOMAIN}`,
  LEGACY_DOMAIN,
  `staging.${LEGACY_DOMAIN}`,
]);

export function isBrandHost(hostname) {
  const h = String(hostname || "")
    .trim()
    .toLowerCase();
  if (!h) return false;
  if (BRAND_HOSTS.has(h)) return true;
  return h.endsWith(`.${BRAND_DOMAIN}`) || h.endsWith(`.${LEGACY_DOMAIN}`);
}

export function brandSiteUrl(path = "") {
  const p = String(path || "");
  if (!p) return BRAND_SITE_ORIGIN;
  return `${BRAND_SITE_ORIGIN}${p.startsWith("/") ? p : `/${p}`}`;
}

/** Chemins publics kit S ondulé (noms `logo-myswym-*` conservés pour e-mails / compat). */
export const LOGO_WORDMARK_LIGHT = "/logo-myswym-on-light.png";
export const LOGO_WORDMARK_DARK = "/logo-myswym-banner-blanc.png";
export const LOGO_FULL_LIGHT = "/logo-full-on-light.png";
export const LOGO_FULL_DARK = "/logo-full.png";
export const LOGO_MARK_LIGHT = "/logo-mark.png";
export const LOGO_MARK_DARK = "/logo-mark-on-dark.png";
export const LOGO_ICON_APP = "/logo-icon-app.png";
export const LOGO_BOOT_MARK = "/boot-mark-still.png";
/** Ratio largeur/hauteur wordmark horizontal (1024×279). */
export const LOGO_WORDMARK_RATIO = 1024 / 279;
/** Symbole paddé carré. */
export const LOGO_MARK_RATIO = 1;
