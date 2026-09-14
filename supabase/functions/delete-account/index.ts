import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmailViaHttp } from "../_shared/email-http.ts";
import {
  DELETE_BLOCK,
  DeleteAccountBlockedError,
  evaluateDeleteGate,
  gateFromUnverifiedAccess,
  paidAccessLooksLive,
  throwIfBlocked,
  type DeleteGate,
} from "../_shared/delete-account-policy.ts";

type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

function firstNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string | undefined {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.first_name === "string" && meta.first_name) ||
    (typeof meta.firstName === "string" && meta.firstName) ||
    (typeof meta.full_name === "string" && meta.full_name.split(/\s+/)[0]) ||
    (typeof meta.name === "string" && meta.name.split(/\s+/)[0]);
  const trimmed = fromMeta?.trim();
  return trimmed || undefined;
}

async function collectCustomerIds(
  stripe: Stripe,
  user: AuthUser,
): Promise<string[]> {
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
  return [...customerIds];
}

async function listSubscriptionsForCustomers(
  stripe: Stripe,
  customerIds: string[],
) {
  const all: Stripe.Subscription[] = [];
  for (const customerId of customerIds) {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 30,
      expand: ["data.items.data.price"],
    });
    all.push(...subs.data);
  }
  return all;
}

async function resolveDeleteGate(opts: {
  stripe: Stripe | null;
  user: AuthUser;
  access: { access_status?: string | null; subscription_ends_at?: string | null } | null;
}): Promise<DeleteGate> {
  const { stripe, user, access } = opts;
  if (!stripe) {
    if (paidAccessLooksLive(access)) return gateFromUnverifiedAccess();
    return evaluateDeleteGate([]);
  }

  try {
    const customerIds = await collectCustomerIds(stripe, user);
    if (customerIds.length === 0) {
      if (paidAccessLooksLive(access)) return gateFromUnverifiedAccess();
      return evaluateDeleteGate([]);
    }
    const subs = await listSubscriptionsForCustomers(stripe, customerIds);
    return evaluateDeleteGate(subs);
  } catch (err) {
    if (err instanceof DeleteAccountBlockedError) throw err;
    console.error("[delete-account] stripe inspect failed:", err);
    return gateFromUnverifiedAccess();
  }
}

async function cancelListedSubscriptions(stripe: Stripe, ids: string[]) {
  for (const id of ids) {
    try {
      await stripe.subscriptions.cancel(id, { prorate: false });
    } catch (err) {
      console.error("[delete-account] stripe cancel failed", id, err);
      throw new DeleteAccountBlockedError(DELETE_BLOCK.cancelFailed, "cancel_failed", 409);
    }
  }
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...cors,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      throw new Error("Méthode non autorisée");
    }

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
    const notifyEmail = user.email?.trim();
    const notifyFirstName = firstNameFromUser(user);
    const { data: { user: adminUser } } = await admin.auth.admin.getUserById(uid);
    const sourceUser = (adminUser ?? user) as AuthUser;

    const { data: access } = await admin
      .from("user_access_state")
      .select("access_status, subscription_ends_at")
      .eq("user_id", uid)
      .maybeSingle();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey
      ? new Stripe(stripeKey, { apiVersion: "2024-04-10" })
      : null;

    const gate = await resolveDeleteGate({
      stripe,
      user: sourceUser,
      access,
    });

    if (req.method === "GET") {
      return new Response(JSON.stringify(gate), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throwIfBlocked(gate);

    if (gate.cancelIds.length > 0) {
      if (!stripe) {
        throw new DeleteAccountBlockedError(DELETE_BLOCK.cancelFailed, "cancel_failed", 409);
      }
      await cancelListedSubscriptions(stripe, gate.cancelIds);
    }

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

    if (notifyEmail?.includes("@")) {
      try {
        const result = await sendEmailViaHttp("account_deleted", {
          to: notifyEmail,
          firstName: notifyFirstName,
          userId: uid,
        });
        if (!result.ok) {
          console.error("[delete-account] email failed:", result.error);
        } else {
          console.log("[delete-account] email sent:", result.id);
        }
      } catch (emailErr) {
        console.error("[delete-account] email unexpected:", emailErr);
      }
    } else {
      console.warn("[delete-account] skip email: no address");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const blocked = err instanceof DeleteAccountBlockedError;
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const status = blocked ? err.httpStatus : 400;
    return new Response(JSON.stringify({
      error: message,
      code: blocked ? err.code : "error",
    }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
