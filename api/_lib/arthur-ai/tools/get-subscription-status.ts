/**
 * get_subscription_status — lecture user_access_state (+ fallback metadata si besoin).
 * Ne touche pas Stripe.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";

export async function getSubscriptionStatus(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<Record<string, unknown>> {
  if (!userId || !isUuid(userId)) {
    return { status: "anonymous", has_premium_access: false };
  }

  try {
    const { data, error } = await admin
      .from("user_access_state")
      .select(
        "access_status, trial_ends_at, trial_used, subscription_ends_at, cancel_at_period_end, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      arthurLog("warn", "get_subscription_status_error", { code: error.code });
      return { status: "unknown", has_premium_access: false };
    }

    if (!data) {
      return {
        status: "free",
        has_premium_access: false,
        trial_used: false,
      };
    }

    const status = data.access_status || "expired";
    const now = Date.now();
    const trialEnds = data.trial_ends_at ? Date.parse(data.trial_ends_at) : NaN;
    const subEnds = data.subscription_ends_at
      ? Date.parse(data.subscription_ends_at)
      : NaN;

    let hasPremium = false;
    if (status === "active") hasPremium = true;
    else if (status === "trial") hasPremium = Number.isFinite(trialEnds) && trialEnds > now;
    else if (status === "canceled") {
      hasPremium = !Number.isFinite(subEnds) || subEnds > now;
    }

    return {
      status,
      has_premium_access: hasPremium,
      trial_ends_at: data.trial_ends_at,
      trial_used: data.trial_used === true,
      subscription_ends_at: data.subscription_ends_at,
      cancel_at_period_end: data.cancel_at_period_end === true,
      updated_at: data.updated_at,
    };
  } catch (err) {
    arthurLog("warn", "get_subscription_status_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { status: "unknown", has_premium_access: false };
  }
}
