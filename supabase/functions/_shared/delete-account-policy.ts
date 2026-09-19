/**
 * Suppression de compte × Stripe : fail-closed.
 * Tant qu’un abonnement vivant existe (engagement, annuel, ou mensuel
 * non encore arrêté), on n’efface pas Auth.
 */
import {
  commitmentEndsAtMs,
  isCommitmentInForce,
  isCommitSubscription,
} from "./stripe-commitment.ts";

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

export const DELETE_BLOCK = {
  commitment:
    "Tu as un engagement 12 mois en cours. Tu ne peux pas supprimer le compte tant que cet abonnement n’est pas terminé. Écris à support@myswym.app pour un cas légal (rétractation, etc.).",
  prepaid:
    "Tu as un abonnement annuel (ou prépayé) encore en cours. Tu ne peux pas supprimer le compte tant que la période déjà payée n’est pas terminée. Pour éviter un renouvellement, ouvre « Gérer mon abonnement ». Cas légal : support@myswym.app.",
  unverified:
    "Impossible de vérifier ton abonnement Stripe. Le compte n’a pas été supprimé. Réessaie plus tard ou écris à support@myswym.app.",
  apple:
    "Tu as un abonnement App Store encore en cours. Résilie-le d’abord sur l’iPhone (Réglages → Apple ID → Abonnements), puis réessaie. Cas légal : support@myswym.app.",
  cancelFailed:
    "Impossible d’arrêter l’abonnement Stripe. Le compte n’a pas été supprimé, pour éviter un prélèvement orphelin. Réessaie ou écris à support@myswym.app.",
} as const;

export type DeleteGateCode = "ok" | "commitment" | "prepaid" | "unverified" | "apple";

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
  }
  | {
    allowed: false;
    code: Exclude<DeleteGateCode, "ok">;
    message: string;
    endsAt: string | null;
    cancelIds: string[];
    willCancelSubscription: false;
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

function isoFromUnixSeconds(sec: number | null | undefined): string | null {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString();
}

function endsAtIso(sub: SubLike, kind: "commitment" | "prepaid"): string | null {
  if (kind === "commitment") {
    const ms = commitmentEndsAtMs(sub);
    if (ms != null && Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  return isoFromUnixSeconds(sub.current_period_end);
}

function allow(cancelIds: string[]): DeleteGate {
  return {
    allowed: true,
    code: "ok",
    message: null,
    endsAt: null,
    cancelIds,
    willCancelSubscription: cancelIds.length > 0,
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
  };
}

/**
 * Décide si on peut supprimer, et quels abos mensuels sans engagement
 * doivent être cancel Stripe *avant* deleteUser.
 */
export function evaluateDeleteGate(subs: SubLike[], nowMs = Date.now()): DeleteGate {
  const relevant = subs.filter((s) => {
    const status = String(s.status || "");
    return isLiveSubscriptionStatus(status) || CLEANUP_STATUSES.has(status);
  });
  if (relevant.length === 0) return allow([]);

  const commit = relevant.find((s) => {
    if (isCommitmentInForce(s, nowMs)) return true;
    if (!isCommitSubscription(s) || !isLiveSubscriptionStatus(s.status)) return false;
    const ends = commitmentEndsAtMs(s);
    return ends == null || nowMs < ends;
  });
  if (commit) {
    return block("commitment", DELETE_BLOCK.commitment, endsAtIso(commit, "commitment"));
  }

  const prepaid = relevant.find((s) => isLiveSubscriptionStatus(s.status) && isPrepaidSubscription(s));
  if (prepaid) {
    return block("prepaid", DELETE_BLOCK.prepaid, endsAtIso(prepaid, "prepaid"));
  }

  const cancelIds: string[] = [];
  for (const sub of relevant) {
    if (isFlexCancelable(sub, nowMs)) {
      cancelIds.push(sub.id);
      continue;
    }
    return block("unverified", DELETE_BLOCK.unverified, null);
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

export function gateFromUnverifiedAccess(): DeleteGate {
  return block("unverified", DELETE_BLOCK.unverified, null);
}

export function gateFromAppleAccess(endsAt: string | null = null): DeleteGate {
  return block("apple", DELETE_BLOCK.apple, endsAt);
}

export function throwIfBlocked(gate: DeleteGate): asserts gate is Extract<DeleteGate, { allowed: true }> {
  if (gate.allowed) return;
  throw new DeleteAccountBlockedError(gate.message, gate.code, 409);
}
