/**
 * Ajoute les automations marketing manquantes (idempotent par nom).
 * Usage: node --env-file=.env.local scripts/setup-resend-automations-v2.mjs
 *
 * Déjà créées en v1 : nurture J+3, cancel immédiat.
 * Ici : J+1 activation, trial J-1, winback J+14, referral post-pay, comeback séance.
 */
const API = "https://api.resend.com";
const KEY = process.env.RESEND_API_KEY;
if (!KEY) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const FROM = process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
const REPLY = process.env.EMAIL_REPLY_TO || "contact@myswym.app";

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

function emailHtml({ title, paragraphs, ctaLabel, ctaUrl = "https://myswym.app/app" }) {
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
    <p style="color:#5d5e61;font-size:12px;margin:28px 0 4px">MySWYM · plans de natation structurés</p>
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

async function main() {
  await ensureEvent("user.signed_up", { firstName: "string", userId: "string" });
  await ensureEvent("subscription.started", {
    firstName: "string",
    userId: "string",
    planLabel: "string",
  });
  await ensureEvent("subscription.canceled", { firstName: "string", userId: "string" });
  await ensureEvent("trial.started", {
    firstName: "string",
    userId: "string",
    trialEndsAt: "string",
  });
  await ensureEvent("trial.ending_soon", {
    firstName: "string",
    userId: "string",
    trialEndsAt: "string",
  });
  await ensureEvent("session.completed", {
    firstName: "string",
    userId: "string",
    sessionTitle: "string",
  });

  const existing = await listAutomationNames();

  const tplActivation = await createAndPublishTemplate({
    name: "automation-activation-j1",
    subject: "Ta première séance MySWYM en 2 minutes",
    html: emailHtml({
      title: "Ouvre l’app, coche ta première séance",
      paragraphs: [
        "{{{GREETING}}}, ton compte est prêt. La suite est simple : ouvre ton plan et lance la séance du jour.",
        "Pas besoin d’être parfait — juste le prochain coup de bras. On structure le reste.",
      ],
      ctaLabel: "Voir ma séance",
    }),
  });

  const tplTrial = await createAndPublishTemplate({
    name: "automation-trial-ending",
    subject: "Demain, ton essai Premium se termine",
    html: emailHtml({
      title: "Plus qu’un jour d’essai",
      paragraphs: [
        "{{{GREETING}}}, ton essai MySWYM se termine demain.",
        "Si tu continues, tu gardes ton plan complet, le multi-plans et les départs chronométrés — 4,99 € / mois, sans engagement.",
        "Tu peux aussi annuler avant la fin de l’essai : 0 €.",
      ],
      ctaLabel: "Gérer mon essai",
    }),
  });

  const tplWinback = await createAndPublishTemplate({
    name: "automation-winback-j14",
    subject: "On garde ta place dans le bassin",
    html: emailHtml({
      title: "Envie de reprendre ?",
      paragraphs: [
        "{{{GREETING}}}, ça fait deux semaines. Ton compte MySWYM est toujours là, avec ton historique.",
        "Quand tu veux, tu reprends un plan adapté — sans repartir de zéro.",
      ],
      ctaLabel: "Reprendre Premium",
    }),
  });

  const tplReferral = await createAndPublishTemplate({
    name: "automation-referral-invite",
    subject: "Offre −20% à un nageur pote",
    html: emailHtml({
      title: "Parraine un nageur",
      paragraphs: [
        "{{{GREETING}}}, merci d’être Premium. Tu peux inviter un ami : il bénéficie de −20% sur sa 1ère facture, et tu reçois 4,99 € de crédit quand il s’abonne.",
        "Le lien se trouve dans Réglages → Parraine un nageur.",
      ],
      ctaLabel: "Ouvrir mes réglages",
      ctaUrl: "https://myswym.app/app",
    }),
  });

  const tplComeback = await createAndPublishTemplate({
    name: "automation-comeback-session",
    subject: "L’eau t’attend — on reprend ?",
    html: emailHtml({
      title: "3 jours sans séance",
      paragraphs: [
        "{{{GREETING}}}, pas de jugement — juste un rappel doux. Ta semaine MySWYM est toujours là.",
        "Une séance courte suffit pour reprendre le fil.",
      ],
      ctaLabel: "Voir ma séance",
    }),
  });

  // J+1 : pas d’abo → activation
  await createAutomationIfMissing(existing, {
    name: "Activation — J+1 sans abo",
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "user.signed_up" } },
      {
        key: "wait_paid",
        type: "wait_for_event",
        config: { event_name: "subscription.started", timeout: "1 day" },
      },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject: "Ta première séance MySWYM en 2 minutes",
          reply_to: REPLY,
          template: {
            id: tplActivation,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait_paid", type: "default" },
      { from: "wait_paid", to: "send", type: "timeout" },
    ],
  });

  // Trial J-1 : event trial.ending_soon (émis par marketing-cron, fenêtre exacte)
  await createAutomationIfMissing(existing, {
    name: "Essai — rappel J-1",
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "trial.ending_soon" } },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject: "Demain, ton essai Premium se termine",
          reply_to: REPLY,
          template: {
            id: tplTrial,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [{ from: "start", to: "send", type: "default" }],
  });

  // Win-back J+14 après cancel
  await createAutomationIfMissing(existing, {
    name: "Win-back — J+14 après cancel",
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "subscription.canceled" } },
      { key: "wait", type: "delay", config: { duration: "14 days" } },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject: "On garde ta place dans le bassin",
          reply_to: REPLY,
          template: {
            id: tplWinback,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait", type: "default" },
      { from: "wait", to: "send", type: "default" },
    ],
  });

  // Referral 1j après abo
  await createAutomationIfMissing(existing, {
    name: "Parrainage — J+1 après abo",
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "subscription.started" } },
      { key: "wait", type: "delay", config: { duration: "1 day" } },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject: "Offre −20% à un nageur pote",
          reply_to: REPLY,
          template: {
            id: tplReferral,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait", type: "default" },
      { from: "wait", to: "send", type: "default" },
    ],
  });

  // Comeback : inscrit, 3j sans séance cochée
  await createAutomationIfMissing(existing, {
    name: "Comeback — 3j sans séance",
    status: "enabled",
    steps: [
      { key: "start", type: "trigger", config: { event_name: "user.signed_up" } },
      {
        key: "wait_session",
        type: "wait_for_event",
        config: { event_name: "session.completed", timeout: "3 days" },
      },
      {
        key: "send",
        type: "send_email",
        config: {
          from: FROM,
          subject: "L’eau t’attend — on reprend ?",
          reply_to: REPLY,
          template: {
            id: tplComeback,
            variables: { GREETING: { var: "event.firstName" } },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait_session", type: "default" },
      { from: "wait_session", to: "send", type: "timeout" },
    ],
  });

  console.log("\nOK — v2 automations ready. Dashboard: https://resend.com/automations");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
