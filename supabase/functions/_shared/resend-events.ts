/**
 * Fire Resend Automation custom events (Edge Functions).
 * Secret: RESEND_API_KEY on Supabase.
 */
export type ResendEventName =
  | "user.signed_up"
  | "subscription.started"
  | "subscription.canceled"
  | "trial.started"
  | "trial.ending_soon"
  | "session.completed"
  | "referral.eligible"
  | "winback.eligible";

/**
 * Consentement newsletter (inscription ou Réglages → Email → Actus).
 * Sans lui : seuls les emails compte, sécurité et paiement partent.
 */
export function hasNewsletterConsent(
  user: { user_metadata?: Record<string, unknown> | null } | null | undefined,
): boolean {
  return user?.user_metadata?.newsletter_opt_in === true;
}

export type ResendEventResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function sendResendEvent(
  event: ResendEventName,
  email: string,
  payload: Record<string, unknown> = {},
): Promise<ResendEventResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[resend-events] RESEND_API_KEY missing");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  if (!email?.includes("@")) {
    return { ok: false, error: "invalid email" };
  }

  try {
    const res = await fetch("https://api.resend.com/events/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        email,
        payload,
      }),
    });

    let data: { id?: string; error?: string; message?: string } = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      const msg = data.error || data.message || `HTTP ${res.status}`;
      console.error("[resend-events] failed:", event, msg);
      return { ok: false, error: msg };
    }

    console.log("[resend-events] sent:", event, "→", email.split("@")[0].slice(0, 2) + "***");
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[resend-events] unexpected:", message);
    return { ok: false, error: message };
  }
}
