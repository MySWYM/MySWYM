import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildExpiredState,
  getAccessState,
  persistAccessState,
  stripEntitlementFromUserMeta,
  type AuthUser,
} from "../_shared/access-state.ts";
import {
  findActiveCommitmentSubscription,
  resolveNoCancelPortalConfigId,
} from "../_shared/stripe-commitment.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

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

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié, pas de token JWT");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error("Utilisateur introuvable après getUser()");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const sourceUser = adminUser ?? user;

    const customerId = (sourceUser.app_metadata?.stripe_customer_id
      ?? sourceUser.user_metadata?.stripe_customer_id) as string | undefined;
    console.log("[create-portal] user:", user.id, "customerId:", customerId ?? "MISSING");

    let resolvedCustomerId = customerId ?? null;
    if (resolvedCustomerId) {
      try {
        const c = await stripe.customers.retrieve(resolvedCustomerId);
        if ((c as { deleted?: boolean }).deleted) resolvedCustomerId = null;
      } catch {
        resolvedCustomerId = null;
      }
    }
    if (!resolvedCustomerId && user.email) {
      const list = await stripe.customers.list({ email: user.email, limit: 10 });
      const match = list.data.find(c => !(c as { deleted?: boolean }).deleted);
      resolvedCustomerId = match?.id ?? null;
      if (resolvedCustomerId) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...(sourceUser.app_metadata ?? {}),
            stripe_customer_id: resolvedCustomerId,
          },
          user_metadata: stripEntitlementFromUserMeta(sourceUser.user_metadata),
        });
      }
    }
    if (!resolvedCustomerId) {
      throw new Error(`stripe_customer_id manquant (user: ${user.id}), clique sur « Actualiser le statut » dans Profil`);
    }

    const returnOrigin = reqOrigin && isAllowedOrigin(reqOrigin)
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "https://myswym.app";

    console.log("[create-portal] creating portal session for customer:", resolvedCustomerId);
    const commitSub = await findActiveCommitmentSubscription(stripe, resolvedCustomerId);
    let portalConfiguration: string | undefined;
    if (commitSub) {
      try {
        portalConfiguration = await resolveNoCancelPortalConfigId(stripe);
        console.log(
          "[create-portal] engagement 12 mois actif → portail sans annulation",
          commitSub.id,
          portalConfiguration,
        );
      } catch (cfgErr) {
        console.error("[create-portal] portal config no_cancel failed:", cfgErr);
      }
    }
    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: resolvedCustomerId,
        return_url: `${returnOrigin}/app?payment=portal`,
        ...(portalConfiguration ? { configuration: portalConfiguration } : {}),
      });
    } catch (stripeErr: unknown) {
      const code = (stripeErr as { code?: string })?.code;
      if (code === "resource_missing") {
        const currentState = await getAccessState(supabaseAdmin, user.id);
        const nextState = buildExpiredState(user.id, {
          ...currentState,
          stripe_customer_id: null,
        });
        await persistAccessState(supabaseAdmin, sourceUser as AuthUser, nextState);
        throw new Error("Lien Stripe périmé, ton compte a été réinitialisé. Contacte support@myswym.app si le problème persiste.");
      }
      throw stripeErr;
    }

    console.log("[create-portal] success, url:", session.url);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-portal] ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
