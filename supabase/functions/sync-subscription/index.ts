import Stripe from "npm:stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  buildReviewPremiumState,
  buildSubscriptionStateFromStripe,
  getAccessState,
  hasEntitlement,
  isLiveAppleEntitlement,
  persistAccessState,
  resolveAccessWithoutStripeSub,
  type AccessStateRow,
  type AuthUser,
} from "../_shared/access-state.ts";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** Comptes App Store Review / démo : Premium 1 an sans Stripe (secret REVIEW_PREMIUM_EMAILS). */
function reviewPremiumEmails(): Set<string> {
  const raw = Deno.env.get("REVIEW_PREMIUM_EMAILS") || "";
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
}

function isReviewPremiumUser(user: AuthUser) {
  const email = String(user.email || "").trim().toLowerCase();
  return Boolean(email) && reviewPremiumEmails().has(email);
}

/** Uniquement l’id déjà rattaché au compte (checkout). */
async function resolveStoredCustomerId(user: AuthUser) {
  const stored = (user.app_metadata?.stripe_customer_id ?? user.user_metadata?.stripe_customer_id) as string | undefined;
  if (!stored) return null;
  try {
    const c = await stripe.customers.retrieve(stored);
    if (!(c as { deleted?: boolean }).deleted) return stored;
  } catch {
    // ID périmé, le checkout recréera un customer.
  }
  return null;
}

async function findActiveSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  return subs.data.find(s => ACTIVE_STATUSES.has(s.status)) ?? null;
}

async function pickBestCustomerId(ids: string[]) {
  if (ids.length === 0) return null;
  if (ids.length === 1) return ids[0];
  let best: { id: string; created: number } | null = null;
  for (const id of ids) {
    const sub = await findActiveSubscription(id);
    if (!sub) continue;
    if (!best || (sub.created ?? 0) > best.created) {
      best = { id, created: sub.created ?? 0 };
    }
  }
  return best?.id ?? null;
}

/** Réécrit metadata.supabase_user_id si périmé (compte recréé, même e-mail). */
async function claimCustomerForUser(customerId: string, userId: string) {
  try {
    const c = await stripe.customers.retrieve(customerId);
    if ((c as { deleted?: boolean }).deleted) return;
    const current = String((c as Stripe.Customer).metadata?.supabase_user_id || "");
    if (current === userId) return;
    await stripe.customers.update(customerId, {
      metadata: { supabase_user_id: userId },
    });
  } catch {
    /* non bloquant : l’accès peut quand même être persisté côté Supabase */
  }
}

/**
 * Récupération Premium Stripe si le customer_id manque sur le JWT.
 * 1) metadata.supabase_user_id = user.id
 * 2) e-mail confirmé + customer(s) avec abo actif (même si metadata pointe un ancien user.id)
 */
async function resolveMissingCustomerId(user: AuthUser) {
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${user.id}'`,
      limit: 5,
    });
    const metaHits: string[] = [];
    for (const c of byMeta.data) {
      if ((c as { deleted?: boolean }).deleted) continue;
      const sub = await findActiveSubscription(c.id);
      if (sub) metaHits.push(c.id);
    }
    const fromMeta = await pickBestCustomerId(metaHits);
    if (fromMeta) return fromMeta;
  } catch {
    // Search API indisponible → fallback e-mail
  }

  const email = String(user.email || "").trim().toLowerCase();
  // Review / e-mail confirmé : lookup Stripe. Sans confirmation = skip (sauf review list).
  if (!email) return null;
  if (!user.email_confirmed_at && !isReviewPremiumUser(user)) return null;
  try {
    const found = await stripe.customers.list({ email, limit: 10 });
    const withActive: string[] = [];
    const exactMeta: string[] = [];
    for (const c of found.data) {
      if ((c as { deleted?: boolean }).deleted) continue;
      const sub = await findActiveSubscription(c.id);
      if (!sub) continue;
      withActive.push(c.id);
      const metaUid = String(c.metadata?.supabase_user_id || "");
      if (metaUid === user.id) exactMeta.push(c.id);
    }
    if (exactMeta.length > 0) return await pickBestCustomerId(exactMeta);
    // Metadata stale / vide : 1 seul abo actif sur cet e-mail → rattacher
    if (withActive.length === 1) return withActive[0];
    if (withActive.length > 1) {
      // Plusieurs abo : on ne devine pas (évite de voler un autre compte)
      return null;
    }
  } catch {
    return null;
  }
  return null;
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

    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const sourceUser = adminUser ?? user;

    const customerId = await resolveStoredCustomerId(sourceUser)
      ?? await resolveMissingCustomerId(sourceUser);
    if (customerId) {
      await claimCustomerForUser(customerId, user.id);
    }
    const currentState = await getAccessState(supabaseAdmin, user.id);
    const grantOpts = { userCreatedAt: sourceUser.created_at ?? null };
    let nextState: AccessStateRow;

    // Comptes review Apple / démo : toujours Premium (priorité après Apple IAP live)
    if (isReviewPremiumUser(sourceUser) && !isLiveAppleEntitlement(currentState)) {
      nextState = buildReviewPremiumState(user.id, {
        ...(currentState ?? {}),
        stripe_customer_id: customerId ?? currentState?.stripe_customer_id ?? null,
      });
    } else if (isLiveAppleEntitlement(currentState)) {
      nextState = {
        ...currentState,
        stripe_customer_id: customerId ?? currentState.stripe_customer_id,
      };
    } else if (customerId) {
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
