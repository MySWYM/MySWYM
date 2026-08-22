import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildExpiredState,
  buildSubscriptionStateFromStripe,
  getAccessState,
  isoFromUnixSeconds,
  persistAccessState,
  stripEntitlementFromUserMeta,
  type AccessStateRow,
  type AuthUser,
} from "../_shared/access-state.ts";
import { sendEmailViaHttp } from "../_shared/email-http.ts";
import { sendResendEvent } from "../_shared/resend-events.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const REFERRAL_CREDIT_CENTS = 499; // 4,99 €

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

const PRICE_LABELS: Record<string, string> = {
  [PRICE_MONTHLY_FLEX]: "Premium — 9,99 € / mois (sans engagement)",
  [PRICE_MONTHLY_COMMIT]: "Premium — 4,99 € / mois (engagement 12 mois)",
  [PRICE_ANNUAL]: "Premium — 52,99 € / an",
  [PRICE_BIENNIAL]: "Premium — 29,99 € / 2 ans",
  price_1U67kYAS4mfgF2Twaw269yaU: "Premium — 9,99 € / mois (sans engagement)",
  price_1U67kZAS4mfgF2Twi5Px8ZvG: "Premium — 4,99 € / mois (engagement 12 mois)",
  price_1U67kaAS4mfgF2TwvUsVQ3vE: "Premium — 52,99 € / an",
  price_1TPjyPAS4mfgF2Twx3Zh4zrJ: "Premium — mensuel (ancien tarif)",
  price_1TudyVAS4mfgF2TwHiSo3Vrg: "Premium — annuel (ancien tarif)",
};

function planLabelFromPriceId(priceId: string | undefined): string {
  if (!priceId) return "Premium";
  return PRICE_LABELS[priceId] || "Premium";
}

function planLabelFromSubscription(sub: Stripe.Subscription): string {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const nick = sub.items?.data?.[0]?.price?.nickname;
  if (nick && typeof nick === "string" && nick.trim()) return nick.trim();
  return planLabelFromPriceId(priceId);
}

function firstNameFromUser(user: AuthUser): string | undefined {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.first_name === "string" && meta.first_name) ||
    (typeof meta.firstName === "string" && meta.firstName) ||
    (typeof meta.full_name === "string" && meta.full_name.split(" ")[0]);
  const trimmed = fromMeta?.trim();
  return trimmed || undefined;
}

async function sendSubscriptionConfirmation(
  user: AuthUser,
  planLabel: string,
) {
  if (!user.email) {
    console.warn("[stripe-webhook] skip confirmation email: no user email");
    return;
  }
  const appUrl = (Deno.env.get("APP_URL") || "https://myswym.app").replace(/\/$/, "");
  const result = await sendEmailViaHttp("subscription_confirmation", {
    to: user.email,
    planLabel,
    manageUrl: `${appUrl}/app`,
    firstName: firstNameFromUser(user),
    userId: user.id,
  });
  if (!result.ok) {
    console.error("[stripe-webhook] confirmation email failed:", result.error);
  } else {
    console.log("[stripe-webhook] confirmation email sent:", result.id);
  }
}

function getStripeCustomerId(user: AuthUser): string | undefined {
  return (user.app_metadata?.stripe_customer_id ?? user.user_metadata?.stripe_customer_id) as string | undefined;
}

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const timestamp = sigHeader.split(",").find(p => p.startsWith("t="))?.slice(2);
  const signature = sigHeader.split(",").find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature || !secret) return false;

  // Reject replays older than 5 minutes (Stripe recommendation)
  const ageSec = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(ageSec) || ageSec < 0 || ageSec > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

async function setEntitlement(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: AuthUser,
  entitlement: Record<string, unknown>,
) {
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      ...entitlement,
    },
    // Neutralise toute falsification côté client
    user_metadata: stripEntitlementFromUserMeta(user.user_metadata),
  });
}

function buildSubscriptionState(
  userId: string,
  current: AccessStateRow | null,
  customerId: string | null,
  sub: Stripe.Subscription,
): AccessStateRow {
  return buildSubscriptionStateFromStripe(userId, current, customerId, sub);
}

async function creditReferrer(
  supabaseAdmin: ReturnType<typeof createClient>,
  filleul: AuthUser,
  referredById: string,
) {
  if (!referredById || referredById === filleul.id) return;
  if (filleul.app_metadata?.referral_rewarded === true) return;

  const { data: { user: parrain } } = await supabaseAdmin.auth.admin.getUserById(referredById);
  if (!parrain) {
    console.error("[stripe-webhook] referrer not found:", referredById);
    return;
  }

  const parrainCustomerId = getStripeCustomerId(parrain as AuthUser);
  if (!parrainCustomerId) {
    console.error("[stripe-webhook] referrer has no stripe_customer_id:", referredById);
    // Mark as rewarded anyway to avoid retry loops if parrain never had Stripe
    await setEntitlement(supabaseAdmin, filleul, { referral_rewarded: true });
    return;
  }

  try {
    await stripe.customers.createBalanceTransaction(parrainCustomerId, {
      amount: -REFERRAL_CREDIT_CENTS, // crédit = montant négatif
      currency: "eur",
      description: `Parrainage MySWYM — filleul ${filleul.id.slice(0, 8)}`,
      metadata: { filleul_id: filleul.id, type: "referral_reward" },
    });
  } catch (err) {
    console.error("[stripe-webhook] balance credit failed:", err);
    return; // ne pas marquer rewarded → retry possible
  }

  await setEntitlement(supabaseAdmin, filleul, { referral_rewarded: true });
  console.log("[stripe-webhook] referral credit OK →", referredById);
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
    const users: AuthUser[] = [];
    let page = 1;
    while (true) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const batch = data?.users ?? [];
      users.push(...batch);
      if (batch.length < 1000) break;
      page += 1;
    }

    const byId = users.find(u => getStripeCustomerId(u) === customerId);
    if (byId) return byId;

    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as { deleted?: boolean }).deleted || !("email" in customer) || !customer.email) return null;

    const byEmail = users.find(u => u.email === customer.email);
    if (byEmail) {
      await setEntitlement(supabaseAdmin, byEmail, {
        stripe_customer_id: customerId,
        subscription: byEmail.app_metadata?.subscription ?? "free",
        subscription_end: byEmail.app_metadata?.subscription_end ?? null,
        cancel_at_period_end: byEmail.app_metadata?.cancel_at_period_end ?? false,
      });
      return {
        ...byEmail,
        app_metadata: { ...(byEmail.app_metadata ?? {}), stripe_customer_id: customerId },
        user_metadata: stripEntitlementFromUserMeta(byEmail.user_metadata),
      };
    }

    return null;
  };

  // ── checkout.session.completed ─────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const userId = session?.client_reference_id;
    const customerId = session?.customer;
    const subscriptionId = session?.subscription;
    const referredBy = (session?.metadata?.referred_by
      ?? session?.subscription_details?.metadata?.referred_by) as string | undefined;

    if (userId) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (user) {
        let nextState: AccessStateRow | null = null;
        let planLabel = "Premium";
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          planLabel = planLabelFromSubscription(sub);
          const currentState = await getAccessState(supabaseAdmin, userId);
          nextState = buildSubscriptionState(userId, currentState, customerId ?? null, sub);
        }

        if (nextState) {
          await persistAccessState(supabaseAdmin, user as AuthUser, nextState);
          await supabaseAdmin.from("conversion_events").insert({
            user_id: user.id,
            event_name: "payment_succeeded",
            path: "/stripe-webhook",
            properties: {
              source: "stripe_webhook",
              subscription_status: nextState.access_status,
              subscription_ends_at: nextState.subscription_ends_at,
            },
            created_at: new Date().toISOString(),
          });
        } else {
          // Checkout subscription sans subscriptionId = anomalie : ne jamais
          // écrire premium "à vie" (subscription_end: null + status active).
          // On rattache seulement le customer ; sync-subscription / prochain event corrigera.
          console.error("[stripe-webhook] checkout.session.completed without subscriptionId", {
            userId,
            sessionId: session?.id,
            customerId,
          });
          if (customerId) {
            await setEntitlement(supabaseAdmin, user as AuthUser, {
              stripe_customer_id: customerId,
            });
          }
        }

        // Email de confirmation (ne bloque pas le webhook si Resend échoue)
        try {
          await sendSubscriptionConfirmation(user as AuthUser, planLabel);
        } catch (mailErr) {
          console.error("[stripe-webhook] confirmation email error:", mailErr);
        }

        // Stoppe le nurture Resend (wait_for_event subscription.started)
        try {
          if (user.email) {
            await sendResendEvent("subscription.started", user.email, {
              firstName: firstNameFromUser(user as AuthUser) || "Salut",
              userId: user.id,
              planLabel,
            });
            if (nextState?.access_status === ACCESS_STATUS.trial) {
              await sendResendEvent("trial.started", user.email, {
                firstName: firstNameFromUser(user as AuthUser) || "Salut",
                userId: user.id,
                trialEndsAt: nextState.trial_ends_at ?? "",
              });
            }
          }
        } catch (evErr) {
          console.error("[stripe-webhook] subscription/trial event error:", evErr);
        }

        // Recharge user après setEntitlement pour avoir app_metadata à jour
        const { data: { user: fresh } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const filleul = (fresh ?? user) as AuthUser;
        const refId = referredBy
          || (typeof subscriptionId === "string"
            ? (await stripe.subscriptions.retrieve(subscriptionId)).metadata?.referred_by
            : undefined);

        // Crédit parrain uniquement si paiement réellement encaissé.
        // Essai 7j (payment_status often "no_payment_required") : pas de crédit tant que
        // le filleul n'a pas été prélevé — sinon crédit orphelin si annulation pendant l'essai.
        if (refId && session?.payment_status === "paid") {
          await creditReferrer(supabaseAdmin, filleul, refId);
        } else if (refId) {
          console.log("[stripe-webhook] skip referral credit (payment_status:", session?.payment_status, ")");
        }
      }
    }
  }

  // ── customer.subscription.created / updated ────────────────────────────
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data?.object;
    const customerId = sub?.customer;

    const user = await findUserByCustomerId(customerId);
    if (user) {
      const currentState = await getAccessState(supabaseAdmin, user.id);
      const nextState = buildSubscriptionState(user.id, currentState, customerId ?? null, sub as Stripe.Subscription);
      await persistAccessState(supabaseAdmin, user, nextState);

      // Fin d'essai → active : créditer le parrain (paiement réel après trial).
      const prevStatus = (event.data as { previous_attributes?: { status?: string } })
        ?.previous_attributes?.status;
      const refId = (sub as Stripe.Subscription)?.metadata?.referred_by as string | undefined;
      if (
        event.type === "customer.subscription.updated" &&
        refId &&
        sub?.status === "active" &&
        prevStatus === "trialing"
      ) {
        await creditReferrer(supabaseAdmin, user, refId);
      }

      // Annulation demandée (fin de période) → automation Resend
      const prev = (event.data as { previous_attributes?: { cancel_at_period_end?: boolean } })
        ?.previous_attributes;
      if (
        event.type === "customer.subscription.updated" &&
        sub?.cancel_at_period_end === true &&
        prev?.cancel_at_period_end === false &&
        user.email
      ) {
        try {
          await sendResendEvent("subscription.canceled", user.email, {
            firstName: firstNameFromUser(user) || "Salut",
            userId: user.id,
          });
        } catch (evErr) {
          console.error("[stripe-webhook] subscription.canceled event error:", evErr);
        }
      }
    }
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data?.object;
    const customerId = sub?.customer;

    const user = await findUserByCustomerId(customerId);
    if (user) {
      const currentState = await getAccessState(supabaseAdmin, user.id);
      const nextState = buildExpiredState(user.id, {
        ...currentState,
        stripe_customer_id: customerId ?? currentState?.stripe_customer_id ?? null,
        subscription_ends_at: isoFromUnixSeconds(sub?.current_period_end ?? null),
      });
      await persistAccessState(supabaseAdmin, user, nextState);

      // Si annulation immédiate (pas déjà passée par cancel_at_period_end)
      if (user.email && !sub?.cancel_at_period_end) {
        try {
          await sendResendEvent("subscription.canceled", user.email, {
            firstName: firstNameFromUser(user) || "Salut",
            userId: user.id,
          });
        } catch (evErr) {
          console.error("[stripe-webhook] subscription.canceled (deleted) event error:", evErr);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
