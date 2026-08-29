import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

/** Refresh en cours par user, évite la rotation concurrente du refresh_token Strava. */
const refreshInflight = new Map<string, Promise<string>>();

export async function userHasHealthConsent(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: { id: string; user_metadata?: Record<string, unknown> },
): Promise<boolean> {
  if (user.user_metadata?.health_consent === true) return true;
  const { data } = await supabaseAdmin
    .from("sport_profiles")
    .select("extra, health_consent")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.health_consent === true) return true;
  const extra = data?.extra;
  if (extra && typeof extra === "object" && (extra as { healthConsent?: boolean }).healthConsent === true) {
    return true;
  }
  return false;
}

export async function refreshStravaToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  refreshToken: string,
): Promise<string> {
  const existing = refreshInflight.get(userId);
  if (existing) return existing;

  const job = (async () => {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("STRAVA_CLIENT_ID")!,
        client_secret: Deno.env.get("STRAVA_CLIENT_SECRET")!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        res.status === 401 || res.status === 400
          ? "Session Strava expirée, reconnecte Strava depuis ton profil."
          : `Impossible de rafraîchir le token Strava${detail ? `: ${detail.slice(0, 120)}` : ""}`,
      );
    }

    const data = await res.json();
    const { error: upsertError } = await supabaseAdmin.from("strava_tokens").upsert({
      user_id: userId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;
    return data.access_token as string;
  })();

  refreshInflight.set(userId, job);
  try {
    return await job;
  } finally {
    refreshInflight.delete(userId);
  }
}

export async function getStravaAccessToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (tokenError || !tokenRow) throw new Error("Compte Strava non connecté");

  const nowSec = Math.floor(Date.now() / 1000);
  if (tokenRow.expires_at <= nowSec + 60) {
    return refreshStravaToken(supabaseAdmin, userId, tokenRow.refresh_token);
  }
  return tokenRow.access_token;
}

/** Retire les streams FC si pas de consentement santé. */
export function stripHeartRateFromStreams(
  streams: Record<string, unknown>,
  storeHeartRate: boolean,
): Record<string, unknown> {
  if (storeHeartRate || !streams || typeof streams !== "object") return streams;
  const next = { ...streams };
  delete next.heartrate;
  return next;
}
