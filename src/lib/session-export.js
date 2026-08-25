/**
 * Export séance — texte (Strava / WhatsApp) et impression bord de bassin.
 */
import { buildWorkoutView } from "./workout-display.js";

const SECTION_ORDER = ["warm", "main", "cool"];

function formatDurationLabel(duration) {
  if (duration == null || duration === "") return "";
  if (typeof duration === "number") return `${duration} min`;
  return String(duration);
}

/**
 * Texte plat structuré (3 phases) — collable dans Strava / WhatsApp.
 * @param {object} session
 * @param {{ withBrandFooter?: boolean }} [opts]
 */
export function formatSessionPlainText(session, opts = {}) {
  const withBrandFooter = opts.withBrandFooter !== false;
  if (!session) return "";
  const view = buildWorkoutView(session);
  const head = [
    `${session.title || "Séance"}${session.distance ? ` — ${session.distance}` : ""}${session.duration ? ` — ${formatDurationLabel(session.duration)}` : ""}`.trim(),
  ];
  if (session.type) head.push(String(session.type));
  if (session.intensity) head.push(String(session.intensity));
  head.push("");

  const body = [];
  for (const sid of SECTION_ORDER) {
    const section = (view.sections || []).find((s) => s.id === sid);
    if (!section?.exercises?.length) continue;
    const meters = section.meters > 0 ? ` · ${section.meters} m` : "";
    body.push(`▸ ${section.label}${meters}`);
    for (const ex of section.exercises) {
      const line = (ex.main || ex.raw || "").trim();
      if (line) body.push(`  ${line}`);
      if (ex.restLabel) body.push(`    ${ex.restLabel}`);
      for (const child of ex.children || []) {
        if (child.main) body.push(`    · ${child.main}`);
      }
    }
    body.push("");
  }

  if (!body.length) {
    const details = Array.isArray(session.details) ? session.details : [];
    details.forEach((d) => {
      const t = String(d || "").trim();
      if (t) body.push(t);
    });
    body.push("");
  }

  if (withBrandFooter) body.push("— MySWYM · myswym.app");
  return [...head, ...body].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** HTML impression A4 / mobile — gros caractères bord de bassin. */
export function buildSessionPrintHtml(session) {
  const view = buildWorkoutView(session || {});
  const title = escapeHtml(session?.title || "Séance");
  const meta = [
    session?.distance,
    formatDurationLabel(session?.duration),
    session?.type,
    session?.intensity,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

  const sectionsHtml = SECTION_ORDER.map((sid) => {
    const section = (view.sections || []).find((s) => s.id === sid);
    if (!section?.exercises?.length) return "";
    const meters = section.meters > 0 ? ` <span class="m">${section.meters} m</span>` : "";
    const items = section.exercises
      .map((ex) => {
        const main = escapeHtml(ex.main || ex.raw || "");
        const rest = ex.restLabel ? `<div class="rest">${escapeHtml(ex.restLabel)}</div>` : "";
        const kids = (ex.children || [])
          .map((c) => (c.main ? `<div class="sub">· ${escapeHtml(c.main)}</div>` : ""))
          .join("");
        return `<li><div class="ex">${main}</div>${rest}${kids}</li>`;
      })
      .join("");
    return `<section><h2>${escapeHtml(section.label)}${meters}</h2><ol>${items}</ol></section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} — MySWYM</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px 20px 40px; font-family: Georgia, "Times New Roman", serif; color: #0b1220; background: #fff; }
  .brand { font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #0057FF; margin-bottom: 8px; }
  h1 { font-size: 28px; line-height: 1.15; margin: 0 0 8px; }
  .meta { font-family: system-ui, sans-serif; font-size: 14px; color: #445; margin-bottom: 28px; }
  section { margin-bottom: 22px; break-inside: avoid; }
  h2 { font-family: system-ui, sans-serif; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #0057FF; margin: 0 0 10px; border-bottom: 2px solid #e8eefc; padding-bottom: 6px; }
  h2 .m { color: #667; font-weight: 600; letter-spacing: 0; text-transform: none; }
  ol { margin: 0; padding: 0 0 0 1.2em; }
  li { margin: 0 0 12px; }
  .ex { font-size: 18px; line-height: 1.35; }
  .rest, .sub { font-family: system-ui, sans-serif; font-size: 13px; color: #556; margin-top: 4px; }
  .foot { margin-top: 32px; font-family: system-ui, sans-serif; font-size: 11px; color: #889; }
  @media print {
    body { padding: 12mm; }
    .noprint { display: none !important; }
  }
</style>
</head>
<body>
  <div class="brand">MySWYM</div>
  <h1>${title}</h1>
  ${meta ? `<div class="meta">${meta}</div>` : ""}
  ${sectionsHtml || "<p>Détail de séance indisponible.</p>"}
  <div class="foot">myswym.app · Impression personnelle</div>
  <script>window.addEventListener("load",()=>{try{window.print()}catch(e){}});</script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Ouvre une fenêtre d’impression (ou nouvel onglet). */
export function openSessionPrint(session) {
  if (typeof window === "undefined" || !session) return false;
  const html = buildSessionPrintHtml(session);
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/**
 * Copie dans le presse-papiers (async).
 * @param {object} session
 * @param {string} [textOverride] — si fourni, copie ce texte tel quel
 * @returns {Promise<boolean>}
 */
export async function copySessionText(session, textOverride = null) {
  const text = textOverride || formatSessionPlainText(session);
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
