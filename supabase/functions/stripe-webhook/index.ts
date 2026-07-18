import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

/** Entitlement keys — never trusted from user_metadata (client-writable). */
const ENTITLEMENT_KEYS = ["subscription", "subscription_end", "cancel_at_period_end", "stripe_customer_id"] as const;

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function stripEntitlementFromUserMeta(meta: Record<string, unknown> | undefined) {
  const next = { ...(meta ?? {}) };
  for (const key of ENTITLEMENT_KEYS) delete next[key];
  return next;
}

function getStripeCustomerId(user: AuthUser): string | undefined {
  return (user.app_metadata?.stripe_customer_id ?? user.user_metadata?.stripe_customer_id) as string | undefined;
}

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const timestamp = sigHeader.split(",").find(p => p.startsWith("t="))?.slice(2);
  const signature = sigHeader.split(",").find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature || !secret) return false;

  // Reject replays older than 5 minutes (Stripe recommendation)
  const ageSec = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(ageSec) || ageSec < 0 || ageSec > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

async function setEntitlement(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: AuthUser,
  entitlement: Record<string, unknown>,
) {
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      ...entitlement,
    },
    // Neutralise toute falsification côté client
    user_metadata: stripEntitlementFromUserMeta(user.user_metadata),
  });
}

Deno.serve(async (req) => {
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const body = await req.text();

  const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
  if (!valid) return new Response("Invalid signature", { status: 400 });

  const event = JSON.parse(body);
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const findUserByCustomerId = async (customerId: string) => {
    const users: AuthUser[] = [];
    let page = 1;
    while (true) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const batch = data?.users ?? [];
      users.push(...batch);
      if (batch.length < 1000) break;
      page += 1;
    }

    const byId = users.find(u => getStripeCustomerId(u) === customerId);
    if (byId) return byId;

    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as { deleted?: boolean }).deleted || !("email" in customer) || !customer.email) return null;

    const byEmail = users.find(u => u.email === customer.email);
    if (byEmail) {
      await setEntitlement(supabaseAdmin, byEmail, {
        stripe_customer_id: customerId,
        subscription: byEmail.app_metadata?.subscription ?? "free",
        subscription_end: byEmail.app_metadata?.subscription_end ?? null,
        cancel_at_period_end: byEmail.app_metadata?.cancel_at_period_end ?? false,
      });
      return {
        ...byEmail,
        app_metadata: { ...(byEmail.app_metadata ?? {}), stripe_customer_id: customerId },
        user_metadata: stripEntitlementFromUserMeta(byEmail.user_metadata),
      };
    }

    return null;
  };

  // ── checkout.session.completed ─────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const userId = session?.client_reference_id;
    const customerId = session?.customer;
    const subscriptionId = session?.subscription;

    if (userId) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (user) {
        let subscriptionEnd: number | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionEnd = sub.current_period_end ?? null;
        }

        await setEntitlement(supabaseAdmin, user, {
          subscription: "premium",
          stripe_customer_id: customerId,
          subscription_end: subscriptionEnd,
          cancel_at_period_end: false,
        });
      }
    }
  }

  // ── customer.subscription.created / updated ────────────────────────────
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data?.object;
    const customerId = sub?.customer;
    const status = sub?.status;
    const cancelAtPeriodEnd = sub?.cancel_at_period_end === true;
    const subscriptionEnd: number | null = sub?.current_period_end ?? null;

    // Reste premium tant que le statut est actif (même si annulation prévue en fin de période)
    const isPremium = status === "active" || status === "trialing";

    const user = await findUserByCustomerId(customerId);
    if (user) {
      await setEntitlement(supabaseAdmin, user, {
        subscription: isPremium ? "premium" : "free",
        stripe_customer_id: customerId,
        subscription_end: isPremium ? subscriptionEnd : null,
        cancel_at_period_end: cancelAtPeriodEnd,
      });
    }
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data?.object;
    const customerId = sub?.customer;

    const user = await findUserByCustomerId(customerId);
    if (user) {
      await setEntitlement(supabaseAdmin, user, {
        subscription: "free",
        stripe_customer_id: customerId,
        subscription_end: null,
        cancel_at_period_end: false,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
