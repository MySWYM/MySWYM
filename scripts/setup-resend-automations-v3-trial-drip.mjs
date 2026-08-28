/**
 * Drip essai Premium J1 / J3 / J6 (idempotent par nom d’automation).
 * Trigger: trial.started (déjà émis par stripe-webhook au checkout essai).
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-resend-automations-v3-trial-drip.mjs
 *
 * Pour mettre à jour le design des templates existants :
 *   npm run email:republish
 */
import { getAutomationTemplates } from "./_lib/email-html.mjs";

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

  const catalog = getAutomationTemplates(APP);
  const byName = Object.fromEntries(catalog.map((t) => [t.name, t]));
  const existing = await listAutomationNames();

  const tplJ1 = await createAndPublishTemplate(byName["automation-trial-j1"]);
  const tplJ3 = await createAndPublishTemplate(byName["automation-trial-j3"]);
  const tplJ6 = await createAndPublishTemplate(byName["automation-trial-j6"]);

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+1 première séance",
      timeout: "1 day",
      subject: byName["automation-trial-j1"].subject,
      templateId: tplJ1,
    }),
  );

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+3 adaptation",
      timeout: "3 days",
      subject: byName["automation-trial-j3"].subject,
      templateId: tplJ3,
    }),
  );

  await createAutomationIfMissing(
    existing,
    trialDripAutomation({
      name: "Essai Premium — J+6 conversion",
      timeout: "6 days",
      subject: byName["automation-trial-j6"].subject,
      templateId: tplJ6,
    }),
  );

  console.log(`
OK — drip essai J1/J3/J6 prêt.
Pour mettre à jour le design sans recréer : npm run email:republish
Dashboard: https://resend.com/automations
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
