/**
 * Drip essai Premium J1 / J3 / J6 (idempotent par nom d’automation).
 * Trigger: trial.started (déjà émis par stripe-webhook au checkout essai).
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-resend-automations-v3-trial-drip.mjs
 *
 * Stoppe l’email si subscription.canceled pendant le délai (annulation essai).
 * Le rappel J-1 (trial.ending_soon) reste géré par marketing-cron + automation v2.
 */
const API = "https://api.resend.com";
const KEY = process.env.RESEND_API_KEY;
if (!KEY) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const FROM = process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
const REPLY = process.env.EMAIL_REPLY_TO || "contact@myswym.app";
const APP = process.env.APP_URL || "https://myswym.app";

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function emailHtml({ title, paragraphs, ctaLabel, ctaUrl = `${APP}/app` }) {
  const body = paragraphs
    .map(
      (t) =>
        `<p style="color:#434751;font-size:15px;line-height:24px;margin:0 0 12px">${t}</p>`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px 12px;background:#f8f9fc;font-family:Lexend,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#355da3;font-size:22px;font-weight:800;margin:0 0 20px">MySWYM</p>
    <div style="background:#fff;border:1px solid rgba(53,93,163,0.12);border-radius:12px;padding:28px 24px">
      <h1 style="color:#191c1e;font-size:22px;margin:0 0 12px">${title}</h1>
      ${body}
      <p style="text-align:center;margin:28px 0 8px">
        <a href="${ctaUrl}" style="background:#355da3;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${ctaLabel}</a>
      </p>
    </div>
    <p style="color:#5d5e61;font-size:12px;margin:28px 0 4px">MySWYM · ton coach natation</p>
    <p style="color:#5d5e61;font-size:12px;margin:0">
      <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5d5e61">Se désabonner</a>
      · contact@myswym.app
    </p>
  </div></body></html>`;
}

async function ensureEvent(name, schema) {
  try {
    const data = await api("POST", "/events", { name, schema });
    console.log("event created:", name, data.id || "");
    return data;
  } catch (e) {
    console.log("event ok/exists:", name, e.status === 409 ? "(409)" : e.message?.slice(0, 80));
    return null;
  }
}

async function createAndPublishTemplate({ name, subject, html }) {
  const created = await api("POST", "/templates", {
    name,
    from: FROM,
    subject,
    html,
    reply_to: REPLY,
    variables: [{ key: "GREETING", type: "string", fallback_value: "Salut" }],
  });
  await api("POST", `/templates/${created.id}/publish`);
  console.log("template:", name, created.id);
  return created.id;
}

async function listAutomationNames() {
  const data = await api("GET", "/automations");
  const items = data.data || data.automations || [];
  return new Set(items.map((a) => a.name));
}

async function createAutomationIfMissing(existing, payload) {
  if (existing.has(payload.name)) {
    console.log("skip automation (exists):", payload.name);
    return null;
  }
  const created = await api("POST", "/automations", payload);
  console.log("automation:", payload.name, created.id);
  existing.add(payload.name);
  return created;
}

/** trial.started → wait cancel (timeout) → send */
function trialDripAutomation({ name, timeout, subject, templateId }) {
  return {
    name,
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "trial.started" } },
      {
        key: "wait_cancel",
        type: "wait_for_event",
        config: { event_name: "subscription.canceled", timeout },
      },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject,
          reply_to: REPLY,
          template: {
            id: templateId,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait_cancel", type: "default" },
      { from: "wait_cancel", to: "send", type: "timeout" },
    ],
  };
}

async function main() {
  await ensureEvent("trial.started", {
    firstName: "string",
    userId: "string",
    trialEndsAt: "string",
  });
  await ensureEvent("subscription.canceled", {
    firstName: "string",
    userId: "string",
  });

  const existing = await listAutomationNames();

  const tplJ1 = await createAndPublishTemplate({
    name: "automation-trial-j1",
    subject: "Jour 1 — coche ta première séance",
    html: emailHtml({
      title: "Ton coach t’attend dans l’eau",
      paragraphs: [
        "{{{GREETING}}}, ton essai Premium a démarré. La meilleure façon de le sentir : ouvrir ton plan et faire la 1ʳᵉ séance.",
        "Après la séance, dis-nous si c’était trop facile ou trop dur — ton volume des prochaines semaines s’ajuste.",
        "Pas besoin d’être parfait. Juste le prochain coup de bras.",
      ],
      ctaLabel: "Voir ma 1ʳᵉ séance",
    }),
  });

  const tplJ3 = await createAndPublishTemplate({
    name: "automation-trial-j3",
    subject: "Jour 3 — ton plan s’adapte à toi",
    html: emailHtml({
      title: "3 jours d’essai — où en es-tu ?",
      paragraphs: [
        "{{{GREETING}}}, à mi-parcours de ton essai, le coach MySWYM vaut surtout si tu coches des séances et donnes ton ressenti.",
        "Trop dur → on baisse le volume. Trop facile → on monte un cran. C’est ça, un vrai suivi.",
        "Si tu n’as pas encore nagé : une séance courte suffit pour reprendre le fil.",
      ],
      ctaLabel: "Ouvrir mon plan",
    }),
  });

  const tplJ6 = await createAndPublishTemplate({
    name: "automation-trial-j6",
    subject: "Plus qu’un jour d’essai Premium",
    html: emailHtml({
      title: "Garde ton coach après demain",
      paragraphs: [
        "{{{GREETING}}}, ton essai se termine bientôt.",
        "Si tu continues : plan jusqu’à ton événement, allures à la seconde, adaptation après chaque feedback — 4,99 € / mois, sans engagement.",
        "Tu préfères arrêter ? Annule avant la fin de l’essai = 0 €. Sinon, tu gardes ton coach.",
      ],
      ctaLabel: "Continuer Premium",
      ctaUrl: `${APP}/tarifs`,
    }),
  });

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+1 première séance",
      timeout: "1 day",
      subject: "Jour 1 — coche ta première séance",
      templateId: tplJ1,
    }),
  );

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+3 adaptation",
      timeout: "3 days",
      subject: "Jour 3 — ton plan s’adapte à toi",
      templateId: tplJ3,
    }),
  );

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+6 conversion",
      timeout: "6 days",
      subject: "Plus qu’un jour d’essai Premium",
      templateId: tplJ6,
    }),
  );

  console.log(`
OK — drip essai J1/J3/J6 prêt.
Dashboard: https://resend.com/automations

Ensuite (J-1 filet) :
  POST \${SUPABASE_URL}/functions/v1/marketing-cron
  Header: x-myswym-email-secret
  Body: { "dry_run": false }

Ou laisse GitHub Action .github/workflows/marketing-cron.yml tourner chaque jour.
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
