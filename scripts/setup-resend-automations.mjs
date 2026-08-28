/**
 * One-shot: events + templates + automations Resend (nurture J+3 + cancel).
 * Usage: node --env-file=.env.local scripts/setup-resend-automations.mjs
 *
 * Pour mettre à jour le design : npm run email:republish
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
    err.data = data;
    throw err;
  }
  return data;
}

async function ensureEvent(name, schema) {
  try {
    const data = await api("POST", "/events", { name, schema });
    console.log("event created:", name, data.id || data);
    return data;
  } catch (e) {
    if (e.status === 409 || String(e.message).includes("already")) {
      console.log("event exists:", name);
      return null;
    }
    console.warn("event create warn:", name, e.message);
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
  const id = created.id;
  await api("POST", `/templates/${id}/publish`);
  console.log("template published:", name, id);
  return id;
}

async function main() {
  await ensureEvent("user.signed_up", {
    firstName: "string",
    userId: "string",
  });
  await ensureEvent("subscription.started", {
    firstName: "string",
    userId: "string",
    planLabel: "string",
  });
  await ensureEvent("subscription.canceled", {
    firstName: "string",
    userId: "string",
  });

  const catalog = getAutomationTemplates(APP);
  const byName = Object.fromEntries(catalog.map((t) => [t.name, t]));

  const nurtureId = await createAndPublishTemplate(byName["automation-nurture-j3"]);
  const cancelId = await createAndPublishTemplate(
    byName["automation-subscription-canceled"],
  );

  const nurture = await api("POST", "/automations", {
    name: "Nurture — pas d’abo J+3",
    status: "enabled",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { event_name: "user.signed_up" },
      },
      {
        key: "wait_paid",
        type: "wait_for_event",
        config: {
          event_name: "subscription.started",
          timeout: "3 days",
        },
      },
      {
        key: "send_nurture",
        type: "send_email",
        config: {
          from: FROM,
          subject: byName["automation-nurture-j3"].subject,
          reply_to: REPLY,
          template: {
            id: nurtureId,
            variables: {
              GREETING: { var: "event.firstName" },
            },
          },
        },
      },
    ],
    connections: [
      { from: "start", to: "wait_paid", type: "default" },
      { from: "wait_paid", to: "send_nurture", type: "timeout" },
    ],
  });
  console.log("automation nurture:", nurture.id);

  const cancel = await api("POST", "/automations", {
    name: "Après annulation abo",
    status: "enabled",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { event_name: "subscription.canceled" },
      },
      {
        key: "send_cancel",
        type: "send_email",
        config: {
          from: FROM,
          subject: byName["automation-subscription-canceled"].subject,
          reply_to: REPLY,
          template: {
            id: cancelId,
            variables: {
              GREETING: { var: "event.firstName" },
            },
          },
        },
      },
    ],
    connections: [{ from: "start", to: "send_cancel", type: "default" }],
  });
  console.log("automation cancel:", cancel.id);

  console.log("\nOK — automations enabled. Design update: npm run email:republish");
  console.log("Dashboard: https://resend.com/automations");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
