/**
 * create_checkout — appelle l’Edge Function existante (pas de secret Stripe ici).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { toolFail, toolOk } from "./result.js";

const PRICE_MONTHLY =
  process.env.STRIPE_PRICE_MONTHLY || "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
const PRICE_ANNUAL =
  process.env.STRIPE_PRICE_ANNUAL || "price_1TudyVAS4mfgF2TwHiSo3Vrg";

export async function createCheckout(
  admin: SupabaseClient,
  ctx: {
    userId: string | null;
    conversationId?: string | null;
    /** JWT utilisateur — requis pour l’Edge Function create-checkout */
    accessToken?: string | null;
  },
  args: { plan?: "monthly" | "annual"; price_id?: string } = {},
) {
  const userId = ctx.userId;
  if (!userId || !isUuid(userId)) {
    return toolFail("unauthenticated", { requires_auth: true });
  }

  if (!ctx.accessToken) {
    return toolFail("missing_user_token", {
      message: "Session utilisateur requise pour démarrer le paiement.",
    });
  }

  // Ne jamais lire de secret Stripe ici — uniquement JWT user → Edge Function.
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !anonKey) {
    arthurLog("error", "checkout_missing_supabase_env", {});
    return toolFail("config_error");
  }

  const priceId =
    args.price_id ||
    (args.plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY);

  const appUrl = (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.accessToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        priceId,
        origin: appUrl,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      alreadySubscribed?: boolean;
    };

    if (json.url) {
      await trackAiEvent(admin, {
        conversationId: ctx.conversationId,
        userId,
        eventType: "checkout_started",
        metadata: { price_id: priceId, reused: false },
      });
      return toolOk({
        checkout_url: json.url,
        price_id: priceId,
      });
    }

    if (json.alreadySubscribed) {
      return toolFail("already_subscribed", {
        message: json.error || "Abonnement déjà actif",
      });
    }

    arthurLog("warn", "checkout_edge_failed", {
      status: res.status,
      // pas de body sensible
    });
    return toolFail("checkout_failed", {
      message: json.error || "Impossible de créer la session de paiement",
    });
  } catch (err) {
    arthurLog("error", "checkout_fetch_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return toolFail("checkout_failed");
  }
}
