/**
 * Republish all MySWYM Resend automation templates (update in place by name)
 * and sync automation send_email subjects to match the catalog.
 *
 * Usage:
 *   node --env-file=.env.local scripts/republish-resend-templates.mjs
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

/** Automation display name → catalog template name */
const AUTOMATION_TO_TEMPLATE = {
  "Essai Premium — J+6 conversion": "automation-trial-j6",
  "Essai Premium — J+3 adaptation": "automation-trial-j3",
  "Essai Premium — J+1 première séance": "automation-trial-j1",
  "Comeback — 3j sans séance": "automation-comeback-session",
  "Parrainage — J+1 après abo": "automation-referral-invite",
  "Win-back — J+14 après cancel": "automation-winback-j14",
  "Essai — rappel J-1": "automation-trial-ending",
  "Activation — J+1 sans abo": "automation-activation-j1",
  "Après annulation abo": "automation-subscription-canceled",
  "Nurture — pas d’abo J+3": "automation-nurture-j3",
};

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

async function listAllTemplates() {
  const byName = new Map();
  let after;
  for (let page = 0; page < 20; page++) {
    const qs = after ? `?limit=100&after=${encodeURIComponent(after)}` : "?limit=100";
    const data = await api("GET", `/templates${qs}`);
    const items = data.data || data.templates || [];
    for (const t of items) {
      if (t?.name && t?.id) byName.set(t.name, t);
    }
    if (!items.length || items.length < 100) break;
    after = items[items.length - 1]?.id;
    if (!after) break;
  }
  return byName;
}

async function upsertTemplate(existing, { name, subject, html }) {
  const found = existing.get(name);
  const variables = [
    { key: "GREETING", type: "string", fallback_value: "Salut" },
  ];

  if (found?.id) {
    await api("PATCH", `/templates/${found.id}`, {
      name,
      from: FROM,
      subject,
      html,
      reply_to: REPLY,
      variables,
    });
    await api("POST", `/templates/${found.id}/publish`);
    console.log("template updated:", name, found.id);
    return found.id;
  }

  const created = await api("POST", "/templates", {
    name,
    from: FROM,
    subject,
    html,
    reply_to: REPLY,
    variables,
  });
  await api("POST", `/templates/${created.id}/publish`);
  console.log("template created:", name, created.id);
  existing.set(name, created);
  return created.id;
}

async function syncAutomationSubjects(catalogByName) {
  const list = await api("GET", "/automations");
  const items = list.data || list.automations || [];

  for (const a of items) {
    const tplKey = AUTOMATION_TO_TEMPLATE[a.name];
    if (!tplKey || !catalogByName[tplKey]) {
      console.log("automation skip:", a.name);
      continue;
    }
    const subject = catalogByName[tplKey].subject;
    const d = await api("GET", `/automations/${a.id}`);
    const current = d.steps?.find((s) => s.type === "send_email")?.config?.subject;
    if (current === subject) {
      console.log("subject ok:", a.name);
      continue;
    }

    const steps = d.steps.map((s) => {
      if (s.type !== "send_email") return s;
      return {
        ...s,
        config: {
          ...s.config,
          from: FROM,
          reply_to: REPLY,
          subject,
        },
      };
    });

    const wasEnabled = d.status === "enabled";
    if (wasEnabled) {
      await api("PATCH", `/automations/${a.id}`, { status: "disabled" });
    }
    await api("PATCH", `/automations/${a.id}`, {
      steps,
      connections: d.connections,
    });
    if (wasEnabled) {
      await api("PATCH", `/automations/${a.id}`, { status: "enabled" });
    }
    console.log("subject synced:", a.name, "→", subject);
  }
}

async function main() {
  const existing = await listAllTemplates();
  console.log(`Found ${existing.size} template(s) in Resend`);

  const catalog = getAutomationTemplates(APP);
  for (const tpl of catalog) {
    await upsertTemplate(existing, tpl);
  }

  const catalogByName = Object.fromEntries(catalog.map((t) => [t.name, t]));
  console.log("\nSyncing automation subjects…");
  await syncAutomationSubjects(catalogByName);

  console.log(`
OK — ${catalog.length} templates republished + subjects synced.
Dashboard: https://resend.com/templates
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
