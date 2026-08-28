/**
 * Shared MySWYM email HTML for Resend automation templates.
 * Keep in sync with api/_lib/emails/components (DA dark header + light card).
 */

export const EMAIL_BRAND = {
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
  pricingShort: "dès 4,99 €/mois",
  referralCredit: "4,99 €",
};

/**
 * @param {{
 *   title: string,
 *   paragraphs?: string[],
 *   bullets?: string[],
 *   eyebrow?: string,
 *   highlight?: { title: string, meta?: string, dark?: boolean },
 *   ctaLabel: string,
 *   ctaUrl?: string,
 *   secondaryLabel?: string,
 *   secondaryUrl?: string,
 *   appUrl?: string,
 * }} opts
 */
export function emailHtml(opts) {
  const B = EMAIL_BRAND;
  const app = opts.appUrl || B.site;
  const ctaUrl = opts.ctaUrl || `${app}/app`;

  const eyebrow = opts.eyebrow
    ? `<p style="color:${B.primary};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 10px">${opts.eyebrow}</p>`
    : "";

  const paragraphs = (opts.paragraphs || [])
    .map(
      (t) =>
        `<p style="color:${B.inkSoft};font-size:15px;line-height:24px;margin:0 0 12px">${t}</p>`,
    )
    .join("");

  const bullets = (opts.bullets || [])
    .map(
      (item) =>
        `<p style="color:${B.inkSoft};font-size:15px;line-height:24px;margin:0 0 8px"><span style="color:${B.primary};font-weight:700;margin-right:6px">→</span>${item}</p>`,
    )
    .join("");

  let highlight = "";
  if (opts.highlight) {
    const dark = opts.highlight.dark !== false;
    const bg = dark ? B.cardDark : B.bg;
    const titleColor = dark ? B.fgOnDark : B.ink;
    const metaColor = dark ? B.mutedOnDark : B.muted;
    const border = dark ? "none" : `1px solid ${B.border}`;
    highlight = `<div style="background:${bg};border:${border};border-radius:10px;margin:16px 0 4px;padding:18px">
      <p style="color:${titleColor};font-size:16px;font-weight:700;line-height:22px;margin:0 0 4px">${opts.highlight.title}</p>
      ${opts.highlight.meta ? `<p style="color:${metaColor};font-size:13px;margin:0">${opts.highlight.meta}</p>` : ""}
    </div>`;
  }

  const secondary =
    opts.secondaryLabel && opts.secondaryUrl
      ? `<p style="text-align:center;margin:14px 0 0"><a href="${opts.secondaryUrl}" style="color:${B.muted};font-size:13px;text-decoration:underline">${opts.secondaryLabel}</a></p>`
      : "";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:24px 12px;background:${B.bg};font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:linear-gradient(165deg,${B.headerBg} 0%,${B.headerBgEnd} 100%);border-radius:14px 14px 0 0;padding:28px 24px 24px;text-align:center;border-bottom:3px solid ${B.primary}">
      <img src="${B.logoOnDark}" alt="MySWYM" width="140" height="36" style="display:block;margin:0 auto 8px;max-width:140px;height:auto" />
      <p style="color:${B.mutedOnDark};font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin:0">ton coach natation</p>
    </div>
    <div style="background:${B.card};border-radius:0 0 14px 14px;border:1px solid ${B.borderSoft};border-top:none;padding:28px 24px 32px">
      ${eyebrow}
      <h1 style="color:${B.ink};font-family:'Space Grotesk',Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:30px;margin:0 0 14px">${opts.title}</h1>
      ${paragraphs}
      ${bullets}
      ${highlight}
      <p style="text-align:center;margin:28px 0 8px">
        <a href="${ctaUrl}" style="background:${B.primary};color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block">${opts.ctaLabel}</a>
      </p>
      ${secondary}
    </div>
    <div style="padding:24px 8px 8px;text-align:center">
      <p style="color:${B.ink};font-size:12px;font-weight:600;margin:0 0 6px">MySWYM · ton coach natation</p>
      <p style="color:${B.muted};font-size:12px;margin:0">
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${B.muted}">Se désabonner</a>
        · contact@myswym.app
      </p>
    </div>
  </div>
</body></html>`;
}

/**
 * Catalog of automation templates (name → subject + html builder args).
 * Used by setup scripts and republish.
 */
export function getAutomationTemplates(appUrl = EMAIL_BRAND.site) {
  const app = appUrl;
  const B = EMAIL_BRAND;

  return [
    {
      name: "automation-trial-j1",
      subject: "Jour 1 — coche ta première séance",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Essai · Jour 1",
        title: "Ton coach t’attend dans l’eau",
        paragraphs: [
          "{{{GREETING}}}, ton essai Premium a démarré. La meilleure façon de le sentir : ouvrir ton plan et faire la 1ʳᵉ séance.",
          "Après la séance, dis-nous si c’était trop facile ou trop dur — ton volume des prochaines semaines s’ajuste.",
        ],
        bullets: ["Pas besoin d’être parfait. Juste le prochain coup de bras."],
        ctaLabel: "Voir ma 1ʳᵉ séance",
      }),
    },
    {
      name: "automation-trial-j3",
      subject: "Jour 3 — ton plan s’adapte à toi",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Essai · Jour 3",
        title: "3 jours — où en es-tu ?",
        paragraphs: [
          "{{{GREETING}}}, à mi-parcours de ton essai, le coach MySWYM vaut surtout si tu coches des séances et donnes ton ressenti.",
        ],
        bullets: [
          "Trop dur → on baisse le volume",
          "Trop facile → on monte un cran",
          "Pas encore nagé ? Une séance courte suffit",
        ],
        ctaLabel: "Ouvrir mon plan",
      }),
    },
    {
      name: "automation-trial-j6",
      subject: "Demain ton essai se termine — tu gardes le coach ?",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Essai · Jour 6",
        title: "Garde ton coach après demain",
        paragraphs: [
          "{{{GREETING}}}, ton essai se termine bientôt.",
          "Si tu continues : plan jusqu’à ton événement, allures à la seconde, adaptation après chaque feedback.",
        ],
        highlight: {
          title: B.pricingLine,
          meta: "Annule avant la fin de l’essai = 0 €. Sinon, tu gardes ton coach.",
          dark: true,
        },
        ctaLabel: "Continuer Premium",
        ctaUrl: `${app}/tarifs`,
        secondaryLabel: "Gérer mon essai",
        secondaryUrl: `${app}/app`,
      }),
    },
    {
      name: "automation-activation-j1",
      subject: "2 minutes — ta 1ʳᵉ séance MySWYM",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Activation",
        title: "Ouvre l’app, coche ta première séance",
        paragraphs: [
          "{{{GREETING}}}, ton compte est prêt. La suite est simple : ouvre ton plan et lance la séance du jour.",
          "Pas besoin d’être parfait — juste le prochain coup de bras. On structure le reste.",
        ],
        ctaLabel: "Voir ma séance",
      }),
    },
    {
      name: "automation-trial-ending",
      subject: "Dernier jour d’essai — 0 € si tu annules",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Essai · J-1",
        title: "Plus qu’un jour d’essai",
        paragraphs: [
          "{{{GREETING}}}, ton essai MySWYM se termine demain.",
          "Si tu continues, tu gardes ton plan complet, le multi-plans et les départs chronométrés.",
        ],
        highlight: {
          title: B.pricingLine,
          meta: "Tu peux aussi annuler avant la fin : 0 €.",
          dark: true,
        },
        ctaLabel: "Garder Premium",
        ctaUrl: `${app}/tarifs`,
        secondaryLabel: "Gérer mon essai",
        secondaryUrl: `${app}/app`,
      }),
    },
    {
      name: "automation-winback-j14",
      subject: "On a gardé ta place dans le bassin",
      html: emailHtml({
        appUrl: app,
        eyebrow: "On te retrouve",
        title: "Envie de reprendre ?",
        paragraphs: [
          "{{{GREETING}}}, ça fait deux semaines. Ton compte MySWYM est toujours là, avec ton historique.",
          "Quand tu veux, tu reprends un plan adapté — sans repartir de zéro.",
        ],
        ctaLabel: "Reprendre Premium",
        ctaUrl: `${app}/tarifs`,
      }),
    },
    {
      name: "automation-referral-invite",
      subject: "Offre −20% à un nageur pote",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Parrainage",
        title: "Parraine un nageur",
        paragraphs: [
          `{{{GREETING}}}, merci d’être Premium. Invite un ami : il bénéficie de −20% sur sa 1ʳᵉ facture, et tu reçois ${B.referralCredit} de crédit quand il s’abonne.`,
          "Le lien se trouve dans Réglages → Parraine un nageur.",
        ],
        ctaLabel: "Ouvrir mes réglages",
      }),
    },
    {
      name: "automation-comeback-session",
      subject: "3 jours — on reprend sans pression ?",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Petit rappel",
        title: "3 jours sans séance",
        paragraphs: [
          "{{{GREETING}}}, pas de jugement — juste un rappel doux. Ta semaine MySWYM est toujours là.",
          "Une séance courte suffit pour reprendre le fil.",
        ],
        ctaLabel: "Voir ma séance",
      }),
    },
    {
      name: "automation-nurture-j3",
      subject: "Ton plan MySWYM t’attend toujours",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Ton plan est prêt",
        title: "Reprends exactement où tu en étais",
        paragraphs: [
          "{{{GREETING}}}, ton plan MySWYM est toujours là — séances structurées, progression claire, sans te perdre.",
          `Premium débloque le programme complet, le multi-plans et les départs chronométrés. Essai 7 jours sans carte, puis ${B.pricingLine}.`,
        ],
        ctaLabel: "Reprendre mon plan",
      }),
    },
    {
      name: "automation-subscription-canceled",
      subject: "On se dit à bientôt sur MySWYM",
      html: emailHtml({
        appUrl: app,
        eyebrow: "Compte",
        title: "Ton accès Premium est terminé",
        paragraphs: [
          "{{{GREETING}}}, ton abonnement MySWYM est bien annulé. Merci d’avoir nagé avec nous.",
          "Ton compte reste là : tu pourras reprendre un plan quand tu veux, sans tout recommencer.",
          "Si c’était un souci technique ou un doute, réponds à cet email — on est là.",
        ],
        ctaLabel: "Rouvrir MySWYM",
      }),
    },
  ];
}
