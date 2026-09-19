import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildSubscriptionStateFromApple,
  hasEntitlement,
  isLiveStripeEntitlement,
  persistAccessState,
  type AccessStateRow,
  type AppleTransactionLike,
  type AuthUser,
} from "./access-state.ts";
import {
  allowXcodeIap,
  expectedAppleBundleId,
  isAllowedAppleProductId,
} from "./apple-iap-catalog.ts";
import { decodeJwsPayload, verifyAppleJws } from "./apple-jws.ts";

export const STRIPE_LIVE_APPLE_CODE = "stripe_live_entitlement";
export const STRIPE_LIVE_APPLE_MESSAGE =
  "Tu as déjà un abonnement Stripe actif. Gère-le depuis Profil (navigateur), pas l’App Store.";

export class StripeLiveAppleConflictError extends Error {
  code = STRIPE_LIVE_APPLE_CODE;
  constructor(message = STRIPE_LIVE_APPLE_MESSAGE) {
    super(message);
    this.name = "StripeLiveAppleConflictError";
  }
}

export function isStripeLiveAppleConflict(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const rec = err as { name?: string; code?: string };
  return rec.name === "StripeLiveAppleConflictError" || rec.code === STRIPE_LIVE_APPLE_CODE;
}

const EXPIRED_NOTIFICATIONS = new Set([
  "EXPIRED",
  "REFUND",
  "REVOKE",
  "GRACE_PERIOD_EXPIRED",
]);

export async function decodeAppleTransactionJws(jws: string) {
  const unverified = decodeJwsPayload(jws);
  const environment = String(unverified.environment || "");
  if (environment === "Xcode") {
    if (!allowXcodeIap()) throw new Error("Transaction Xcode refusée hors recette locale");
    return unverified;
  }
  return await verifyAppleJws(jws);
}

export function assertUsableAppleTransaction(payload: Record<string, unknown>) {
  const bundleId = String(payload.bundleId || "");
  if (bundleId !== expectedAppleBundleId()) {
    throw new Error("Bundle Apple inattendu");
  }
  const productId = String(payload.productId || "");
  if (!isAllowedAppleProductId(productId)) {
    throw new Error("Offre Apple inconnue");
  }
  const originalTransactionId = String(payload.originalTransactionId || payload.transactionId || "");
  if (!originalTransactionId) throw new Error("Transaction Apple incomplète");
  return {
    bundleId,
    productId,
    originalTransactionId,
    transactionId: String(payload.transactionId || originalTransactionId),
    expiresDate: payload.expiresDate as number | string | null,
    purchaseDate: payload.purchaseDate as number | string | null,
    environment: payload.environment ? String(payload.environment) : null,
    revocationDate: payload.revocationDate as number | string | null,
  } satisfies AppleTransactionLike & { originalTransactionId: string };
}

export async function findUserIdByOriginalTx(
  supabaseAdmin: ReturnType<typeof createClient>,
  originalTransactionId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_access_state")
    .select("user_id")
    .eq("apple_original_transaction_id", originalTransactionId)
    .maybeSingle();
  if (error) throw error;
  return (data?.user_id as string | undefined) ?? null;
}

export async function persistAppleTransaction(opts: {
  supabaseAdmin: ReturnType<typeof createClient>;
  user: AuthUser;
  current: AccessStateRow | null;
  tx: AppleTransactionLike;
  cancelAtPeriodEnd?: boolean;
}) {
  if (isLiveStripeEntitlement(opts.current)) {
    throw new StripeLiveAppleConflictError();
  }
  const next = buildSubscriptionStateFromApple(opts.user.id, opts.current, opts.tx, {
    cancelAtPeriodEnd: opts.cancelAtPeriodEnd,
  });
  return persistAccessState(opts.supabaseAdmin, opts.user, next);
}

export function cancelAtPeriodEndFromNotification(
  notificationType: string,
  renewalInfo: Record<string, unknown> | null,
) {
  if (EXPIRED_NOTIFICATIONS.has(notificationType)) return false;
  if (notificationType === "DID_CHANGE_RENEWAL_STATUS") {
    return Number(renewalInfo?.autoRenewStatus) === 0;
  }
  return Number(renewalInfo?.autoRenewStatus) === 0;
}

export function isPremiumFromState(state: AccessStateRow) {
  return state.access_status === ACCESS_STATUS.trial
    || state.access_status === ACCESS_STATUS.active
    || (state.access_status === ACCESS_STATUS.canceled && hasEntitlement(state));
}
