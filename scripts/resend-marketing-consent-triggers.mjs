/**
 * Parrainage et Win-back : déclencheurs réservés aux nageurs qui ont accepté la newsletter.
 * subscription.started / subscription.canceled restent envoyés à tous (confirmation
 * d'annulation, arrêt du nurture) ; stripe-webhook émet en plus referral.eligible /
 * winback.eligible seulement avec newsletter_opt_in.
 *
 * Usage : node --env-file=.env.local scripts/resend-marketing-consent-triggers.mjs [--dry-run]
 */
const API = "https://api.resend.com";
const KEY = process.env.RESEND_API_KEY;
const DRY = process.argv.includes("--dry-run");

if (!KEY) {
  console.error("RESEND_API_KEY manquant");
  process.exit(1);
}

const TARGETS = [
  { namePrefix: "Parrainage", from: "subscription.started", to: "referral.eligible" },
  { namePrefix: "Win-back", from: "subscription.canceled", to: "winback.eligible" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body) {
  await sleep(600);
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
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

async function ensureEvent(name) {
  if (DRY) return console.log("[dry] event:", name);
  try {
    await api("POST", "/events", { name, schema: { firstName: "string", userId: "string" } });
    console.log("event created:", name);
  } catch (e) {
    console.log("event ok/exists:", name, e.status === 409 ? "(409)" : e.message?.slice(0, 100));
  }
}

async function main() {
  for (const t of TARGETS) await ensureEvent(t.to);

  const list = await api("GET", "/automations");
  const items = list.data || [];

  for (const t of TARGETS) {
    const hit = items.find((a) => String(a.name || "").startsWith(t.namePrefix));
    if (!hit) {
      console.log("introuvable:", t.namePrefix);
      continue;
    }
    const full = await api("GET", `/automations/${hit.id}`);
    const trigger = (full.steps || []).find((s) => s.type === "trigger");
    const current = trigger?.config?.event_name;
    if (current === t.to) {
      console.log("déjà ok:", full.name, "→", t.to);
      continue;
    }
    if (current !== t.from) {
      console.log("déclencheur inattendu, on ne touche pas:", full.name, current);
      continue;
    }
    const steps = full.steps.map((s) =>
      s.type === "trigger" ? { ...s, config: { ...s.config, event_name: t.to } } : s,
    );
    if (DRY) {
      console.log("[dry] basculerait:", full.name, current, "→", t.to);
      continue;
    }
    const wasEnabled = full.status === "enabled";
    if (wasEnabled) await api("PATCH", `/automations/${hit.id}`, { status: "disabled" });
    await api("PATCH", `/automations/${hit.id}`, { steps, connections: full.connections });
    if (wasEnabled) await api("PATCH", `/automations/${hit.id}`, { status: "enabled" });
    const check = await api("GET", `/automations/${hit.id}`);
    const now = (check.steps || []).find((s) => s.type === "trigger")?.config?.event_name;
    console.log("basculé:", check.name, current, "→", now, "| statut", check.status);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
