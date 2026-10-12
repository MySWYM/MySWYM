import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildSubscriptionStateFromApple,
  hasEntitlement,
  isLiveStripeEntitlement,
  getAccessState,
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
    offerType: payload.offerType as number | string | null,
    offerDiscountType: payload.offerDiscountType ? String(payload.offerDiscountType) : null,
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

const APP_ACCOUNT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** appAccountToken StoreKit = id utilisateur Supabase, posé à l'achat. */
export function userIdFromAppAccountToken(payload: Record<string, unknown>) {
  const raw = String(payload.appAccountToken || "").trim();
  return APP_ACCOUNT_UUID.test(raw) ? raw : null;
}

function appleExpiresIso(expiresDate: number | string | null | undefined) {
  if (expiresDate == null || expiresDate === "") return null;
  const numeric = Number(expiresDate);
  const ms = Number.isFinite(numeric) && String(expiresDate).trim() !== "" && numeric > 0
    ? numeric
    : Date.parse(String(expiresDate));
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

/**
 * Garde un arrêt déjà enregistré quand l'app resynchronise la même période.
 * Une nouvelle date d'expiration prouve que le renouvellement a eu lieu.
 */
export function preservedAppleCancelAtPeriodEnd(
  current: AccessStateRow | null | undefined,
  tx: AppleTransactionLike,
) {
  if (current?.cancel_at_period_end !== true) return false;
  const linked = String(current.apple_original_transaction_id || "");
  const incoming = String(tx.originalTransactionId || "");
  if (!linked || !incoming || linked !== incoming) return false;
  const nextEnds = appleExpiresIso(tx.expiresDate ?? null);
  if (!nextEnds || nextEnds !== current.subscription_ends_at) return false;
  return true;
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

export { appleTxOwnerDecision } from "./apple-tx-link.ts";

/** Ancien compte anonyme : plus d'accès Apple (une transaction = un seul compte). */
export function clearedAnonymousAppleState(userId: string, current: AccessStateRow | null): AccessStateRow {
  return {
    user_id: userId,
    access_status: ACCESS_STATUS.expired,
    trial_started_at: current?.trial_started_at ?? null,
    trial_ends_at: current?.trial_ends_at ?? null,
    trial_used: current?.trial_used ?? true,
    subscription_started_at: null,
    subscription_ends_at: null,
    cancel_at_period_end: false,
    stripe_customer_id: current?.stripe_customer_id ?? null,
    billing_provider: current?.billing_provider === "apple" ? null : (current?.billing_provider ?? null),
    apple_original_transaction_id: null,
    apple_product_id: null,
    apple_environment: null,
  };
}

export async function releaseAnonymousAppleLink(
  supabaseAdmin: ReturnType<typeof createClient>,
  fromUserId: string,
) {
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(fromUserId);
  if (!user) return;
  const current = await getAccessState(supabaseAdmin, fromUserId);
  await persistAccessState(
    supabaseAdmin,
    user as AuthUser,
    clearedAnonymousAppleState(fromUserId, current),
  );
}

export async function logAppleEntitlementTransfer(
  supabaseAdmin: ReturnType<typeof createClient>,
  toUserId: string,
  fromUserId: string,
  originalTransactionId: string,
) {
  await supabaseAdmin.from("conversion_events").insert({
    user_id: toUserId,
    event_name: "apple_entitlement_transferred",
    path: "/apple-iap",
    properties: {
      from_user_id: fromUserId,
      original_transaction_id: originalTransactionId,
    },
    created_at: new Date().toISOString(),
  });
}
