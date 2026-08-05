/**
 * Cron / admin: filet trial J-1 (si l’automation delay a loupé).
 * Auth: x-myswym-email-secret
 * Body: { dry_run, limit }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ACCESS_STATUS, hasEntitlement, type AccessStateRow } from "../_shared/access-state.ts";
import { sendResendEvent } from "../_shared/resend-events.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-myswym-email-secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("INTERNAL_EMAIL_SECRET");
  if (!secret || req.headers.get("x-myswym-email-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let dryRun = true;
  let limit = 50;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      dry_run?: unknown;
      limit?: unknown;
    };
    if (typeof body.dry_run === "boolean") dryRun = body.dry_run;
    if (typeof body.limit === "number" && body.limit > 0) {
      limit = Math.min(Math.floor(body.limit), 100);
    }
  } catch {
    /* defaults */
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  const horizon = now + 36 * 60 * 60 * 1000;

  const { data: rows, error } = await supabaseAdmin
    .from("user_access_state")
    .select("*")
    .eq("access_status", ACCESS_STATUS.trial)
    .not("trial_ends_at", "is", null)
    .gte("trial_ends_at", new Date(now).toISOString())
    .lte("trial_ends_at", new Date(horizon).toISOString())
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const candidates = ((rows ?? []) as AccessStateRow[]).filter((r) => {
    if (!hasEntitlement(r)) return false;
    const ends = r.trial_ends_at ? Date.parse(r.trial_ends_at) : NaN;
    // J-1 approx : fin d’essai dans 6h–36h
    return Number.isFinite(ends) && ends > now + 6 * 3600_000 && ends <= horizon;
  });

  const batch = candidates.slice(0, limit);
  const sent: string[] = [];
  const skipped: { userId: string; reason: string }[] = [];

  for (const row of batch) {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
    const user = authData?.user;
    if (!user?.email) {
      skipped.push({ userId: row.user_id, reason: "no_email" });
      continue;
    }
    if (user.app_metadata?.trial_ending_email_sent === true) {
      skipped.push({ userId: row.user_id, reason: "already_sent" });
      continue;
    }

    if (dryRun) {
      sent.push(row.user_id);
      continue;
    }

    const firstName =
      (typeof user.user_metadata?.first_name === "string" && user.user_metadata.first_name) ||
      (typeof user.user_metadata?.firstName === "string" && user.user_metadata.firstName) ||
      "Salut";

    const ev = await sendResendEvent("trial.ending_soon", user.email, {
      firstName,
      userId: user.id,
      trialEndsAt: row.trial_ends_at,
    });

    if (!ev.ok) {
      skipped.push({ userId: user.id, reason: ev.error });
      continue;
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        trial_ending_email_sent: true,
      },
    });
    sent.push(user.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      dry_run: dryRun,
      candidates: candidates.length,
      sent: sent.length,
      skipped,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
