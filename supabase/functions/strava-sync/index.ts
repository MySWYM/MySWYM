import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRAVA_TOKEN_URL      = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

const SWIM_TYPES = new Set(["Swim", "OpenWaterSwim"]);

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
      client_id:     Deno.env.get("STRAVA_CLIENT_ID")!,
      client_secret: Deno.env.get("STRAVA_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Impossible de rafraîchir le token Strava");

  const data = await res.json();

  await supabaseAdmin.from("strava_tokens").upsert({
    user_id:       userId,
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    data.expires_at,
    updated_at:    new Date().toISOString(),
  }, { onConflict: "user_id" });

  return data.access_token;
}

// seconds per 100 m for swim activities, null otherwise
function computePace(activity: Record<string, unknown>): number | null {
  if (!SWIM_TYPES.has(activity.type as string)) return null;
  const dist = Number(activity.distance);
  const time = Number(activity.moving_time);
  if (!dist || !time) return null;
  return Math.round((time / dist) * 100);
}

function mapActivity(a: Record<string, unknown>, userId: string) {
  return {
    user_id:            userId,
    strava_activity_id: Number(a.id),
    activity_type:      (a.type as string) ?? null,
    title:              (a.name as string) ?? null,
    distance:           Number(a.distance) || null,
    duration:           Number(a.moving_time) || null,
    pace:               computePace(a),
    calories:           Number(a.calories) || null,
    heart_rate:         Number(a.average_heartrate) || null,
    activity_date:      (a.start_date as string)?.slice(0, 10) ?? null,
    raw_data:           a,
  };
}

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
      { global: { headers: { Authorization: authHeader } } }
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    // ── Load stored token ─────────────────────────────────────────────────
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("strava_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenRow) throw new Error("Compte Strava non connecté");

    // ── Refresh access token if expired ───────────────────────────────────
    const nowSec = Math.floor(Date.now() / 1000);
    let accessToken: string = tokenRow.access_token;
    if (tokenRow.expires_at <= nowSec + 60) {
      accessToken = await refreshStravaToken(supabaseAdmin, user.id, tokenRow.refresh_token);
    }

    // ── Fetch activities from Strava API ──────────────────────────────────
    const body     = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const perPage  = Math.min(Number(body.per_page) || 30, 100);
    const page     = Math.max(Number(body.page) || 1, 1);

    const actRes = await fetch(
      `${STRAVA_ACTIVITIES_URL}?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!actRes.ok) throw new Error("Erreur API Strava lors de la récupération des activités");

    const activities: Record<string, unknown>[] = await actRes.json();

    // ── Upsert into Supabase ──────────────────────────────────────────────
    const rows = activities.map((a) => mapActivity(a, user.id));

    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("strava_activities")
        .upsert(rows, { onConflict: "user_id,strava_activity_id" });

      if (upsertError) throw upsertError;
    }

    return new Response(
      JSON.stringify({ ok: true, synced: rows.length }),
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
