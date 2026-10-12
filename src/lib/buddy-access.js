import { supabase } from "../supabase.js";
import { getAccessState } from "./access.js";

export const BUDDIES_PAID_ONLY_MSG = "Binômes est réservé aux abonnés.";
export const PREMIUM_REQUIRED_CODE = "premium_required";

export function isPremiumRequiredError(error) {
  const blob = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`;
  return blob.includes(PREMIUM_REQUIRED_CODE);
}

export async function requirePaidBuddies() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { ok: false, user: null, error: { message: error.message || BUDDIES_PAID_ONLY_MSG } };
    const user = data?.user ?? null;
    if (!getAccessState(user).canUseBuddies) {
      return { ok: false, user, error: { message: BUDDIES_PAID_ONLY_MSG } };
    }
    return { ok: true, user, error: null };
  } catch (err) {
    return { ok: false, user: null, error: { message: err?.message || BUDDIES_PAID_ONLY_MSG } };
  }
}
