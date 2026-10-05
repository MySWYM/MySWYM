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

async function finishAppleTransaction(transactionId) {
  if (!transactionId) return;
  await AppleIap.finish({ transactionId: String(transactionId) });
}

const pendingAppleUpdates = [];

async function syncThenFinish(jws, transactionId, { skipIfStripeLive = false } = {}) {
  const user = await syncAppleJws(jws, { skipIfStripeLive });
  await finishAppleTransaction(transactionId);
  return user;
}

/** Ask to Buy, code promo, autre appareil : synchro seulement si une session existe. */
export function installAppleTransactionUpdates() {
  if (!isNativeApp() || installAppleTransactionUpdates.done) return;
  installAppleTransactionUpdates.done = true;
  void AppleIap.addListener("transactionUpdated", (event) => {
    const jws = event?.jws;
    const transactionId = event?.transactionId;
    if (!jws) return;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        pendingAppleUpdates.push({ jws, transactionId });
        return;
      }
      try {
        await syncThenFinish(jws, transactionId, { skipIfStripeLive: true });
      } catch (err) {
        console.warn("[iap] transactionUpdated", err?.message || err);
        pendingAppleUpdates.push({ jws, transactionId });
      }
    })();
  });
}

export async function flushPendingAppleTransactions() {
  if (!isNativeApp() || pendingAppleUpdates.length === 0) return;
  const batch = pendingAppleUpdates.splice(0);
  for (const event of batch) {
    try {
      await syncThenFinish(event.jws, event.transactionId, { skipIfStripeLive: true });
    } catch (err) {
      console.warn("[iap] flush transaction", err?.message || err);
      pendingAppleUpdates.push(event);
    }
  }
}

export async function purchaseAppleProduct(productId) {
  const session = await currentSessionUser();
  if (isLiveStripeBilling(session?.user)) {
    throw new Error(STRIPE_LIVE_APPLE_MESSAGE);
  }
  const { jws, transactionId } = await AppleIap.purchase({
    productId,
    ...(session?.user?.id ? { appAccountToken: session.user.id } : {}),
  });
  if (!jws) throw new Error("Transaction Apple manquante");
  return syncThenFinish(jws, transactionId);
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

/** Feuille d’avis App Store. Apple peut ne rien afficher. */
export async function requestAppStoreReview() {
  if (!isNativeApp()) return false;
  try {
    await AppleIap.requestReview();
    return true;
  } catch {
    return false;
  }
}
