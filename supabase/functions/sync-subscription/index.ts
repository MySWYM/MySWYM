import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildExpiredState,
  buildTrialState,
  getAccessState,
  isoFromUnixSeconds,
  persistAccessState,
  stripEntitlementFromUserMeta,
  type AccessStateRow,
  type AuthUser,
} from "../_shared/access-state.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

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

async function resolveCustomerId(user: AuthUser) {
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

function buildSubscriptionState(
  userId: string,
  current: AccessStateRow | null,
  customerId: string | null,
  sub: Stripe.Subscription,
): AccessStateRow {
  const subscriptionEndsAt = isoFromUnixSeconds(sub.current_period_end ?? null);
  const subscriptionStartedAt = isoFromUnixSeconds(sub.start_date ?? null);
  const cancelAtPeriodEnd = sub.cancel_at_period_end === true;
  const accessStatus = sub.status === "trialing"
    ? ACCESS_STATUS.trial
    : cancelAtPeriodEnd
      ? ACCESS_STATUS.canceled
      : ACCESS_STATUS.active;

  return {
    user_id: userId,
    access_status: accessStatus,
    trial_started_at: current?.trial_started_at ?? null,
    trial_ends_at: current?.trial_ends_at ?? null,
    trial_used: current?.trial_used ?? false,
    subscription_started_at: subscriptionStartedAt,
    subscription_ends_at: subscriptionEndsAt,
    cancel_at_period_end: cancelAtPeriodEnd,
    stripe_customer_id: customerId ?? current?.stripe_customer_id ?? null,
  };
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
    const currentState = await getAccessState(supabaseAdmin, user.id);
    let nextState: AccessStateRow;

    if (customerId) {
      const sub = await findActiveSubscription(customerId);
      if (sub) {
        nextState = buildSubscriptionState(user.id, currentState, customerId, sub);
      } else if (currentState?.trial_used) {
        nextState = buildExpiredState(user.id, {
          ...currentState,
          stripe_customer_id: customerId ?? currentState.stripe_customer_id,
        });
      } else {
        nextState = buildTrialState(user.id, {
          ...currentState,
          stripe_customer_id: customerId ?? currentState?.stripe_customer_id ?? null,
        });
      }
    } else if (currentState?.trial_used) {
      const trialStillActive = currentState.access_status === ACCESS_STATUS.trial
        && currentState.trial_ends_at
        && Date.parse(currentState.trial_ends_at) > Date.now();
      nextState = trialStillActive
        ? currentState
        : buildExpiredState(user.id, currentState);
    } else {
      nextState = buildTrialState(user.id, currentState);
    }

    const persisted = await persistAccessState(supabaseAdmin, sourceUser as AuthUser, nextState);
    const entitled = persisted.access_status === ACCESS_STATUS.trial
      || persisted.access_status === ACCESS_STATUS.active
      || (persisted.access_status === ACCESS_STATUS.canceled
        && !!persisted.subscription_ends_at
        && Date.parse(persisted.subscription_ends_at) > Date.now());

    return new Response(JSON.stringify({
      isPremium: entitled,
      subscription: entitled ? "premium" : "free",
      subscription_status: persisted.access_status,
      subscription_end: persisted.subscription_ends_at,
      trial_ends_at: persisted.trial_ends_at,
      stripe_customer_id: persisted.stripe_customer_id,
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
