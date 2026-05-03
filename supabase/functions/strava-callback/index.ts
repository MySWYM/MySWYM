import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

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

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
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

    // ── Exchange OAuth code for tokens ────────────────────────────────────
    const { code } = await req.json();
    if (!code) throw new Error("Code OAuth manquant");

    const clientId     = Deno.env.get("STRAVA_CLIENT_ID");
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Config Strava manquante (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET)");

    const tokenRes = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Strava token error: ${err}`);
    }

    const tokenData = await tokenRes.json();

    // ── Store tokens (upsert) ─────────────────────────────────────────────
    const { error: upsertError } = await supabaseAdmin
      .from("strava_tokens")
      .upsert({
        user_id:       user.id,
        athlete_id:    tokenData.athlete?.id,
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at:    tokenData.expires_at,
        scope:         tokenData.scope ?? null,
        athlete_data:  tokenData.athlete ?? null,
        updated_at:    new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    // ── Trigger initial sync (fire-and-forget) ────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    fetch(`${supabaseUrl}/functions/v1/strava-sync`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type":  "application/json",
        "apikey":        Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ per_page: 50 }),
    }).catch(() => { /* best-effort */ });

    return new Response(
      JSON.stringify({ ok: true, athlete: tokenData.athlete?.firstname ?? null }),
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
