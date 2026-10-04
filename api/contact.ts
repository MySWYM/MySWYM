/**
 * POST /api/contact, formulaire contact + avis landing + support in-app / Telegram.
 * Hobby = 12 fonctions max : ne pas ajouter api/landing-review.ts, api/support.ts
 * ni api/natation-sheet.ts, api/push/notify.ts : tout passe par ici (+ rewrites vercel.json).
 *
 * Support : GET|POST /api/contact?kind=app-support (JWT)
 * Telegram webhook : POST /api/telegram/webhook (rewrite) ou POST avec update_id
 * Catalogue Sheet : GET /api/natation-sheet (rewrite → kind=natation-sheet)
 * Push APNs : POST /api/push/notify (rewrite → kind=push-notify)
 * Reset MDP : POST /api/contact kind=reset-password (ou rewrite /api/auth/reset-password)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  handleSupportHttp,
  handleTelegramWebhook,
  isSupportRequest,
  isTelegramWebhookRequest,
} from "./_lib/support/http.js";
import {
  handleNatationSheet,
  isNatationSheetRequest,
} from "./_lib/natation-sheet.js";
import {
  handlePushNotifyHttp,
  isPushNotifyRequest,
} from "./_lib/push/http.js";
import { formatLandingContactNotify } from "./_lib/support/parse.js";
import {
  isContactTelegramConfigured,
  sendContactTelegramMessage,
} from "./_lib/support/telegram.js";
import { allowContactNotify, RATE_LIMIT_MESSAGE } from "./_lib/support/rate-limit.js";

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

function isPasswordResetRequest(req: VercelRequest, body: Record<string, unknown>): boolean {
  const q = asString(req.query?.kind).trim();
  const kind = asString(body.kind || body.type).trim();
  return q === "reset-password" || kind === "reset-password" || kind === "reset_password";
}

const PROD_SITE = "https://www.myswym.app";
/** ?reset=1 : l’app affiche le formulaire même si PASSWORD_RECOVERY ne part pas. */
const RESET_REDIRECT = `${PROD_SITE}/app?reset=1`;

/** Force redirect_to prod même si le projet Supabase a Site URL = staging. */
function forceProdRecoveryLink(actionLink: string): string {
  try {
    const u = new URL(actionLink);
    if (u.searchParams.has("redirect_to")) {
      u.searchParams.set("redirect_to", RESET_REDIRECT);
    }
    return u.toString();
  } catch {
    return actionLink;
  }
}

function resetPasswordHtml(resetUrl: string): string {
  const safeUrl = escapeHtml(resetUrl);
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f4f8fa;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Choisis un nouveau mot de passe MySWYM.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fa;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;border-collapse:collapse">
        <tr><td style="background:linear-gradient(180deg,#000514 0%,#06101f 100%);border-radius:16px 16px 0 0;padding:22px 28px">
          <img src="${PROD_SITE}/logo-myswym-banner-blanc.png" alt="MySWYM" height="28" style="display:block;height:28px;width:auto" />
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid rgba(0,107,253,0.18);border-top:0;border-radius:0 0 16px 16px;padding:28px 28px 32px">
          <p style="color:#006bfd;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 10px">Sécurité</p>
          <h1 style="color:#0a162c;font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:30px;margin:0 0 14px">Nouveau mot de passe</h1>
          <p style="color:#3d4f63;font-size:15px;line-height:24px;margin:0 0 12px">Tu as demandé à réinitialiser ton mot de passe MySWYM. Utilise le bouton ci-dessous pour en choisir un nouveau.</p>
          <p style="color:#3d4f63;font-size:15px;line-height:24px;margin:0 0 22px">Si tu n’es pas à l’origine de cette demande, ignore cet email : ton compte reste inchangé.</p>
          <a href="${safeUrl}" style="display:inline-block;background:#006bfd;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:999px">Choisir un nouveau mot de passe</a>
          <p style="color:#5a6b7d;font-size:13px;line-height:20px;margin:22px 0 0">Pour ta sécurité, ce lien expire rapidement. Besoin d’aide ? support@myswym.app</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function handlePasswordReset(
  body: Record<string, unknown>,
  req: VercelRequest,
  res: VercelResponse,
) {
  const email = asString(body.email).trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Email invalide" });
  }

  const allowed = await allowContactNotify(req, email);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: RATE_LIMIT_MESSAGE });
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const apiKey = process.env.RESEND_API_KEY;

  // Toujours 200 « ok » si format valide : ne pas révéler si le compte existe.
  const okResponse = () => res.status(200).json({ ok: true });

  if (!url || !serviceKey || !apiKey) {
    console.error("[api/contact] reset-password misconfigured", {
      hasUrl: Boolean(url),
      hasService: Boolean(serviceKey),
      hasResend: Boolean(apiKey),
    });
    return okResponse();
  }

  try {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: RESET_REDIRECT },
    });

    if (error || !data?.properties?.action_link) {
      // Compte inconnu ou autre : réponse neutre
      if (error && !/not found|unable to find|user not found/i.test(error.message || "")) {
        console.error("[api/contact] reset generateLink:", error.message);
      }
      return okResponse();
    }

    const resetUrl = forceProdRecoveryLink(data.properties.action_link);
    const resend = new Resend(apiKey);
    const { error: sendErr } = await resend.emails.send({
      from: fromAddress(),
      to: [email],
      replyTo: replyToDefault(),
      subject: "Réinitialise ton mot de passe MySWYM",
      html: resetPasswordHtml(resetUrl),
      tags: [{ name: "category", value: "reset_password" }],
    });

    if (sendErr) {
      console.error("[api/contact] reset send:", sendErr.message);
      return res.status(502).json({
        ok: false,
        error: "Envoi impossible pour le moment. Réessaie ou écris à support@myswym.app.",
      });
    }

    return okResponse();
  } catch (err) {
    console.error(
      "[api/contact] reset unexpected:",
      err instanceof Error ? err.message : err,
    );
    return res.status(500).json({
      ok: false,
      error: "Erreur serveur. Réessaie plus tard ou support@myswym.app.",
    });
  }
}

function replyToDefault(): string {
  return process.env.EMAIL_REPLY_TO || "contact@myswym.app";
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
    console.warn("[api/contact] Supabase admin missing, e-mail only for review");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromAddress(),
        to: [contactInbox()],
        replyTo: email || undefined,
        subject: `[Avis] ${name}, ${rating}/5`,
        html: `<p>Nouvel avis en relecture (ne pas publier tel quel).</p>
          <p><strong>${escapeHtml(name)}</strong>, ${rating}/5</p>
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
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (isNatationSheetRequest(req)) {
    await handleNatationSheet(req, res);
    return;
  }

  if (isPushNotifyRequest(req, body)) {
    await handlePushNotifyHttp(req, res, body);
    return;
  }

  if (isTelegramWebhookRequest(req, body)) {
    await handleTelegramWebhook(req, res, body);
    return;
  }

  if (isSupportRequest(req, body)) {
    await handleSupportHttp(req, res, body);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const honey = asString(body.company || body.website).trim();
  if (honey) {
    return res.status(200).json({ ok: true, id: "ignored" });
  }

  if (isLandingReview(body)) {
    return handleLandingReview(body, res);
  }

  if (isPasswordResetRequest(req, body)) {
    return handlePasswordReset(body, req, res);
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

  const allowed = await allowContactNotify(req, email);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: RATE_LIMIT_MESSAGE });
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

    if (isContactTelegramConfigured()) {
      try {
        await sendContactTelegramMessage(
          formatLandingContactNotify({ name, email, subject, body: message }),
        );
      } catch (err) {
        console.error(
          "[api/contact] telegram notify:",
          err instanceof Error ? err.message : err,
        );
      }
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
