import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const ENTITLEMENT_KEYS = ["subscription", "subscription_end", "cancel_at_period_end", "stripe_customer_id"] as const;

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".vercel.app") || origin.endsWith(".myswym.app"));
}

function corsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function stripEntitlementFromUserMeta(meta: Record<string, unknown> | undefined) {
  const next = { ...(meta ?? {}) };
  for (const key of ENTITLEMENT_KEYS) delete next[key];
  return next;
}

async function resolveCustomerId(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}) {
  const stored = (user.app_metadata?.stripe_customer_id ?? user.user_metadata?.stripe_customer_id) as string | undefined;
  if (stored) {
    try {
      const c = await stripe.customers.retrieve(stored);
      if (!(c as { deleted?: boolean }).deleted) return stored;
    } catch {
      // ID périmé — recherche par email
    }
  }
  if (!user.email) return null;
  const list = await stripe.customers.list({ email: user.email, limit: 10 });
  const match = list.data.find(c => !(c as { deleted?: boolean }).deleted);
  return match?.id ?? null;
}

async function findActiveSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  return subs.data.find(s => ACTIVE_STATUSES.has(s.status)) ?? null;
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Recharge via admin pour avoir app_metadata à jour
    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const sourceUser = adminUser ?? user;

    const customerId = await resolveCustomerId(sourceUser);
    let isPremium = false;
    let subscriptionEnd: number | null = null;
    let cancelAtPeriodEnd = false;

    if (customerId) {
      const sub = await findActiveSubscription(customerId);
      if (sub) {
        isPremium = true;
        subscriptionEnd = sub.current_period_end ?? null;
        cancelAtPeriodEnd = sub.cancel_at_period_end === true;
      }
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(sourceUser.app_metadata ?? {}),
        subscription: isPremium ? "premium" : "free",
        stripe_customer_id: customerId ?? sourceUser.app_metadata?.stripe_customer_id ?? null,
        subscription_end: isPremium ? subscriptionEnd : null,
        cancel_at_period_end: isPremium ? cancelAtPeriodEnd : false,
      },
      user_metadata: stripEntitlementFromUserMeta(sourceUser.user_metadata),
    });

    return new Response(JSON.stringify({
      isPremium,
      subscription: isPremium ? "premium" : "free",
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
