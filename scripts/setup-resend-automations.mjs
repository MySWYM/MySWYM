/**
 * One-shot: events + templates + automations Resend (nurture J+3 + cancel).
 * Usage: node --env-file=.env.local scripts/setup-resend-automations.mjs
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
    err.data = data;
    throw err;
  }
  return data;
}

function emailHtml({ title, paragraphs, ctaLabel }) {
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
        <a href="https://myswym.app/app" style="background:#355da3;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${ctaLabel}</a>
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
    console.log("event created:", name, data.id || data);
    return data;
  } catch (e) {
    if (e.status === 409 || String(e.message).includes("already")) {
      console.log("event exists:", name);
      return null;
    }
    // list and ignore if present
    console.warn("event create warn:", name, e.message);
    return null;
  }
}

async function createAndPublishTemplate({ name, subject, html, variables }) {
  const created = await api("POST", "/templates", {
    name,
    from: FROM,
    subject,
    html,
    reply_to: REPLY,
    variables,
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

  const nurtureId = await createAndPublishTemplate({
    name: "automation-nurture-j3",
    subject: "Ton plan MySWYM t’attend",
    html: emailHtml({
      title: "Ton plan continue quand tu veux",
      paragraphs: [
        "{{{GREETING}}}, ton plan MySWYM est toujours là — séances structurées, progression claire, sans te perdre.",
        "Premium débloque le programme complet, le multi-plans et les départs chronométrés. Essai 7 jours avec carte, puis 4,99 € / mois — tu peux annuler quand tu veux.",
        "Un clic et tu reprends exactement où tu en étais.",
      ],
      ctaLabel: "Reprendre mon plan",
    }),
    variables: [
      { key: "GREETING", type: "string", fallback_value: "Salut" },
    ],
  });

  const cancelId = await createAndPublishTemplate({
    name: "automation-subscription-canceled",
    subject: "On se dit à bientôt sur MySWYM",
    html: emailHtml({
      title: "Ton accès Premium est terminé",
      paragraphs: [
        "{{{GREETING}}}, ton abonnement MySWYM est bien annulé. Merci d’avoir nagé avec nous.",
        "Ton compte reste là : tu pourras reprendre un plan quand tu veux, sans tout recommencer.",
        "Si c’était un souci technique ou un doute, réponds à cet email — on est là.",
      ],
      ctaLabel: "Rouvrir MySWYM",
    }),
    variables: [
      { key: "GREETING", type: "string", fallback_value: "Salut" },
    ],
  });

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
          subject: "Ton plan MySWYM t’attend",
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
      // event_received → fin (pas de suite = stop)
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
          subject: "On se dit à bientôt sur MySWYM",
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
    connections: [
      { from: "start", to: "send_cancel", type: "default" },
    ],
  });
  console.log("automation cancel:", cancel.id);

  console.log("\nOK — automations enabled.");
  console.log("Dashboard: https://resend.com/automations");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
