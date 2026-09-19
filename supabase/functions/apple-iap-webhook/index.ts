import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAccessState, isLiveStripeEntitlement, type AuthUser } from "../_shared/access-state.ts";
import {
  assertUsableAppleTransaction,
  cancelAtPeriodEndFromNotification,
  decodeAppleTransactionJws,
  findUserIdByOriginalTx,
  persistAppleTransaction,
} from "../_shared/apple-iap.ts";
import { decodeJwsPayload } from "../_shared/apple-jws.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const signedPayload = String(body?.signedPayload || "");
    if (!signedPayload) throw new Error("signedPayload manquant");

    const notification = await decodeAppleTransactionJws(signedPayload);
    const notificationType = String(notification.notificationType || "");
    const data = (notification.data && typeof notification.data === "object")
      ? notification.data as Record<string, unknown>
      : {};
    const signedTransactionInfo = String(data.signedTransactionInfo || "");
    if (!signedTransactionInfo) throw new Error("signedTransactionInfo manquant");

    const txPayload = await decodeAppleTransactionJws(signedTransactionInfo);
    const tx = assertUsableAppleTransaction(txPayload);

    let renewalInfo: Record<string, unknown> | null = null;
    const signedRenewalInfo = String(data.signedRenewalInfo || "");
    if (signedRenewalInfo) {
      try {
        renewalInfo = decodeJwsPayload(signedRenewalInfo);
      } catch {
        renewalInfo = null;
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userId = await findUserIdByOriginalTx(supabaseAdmin, tx.originalTransactionId!);
    if (!userId) {
      console.warn("[apple-iap-webhook] transaction non liée", tx.originalTransactionId);
      return new Response(JSON.stringify({ received: true, linked: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!user) throw new Error("Utilisateur introuvable");
    const current = await getAccessState(supabaseAdmin, userId);
    if (isLiveStripeEntitlement(current)) {
      console.warn("[apple-iap-webhook] skip apple persist, stripe entitlement live", userId);
      return new Response(JSON.stringify({ received: true, linked: true, skipped: "stripe_live" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    await persistAppleTransaction({
      supabaseAdmin,
      user: user as AuthUser,
      current,
      tx,
      cancelAtPeriodEnd: cancelAtPeriodEndFromNotification(notificationType, renewalInfo),
    });

    return new Response(JSON.stringify({ received: true, linked: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[apple-iap-webhook]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
