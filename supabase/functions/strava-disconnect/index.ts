import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const STRAVA_DEAUTH_URL = "https://www.strava.com/oauth/deauthorize";

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

    // Load token to revoke it on Strava's side
    const { data: tokenRow } = await supabaseAdmin
      .from("strava_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (tokenRow?.access_token) {
      // Best-effort revocation, don't fail if Strava is unreachable
      await fetch(STRAVA_DEAUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: tokenRow.access_token }),
      }).catch(() => { /* best-effort */ });
    }

    // Remove token + all synced activities
    await supabaseAdmin.from("strava_tokens").delete().eq("user_id", user.id);
    await supabaseAdmin.from("strava_activities").delete().eq("user_id", user.id);

    return new Response(
      JSON.stringify({ ok: true }),
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
