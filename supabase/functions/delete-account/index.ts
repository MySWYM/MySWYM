import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
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
    reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "https://myswym.app";
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
    if (req.method !== "POST") throw new Error("Méthode non autorisée");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const uid = user.id;

    // Best-effort purge données applicatives
    await admin.from("strava_tokens").delete().eq("user_id", uid);
    await admin.from("strava_activities").delete().eq("user_id", uid);
    await admin.from("user_plans").delete().eq("user_id", uid);

    // Avatars Storage : dossier uid/
    try {
      const { data: files } = await admin.storage.from("avatars").list(uid);
      if (files?.length) {
        await admin.storage.from("avatars").remove(files.map((f) => `${uid}/${f.name}`));
      }
    } catch {
      // ignore storage errors
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw new Error(delErr.message || "Impossible de supprimer le compte");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
