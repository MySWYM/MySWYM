import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

// Prix actifs + anciens IDs (sécurité si un client a encore un cache)
const ALLOWED_PRICE_IDS = new Set([
  Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  Deno.env.get("STRIPE_PRICE_ANNUAL") ?? "price_1TPjyeAS4mfgF2TwmSjSiidD",
  Deno.env.get("STRIPE_PRICE_ID") ?? "",
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1TPjyeAS4mfgF2TwmSjSiidD",
  "price_1TP5yOAVxucD4jHaRYk2cbHC",
  "price_1TPKQfAVxucD4jHaUDssY5cs",
].filter(Boolean));

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some((o) => origin === o)
    || origin.endsWith(".vercel.app")
    || origin === "https://myswym.app"
    || origin.endsWith(".myswym.app");
}

function corsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function stripeErrorMessage(err: unknown): string {
  const e = err as { type?: string; code?: string; message?: string };
  if (e?.code === "resource_missing" || /No such price/i.test(e?.message ?? "")) {
    return "Offre Stripe introuvable — les IDs de prix ne correspondent pas au compte Stripe.";
  }
  if (e?.message) return e.message;
  if (err instanceof Error) return err.message;
  return "Une erreur est survenue";
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
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const sourceUser = adminUser ?? user;

    const body = await req.json();
    const { priceId } = body;

    const price = priceId ?? Deno.env.get("STRIPE_PRICE_ID")!;
    if (!ALLOWED_PRICE_IDS.has(price)) throw new Error("Offre invalide");

    // Vérifie que le prix existe vraiment sur CE compte Stripe (évite un échec silencieux)
    try {
      await stripe.prices.retrieve(price);
    } catch (priceErr) {
      console.error("[create-checkout] price retrieve failed:", price, priceErr);
      throw new Error(stripeErrorMessage(priceErr));
    }

    const origin = reqOrigin && isAllowedOrigin(reqOrigin)
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "https://myswym.app";

    const appPath = `${origin}/app`;

    const existingCustomerId = (sourceUser.app_metadata?.stripe_customer_id
      ?? sourceUser.user_metadata?.stripe_customer_id) as string | undefined;

    let validCustomerId: string | undefined;
    if (existingCustomerId) {
      try {
        const c = await stripe.customers.retrieve(existingCustomerId);
        if (!(c as { deleted?: boolean }).deleted) validCustomerId = existingCustomerId;
      } catch {
        // ID invalide / autre mode Stripe → nouveau checkout avec email
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${appPath}?payment=success`,
      cancel_url: `${appPath}?payment=cancel`,
      client_reference_id: user.id,
      ...(validCustomerId
        ? { customer: validCustomerId }
        : { customer_email: user.email }),
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = stripeErrorMessage(err);
    console.error("[create-checkout] ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
