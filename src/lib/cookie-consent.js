export const COOKIE_CONSENT_KEY = "myswym_cookie_consent_v1";

export const DEFAULT_COOKIE_PREFS = {
  analytics: false,
  performance: false,
};

/** Interprète l’ancien format `accepted` | `refused` et le JSON v2. */
export function parseConsent(raw) {
  if (!raw) return null;
  if (raw === "accepted") return { analytics: true, performance: true };
  if (raw === "refused") return { analytics: false, performance: false };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      analytics: !!parsed.analytics,
      performance: !!parsed.performance,
    };
  } catch {
    return null;
  }
}

export function readConsent() {
  try {
    return parseConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return readConsent()?.analytics === true;
}

export function hasPerformanceConsent() {
  return readConsent()?.performance === true;
}

export function writeConsent(prefs) {
  const next = {
    v: 2,
    analytics: !!prefs?.analytics,
    performance: !!prefs?.performance,
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent("myswym:cookie-consent-changed", { detail: { prefs: next } }));
  } catch { /* ignore */ }
}

export function acceptAllCookies() {
  writeConsent({ analytics: true, performance: true });
}

export function refuseAllCookies() {
  writeConsent({ analytics: false, performance: false });
}

/** Ouvre le gestionnaire (footer « Gérer les cookies »). Ne remet pas le consentement à zéro. */
export function openCookieManager() {
  window.dispatchEvent(new Event("myswym:cookie-manager-open"));
}

/** @deprecated préférer openCookieManager, conservé si un ancien lien vide le stockage. */
export function resetCookieConsent() {
  openCookieManager();
}
