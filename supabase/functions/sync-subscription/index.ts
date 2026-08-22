import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildSubscriptionStateFromStripe,
  getAccessState,
  hasEntitlement,
  persistAccessState,
  resolveAccessWithoutStripeSub,
  type AccessStateRow,
  type AuthUser,
} from "../_shared/access-state.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
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

/** Uniquement l’id déjà rattaché au compte (checkout). Jamais de lookup e-mail : ça vole l’essai 7j. */
async function resolveStoredCustomerId(user: AuthUser) {
  const stored = (user.app_metadata?.stripe_customer_id ?? user.user_metadata?.stripe_customer_id) as string | undefined;
  if (!stored) return null;
  try {
    const c = await stripe.customers.retrieve(stored);
    if (!(c as { deleted?: boolean }).deleted) return stored;
  } catch {
    // ID périmé — le checkout recréera un customer. Ne pas rattacher un autre compte par e-mail.
  }
  return null;
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

    const customerId = await resolveStoredCustomerId(sourceUser);
    const currentState = await getAccessState(supabaseAdmin, user.id);
    const grantOpts = { userCreatedAt: sourceUser.created_at ?? null };
    let nextState: AccessStateRow;

    // Abo Stripe encore valide → Stripe gagne. Sinon essai 7j sans carte (1×) puis gel.
    if (customerId) {
      const sub = await findActiveSubscription(customerId);
      if (sub) {
        const mapped = buildSubscriptionStateFromStripe(user.id, currentState, customerId, sub);
        nextState = hasEntitlement(mapped)
          ? mapped
          : resolveAccessWithoutStripeSub(user.id, currentState, customerId, grantOpts);
      } else {
        nextState = resolveAccessWithoutStripeSub(user.id, currentState, customerId, grantOpts);
      }
    } else {
      nextState = resolveAccessWithoutStripeSub(user.id, currentState, null, grantOpts);
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
