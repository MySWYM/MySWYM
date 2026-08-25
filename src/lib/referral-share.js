/**
 * Charge / cache le lien + code parrainage Premium (ensure-referral-code).
 */
import { supabase } from "../supabase.js";

let cache = null; // { code, shareUrl } | null
let inflight = null;

export function clearReferralInviteCache() {
  cache = null;
  inflight = null;
}

/**
 * @returns {Promise<{ code: string, shareUrl: string } | null>}
 */
export async function fetchReferralInvite() {
  if (cache?.code && cache?.shareUrl) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const session = refreshData?.session;
      if (!session) return null;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure-referral-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.code || !json.shareUrl) return null;
      cache = { code: String(json.code).toUpperCase(), shareUrl: String(json.shareUrl) };
      return cache;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
