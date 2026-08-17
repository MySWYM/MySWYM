/**
 * POST /api/contact — formulaire contact + avis landing (même fonction Vercel).
 * Hobby = 12 fonctions max : ne pas ajouter api/landing-review.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const MAX_NAME = 120;
const MAX_REVIEW_NAME = 80;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const MAX_REVIEW_BODY = 800;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contactInbox(): string {
  return (
    process.env.EMAIL_CONTACT_TO ||
    process.env.EMAIL_REPLY_TO ||
    "contact@myswym.app"
  );
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
}

function isLandingReview(body: Record<string, unknown>): boolean {
  const kind = asString(body.kind || body.type).trim();
  return kind === "landing-review" || kind === "review";
}

async function handleLandingReview(
  body: Record<string, unknown>,
  res: VercelResponse,
) {
  const name = asString(body.name).trim();
  const text = asString(body.body).trim();
  const email = asString(body.email).trim();
  const rating = Number(body.rating);

  if (!name || name.length > MAX_REVIEW_NAME) {
    return res.status(400).json({ ok: false, error: "Prénom invalide" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, error: "Note invalide" });
  }
  if (!text || text.length > MAX_REVIEW_BODY) {
    return res.status(400).json({ ok: false, error: "Avis invalide" });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Email invalide" });
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await admin.from("landing_reviews").insert({
      author_name: name,
      rating,
      body: text,
      contact_email: email || null,
      status: "pending",
    });
    if (error) {
      console.error("[api/contact] review insert:", error.message);
      return res.status(500).json({ ok: false, error: "Enregistrement impossible pour le moment." });
    }
  } else {
    console.warn("[api/contact] Supabase admin missing — e-mail only for review");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromAddress(),
        to: [contactInbox()],
        replyTo: email || undefined,
        subject: `[Avis] ${name} — ${rating}/5`,
        html: `<p>Nouvel avis en relecture (ne pas publier tel quel).</p>
          <p><strong>${escapeHtml(name)}</strong> — ${rating}/5</p>
          <p style="white-space:pre-wrap">${escapeHtml(text)}</p>
          <p>Publier : table <code>landing_reviews</code> → status = published.</p>`,
        tags: [{ name: "category", value: "landing-review" }],
      });
    } catch (err) {
      console.error("[api/contact] review mail:", err instanceof Error ? err.message : err);
    }
  }

  return res.status(200).json({ ok: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const honey = asString(body.company || body.website).trim();
  if (honey) {
    return res.status(200).json({ ok: true, id: "ignored" });
  }

  if (isLandingReview(body)) {
    return handleLandingReview(body, res);
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[api/contact] RESEND_API_KEY missing");
    return res.status(500).json({
      ok: false,
      error: "Envoi impossible pour le moment. Réessaie ou écris à contact@myswym.app.",
    });
  }

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px 12px;background:#f8f9fc;font-family:Lexend,-apple-system,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#355da3;font-size:22px;font-weight:800;margin:0 0 20px">MySWYM</p>
    <div style="background:#fff;border:1px solid rgba(53,93,163,0.12);border-radius:12px;padding:28px 24px">
      <h1 style="color:#191c1e;font-size:22px;margin:0 0 12px">Nouveau message contact</h1>
      <p style="color:#434751;font-size:15px;line-height:24px">De : <strong>${escapeHtml(name)}</strong> (${escapeHtml(email)})</p>
      <p style="color:#434751;font-size:15px;line-height:24px">Objet : <strong>${escapeHtml(subject)}</strong></p>
      <p style="color:#434751;font-size:15px;line-height:24px;white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  </div></body></html>`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: [contactInbox()],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html,
      tags: [{ name: "category", value: "contact" }],
    });

    if (error) {
      console.error("[api/contact] send failed:", error.message);
      return res.status(502).json({
        ok: false,
        error: "Envoi impossible pour le moment. Réessaie ou écris à contact@myswym.app.",
      });
    }

    return res.status(200).json({ ok: true, id: data?.id ?? "unknown" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/contact] unexpected:", msg);
    return res.status(500).json({
      ok: false,
      error: "Erreur serveur. Réessaie plus tard ou contact@myswym.app.",
    });
  }
}
