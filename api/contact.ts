/**
 * POST /api/contact — public contact form (no secret header).
 * Sends to contact@ via Resend; reply-to = visitor email.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendContactEmail } from "../_lib/email";

const MAX_NAME = 120;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  // Honeypot — bots fill hidden fields; pretend success.
  const honey = asString(body.company || body.website).trim();
  if (honey) {
    return res.status(200).json({ ok: true, id: "ignored" });
  }

  const name = asString(body.name).trim();
  const email = asString(body.email).trim();
  const subject = asString(body.subject).trim();
  const message = asString(body.message).trim();

  if (!name || name.length > MAX_NAME) {
    return res.status(400).json({ ok: false, error: "Nom invalide" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Email invalide" });
  }
  if (!subject || subject.length > MAX_SUBJECT) {
    return res.status(400).json({ ok: false, error: "Objet invalide" });
  }
  if (!message || message.length > MAX_MESSAGE) {
    return res.status(400).json({ ok: false, error: "Message invalide" });
  }

  try {
    const result = await sendContactEmail({ name, email, subject, message });
    if (!result.ok) {
      console.error("[api/contact] send failed:", result.error);
      return res.status(502).json({
        ok: false,
        error: "Envoi impossible pour le moment. Réessaie ou écris à contact@myswym.app.",
      });
    }
    return res.status(200).json({ ok: true, id: result.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/contact] unexpected:", msg);
    return res.status(500).json({
      ok: false,
      error: "Erreur serveur. Réessaie plus tard ou contact@myswym.app.",
    });
  }
}
