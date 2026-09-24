/**
 * Paiement iOS : pas de Stripe in-app (guideline App Store 3.1.1).
 * Achat nageur = StoreKit (native-iap.js). Stripe reste sur la webapp.
 * create-portal est autorisé : le portail s’ouvre dans le navigateur par défaut,
 * pas le WebView ni la feuille Safari in-app.
 */
import { isNativeApp } from "./native-platform.js";
import { openInSystemBrowser } from "./native-links.js";

export const NATIVE_BILLING_TOAST =
  "Sur iPhone, l’abonnement passe par l’App Store. Si tu es déjà Premium sur le site, synchronise ton compte.";

export function nativeBillingBlocked() {
  return isNativeApp();
}

export function isStripeCheckoutUrl(url) {
  return /\/functions\/v1\/create-checkout(?:\?|$)/.test(String(url || ""));
}

/** Alias historique : seul le checkout Stripe est bloqué dans l’app. */
export function isStripeBillingUrl(url) {
  return isStripeCheckoutUrl(url);
}

export async function openStripePortalUrl(url) {
  const href = String(url || "").trim();
  if (!href) return;
  if (isNativeApp()) {
    openInSystemBrowser(href);
    return;
  }
  window.location.href = href;
}

export function nativeBillingBlockedResponse() {
  return new Response(JSON.stringify({ error: NATIVE_BILLING_TOAST }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function installNativeBillingBlock() {
  if (typeof window === "undefined") return false;
  if (window.__myswymNativeBilling) return true;
  if (!isNativeApp()) return false;
  window.__myswymNativeBilling = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : typeof Request !== "undefined" && input instanceof Request
          ? input.url
          : "";
    if (isStripeCheckoutUrl(url)) return Promise.resolve(nativeBillingBlockedResponse());
    return orig(input, init);
  };
  return true;
}

