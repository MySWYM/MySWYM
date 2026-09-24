import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getAccessState, type AuthUser } from "../_shared/access-state.ts";
import {
  assertUsableAppleTransaction,
  decodeAppleTransactionJws,
  findUserIdByOriginalTx,
  isPremiumFromState,
  isStripeLiveAppleConflict,
  persistAppleTransaction,
  STRIPE_LIVE_APPLE_CODE,
  STRIPE_LIVE_APPLE_MESSAGE,
} from "../_shared/apple-iap.ts";

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

    const body = await req.json().catch(() => ({}));
    const jws = String((body as { jws?: string }).jws || "");
    if (!jws) throw new Error("Transaction Apple manquante");

    const payload = await decodeAppleTransactionJws(jws);
    const tx = assertUsableAppleTransaction(payload);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const linkedUserId = await findUserIdByOriginalTx(supabaseAdmin, tx.originalTransactionId!);
    if (linkedUserId && linkedUserId !== user.id) {
      return new Response(JSON.stringify({
        error: "Cet achat Apple est déjà lié à un autre compte MySWYM.",
      }), {
        status: 409,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const sourceUser = (adminUser ?? user) as AuthUser;
    const current = await getAccessState(supabaseAdmin, user.id);
    const persisted = await persistAppleTransaction({
      supabaseAdmin,
      user: sourceUser,
      current,
      tx,
    });

    return new Response(JSON.stringify({
      isPremium: isPremiumFromState(persisted),
      subscription_status: persisted.access_status,
      subscription_end: persisted.subscription_ends_at,
      billing_provider: persisted.billing_provider,
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isStripeLiveAppleConflict(err)) {
      console.warn("[apple-iap-sync] skip apple persist, stripe entitlement live");
      return new Response(JSON.stringify({
        error: STRIPE_LIVE_APPLE_MESSAGE,
        code: STRIPE_LIVE_APPLE_CODE,
        alreadySubscribed: true,
        billingProvider: "stripe",
      }), {
        status: 409,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    console.error("[apple-iap-sync]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
