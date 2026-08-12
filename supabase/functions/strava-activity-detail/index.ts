import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getStravaAccessToken,
  stripHeartRateFromStreams,
  userHasHealthConsent,
} from "../_shared/strava-auth.ts";

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

function stripHeartRateFromDetail(
  detail: Record<string, unknown>,
  storeHeartRate: boolean,
) {
  if (storeHeartRate || !detail) return detail;
  const next = { ...detail };
  delete next.average_heartrate;
  delete next.max_heartrate;
  delete next.has_heartrate;
  return next;
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

    const body = await req.json().catch(() => ({}));
    const activityId = Number(body?.activityId);
    if (!activityId) throw new Error("activityId manquant");

    const { data: activityRow, error: activityRowError } = await supabase
      .from("strava_activities")
      .select("strava_activity_id")
      .eq("user_id", user.id)
      .eq("strava_activity_id", activityId)
      .maybeSingle();
    if (activityRowError || !activityRow) throw new Error("Activité introuvable");

    const accessToken = await getStravaAccessToken(supabaseAdmin, user.id);
    const storeHeartRate = await userHasHealthConsent(supabaseAdmin, user);

    const detailRes = await fetch(
      `${STRAVA_ACTIVITY_URL}/${activityId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!detailRes.ok) throw new Error("Impossible de récupérer le détail Strava");
    const detailRaw = await detailRes.json();
    const detail = stripHeartRateFromDetail(detailRaw, storeHeartRate);

    const streamKeys = storeHeartRate
      ? ["time", "distance", "heartrate", "velocity_smooth", "cadence"]
      : ["time", "distance", "velocity_smooth", "cadence"];
    const streamsRes = await fetch(
      `${STRAVA_ACTIVITY_URL}/${activityId}/streams?keys=${encodeURIComponent(streamKeys.join(","))}&key_by_type=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    let streams: Record<string, unknown> = {};
    if (streamsRes.ok) {
      streams = stripHeartRateFromStreams(await streamsRes.json(), storeHeartRate);
    }

    return new Response(
      JSON.stringify({ ok: true, detail, streams }),
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
