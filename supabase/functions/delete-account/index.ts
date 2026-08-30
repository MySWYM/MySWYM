import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import {
  findActiveCommitmentSubscription,
  isCommitmentInForce,
} from "../_shared/stripe-commitment.ts";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some(
    (o) => origin === o || origin.endsWith(".vercel.app") || origin.endsWith(".myswym.app")
  );
}

function corsHeaders(reqOrigin: string | null) {
  const origin =
    reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "https://myswym.app";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

async function cancelStripeSubscriptionsForUser(
  stripe: Stripe,
  user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> },
) {
  const stored = (user.app_metadata?.stripe_customer_id
    ?? user.user_metadata?.stripe_customer_id) as string | undefined;
  const customerIds = new Set<string>();
  if (stored) customerIds.add(stored);
  if (user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 10 });
    for (const c of list.data) {
      if (!(c as { deleted?: boolean }).deleted) customerIds.add(c.id);
    }
  }
  for (const customerId of customerIds) {
    const commitSub = await findActiveCommitmentSubscription(stripe, customerId);
    if (commitSub) {
      throw new Error(
        "Engagement 12 mois en cours : tu ne peux pas supprimer le compte tant que l’abonnement engagé n’est pas terminé. Écris à support@myswym.app pour un cas légal (rétractation, etc.).",
      );
    }
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 30 });
    for (const sub of subs.data) {
      if (sub.status === "canceled" || sub.status === "incomplete_expired") continue;
      if (isCommitmentInForce(sub)) {
        throw new Error(
          "Engagement 12 mois en cours : tu ne peux pas supprimer le compte tant que l’abonnement engagé n’est pas terminé. Écris à support@myswym.app pour un cas légal (rétractation, etc.).",
        );
      }
      try {
        // Annulation immédiate à la suppression de compte (évite prélèvement orphelin).
        await stripe.subscriptions.cancel(sub.id, { prorate: false });
      } catch (err) {
        console.error("[delete-account] stripe cancel failed", sub.id, err);
      }
    }
  }
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (req.method !== "POST") throw new Error("Méthode non autorisée");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const uid = user.id;

    // Annuler les abonnements Stripe avant suppression (best-effort).
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
        const { data: { user: adminUser } } = await admin.auth.admin.getUserById(uid);
        await cancelStripeSubscriptionsForUser(stripe, adminUser ?? user);
      } catch (stripeErr) {
        console.error("[delete-account] stripe cleanup error:", stripeErr);
      }
    }

    // Best-effort purge données applicatives
    const tables = [
      "strava_tokens",
      "strava_activities",
      "user_plans",
      "conversion_events",
      "buddy_profiles",
      "buddy_moderation",
      "user_access_state",
    ];
    for (const table of tables) {
      try {
        await admin.from(table).delete().eq("user_id", uid);
      } catch {
        // table may not exist / RLS, ignore
      }
    }

    // Buddy relations (colonnes requester/recipient / reporter / blocker)
    const buddyPairDeletes: Array<{ table: string; filters: Array<[string, string]> }> = [
      { table: "buddy_connections", filters: [["requester_id", uid], ["recipient_id", uid]] },
      { table: "buddy_blocks", filters: [["blocker_id", uid], ["blocked_id", uid]] },
      { table: "buddy_reports", filters: [["reporter_id", uid], ["reported_id", uid]] },
    ];
    for (const { table, filters } of buddyPairDeletes) {
      for (const [col, val] of filters) {
        try {
          await admin.from(table).delete().eq(col, val);
        } catch {
          // ignore
        }
      }
    }

    // Avatars Storage : dossier uid/
    try {
      const { data: files } = await admin.storage.from("avatars").list(uid);
      if (files?.length) {
        await admin.storage.from("avatars").remove(files.map((f) => `${uid}/${f.name}`));
      }
    } catch {
      // ignore storage errors
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw new Error(delErr.message || "Impossible de supprimer le compte");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
