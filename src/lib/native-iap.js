/**
 * StoreKit 2 via plugin Capacitor. Stripe reste bloqué dans l’app
 * (voir native-billing.js).
 */
import { registerPlugin } from "@capacitor/core";
import { supabase } from "../supabase.js";
import { isLiveStripeBilling } from "./access.js";
import { APPLE_IAP_PRODUCT_IDS } from "./apple-iap-catalog.js";
import { isNativeApp } from "./native-platform.js";

const AppleIap = registerPlugin("AppleIap");

export const STRIPE_LIVE_APPLE_CODE = "stripe_live_entitlement";
export const STRIPE_LIVE_APPLE_MESSAGE =
  "Tu as déjà un abonnement Stripe actif. Gère-le depuis Profil (navigateur), pas l’App Store.";

export async function loadAppleIapProducts() {
  if (!isNativeApp()) return [];
  const result = await AppleIap.getProducts({ productIds: APPLE_IAP_PRODUCT_IDS });
  return Array.isArray(result?.products) ? result.products : [];
}

async function currentSessionUser() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  return refreshData?.session ?? null;
}

async function syncAppleJws(jws, { skipIfStripeLive = false } = {}) {
  const session = await currentSessionUser();
  if (!session) throw new Error("Connecte-toi d’abord.");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apple-iap-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ jws }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (skipIfStripeLive && json.code === STRIPE_LIVE_APPLE_CODE) return null;
    throw new Error(json.error || "Synchronisation Apple échouée");
  }
  const { data } = await supabase.auth.refreshSession();
  return data?.user ?? null;
}

export async function purchaseAppleProduct(productId) {
  const session = await currentSessionUser();
  if (isLiveStripeBilling(session?.user)) {
    throw new Error(STRIPE_LIVE_APPLE_MESSAGE);
  }
  const { jws } = await AppleIap.purchase({ productId });
  if (!jws) throw new Error("Transaction Apple manquante");
  return syncAppleJws(jws);
}

export async function restoreAndSyncAppleIap() {
  if (!isNativeApp()) return null;
  const session = await currentSessionUser();
  if (isLiveStripeBilling(session?.user)) return session?.user ?? null;
  const { transactions } = await AppleIap.restore();
  let lastUser = null;
  for (const tx of transactions || []) {
    if (!tx?.jws) continue;
    const synced = await syncAppleJws(tx.jws, { skipIfStripeLive: true });
    if (synced) lastUser = synced;
  }
  return lastUser;
}

export async function openAppleSubscriptionManagement() {
  if (!isNativeApp()) return;
  await AppleIap.manageSubscriptions();
}
