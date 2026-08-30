/**
 * Engagement 12 mois (offre 4,99 €) : helpers Stripe.
 * Pendant l’engagement : pas d’annulation portail, pas de cancel_at_period_end,
 * pas de suppression de compte qui coupe l’abo (hors cas légaux gérés à part).
 */

export const COMMITMENT_MONTHS = 12;

/** Price IDs mensuel engagement (live + test / legacy). */
function envPrice(name: string): string {
  try {
    // Deno Edge
    // @ts-ignore
    const v = typeof Deno !== "undefined" ? Deno.env.get(name) : undefined;
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

export const COMMIT_PRICE_IDS = new Set([
  envPrice("STRIPE_PRICE_MONTHLY_COMMIT"),
  envPrice("STRIPE_PRICE_MONTHLY"),
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1U67kZAS4mfgF2Twi5Px8ZvG",
].filter(Boolean));

type SubLike = {
  id: string;
  status?: string | null;
  start_date?: number | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, string> | null;
  items?: { data?: Array<{ price?: { id?: string } | null }> } | null;
};

export function isCommitPriceId(priceId: string | null | undefined): boolean {
  return Boolean(priceId && COMMIT_PRICE_IDS.has(priceId));
}

export function subscriptionPriceId(sub: SubLike): string | null {
  return sub.items?.data?.[0]?.price?.id ?? null;
}

export function isCommitSubscription(sub: SubLike): boolean {
  const meta = sub.metadata ?? {};
  if (meta.plan_tier === "monthly_commit" || meta.commitment_months === String(COMMITMENT_MONTHS)) {
    return true;
  }
  return isCommitPriceId(subscriptionPriceId(sub));
}

/** Fin d’engagement (ms) : metadata ou start_date + 12 mois. */
export function commitmentEndsAtMs(sub: SubLike): number | null {
  const raw = sub.metadata?.commitment_ends_at;
  if (raw) {
    const ms = Date.parse(raw);
    if (Number.isFinite(ms)) return ms;
  }
  if (!isCommitSubscription(sub)) return null;
  const startSec = Number(sub.start_date);
  if (!Number.isFinite(startSec) || startSec <= 0) return null;
  const end = new Date(startSec * 1000);
  end.setUTCMonth(end.getUTCMonth() + COMMITMENT_MONTHS);
  return end.getTime();
}

export function isCommitmentInForce(sub: SubLike, nowMs = Date.now()): boolean {
  const status = String(sub.status || "");
  if (!["active", "past_due", "unpaid", "trialing"].includes(status)) return false;
  if (!isCommitSubscription(sub)) return false;
  const ends = commitmentEndsAtMs(sub);
  if (ends == null) return true; // commit sans date → on protège par défaut
  return nowMs < ends;
}

export function commitmentMetadataForCheckout(nowMs = Date.now()): Record<string, string> {
  const end = new Date(nowMs);
  end.setUTCMonth(end.getUTCMonth() + COMMITMENT_MONTHS);
  return {
    plan_tier: "monthly_commit",
    commitment_months: String(COMMITMENT_MONTHS),
    commitment_ends_at: end.toISOString(),
  };
}

type StripeBilling = {
  billingPortal: {
    configurations: {
      list: (params: { limit?: number; active?: boolean }) => Promise<{ data: Array<{ id: string; metadata?: Record<string, string> | null }> }>;
      create: (params: Record<string, unknown>) => Promise<{ id: string }>;
    };
  };
  subscriptions: {
    list: (params: Record<string, unknown>) => Promise<{ data: SubLike[] }>;
    update: (id: string, params: Record<string, unknown>) => Promise<SubLike>;
  };
};

/** Config portail sans bouton Annuler (créée une fois, ou via env). */
export async function resolveNoCancelPortalConfigId(stripe: StripeBilling): Promise<string> {
  const fromEnv = Deno.env.get("STRIPE_PORTAL_CONFIG_NO_CANCEL")?.trim();
  if (fromEnv) return fromEnv;

  const listed = await stripe.billingPortal.configurations.list({ limit: 20, active: true });
  const existing = listed.data.find((c) => c.metadata?.myswym_role === "no_cancel_commit");
  if (existing?.id) return existing.id;

  const created = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Gère ton abonnement MySWYM",
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "tax_id"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: false },
      subscription_update: { enabled: false },
    },
    metadata: {
      myswym_role: "no_cancel_commit",
    },
  });
  console.log("[stripe-commitment] created portal config no_cancel:", created.id);
  return created.id;
}

export async function findActiveCommitmentSubscription(
  stripe: StripeBilling,
  customerId: string,
): Promise<SubLike | null> {
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
    expand: ["data.items.data.price"],
  });
  for (const sub of list.data) {
    if (isCommitmentInForce(sub)) return sub;
  }
  return null;
}

/** Si annulation anticipée pendant engagement → on annule l’annulation Stripe. */
export async function revertEarlyCancelIfCommitment(
  stripe: StripeBilling,
  sub: SubLike,
): Promise<boolean> {
  if (!sub.cancel_at_period_end) return false;
  if (!isCommitmentInForce(sub)) return false;
  await stripe.subscriptions.update(sub.id, {
    cancel_at_period_end: false,
    metadata: {
      ...(sub.metadata ?? {}),
      commitment_cancel_blocked_at: new Date().toISOString(),
    },
  });
  console.warn("[stripe-commitment] reverted cancel_at_period_end", sub.id);
  return true;
}
