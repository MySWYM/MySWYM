/**
 * Admin: relance email des comptes sans accès Premium en cours.
 * Auth: header x-myswym-email-secret === INTERNAL_EMAIL_SECRET
 * Body: { dry_run?: boolean, limit?: number }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ACCESS_STATUS,
  type AccessStateRow,
  type AccessStatus,
  hasEntitlement,
  isoFromUnixSeconds,
} from "../_shared/access-state.ts";
import { sendEmailViaHttp } from "../_shared/email-http.ts";

type ListedUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function firstNameFromUser(user: ListedUser): string | undefined {
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1) || "*";
  return `${head}***@${domain}`;
}

function accessFromAppMetadata(
  userId: string,
  meta: Record<string, unknown>,
): Pick<AccessStateRow, "access_status" | "trial_ends_at" | "subscription_ends_at"> {
  const statusRaw = meta.subscription_status;
  const status =
    statusRaw === ACCESS_STATUS.trial ||
      statusRaw === ACCESS_STATUS.active ||
      statusRaw === ACCESS_STATUS.canceled ||
      statusRaw === ACCESS_STATUS.expired
      ? (statusRaw as AccessStatus)
      : meta.subscription === "premium"
      ? ACCESS_STATUS.active
      : ACCESS_STATUS.expired;

  const trialEnds =
    typeof meta.trial_ends_at === "string" ? meta.trial_ends_at : null;
  const subEndUnix =
    typeof meta.subscription_end === "number"
      ? meta.subscription_end
      : typeof meta.subscription_end === "string" && /^\d+$/.test(meta.subscription_end)
      ? Number(meta.subscription_end)
      : null;

  return {
    access_status: status,
    trial_ends_at: trialEnds,
    subscription_ends_at: isoFromUnixSeconds(subEndUnix),
  };
}

function userIsEntitled(
  user: ListedUser,
  accessRow: AccessStateRow | null | undefined,
): boolean {
  if (accessRow) return hasEntitlement(accessRow);
  return hasEntitlement(accessFromAppMetadata(user.id, user.app_metadata ?? {}));
}

async function listAllUsers(
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<ListedUser[]> {
  const users: ListedUser[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const batch = (data?.users ?? []) as ListedUser[];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 50) break; // safety
  }
  return users;
}

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
  if (!secret) {
    console.error("[reactivate-nonpayers] INTERNAL_EMAIL_SECRET missing");
    return new Response(JSON.stringify({ ok: false, error: "Not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const provided = req.headers.get("x-myswym-email-secret");
  if (provided !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let dryRun = true;
  let limit = 20;
  try {
    const body = await req.json().catch(() => ({})) as {
      dry_run?: unknown;
      limit?: unknown;
    };
    if (typeof body.dry_run === "boolean") dryRun = body.dry_run;
    if (typeof body.limit === "number" && Number.isFinite(body.limit) && body.limit > 0) {
      limit = Math.min(Math.floor(body.limit), 100);
    }
  } catch {
    // defaults
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const allUsers = await listAllUsers(supabaseAdmin);
    const withEmail = allUsers.filter((u) => typeof u.email === "string" && u.email.includes("@"));

    const ids = withEmail.map((u) => u.id);
    const accessByUser = new Map<string, AccessStateRow>();
    // batch fetch access rows (chunk of 100)
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { data, error } = await supabaseAdmin
        .from("user_access_state")
        .select("*")
        .in("user_id", chunk);
      if (error) {
        console.error("[reactivate-nonpayers] access fetch error:", error.message);
      } else {
        for (const row of (data ?? []) as AccessStateRow[]) {
          accessByUser.set(row.user_id, row);
        }
      }
    }

    const candidates = withEmail.filter((u) => {
      if (u.app_metadata?.reactivation_email_sent === true) return false;
      return !userIsEntitled(u, accessByUser.get(u.id));
    });

    const batch = candidates.slice(0, limit);

    console.log(
      JSON.stringify({
        event: "reactivate-nonpayers.scan",
        dry_run: dryRun,
        total_users: allUsers.length,
        with_email: withEmail.length,
        candidates: candidates.length,
        batch: batch.length,
        limit,
      }),
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          ok: true,
          dry_run: true,
          total_users: allUsers.length,
          with_email: withEmail.length,
          candidates: candidates.length,
          limit,
          sample: batch.map((u) => ({
            id: u.id,
            email: maskEmail(u.email!),
            subscription: u.app_metadata?.subscription ?? null,
            subscription_status: u.app_metadata?.subscription_status ?? null,
          })),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const sent: { id: string; email: string; resendId: string }[] = [];
    const failed: { id: string; email: string; error: string }[] = [];

    for (const user of batch) {
      const email = user.email!;
      const firstName = firstNameFromUser(user);
      const result = await sendEmailViaHttp("reactivation", {
        to: email,
        firstName,
        ctaUrl: "https://myswym.app/app",
        userId: user.id,
      });

      if (!result.ok) {
        console.error("[reactivate-nonpayers] send failed:", user.id.slice(0, 8), result.error);
        failed.push({ id: user.id, email: maskEmail(email), error: result.error });
        continue;
      }

      const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...(user.app_metadata ?? {}),
          reactivation_email_sent: true,
        },
      });
      if (metaErr) {
        console.error("[reactivate-nonpayers] metadata update failed:", user.id.slice(0, 8), metaErr.message);
        // mail already sent, still count as sent to avoid re-send storms
      }

      sent.push({ id: user.id, email: maskEmail(email), resendId: result.id });
      console.log("[reactivate-nonpayers] sent:", result.id, "→", user.id.slice(0, 8));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: false,
        candidates: candidates.length,
        limit,
        sent: sent.length,
        failed: failed.length,
        results: { sent, failed },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reactivate-nonpayers] unexpected:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
