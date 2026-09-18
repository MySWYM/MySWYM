/**
 * Paiement iOS : pas de Stripe in-app (guideline App Store 3.1.1).
 * TestFlight = essai 7 jours sans carte. IAP plus tard.
 */
import { isNativeApp } from "./native-platform.js";

export const NATIVE_BILLING_TOAST =
  "L’abonnement iOS arrive via l’App Store. En beta, l’essai 7 jours sans carte reste actif.";

export function nativeBillingBlocked() {
  return isNativeApp();
}

export function isStripeBillingUrl(url) {
  return /\/functions\/v1\/create-(checkout|portal)(?:\?|$)/.test(String(url || ""));
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
    if (isStripeBillingUrl(url)) return Promise.resolve(nativeBillingBlockedResponse());
    return orig(input, init);
  };
  return true;
}

