/**
 * Bridge Edge Functions → Vercel email API (same React Email templates).
 * Not wired yet — import from stripe-webhook / Auth hooks when ready.
 *
 * Secrets (Supabase): INTERNAL_EMAIL_SECRET, APP_URL (e.g. https://myswym.app)
 */
export type EmailHttpKind =
  | "welcome"
  | "verification"
  | "reset_password"
  | "subscription_confirmation"
  | "workout_reminder"
  | "newsletter"
  | "contact";


export type EmailHttpResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

export async function sendEmailViaHttp(
  kind: EmailHttpKind,
  payload: Record<string, unknown>,
): Promise<EmailHttpResult> {
  const base =
    Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://myswym.app";
  const secret = Deno.env.get("INTERNAL_EMAIL_SECRET");
  if (!secret) {
    console.error("[email-http] INTERNAL_EMAIL_SECRET missing");
    return { ok: false, error: "INTERNAL_EMAIL_SECRET missing" };
  }

  const res = await fetch(`${base}/api/email/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-myswym-email-secret": secret,
    },
    body: JSON.stringify({ kind, payload }),
  });

  let data: { ok?: boolean; id?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: `Invalid JSON from email API (${res.status})`,
      status: res.status,
    };
  }

  if (!res.ok || !data.ok || !data.id) {
    console.error("[email-http] failed:", res.status, data.error);
    return {
      ok: false,
      error: data.error || `HTTP ${res.status}`,
      status: res.status,
    };
  }

  return { ok: true, id: data.id };
}
