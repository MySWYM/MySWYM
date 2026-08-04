export const COOKIE_CONSENT_KEY = "myswym_cookie_consent_v1";

/** Remet la bannière (ex. lien « Gérer les cookies »). */
export function resetCookieConsent() {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event("myswym:cookie-consent-reset"));
}
