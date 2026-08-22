import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const LEGACY_PRICE_IDS = new Set([
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1TudyVAS4mfgF2TwHiSo3Vrg",
  "price_1Tue7cAS4mfgF2TwP53wZ7qn",
  "price_1TPjyeAS4mfgF2TwmSjSiidD",
  "price_1TP5yOAVxucD4jHaRYk2cbHC",
  "price_1TPKQfAVxucD4jHaUDssY5cs",
]);

function envPrice(name: string, fallback: string) {
  const v = Deno.env.get(name);
  if (v && !LEGACY_PRICE_IDS.has(v)) return v;
  return fallback;
}

const PRICE_MONTHLY_FLEX = envPrice("STRIPE_PRICE_MONTHLY_FLEX", "price_1U67kYAS4mfgF2Twaw269yaU");
const PRICE_MONTHLY_COMMIT = envPrice(
  "STRIPE_PRICE_MONTHLY_COMMIT",
  envPrice("STRIPE_PRICE_MONTHLY", "price_1U67kZAS4mfgF2Twi5Px8ZvG"),
);
const PRICE_ANNUAL = envPrice("STRIPE_PRICE_ANNUAL", "price_1U67kaAS4mfgF2TwvUsVQ3vE");
const PRICE_BIENNIAL = Deno.env.get("STRIPE_PRICE_BIENNIAL") ?? "price_1Tue7cAS4mfgF2TwP53wZ7qn";
const COUPON_REFERRAL = Deno.env.get("STRIPE_COUPON_REFERRAL") ?? "REFERRAL20";

function planTierFromPrice(price: string): string | undefined {
  if (
    price === PRICE_MONTHLY_FLEX ||
    price === "price_1U67kYAS4mfgF2Twaw269yaU"
  ) return "monthly_flex";
  if (
    price === PRICE_MONTHLY_COMMIT ||
    price === "price_1U67kZAS4mfgF2Twi5Px8ZvG"
  ) return "monthly_commit";
  if (
    price === PRICE_ANNUAL ||
    price === "price_1U67kaAS4mfgF2TwvUsVQ3vE"
  ) return "annual";
  if (price === PRICE_BIENNIAL) return "biennial";
  return undefined;
}

// Offres actives + anciens IDs (abonnés / cache / secrets non encore mis à jour)
const ALLOWED_PRICE_IDS = new Set([
  PRICE_MONTHLY_FLEX,
  PRICE_MONTHLY_COMMIT,
  PRICE_ANNUAL,
  PRICE_BIENNIAL,
  Deno.env.get("STRIPE_PRICE_ID") ?? "",
  "price_1U67kYAS4mfgF2Twaw269yaU",
  "price_1U67kZAS4mfgF2Twi5Px8ZvG",
  "price_1U67kaAS4mfgF2TwvUsVQ3vE",
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1TudyVAS4mfgF2TwHiSo3Vrg",
  "price_1Tue7cAS4mfgF2TwP53wZ7qn",
  "price_1TPjyeAS4mfgF2TwmSjSiidD",
  "price_1TP5yOAVxucD4jHaRYk2cbHC",
  "price_1TPKQfAVxucD4jHaUDssY5cs",
].filter(Boolean));

const BLOCKING_SUB_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
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

/** Crée le coupon s'il n'existe pas encore (id stable). */
async function ensureCoupon(id: string, percentOff: number, name: string) {
  try {
    return await stripe.coupons.retrieve(id);
  } catch {
    return await stripe.coupons.create({
      id,
      percent_off: percentOff,
      duration: "once",
      name,
    });
  }
}

type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

async function findUserByReferralCode(
  supabaseAdmin: ReturnType<typeof createClient>,
  code: string,
): Promise<AuthUser | null> {
  const needle = code.trim().toUpperCase();
  if (!needle || needle.length < 4) return null;

  let page = 1;
  while (true) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = (data?.users ?? []) as AuthUser[];
    const hit = batch.find((u) =>
      String(u.app_metadata?.referral_code ?? "").toUpperCase() === needle
    );
    if (hit) return hit;
    if (batch.length < 1000) break;
    page += 1;
  }
  return null;
}

async function resolveCustomerId(user: AuthUser): Promise<string | undefined> {
  const stored = (user.app_metadata?.stripe_customer_id
    ?? user.user_metadata?.stripe_customer_id) as string | undefined;
  if (stored) {
    try {
      const c = await stripe.customers.retrieve(stored);
      if (!(c as { deleted?: boolean }).deleted) return stored;
    } catch {
      // ID périmé — recherche par email
    }
  }
  if (!user.email) return undefined;
  const list = await stripe.customers.list({ email: user.email, limit: 10 });
  const match = list.data.find((c) => !(c as { deleted?: boolean }).deleted);
  return match?.id;
}

async function findBlockingSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 30,
  });
  return subs.data.find((s) => BLOCKING_SUB_STATUSES.has(s.status)) ?? null;
}

/** Cherche un abo bloquant sur tous les customers Stripe liés à l'email. */
async function findBlockingSubscriptionForEmail(email: string) {
  const list = await stripe.customers.list({ email, limit: 10 });
  for (const c of list.data) {
    if ((c as { deleted?: boolean }).deleted) continue;
    const sub = await findBlockingSubscription(c.id);
    if (sub) return { customerId: c.id, subscription: sub };
  }
  return null;
}

async function findOpenCheckoutSession(customerId: string) {
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 10,
  });
  return sessions.data.find((s) =>
    s.status === "open"
    && s.mode === "subscription"
    && typeof s.url === "string"
    && s.url.length > 0
  ) ?? null;
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
    const { priceId, referralCode } = body as { priceId?: string; referralCode?: string };

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

    let validCustomerId = await resolveCustomerId(sourceUser);

    // Anti-doublon : refuse un 2e abo si un trial/active existe déjà (même email / customer).
    let blockingSub = validCustomerId
      ? await findBlockingSubscription(validCustomerId)
      : null;
    if (!blockingSub && sourceUser.email) {
      const byEmail = await findBlockingSubscriptionForEmail(sourceUser.email);
      if (byEmail) {
        validCustomerId = byEmail.customerId;
        blockingSub = byEmail.subscription;
      }
    }
    if (blockingSub) {
      console.warn("[create-checkout] blocked duplicate", {
        userId: user.id,
        customerId: validCustomerId,
        subscriptionId: blockingSub.id,
        status: blockingSub.status,
      });
      return new Response(JSON.stringify({
        error: blockingSub.status === "trialing"
          ? "Tu as déjà un essai en cours. Gère ton abonnement depuis ton compte."
          : "Tu as déjà un abonnement actif. Gère-le depuis ton compte.",
        alreadySubscribed: true,
        subscriptionStatus: blockingSub.status,
        subscriptionId: blockingSub.id,
      }), {
        status: 409,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Réutilise une session Checkout encore ouverte (anti multi-clics).
    if (validCustomerId) {
      const openSession = await findOpenCheckoutSession(validCustomerId);
      if (openSession?.url) {
        await supabaseAdmin.from("conversion_events").insert({
          user_id: user.id,
          event_name: "checkout_session_reused",
          path: "/create-checkout",
          properties: { session_id: openSession.id, price_id: price },
          created_at: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ url: openSession.url, reused: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // Parrainage > unlock (−50% mensuel). Pas de stacking.
    const rawRef = (referralCode
      ?? sourceUser.user_metadata?.referred_by
      ?? "") as string;
    let referredByUserId: string | undefined;
    let couponId: string | undefined;

    if (rawRef) {
      const referrer = await findUserByReferralCode(supabaseAdmin, rawRef);
      if (referrer && referrer.id !== user.id) {
        const refIsPremium = referrer.app_metadata?.subscription === "premium";
        if (refIsPremium) {
          await ensureCoupon(COUPON_REFERRAL, 20, "Parrainage −20%");
          couponId = COUPON_REFERRAL;
          referredByUserId = referrer.id;
        }
      }
    }

    // L'essai 7j est sans carte (à l'inscription). Checkout = paiement immédiat.
    // Fenêtre 2 min : double-clic / refresh ne créent pas 2 sessions Stripe.
    const idempotencyKey = `checkout:${user.id}:${price}:${Math.floor(Date.now() / 120_000)}`;
    const planTier = planTierFromPrice(price);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      payment_method_collection: "always",
      line_items: [{ price, quantity: 1 }],
      success_url: `${appPath}?payment=success`,
      cancel_url: `${appPath}?payment=cancel`,
      client_reference_id: user.id,
      allow_promotion_codes: !couponId, // Stripe: discounts XOR allow_promotion_codes
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      metadata: {
        supabase_user_id: user.id,
        ...(planTier ? { plan_tier: planTier } : {}),
        ...(referredByUserId ? { referred_by: referredByUserId } : {}),
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          ...(planTier ? { plan_tier: planTier } : {}),
          ...(referredByUserId ? { referred_by: referredByUserId } : {}),
        },
      },
      ...(validCustomerId
        ? { customer: validCustomerId }
        : { customer_email: user.email }),
    }, {
      idempotencyKey,
    });

    await supabaseAdmin.from("conversion_events").insert({
      user_id: user.id,
      event_name: "checkout_session_created",
      path: "/create-checkout",
      properties: {
        price_id: price,
        has_referral: !!couponId || !!referredByUserId,
        trial_granted: false,
        session_id: session.id,
      },
      created_at: new Date().toISOString(),
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
