/**
 * POST /api/landing-review — avis landing (pending + e-mail Arthur).
 * Rien n’est publié sans passage de status à `published` dans Supabase.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const MAX_NAME = 80;
const MAX_BODY = 800;

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

function inbox(): string {
  return process.env.EMAIL_CONTACT_TO || process.env.EMAIL_REPLY_TO || "contact@myswym.app";
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (asString(body.company || body.website).trim()) {
    return res.status(200).json({ ok: true, id: "ignored" });
  }

  const name = asString(body.name).trim();
  const text = asString(body.body).trim();
  const email = asString(body.email).trim();
  const rating = Number(body.rating);

  if (!name || name.length > MAX_NAME) {
    return res.status(400).json({ ok: false, error: "Prénom invalide" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, error: "Note invalide" });
  }
  if (!text || text.length > MAX_BODY) {
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
      console.error("[api/landing-review] insert:", error.message);
      return res.status(500).json({ ok: false, error: "Enregistrement impossible pour le moment." });
    }
  } else {
    console.warn("[api/landing-review] Supabase admin missing — e-mail only");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromAddress(),
        to: [inbox()],
        replyTo: email || undefined,
        subject: `[Avis] ${name} — ${rating}/5`,
        html: `<p>Nouvel avis en relecture (ne pas publier tel quel).</p>
          <p><strong>${escapeHtml(name)}</strong> — ${rating}/5</p>
          <p style="white-space:pre-wrap">${escapeHtml(text)}</p>
          <p>Publier : table <code>landing_reviews</code> → status = published.</p>`,
        tags: [{ name: "category", value: "landing-review" }],
      });
    } catch (err) {
      console.error("[api/landing-review] mail:", err instanceof Error ? err.message : err);
    }
  }

  return res.status(200).json({ ok: true });
}
