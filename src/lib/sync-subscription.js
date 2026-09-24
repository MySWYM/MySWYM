import { supabase } from "../supabase.js";

/** Relit Stripe via Edge Function, puis rafraîchit le JWT (app_metadata). */
export async function syncSubscriptionFromStripe() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session;
  if (!session) return null;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Synchronisation échouée");
  const { data } = await supabase.auth.refreshSession();
  return data?.user ?? null;
}
