import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getStravaAccessToken,
  userHasHealthConsent,
} from "../_shared/strava-auth.ts";

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

function computePace(activity: Record<string, unknown>): number | null {
  if (!SWIM_TYPES.has(activity.type as string)) return null;
  const dist = Number(activity.distance);
  const time = Number(activity.moving_time);
  if (!dist || !time) return null;
  return Math.round((time / dist) * 100);
}

function mapActivity(a: Record<string, unknown>, userId: string, storeHeartRate: boolean) {
  const raw = { ...a };
  if (!storeHeartRate) {
    delete raw.average_heartrate;
    delete raw.max_heartrate;
    delete raw.heartrate_opt_out;
  }
  return {
    user_id: userId,
    strava_activity_id: Number(a.id),
    activity_type: (a.type as string) ?? null,
    title: (a.name as string) ?? null,
    distance: Number(a.distance) || null,
    duration: Number(a.moving_time) || null,
    pace: computePace(a),
    calories: Number(a.calories) || null,
    heart_rate: storeHeartRate ? (Number(a.average_heartrate) || null) : null,
    activity_date: (a.start_date as string)?.slice(0, 10) ?? null,
    raw_data: raw,
  };
}

async function fetchActivitiesPage(accessToken: string, perPage: number, page: number) {
  const actRes = await fetch(
    `${STRAVA_ACTIVITIES_URL}?per_page=${perPage}&page=${page}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!actRes.ok) {
    if (actRes.status === 401) {
      throw new Error("Session Strava expirée — reconnecte Strava depuis ton profil.");
    }
    throw new Error("Erreur API Strava lors de la récupération des activités");
  }
  return actRes.json() as Promise<Record<string, unknown>[]>;
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
      { global: { headers: { Authorization: authHeader } } },
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const accessToken = await getStravaAccessToken(supabaseAdmin, user.id);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const perPage = Math.min(Number(body.per_page) || 30, 100);
    const maxPages = body.sync_all === true ? 5 : 1;
    let totalSynced = 0;

    const storeHeartRate = await userHasHealthConsent(supabaseAdmin, user);

    for (let page = 1; page <= maxPages; page += 1) {
      const activities = await fetchActivitiesPage(accessToken, perPage, page);
      if (!activities.length) break;

      const rows = activities.map((a) => mapActivity(a, user.id, storeHeartRate));
      const { error: upsertError } = await supabaseAdmin
        .from("strava_activities")
        .upsert(rows, { onConflict: "user_id,strava_activity_id" });
      if (upsertError) throw upsertError;

      totalSynced += rows.length;
      if (activities.length < perPage) break;
    }

    return new Response(
      JSON.stringify({ ok: true, synced: totalSynced }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
