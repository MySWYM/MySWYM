/**
 * Automations marketing v2 (idempotent par nom).
 * Usage: node --env-file=.env.local scripts/setup-resend-automations-v2.mjs
 *
 * Pour mettre à jour le design des templates : npm run email:republish
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

  const catalog = getAutomationTemplates(APP);
  const byName = Object.fromEntries(catalog.map((t) => [t.name, t]));
  const existing = await listAutomationNames();

  const tplActivation = await createAndPublishTemplate(byName["automation-activation-j1"]);
  const tplTrial = await createAndPublishTemplate(byName["automation-trial-ending"]);
  const tplWinback = await createAndPublishTemplate(byName["automation-winback-j14"]);
  const tplReferral = await createAndPublishTemplate(byName["automation-referral-invite"]);
  const tplComeback = await createAndPublishTemplate(byName["automation-comeback-session"]);

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
          subject: byName["automation-activation-j1"].subject,
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
          subject: byName["automation-trial-ending"].subject,
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
          subject: byName["automation-winback-j14"].subject,
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
          subject: byName["automation-referral-invite"].subject,
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
          subject: byName["automation-comeback-session"].subject,
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

  console.log("\nOK — v2 automations ready. Design update: npm run email:republish");
  console.log("Dashboard: https://resend.com/automations");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
