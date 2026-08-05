/**
 * Events marketing côté client (JWT requis).
 * Body: { event: "session.completed", sessionTitle?: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendResendEvent } from "../_shared/resend-events.ts";

const ALLOWED = new Set(["session.completed"]);

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function corsHeaders(reqOrigin: string | null) {
  const origin =
    reqOrigin &&
    (ALLOWED_ORIGINS.includes(reqOrigin) ||
      reqOrigin.endsWith(".vercel.app") ||
      reqOrigin.endsWith(".myswym.app"))
      ? reqOrigin
      : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error } = await supabaseUser.auth.getUser();
    if (error || !user?.email) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      event?: string;
      sessionTitle?: string;
    };
    if (!body.event || !ALLOWED.has(body.event)) {
      return new Response(JSON.stringify({ error: "event invalide" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const meta = user.user_metadata ?? {};
    const firstName =
      (typeof meta.first_name === "string" && meta.first_name) ||
      (typeof meta.firstName === "string" && meta.firstName) ||
      "Salut";

    const result = await sendResendEvent(
      body.event as "session.completed",
      user.email,
      {
        firstName,
        userId: user.id,
        sessionTitle: typeof body.sessionTitle === "string" ? body.sessionTitle : "",
      },
    );

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
