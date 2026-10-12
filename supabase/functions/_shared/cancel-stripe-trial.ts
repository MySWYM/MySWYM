import type { AccessStateRow } from "./access-policy.ts";

/** Essai Stripe encore en cours : à annuler avant de poser un entitlement Apple. */
export function shouldCancelStripeTrial(current: AccessStateRow | null | undefined) {
  if (!current) return false;
  if (current.access_status !== "trial") return false;
  if (current.billing_provider === "apple") return false;
  return Boolean(current.stripe_customer_id);
}

type StripeLike = {
  subscriptions: {
    list: (opts: { customer: string; status: string; limit: number }) => Promise<{ data: { id: string }[] }>;
    cancel: (id: string, opts?: { invoice_now?: boolean; prorate?: boolean }) => Promise<unknown>;
  };
};

type AdminLike = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<unknown>;
  };
};

/**
 * Annule tout de suite l'abonnement Stripe en essai (rien à facturer).
 * Un abo Stripe déjà payé ne passe pas ici : isLiveStripeEntitlement bloque avant.
 */
export async function cancelStripeTrialForApple(opts: {
  stripe: StripeLike;
  supabaseAdmin: AdminLike;
  userId: string;
  current: AccessStateRow | null | undefined;
}) {
  if (!shouldCancelStripeTrial(opts.current)) return false;
  const customerId = opts.current?.stripe_customer_id;
  if (!customerId) return false;
  const subs = await opts.stripe.subscriptions.list({
    customer: customerId,
    status: "trialing",
    limit: 5,
  });
  if (!subs.data.length) return false;
  for (const sub of subs.data) {
    await opts.stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
  }
  await opts.supabaseAdmin.from("conversion_events").insert({
    user_id: opts.userId,
    event_name: "stripe_trial_canceled_for_apple",
    path: "/apple-iap",
    properties: {
      stripe_customer_id: customerId,
      subscription_ids: subs.data.map((sub) => sub.id),
    },
    created_at: new Date().toISOString(),
  });
  return true;
}
