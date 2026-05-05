import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const timestamp = sigHeader.split(",").find(p => p.startsWith("t="))?.slice(2);
  const signature = sigHeader.split(",").find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
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
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const users = data?.users ?? [];

    // 1️⃣ Lookup by stripe_customer_id (normal flow via checkout)
    const byId = users.find(u => u.user_metadata?.stripe_customer_id === customerId);
    if (byId) return byId;

    // 2️⃣ Fallback: lookup by email from Stripe (subscription créée manuellement)
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as any).deleted || !("email" in customer) || !customer.email) return null;

    const byEmail = users.find(u => u.email === customer.email);
    if (byEmail) {
      // Sauvegarde le lien pour les prochains events
      await supabaseAdmin.auth.admin.updateUserById(byEmail.id, {
        user_metadata: { ...byEmail.user_metadata, stripe_customer_id: customerId },
      });
      return byEmail;
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

      let subscriptionEnd: number | null = null;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        subscriptionEnd = sub.current_period_end ?? null;
      }

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user?.user_metadata,
          subscription: "premium",
          stripe_customer_id: customerId,
          subscription_end: subscriptionEnd,
        },
      });
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
    // La perte d'accès se fait quand customer.subscription.deleted arrive
    const isPremium = status === "active" || status === "trialing";

    const user = await findUserByCustomerId(customerId);
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          subscription: isPremium ? "premium" : "free",
          subscription_end: isPremium ? subscriptionEnd : null,
          cancel_at_period_end: cancelAtPeriodEnd,
        },
      });
    }
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  // Déclenché : annulation immédiate (admin) OU fin de période après cancel
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data?.object;
    const customerId = sub?.customer;

    const user = await findUserByCustomerId(customerId);
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          subscription: "free",
          subscription_end: null,
          cancel_at_period_end: false,
        },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
