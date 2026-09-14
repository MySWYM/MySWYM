/**
 * Envoie le mail de bienvenue une seule fois par compte.
 * Appelé depuis le client après SIGNED_IN / INITIAL_SESSION (JWT requis).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailViaHttp } from "../_shared/email-http.ts";
import { sendResendEvent } from "../_shared/resend-events.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Démarre l’automation Resend nurture (J+3 si pas d’abo)
    try {
      await sendResendEvent("user.signed_up", source.email!, {
        firstName: firstName || "Salut",
        userId: source.id,
      });
    } catch (evErr) {
      console.error("[welcome-email] resend event error:", evErr);
    }

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
