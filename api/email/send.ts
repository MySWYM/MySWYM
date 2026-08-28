/**
 * POST /api/email/send
 * Self-contained handler (no local relative imports — Vercel ESM-safe).
 * Body: { kind, payload }
 * Header: x-myswym-email-secret = INTERNAL_EMAIL_SECRET
 *
 * HTML layout mirrors api/_lib/emails (DA dark header + light card).
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

const B = {
  bg: "#f4f8fa",
  headerBg: "#000514",
  headerBgEnd: "#06101f",
  card: "#ffffff",
  cardDark: "#06101f",
  ink: "#0a162c",
  inkSoft: "#3d4f63",
  muted: "#5a6b7d",
  primary: "#006bfd",
  fgOnDark: "#f4f8fa",
  mutedOnDark: "#9bb0c8",
  border: "rgba(0, 107, 253, 0.18)",
  borderSoft: "rgba(10, 22, 44, 0.08)",
  site: "https://myswym.app",
  logoOnDark: "https://myswym.app/logo-myswym-banner-blanc.png",
  pricingLine:
    "9,99 €/mois sans engagement · 4,99 €/mois sur 12 mois · 52,99 €/an",
} as const;

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

function p(text: string): string {
  return `<p style="color:${B.inkSoft};font-size:15px;line-height:24px;margin:0 0 12px">${text}</p>`;
}

function bullets(items: string[]): string {
  return items
    .map(
      (item) =>
        `<p style="color:${B.inkSoft};font-size:15px;line-height:24px;margin:0 0 8px"><span style="color:${B.primary};font-weight:700;margin-right:6px">→</span>${item}</p>`,
    )
    .join("");
}

function layout(options: {
  preview: string;
  eyebrow?: string;
  title?: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  secondary?: { label: string; url: string };
  showUnsubscribe?: boolean;
}): string {
  const eyebrow = options.eyebrow
    ? `<p style="color:${B.primary};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 10px">${escapeHtml(options.eyebrow)}</p>`
    : "";
  const titleBlock = options.title
    ? `<h1 style="color:${B.ink};font-family:'Space Grotesk',Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:30px;margin:0 0 14px">${escapeHtml(options.title)}</h1>`
    : "";
  const ctaBlock = options.cta
    ? `<p style="text-align:center;margin:28px 0 8px">
        <a href="${escapeHtml(options.cta.url)}" style="background:${B.primary};color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block">${escapeHtml(options.cta.label)}</a>
      </p>`
    : "";
  const secondaryBlock = options.secondary
    ? `<p style="text-align:center;margin:14px 0 0">
        <a href="${escapeHtml(options.secondary.url)}" style="color:${B.muted};font-size:13px;text-decoration:underline">${escapeHtml(options.secondary.label)}</a>
      </p>`
    : "";
  const unsub = options.showUnsubscribe
    ? `<p style="color:${B.muted};font-size:11px;margin:12px 0 0">Tu ne souhaites plus recevoir ces emails ? <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${B.primary}">Se désabonner</a></p>`
    : "";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${escapeHtml(options.preview)}</title></head>
<body style="margin:0;padding:24px 12px;background:${B.bg};font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:linear-gradient(165deg,${B.headerBg} 0%,${B.headerBgEnd} 100%);border-radius:14px 14px 0 0;padding:28px 24px 24px;text-align:center;border-bottom:3px solid ${B.primary}">
      <img src="${B.logoOnDark}" alt="MySWYM" width="140" height="36" style="display:block;margin:0 auto 8px;max-width:140px;height:auto" />
      <p style="color:${B.mutedOnDark};font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin:0">ton coach natation</p>
    </div>
    <div style="background:${B.card};border-radius:0 0 14px 14px;border:1px solid ${B.borderSoft};border-top:none;padding:28px 24px 32px">
      ${eyebrow}
      ${titleBlock}
      ${options.bodyHtml}
      ${ctaBlock}
      ${secondaryBlock}
    </div>
    <div style="padding:24px 8px 8px;text-align:center">
      <p style="color:${B.ink};font-size:12px;font-weight:600;margin:0 0 6px">MySWYM · ton coach natation</p>
      <p style="color:${B.muted};font-size:12px;margin:0 0 4px">contact@myswym.app · support@myswym.app</p>
      <p style="color:${B.muted};font-size:12px;margin:0"><a href="${B.site}" style="color:${B.primary};text-decoration:underline">myswym.app</a></p>
      ${unsub}
    </div>
  </div>
</body></html>`;
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
      const titled =
        firstName !== "nageur" ? `${firstName}, on nage.` : "On nage.";
      return {
        to,
        subject:
          firstName !== "nageur"
            ? `${firstName}, ton bassin t’attend`
            : "Ton bassin t’attend — MySWYM",
        category: "welcome",
        html: layout({
          preview: "Ouvre ton plan — la 1ʳᵉ séance est déjà là.",
          eyebrow: "Compte créé",
          title: titled,
          bodyHtml:
            p(
              "Ton compte MySWYM est prêt. Ton plan est déjà structuré — clair, progressif, adapté à ton niveau.",
            ) +
            bullets([
              "Ouvre l’app et lance ta 1ʳᵉ séance",
              "Coche-la après — le coach s’ajuste à ton ressenti",
              "Essai 7 jours sans carte : tu testes, tu décides",
            ]),
          cta: { label: "Ouvrir ma 1ʳᵉ séance", url: `${B.site}/app` },
        }),
      };
    }
    case "verification": {
      const to = str("to");
      const confirmUrl = str("confirmUrl");
      if (!to.includes("@") || !confirmUrl) return { error: "to and confirmUrl required" };
      return {
        to,
        subject: "1 clic pour activer MySWYM",
        category: "verification",
        html: layout({
          preview: "1 clic pour activer ton compte MySWYM.",
          eyebrow: "Sécurité",
          title: "Active ton compte",
          bodyHtml:
            p("Un dernier clic pour confirmer ton adresse et accéder à ton plan.") +
            p("Si tu n’as pas créé de compte, ignore ce message — rien ne se passe."),
          cta: { label: "Confirmer mon email", url: confirmUrl },
        }),
      };
    }
    case "reset_password": {
      const to = str("to");
      const resetUrl = str("resetUrl");
      if (!to.includes("@") || !resetUrl) return { error: "to and resetUrl required" };
      return {
        to,
        subject: "Réinitialise ton mot de passe",
        category: "reset_password",
        html: layout({
          preview: "Choisis un nouveau mot de passe MySWYM.",
          eyebrow: "Sécurité",
          title: "Nouveau mot de passe",
          bodyHtml:
            p(
              "Tu as demandé à changer ton mot de passe MySWYM. Clique ci-dessous pour en choisir un nouveau.",
            ) +
            p(
              "Si tu n’es pas à l’origine de cette demande, ignore cet email — ton compte reste inchangé.",
            ),
          cta: { label: "Choisir un nouveau mot de passe", url: resetUrl },
        }),
      };
    }
    case "subscription_confirmation": {
      const to = str("to");
      const planLabel = str("planLabel") || "Premium";
      const manageUrl = str("manageUrl") || `${B.site}/app`;
      const firstName = str("firstName");
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const title = firstName
        ? `Merci, ${firstName} — coach on.`
        : "Merci — coach on.";
      return {
        to,
        subject: `C’est parti — Premium actif (${planLabel})`,
        category: "subscription_confirmation",
        html: layout({
          preview: `Premium actif (${planLabel}) — ton coach est prêt.`,
          eyebrow: `Premium · ${planLabel}`,
          title,
          bodyHtml:
            p(
              "Ton accès Premium est actif. Tu as maintenant tout ce qu’il faut pour progresser sans te perdre.",
            ) +
            bullets([
              "Plan jusqu’à ton événement",
              "Allures à la seconde",
              "Adaptation après chaque feedback",
            ]),
          cta: { label: "Voir mon plan", url: `${B.site}/app` },
          secondary: { label: "Gérer mon abonnement", url: manageUrl },
        }),
      };
    }
    case "workout_reminder": {
      const to = str("to");
      const sessionTitle = str("sessionTitle") || "Séance";
      const ctaUrl = str("ctaUrl") || `${B.site}/app`;
      const firstName = str("firstName");
      const meters = typeof payload.meters === "number" ? payload.meters : undefined;
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const metersLine =
        typeof meters === "number" && meters > 0
          ? `~${meters.toLocaleString("fr-FR")} m`
          : "";
      const title = firstName ? `${firstName}, l’eau t’attend` : "L’eau t’attend";
      const highlight = `<div style="background:${B.cardDark};border-radius:10px;margin:16px 0 4px;padding:18px">
        <p style="color:${B.fgOnDark};font-size:16px;font-weight:700;line-height:22px;margin:0 0 4px">${escapeHtml(sessionTitle)}</p>
        ${metersLine ? `<p style="color:${B.mutedOnDark};font-size:13px;margin:0">${escapeHtml(metersLine)}</p>` : ""}
      </div>`;
      return {
        to,
        subject: `L’eau t’attend — ${sessionTitle}`,
        category: "workout_reminder",
        html: layout({
          preview: `L’eau t’attend — ${sessionTitle}${metersLine ? ` · ${metersLine}` : ""}`,
          eyebrow: "Séance du jour",
          title,
          bodyHtml:
            p(
              "Quelques dizaines de minutes et tu coches la case. Pas de pression — juste le prochain coup de bras.",
            ) + highlight,
          cta: { label: "Ouvrir la séance", url: ctaUrl },
        }),
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
              ? `<h1 style="color:${B.ink};font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:30px;margin:0 0 14px">${t}</h1>`
              : `<h2 style="color:${B.ink};font-size:17px;font-weight:700;margin:22px 0 8px;border-left:3px solid ${B.primary};padding-left:12px">${t}</h2>`;
          return heading + p(b);
        })
        .join("");
      return {
        to,
        subject,
        category: "newsletter",
        html: layout({
          preview: previewText || subject,
          eyebrow: "MySWYM",
          bodyHtml: body,
          cta: {
            label: str("ctaLabel") || "Ouvrir MySWYM",
            url: str("ctaUrl") || `${B.site}/app`,
          },
          showUnsubscribe: true,
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
        html: layout({
          preview: `Contact MySWYM — ${subject}`,
          eyebrow: "Support",
          title: "Nouveau message contact",
          bodyHtml:
            p(`<strong style="color:${B.ink}">De :</strong> ${escapeHtml(name)} (${escapeHtml(email)})`) +
            p(`<strong style="color:${B.ink}">Objet :</strong> ${escapeHtml(subject)}`) +
            p(`<strong style="color:${B.ink}">Message :</strong>`) +
            `<p style="color:${B.inkSoft};font-size:15px;line-height:24px;white-space:pre-wrap;margin:0 0 12px">${escapeHtml(message)}</p>` +
            p(`Réponds directement à cet e-mail pour écrire à ${escapeHtml(email)}.`),
        }),
      };
    }
    case "reactivation": {
      const to = str("to");
      const firstName = str("firstName");
      const ctaUrl = str("ctaUrl") || `${B.site}/app`;
      if (!to.includes("@")) return { error: "payload.to must be an email" };
      const title = firstName
        ? `${firstName}, ton plan n’a pas bougé`
        : "Ton plan n’a pas bougé";
      return {
        to,
        subject: firstName
          ? `${firstName}, ton plan MySWYM t’attend`
          : "Ton plan MySWYM t’attend",
        category: "reactivation",
        html: layout({
          preview: "Reprends exactement où tu en étais.",
          eyebrow: "On te garde une place",
          title,
          bodyHtml:
            p(
              "Ton plan MySWYM est toujours là — séances structurées, progression claire, sans tout recommencer.",
            ) +
            p(`Premium : ${B.pricingLine}. Essai 7 jours sans carte.`) +
            p("Un clic et tu reprends exactement où tu en étais."),
          cta: { label: "Reprendre mon plan", url: ctaUrl },
        }),
      };
    }
    default:
      return { error: `Unknown kind` };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.INTERNAL_EMAIL_SECRET;
  if (!secret) {
    console.error("[api/email/send] INTERNAL_EMAIL_SECRET missing");
    return res.status(500).json({ error: "Email service misconfigured" });
  }

  const header = req.headers["x-myswym-email-secret"];
  if (header !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[api/email/send] RESEND_API_KEY missing");
    return res.status(500).json({ error: "Email service misconfigured" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const kind = body.kind;
  const payload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as Record<string, unknown>)
      : {};

  if (!isEmailKind(kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }

  const built = buildEmail(kind, payload);
  if ("error" in built) {
    return res.status(400).json({ error: built.error });
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
      return res.status(502).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/email/send] unexpected:", message);
    return res.status(500).json({ error: message });
  }
}
