/**
 * Suppression de compte : TOUJOURS possible depuis l’app (App Store 5.1.1(v)) :
 * jamais « résilie d’abord ». Un abo Stripe vivant est annulé immédiatement
 * au moment de la suppression. Un abo App Store ne peut pas être résilié par
 * l’app (Apple l’interdit) : on informe et on ouvre la gestion des abonnements.
 * Si Stripe est injoignable, on supprime quand même et le support est alerté.
 */
import { isCommitmentInForce } from "./stripe-commitment.ts";

function envPrice(name: string): string {
  try {
    // @ts-ignore Deno Edge
    const v = typeof Deno !== "undefined" ? Deno.env.get(name) : undefined;
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

const PREPAID_PRICE_IDS = new Set([
  envPrice("STRIPE_PRICE_ANNUAL"),
  envPrice("STRIPE_PRICE_BIENNIAL"),
  "price_1U7E38AS4mfgF2TwpJGYoMpE",
  "price_1U67kaAS4mfgF2TwvUsVQ3vE",
  "price_1Tue7cAS4mfgF2TwP53wZ7qn",
].filter(Boolean));

const FLEX_PRICE_IDS = new Set([
  envPrice("STRIPE_PRICE_MONTHLY_FLEX"),
  "price_1U3N2tAS4mfgF2TwyaI2hf22",
  "price_1U67kYAS4mfgF2Twaw269yaU",
].filter(Boolean));

/** Statuts Stripe encore facturables / encore couverts. */
export const LIVE_SUB_STATUSES = new Set([
  "active",
  "past_due",
  "unpaid",
  "trialing",
  "paused",
]);

/** Paiement pas allé au bout : on peut (et on doit) les nettoyer. */
const CLEANUP_STATUSES = new Set(["incomplete"]);

export const DELETE_APPLE_NOTICE =
  "Ton abonnement App Store continue jusqu’à ce que tu le résilies : Réglages, Apple ID, Abonnements. Supprimer le compte MySWYM ne l’arrête pas.";

export const DELETE_BLOCK = {
  unverified:
    "Impossible de vérifier ton abonnement Stripe. Le compte n’a pas été supprimé. Réessaie plus tard ou écris à support@myswym.app.",
  cancelFailed:
    "Impossible d’arrêter l’abonnement Stripe. Le compte n’a pas été supprimé, pour éviter un prélèvement orphelin. Réessaie ou écris à support@myswym.app.",
} as const;

export type DeleteGateCode = "ok" | "unverified";

export type SubLike = {
  id: string;
  status?: string | null;
  start_date?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, string> | null;
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
        recurring?: { interval?: string | null } | null;
      } | null;
    }>;
  } | null;
};

export type DeleteGate =
  | {
    allowed: true;
    code: "ok";
    message: null;
    endsAt: string | null;
    cancelIds: string[];
    willCancelSubscription: boolean;
    appleKeepsBilling: boolean;
    stripeUnverified?: boolean;
  }
  | {
    allowed: false;
    code: Exclude<DeleteGateCode, "ok">;
    message: string;
    endsAt: string | null;
    cancelIds: string[];
    willCancelSubscription: false;
    appleKeepsBilling: false;
    stripeUnverified?: false;
  };

export class DeleteAccountBlockedError extends Error {
  code: Exclude<DeleteGateCode, "ok"> | "cancel_failed";
  httpStatus: number;

  constructor(
    message: string,
    code: Exclude<DeleteGateCode, "ok"> | "cancel_failed",
    httpStatus = 409,
  ) {
    super(message);
    this.name = "DeleteAccountBlockedError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isLiveSubscriptionStatus(status: string | null | undefined): boolean {
  return LIVE_SUB_STATUSES.has(String(status || ""));
}

function priceOf(sub: SubLike) {
  return sub.items?.data?.[0]?.price ?? null;
}

function priceIdOf(sub: SubLike): string | null {
  return priceOf(sub)?.id ?? null;
}

function intervalOf(sub: SubLike): string | null {
  return priceOf(sub)?.recurring?.interval ?? null;
}

export function isPrepaidSubscription(sub: SubLike): boolean {
  const meta = sub.metadata ?? {};
  if (meta.plan_tier === "annual" || meta.plan_tier === "biennial") return true;
  const priceId = priceIdOf(sub);
  if (priceId && PREPAID_PRICE_IDS.has(priceId)) return true;
  return intervalOf(sub) === "year";
}

export function isFlexCancelable(sub: SubLike, nowMs = Date.now()): boolean {
  const status = String(sub.status || "");
  if (CLEANUP_STATUSES.has(status)) return true;
  if (!isLiveSubscriptionStatus(status)) return false;
  if (isPrepaidSubscription(sub)) return false;
  if (isCommitmentInForce(sub, nowMs)) return false;
  const meta = sub.metadata ?? {};
  if (meta.plan_tier === "monthly_flex" || meta.plan_tier === "monthly_commit") return true;
  const priceId = priceIdOf(sub);
  if (priceId && FLEX_PRICE_IDS.has(priceId)) return true;
  return intervalOf(sub) === "month";
}

function allow(
  cancelIds: string[],
  extra: {
    message?: string | null;
    endsAt?: string | null;
    appleKeepsBilling?: boolean;
    stripeUnverified?: boolean;
  } = {},
): DeleteGate {
  return {
    allowed: true,
    code: "ok",
    message: extra.message ?? null,
    endsAt: extra.endsAt ?? null,
    cancelIds,
    willCancelSubscription: cancelIds.length > 0 || extra.stripeUnverified === true,
    appleKeepsBilling: extra.appleKeepsBilling === true,
    stripeUnverified: extra.stripeUnverified === true,
  };
}

function block(
  code: Exclude<DeleteGateCode, "ok">,
  message: string,
  endsAt: string | null,
): DeleteGate {
  return {
    allowed: false,
    code,
    message,
    endsAt,
    cancelIds: [],
    willCancelSubscription: false,
    appleKeepsBilling: false,
  };
}

/**
 * Tout abo Stripe vivant est annulé, puis le compte peut être effacé.
 * nowMs reste dans la signature pour les appels existants.
 */
export function evaluateDeleteGate(subs: SubLike[], nowMs = Date.now()): DeleteGate {
  void nowMs;
  const relevant = subs.filter((s) => {
    const status = String(s.status || "");
    return isLiveSubscriptionStatus(status) || CLEANUP_STATUSES.has(status);
  });
  if (relevant.length === 0) return allow([]);

  const cancelIds: string[] = [];
  for (const sub of relevant) {
    const status = String(sub.status || "");
    if (CLEANUP_STATUSES.has(status) || isLiveSubscriptionStatus(status)) {
      cancelIds.push(sub.id);
    }
  }
  return allow(cancelIds);
}

export function paidAccessLooksLive(
  access: { access_status?: string | null; subscription_ends_at?: string | null } | null,
  nowMs = Date.now(),
): boolean {
  if (!access) return false;
  const status = String(access.access_status || "");
  if (status === "active") return true;
  if (status === "canceled" && access.subscription_ends_at) {
    const ms = Date.parse(access.subscription_ends_at);
    return Number.isFinite(ms) && ms > nowMs;
  }
  return false;
}

export const DELETE_STRIPE_UNVERIFIED_NOTICE =
  "Ton abonnement sera arrêté par notre équipe dans les 24 h : aucun nouveau prélèvement après la suppression.";

/** Stripe injoignable : on ne bloque plus (Apple 5.1.1(v)), le support annule à la main. */
export function gateFromUnverifiedAccess(): DeleteGate {
  return allow([], { message: DELETE_STRIPE_UNVERIFIED_NOTICE, stripeUnverified: true });
}

export function gateFromAppleAccess(endsAt: string | null = null): DeleteGate {
  return allow([], {
    message: DELETE_APPLE_NOTICE,
    endsAt,
    appleKeepsBilling: true,
  });
}

export function throwIfBlocked(gate: DeleteGate): asserts gate is Extract<DeleteGate, { allowed: true }> {
  if (gate.allowed) return;
  throw new DeleteAccountBlockedError(gate.message, gate.code, 409);
}
