import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITY_URL = "https://www.strava.com/api/v3/activities";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
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
    reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

async function refreshStravaToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  refreshToken: string
): Promise<string> {
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

  if (!res.ok) throw new Error("Impossible de rafraichir le token Strava");

  const data = await res.json();

  await supabaseAdmin.from("strava_tokens").upsert({
    user_id: userId,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return data.access_token;
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifie");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const body = await req.json().catch(() => ({}));
    const activityId = Number(body?.activityId);
    if (!activityId) throw new Error("activityId manquant");

    const { data: activityRow, error: activityRowError } = await supabase
      .from("strava_activities")
      .select("strava_activity_id")
      .eq("user_id", user.id)
      .eq("strava_activity_id", activityId)
      .maybeSingle();
    if (activityRowError || !activityRow) throw new Error("Activite introuvable");

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("strava_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (tokenError || !tokenRow) throw new Error("Compte Strava non connecte");

    const nowSec = Math.floor(Date.now() / 1000);
    let accessToken: string = tokenRow.access_token;
    if (tokenRow.expires_at <= nowSec + 60) {
      accessToken = await refreshStravaToken(supabaseAdmin, user.id, tokenRow.refresh_token);
    }

    const detailRes = await fetch(
      `${STRAVA_ACTIVITY_URL}/${activityId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!detailRes.ok) throw new Error("Impossible de recuperer le detail Strava");
    const detail = await detailRes.json();

    const streamKeys = ["time", "distance", "heartrate", "velocity_smooth", "cadence"];
    const streamsRes = await fetch(
      `${STRAVA_ACTIVITY_URL}/${activityId}/streams?keys=${encodeURIComponent(streamKeys.join(","))}&key_by_type=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    let streams: Record<string, unknown> = {};
    if (streamsRes.ok) {
      streams = await streamsRes.json();
    }

    return new Response(
      JSON.stringify({ ok: true, detail, streams }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
