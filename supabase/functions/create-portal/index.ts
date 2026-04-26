import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!authHeader) throw new Error("Non authentifié — pas de token JWT");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error("Utilisateur introuvable après getUser()");

    const customerId = user.user_metadata?.stripe_customer_id;
    console.log("[create-portal] user:", user.id, "customerId:", customerId ?? "MISSING");
    if (!customerId) throw new Error(`stripe_customer_id manquant dans user_metadata (user: ${user.id})`);

    // Ignore client-provided origin — use the validated request origin instead
    const returnOrigin = reqOrigin && isAllowedOrigin(reqOrigin)
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "https://myswym.fr";

    console.log("[create-portal] creating portal session for customer:", customerId);
    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${returnOrigin}?payment=portal`,
      });
    } catch (stripeErr: any) {
      if (stripeErr?.code === "resource_missing") {
        // Customer ID périmé (test→live ou supprimé) : on le retire du metadata
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, stripe_customer_id: null },
        });
        throw new Error("Lien Stripe périmé — ton compte a été réinitialisé. Contacte support@myswym.app si le problème persiste.");
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
