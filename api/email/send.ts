/**
 * POST /api/email/send
 * Self-contained handler (no local relative imports — Vercel ESM-safe).
 * Body: { kind, payload }
 * Header: x-myswym-email-secret = INTERNAL_EMAIL_SECRET
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const KINDS = [
  "welcome",
  "verification",
  "reset_password",
  "subscription_confirmation",
  "workout_reminder",
  "newsletter",
  "contact",
  "reactivation",
] as const;

type EmailKind = (typeof KINDS)[number];

function isEmailKind(value: unknown): value is EmailKind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
}

function replyToDefault(): string {
  return process.env.EMAIL_REPLY_TO || "contact@myswym.app";
}

function contactInbox(): string {
  return (
    process.env.EMAIL_CONTACT_TO ||
    process.env.EMAIL_REPLY_TO ||
    "contact@myswym.app"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  const ctaBlock = cta
    ? `<p style="text-align:center;margin:28px 0 8px">
        <a href="${escapeHtml(cta.url)}" style="background:#355da3;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${escapeHtml(cta.label)}</a>
      </p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px 12px;background:#f8f9fc;font-family:Lexend,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#355da3;font-size:22px;font-weight:800;margin:0 0 20px">MySWYM</p>
    <div style="background:#fff;border:1px solid rgba(53,93,163,0.12);border-radius:12px;padding:28px 24px">
      <h1 style="color:#191c1e;font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>
      ${bodyHtml}
      ${ctaBlock}
    </div>
    <p style="color:#5d5e61;font-size:12px;margin:28px 0 4px">MySWYM · plans de natation structurés</p>
    <p style="color:#5d5e61;font-size:12px;margin:0">contact@myswym.app · support@myswym.app</p>
  </div></body></html>`;
}

function p(text: string): string {
  return `<p style="color:#434751;font-size:15px;line-height:24px;margin:0 0 12px">${text}</p>`;
}

function buildEmail(kind: EmailKind, payload: Record<string, unknown>): {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  category: string;
} | { error: string } {
  const str = (k: string) => (typeof payload[k] === "string" ? (payload[k] as string).trim() : "");

  switch (kind) {
    case "welcome": {
      const to = str("to");
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const firstName = str("firstName") || "nageur";
      return {
        to,
        subject: firstName !== "nageur" ? `Bienvenue sur MySWYM, ${firstName}` : "Bienvenue sur MySWYM",
        category: "welcome",
        html: layout(
          `Bienvenue, ${firstName}`,
          p("Ton compte MySWYM est prêt. On a conçu un générateur de séances clair, progressif, adapté à ton niveau et à ton objectif.") +
            p("Prochaine étape : ouvre l’app, vérifie ton profil, et lance ta première semaine."),
          { label: "Ouvrir mon plan", url: "https://myswym.app/app" },
        ),
      };
    }
    case "verification": {
      const to = str("to");
      const confirmUrl = str("confirmUrl");
      if (!to.includes("@") || !confirmUrl) return { error: "to and confirmUrl required" };
      return {
        to,
        subject: "Confirme ton email MySWYM",
        category: "verification",
        html: layout(
          "Confirme ton adresse email",
          p("Un dernier clic pour activer ton compte MySWYM et accéder à ton plan.") +
            p("Si tu n’as pas créé de compte, tu peux ignorer ce message."),
          { label: "Confirmer mon email", url: confirmUrl },
        ),
      };
    }
    case "reset_password": {
      const to = str("to");
      const resetUrl = str("resetUrl");
      if (!to.includes("@") || !resetUrl) return { error: "to and resetUrl required" };
      return {
        to,
        subject: "Réinitialise ton mot de passe MySWYM",
        category: "reset_password",
        html: layout(
          "Réinitialiser le mot de passe",
          p("Tu as demandé à changer ton mot de passe MySWYM. Clique sur le bouton ci-dessous pour en choisir un nouveau.") +
            p("Si tu n’es pas à l’origine de cette demande, ignore cet email."),
          { label: "Choisir un nouveau mot de passe", url: resetUrl },
        ),
      };
    }
    case "subscription_confirmation": {
      const to = str("to");
      const planLabel = str("planLabel") || "Premium";
      const manageUrl = str("manageUrl") || "https://myswym.app/app";
      const firstName = str("firstName");
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const greeting = firstName ? `Merci, ${escapeHtml(firstName)} !` : "Merci !";
      return {
        to,
        subject: `Abonnement confirmé — ${planLabel}`,
        category: "subscription_confirmation",
        html: layout(
          greeting,
          p(`Ton abonnement <strong style="color:#191c1e">${escapeHtml(planLabel)}</strong> est actif. Tu as accès aux plans complets, au multi-plans et aux départs chronométrés.`) +
            p("Un reçu Stripe t’a été (ou va t’être) envoyé séparément. Tu peux gérer ton abonnement à tout moment depuis l’app."),
          { label: "Gérer mon abonnement", url: manageUrl },
        ),
      };
    }
    case "workout_reminder": {
      const to = str("to");
      const sessionTitle = str("sessionTitle") || "Séance";
      const ctaUrl = str("ctaUrl") || "https://myswym.app/app";
      const meters = typeof payload.meters === "number" ? payload.meters : undefined;
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const metersLine =
        typeof meters === "number" && meters > 0
          ? ` · ~${meters.toLocaleString("fr-FR")} m`
          : "";
      return {
        to,
        subject: `L’eau t’attend — ${sessionTitle}`,
        category: "workout_reminder",
        html: layout(
          "L’eau t’attend",
          p(`Ta séance du jour : <strong style="color:#191c1e">${escapeHtml(sessionTitle)}</strong>${escapeHtml(metersLine)}. Quelques dizaines de minutes et tu coches la case.`) +
            p("Pas de pression — juste le prochain coup de bras."),
          { label: "Voir ma séance", url: ctaUrl },
        ),
      };
    }
    case "newsletter": {
      const to = str("to");
      const subject = str("subject");
      const previewText = str("previewText");
      const sections = Array.isArray(payload.sections) ? payload.sections : [];
      if (!to.includes("@") || !subject || !sections.length) {
        return { error: "to, subject and sections required" };
      }
      const body = sections
        .map((s, i) => {
          const sec = s as { title?: string; body?: string };
          const t = escapeHtml(String(sec.title || ""));
          const b = escapeHtml(String(sec.body || ""));
          const heading =
            i === 0
              ? `<h1 style="color:#191c1e;font-size:22px;margin:0 0 12px">${t}</h1>`
              : `<h2 style="color:#191c1e;font-size:17px;margin:20px 0 8px">${t}</h2>`;
          return heading + p(b);
        })
        .join("");
      return {
        to,
        subject,
        category: "newsletter",
        html: layout(previewText || subject, body, {
          label: str("ctaLabel") || "Ouvrir MySWYM",
          url: str("ctaUrl") || "https://myswym.app/app",
        }),
      };
    }
    case "contact": {
      const name = str("name");
      const email = str("email");
      const subject = str("subject") || "Contact MySWYM";
      const message = str("message");
      if (!name || !email.includes("@") || !message) {
        return { error: "name, email and message required" };
      }
      return {
        to: contactInbox(),
        subject: `[Contact] ${subject}`,
        category: "contact",
        replyTo: email,
        html: layout(
          "Nouveau message contact",
          p(`<strong style="color:#191c1e">De :</strong> ${escapeHtml(name)} (${escapeHtml(email)})`) +
            p(`<strong style="color:#191c1e">Objet :</strong> ${escapeHtml(subject)}`) +
            p(`<strong style="color:#191c1e">Message :</strong>`) +
            `<p style="color:#434751;font-size:15px;line-height:24px;white-space:pre-wrap;margin:0 0 12px">${escapeHtml(message)}</p>` +
            p(`Réponds directement à cet e-mail pour écrire à ${escapeHtml(email)}.`),
        ),
      };
    }
    case "reactivation": {
      const to = str("to");
      const firstName = str("firstName");
      const ctaUrl = str("ctaUrl") || "https://myswym.app/app";
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const who = firstName ? `${escapeHtml(firstName)}, t` : "T";
      return {
        to,
        subject: "Ton plan MySWYM t’attend",
        category: "reactivation",
        html: layout(
          "Ton plan continue quand tu veux",
          p(`${who}on plan MySWYM est toujours là — séances structurées, progression claire, sans te perdre.`) +
            p("Premium débloque le programme complet, le multi-plans et les départs chronométrés. Essai 7 jours avec carte, puis 4,99 € / mois — tu peux annuler quand tu veux.") +
            p("Un clic et tu reprends exactement où tu en étais."),
          { label: "Reprendre mon plan", url: ctaUrl },
        ),
      };
    }
    default:
      return { error: `Unknown kind` };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = process.env.INTERNAL_EMAIL_SECRET;
  if (!secret) {
    console.error("[api/email/send] INTERNAL_EMAIL_SECRET missing");
    return res.status(500).json({ ok: false, error: "Email API not configured" });
  }

  const provided = req.headers["x-myswym-email-secret"];
  if (typeof provided !== "string" || provided !== secret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[api/email/send] RESEND_API_KEY missing");
    return res.status(500).json({ ok: false, error: "Email API not configured" });
  }

  const body = req.body as { kind?: unknown; payload?: unknown } | undefined;
  if (!body || !isEmailKind(body.kind) || !body.payload || typeof body.payload !== "object") {
    return res.status(400).json({
      ok: false,
      error: "Expected JSON { kind, payload }",
      kinds: KINDS,
    });
  }

  const built = buildEmail(body.kind, body.payload as Record<string, unknown>);
  if ("error" in built) {
    return res.status(400).json({ ok: false, error: built.error });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: [built.to],
      replyTo: built.replyTo || replyToDefault(),
      subject: built.subject,
      html: built.html,
      tags: [{ name: "category", value: built.category }],
    });

    if (error) {
      console.error("[api/email/send] resend error:", error.message);
      return res.status(502).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, id: data?.id ?? "unknown" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/email/send] unexpected:", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
