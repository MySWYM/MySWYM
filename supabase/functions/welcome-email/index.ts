/**
 * Envoie le mail de bienvenue une seule fois par compte.
 * Appelé depuis le client après SIGNED_IN / INITIAL_SESSION (JWT requis).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailViaHttp } from "../_shared/email-http.ts";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some((o) => origin === o)
    || origin.endsWith(".vercel.app")
    || origin.endsWith(".myswym.app");
}

function corsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function firstNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string | undefined {
  const meta = user.user_metadata ?? {};
  const raw =
    (typeof meta.first_name === "string" && meta.first_name) ||
    (typeof meta.firstName === "string" && meta.firstName) ||
    (typeof meta.full_name === "string" && meta.full_name.split(/\s+/)[0]) ||
    (typeof meta.name === "string" && meta.name.split(/\s+/)[0]) ||
    (user.email ? user.email.split("@")[0] : undefined);
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

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

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user: fresh } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const source = fresh ?? user;

    if (source.app_metadata?.welcome_email_sent === true) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const firstName = firstNameFromUser(source);
    const result = await sendEmailViaHttp("welcome", {
      to: source.email,
      firstName,
      userId: source.id,
    });

    if (!result.ok) {
      console.error("[welcome-email] send failed:", result.error);
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.auth.admin.updateUserById(source.id, {
      app_metadata: {
        ...(source.app_metadata ?? {}),
        welcome_email_sent: true,
      },
    });

    console.log("[welcome-email] sent:", result.id, "→", source.id.slice(0, 8));
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[welcome-email] unexpected:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
