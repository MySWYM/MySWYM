/**
 * POST /api/email/send
 * Body: { kind, payload }
 * Header: x-myswym-email-secret = INTERNAL_EMAIL_SECRET
 *
 * Server-only — used by Edge Functions / internal tools. Not for the Vite client.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendEmail } from "../src/lib/email";
import type { EmailKind, EmailPayloadByKind } from "../src/lib/email-types";

const KINDS: EmailKind[] = [
  "welcome",
  "verification",
  "reset_password",
  "subscription_confirmation",
  "workout_reminder",
  "newsletter",
  "contact",
];

function isEmailKind(value: unknown): value is EmailKind {
  return typeof value === "string" && (KINDS as string[]).includes(value);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = process.env.INTERNAL_EMAIL_SECRET;
  if (!secret) {
    console.error("[api/email/send] INTERNAL_EMAIL_SECRET is not configured");
    return res.status(500).json({ ok: false, error: "Email API not configured" });
  }

  const provided = req.headers["x-myswym-email-secret"];
  if (typeof provided !== "string" || provided !== secret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const body = req.body as { kind?: unknown; payload?: unknown } | undefined;
  if (!body || !isEmailKind(body.kind) || !body.payload || typeof body.payload !== "object") {
    return res.status(400).json({
      ok: false,
      error: "Expected JSON { kind, payload }",
      kinds: KINDS,
    });
  }

  const to = (body.payload as { to?: unknown }).to;
  // `contact` targets the inbox server-side — no payload.to required
  if (
    body.kind !== "contact" &&
    (typeof to !== "string" || !to.includes("@"))
  ) {
    return res.status(400).json({ ok: false, error: "payload.to must be an email" });
  }

  try {
    const result = await sendEmail(
      body.kind,
      body.payload as EmailPayloadByKind[typeof body.kind],
    );
    if (!result.ok) {
      return res.status(502).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/email/send] unexpected:", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
