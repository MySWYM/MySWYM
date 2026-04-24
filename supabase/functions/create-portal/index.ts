import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".vercel.app"));
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
    if (!authHeader) throw new Error("Non authentifié");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Utilisateur introuvable");

    const customerId = user.user_metadata?.stripe_customer_id;
    if (!customerId) throw new Error("Aucun abonnement actif trouvé");

    // Ignore client-provided origin — use the validated request origin instead
    const returnOrigin = reqOrigin && isAllowedOrigin(reqOrigin)
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "https://myswym.fr";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${returnOrigin}?payment=portal`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Une erreur est survenue" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
