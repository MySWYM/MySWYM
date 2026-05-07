import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ALLOWED_PRICE_IDS = new Set([
  Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "price_1TP5yOAVxucD4jHaRYk2cbHC",
  Deno.env.get("STRIPE_PRICE_ANNUAL")  ?? "price_1TPKQfAVxucD4jHaUDssY5cs",
  Deno.env.get("STRIPE_PRICE_ID") ?? "",
].filter(Boolean));

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
    if (!authHeader) throw new Error("Non authentifié");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const body = await req.json();
    const { priceId } = body;

    // Validate priceId server-side — never trust the client
    const price = priceId ?? Deno.env.get("STRIPE_PRICE_ID")!;
    if (!ALLOWED_PRICE_IDS.has(price)) throw new Error("Offre invalide");

    // Validate origin to prevent open redirect
    const origin = reqOrigin && isAllowedOrigin(reqOrigin)
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "https://myswym.fr";

    const appPath = `${origin}/app`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${appPath}?payment=success`,
      cancel_url: `${appPath}?payment=cancel`,
      client_reference_id: user.id,
      customer_email: user.email,
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
