/**
 * Export séance, texte (Strava / WhatsApp) et impression bord de bassin.
 * Impression = même vue que WorkoutPrepView / WorkoutExerciseCard.
 */
import { buildWorkoutView } from "./workout-display.js";
import { humanizeArthurDisplayTerms } from "./sports-engine/session-labels.js";
import {
  fourNagesDisplayCue,
  parseRepMetersFromVolumeLabel,
} from "./natation-sheet/parse.js";

const SECTION_ORDER = ["warm", "main", "cool"];

const EQUIPMENT_LABELS = {
  planche: "Planche",
  pull: "Pull-buoy",
  palmes: "Palmes",
  tuba: "Tuba",
  plaquettes: "Plaquettes",
  plaquettes_doigts: "Plaquettes doigts",
  elastique: "Élastique chevilles",
};

const ALLURE_PRINT_LABEL = {
  enchainement: "Enchaînement",
  souple: "Facile",
  lent: "Lent",
  moyen: "Moyen",
  progressif: "Progressif",
  vite: "Vite",
  abloc: "À bloc",
  sprint: "Sprint",
};

const ALLURE_CHIP_ORDER = [
  "enchainement",
  "souple",
  "lent",
  "moyen",
  "progressif",
  "vite",
  "abloc",
  "sprint",
];

function nageurText(value) {
  let out = humanizeArthurDisplayTerms(value);
  out = out.replace(/\bZ2\b/gi, "confortable");
  out = out.replace(/\bZ3\b/gi, "soutenu");
  out = out.replace(/\bZ4\b/gi, "rapide");
  return out;
}

function capitalizeCue(cue) {
  const s = String(cue || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pastilles allure, même détection que WorkoutExerciseCard. */
function printAllureKeys(exercise) {
  if (exercise?.allureEnchainement?.steps?.length >= 2) return ["enchainement"];
  const blob = `${exercise?.cue || ""} ${exercise?.main || ""} ${exercise?.raw || ""}`.toLowerCase();
  const found = new Set();
  const showSouplePill =
    exercise?.section !== "warm"
    && exercise?.kind !== "warm"
    && (exercise?.effortLabel === "souple" || exercise?.kind === "cool");
  if (showSouplePill || /\bsouple\b/.test(blob)) found.add("souple");
  if (/\blent\b/.test(blob)) found.add("lent");
  if (/\bmoyen\b/.test(blob) || /allure\s+r[eé]guli[eè]re/.test(blob)) found.add("moyen");
  if (/\bprogressif\b/.test(blob)) found.add("progressif");
  if (/\b(vite|rapide)\b/.test(blob)) found.add("vite");
  if (/\b(à\s*bloc|a\s*bloc)\b/.test(blob)) found.add("abloc");
  if (exercise?.sprint || /\bsprints?\b/.test(blob)) found.add("sprint");
  return ALLURE_CHIP_ORDER.filter((k) => found.has(k));
}

function formatPrintHeadline(ex) {
  const volume = ex.volumeLabel || (ex.meters ? `${ex.meters} m` : null);
  const stroke = ex.strokeLabel;
  const head = nageurText(volume || ex.main || "");
  if (stroke) return `${head} · ${nageurText(stroke)}`;
  return head;
}

function printDrills(ex) {
  if (Array.isArray(ex?.educatifs) && ex.educatifs.length) return ex.educatifs;
  if (ex?.educatif) return [ex.educatif];
  return [];
}

function formatPrintCue(ex) {
  const modeCue = fourNagesDisplayCue(ex.fourNagesMode, ex.volumeLabel);
  if (modeCue) return modeCue;
  const drills = printDrills(ex);
  if (drills.length > 1) return "4 éducatifs (1 / nage)";
  const blob = `${ex?.strokeLabel || ""} ${ex?.volumeLabel || ""} ${ex?.cue || ""}`;
  if (/4\s*nages/i.test(blob) && /25\s*m/i.test(ex?.cue || "") && /\+/.test(ex?.cue || "")) {
    return "4 éducatifs (1 / nage)";
  }
  const cue = capitalizeCue(ex.cue);
  return cue ? nageurText(cue) : "";
}

const FOUR_NAGES_STROKE_LABELS = ["papillon", "dos", "brasse", "crawl"];

/** Papier : 1 ligne par nage, selon le jeton Sheet. */
function formatPrintDrillLines(ex) {
  const drills = printDrills(ex);
  if (drills.length <= 1) return [];
  const mode = ex.fourNagesMode;
  const repMeters = parseRepMetersFromVolumeLabel(ex.volumeLabel)
    || (ex.meters ? Number(ex.meters) : null)
    || 50;
  const slice = mode?.sliceMeters || 25;
  return drills
    .map((d, i) => {
      const name = nageurText(d.name || d.nom || "").trim();
      if (!name) return "";
      const stroke = FOUR_NAGES_STROKE_LABELS[i];
      if (!stroke) return name;
      if (mode?.kind === "im") return `${slice} m ${stroke} : ${name}`;
      if (mode?.kind === "drill_then_swim") {
        return `${repMeters} m ${stroke} : ${slice} m ${name} + ${slice} m ${stroke}`;
      }
      return `${repMeters} m ${stroke} : ${name}`;
    })
    .filter(Boolean);
}

function formatPrintChips(ex) {
  const chips = printAllureKeys(ex).map((k) => ALLURE_PRINT_LABEL[k]);
  if (ex.restChip && !ex.departLabel) chips.push(ex.restChip);
  if (ex.departLabel) chips.push(ex.departLabel);
  if (ex.allurePaceLabel) chips.push(ex.allurePaceLabel);
  if (ex.restLabel && !ex.restChip && !ex.departLabel) chips.push(ex.restLabel);
  if (ex.kind === "warm") chips.push("Facile");
  return [...new Set(chips.filter(Boolean))];
}

/**
 * Texte plat structuré (3 phases), collable dans Strava / WhatsApp.
 * @param {object} session
 * @param {{ withBrandFooter?: boolean }} [opts]
 */
export function formatSessionPlainText(session, opts = {}) {
  const withBrandFooter = opts.withBrandFooter !== false;
  if (!session) return "";
  const view = buildWorkoutView(session);
  const head = [
    `${view.header.title || "Séance"}${view.header.distanceLabel ? `, ${view.header.distanceLabel}` : ""}${view.header.durationLabel ? `, ${view.header.durationLabel}` : ""}`.trim(),
  ];
  if (view.header.intensityZone) head.push(nageurText(view.header.intensityZone));
  head.push("");

  const body = [];
  for (const sid of SECTION_ORDER) {
    const section = (view.sections || []).find((s) => s.id === sid);
    if (!section?.exercises?.length) continue;
    const meters = section.metersLabel ? ` · ${section.metersLabel}` : "";
    body.push(`▸ ${section.label}${meters}`);
    for (const ex of section.exercises) {
      const line = formatPrintHeadline(ex);
      if (line) body.push(`  ${line}`);
      const cue = formatPrintCue(ex);
      if (cue) body.push(`    ${cue}`);
      for (const drill of formatPrintDrillLines(ex)) {
        body.push(`    · ${drill}`);
      }
      const chips = formatPrintChips(ex);
      if (chips.length) body.push(`    ${chips.join(" · ")}`);
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

  if (withBrandFooter) body.push(",  MySWYM · myswym.app");
  return [...head, ...body].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** HTML impression, même contenu que la fiche séance in-app. */
export function buildSessionPrintHtml(session) {
  const view = buildWorkoutView(session || {});
  const title = escapeHtml(nageurText(view.header?.title || "Séance"));
  const meta = [
    view.header?.distanceLabel,
    view.header?.durationLabel,
    view.header?.intensityZone ? nageurText(view.header.intensityZone) : "",
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

  const equipmentLabel = (view.header?.equipment || [])
    .map((id) => EQUIPMENT_LABELS[id] || id)
    .filter(Boolean)
    .join(" · ");
  const gearHtml = equipmentLabel
    ? `<div class="gear">Matériel · ${escapeHtml(equipmentLabel)}</div>`
    : "";
  const cueHtml = view.header?.intensityCue
    ? `<div class="gear">Objectif · ${escapeHtml(nageurText(capitalizeCue(view.header.intensityCue)))}</div>`
    : "";
  const banner = session?.sheetWeekRole;
  const bannerHtml = banner?.banner
    ? `<div class="banner"><div class="banner-k">${escapeHtml(banner.label || "")}</div>${escapeHtml(nageurText(banner.banner))}</div>`
    : "";

  const sectionsHtml = (view.sections || []).map((section) => {
    if (!section?.exercises?.length) return "";
    const meters = section.metersLabel
      ? ` <span class="m">${escapeHtml(section.metersLabel)}</span>`
      : "";
    const items = section.exercises
      .map((ex) => {
        const headline = escapeHtml(formatPrintHeadline(ex));
        const cue = formatPrintCue(ex);
        const cueBlock = cue ? `<div class="cue">${escapeHtml(cue)}</div>` : "";
        const drills = formatPrintDrillLines(ex)
          .map((d) => `<div class="sub">${escapeHtml(d)}</div>`)
          .join("");
        const chips = formatPrintChips(ex)
          .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
          .join("");
        const chipBlock = chips ? `<div class="chips">${chips}</div>` : "";
        const n = ex.phaseIndex || ex.index || "";
        return `<li><span class="n">${n}</span><div class="body"><div class="ex">${headline}</div>${cueBlock}${drills}${chipBlock}</div></li>`;
      })
      .join("");
    return `<section><h2>${escapeHtml(section.label)}${meters}</h2><ol>${items}</ol></section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}, MySWYM</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px 20px 40px; font-family: ui-sans-serif, system-ui, sans-serif; color: #0b1220; background: #fff; }
  .brand { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #0057FF; margin-bottom: 8px; }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; margin: 0 0 8px; }
  .meta { font-size: 15px; font-weight: 700; color: #445; margin-bottom: 8px; }
  .gear { font-size: 13px; font-weight: 600; color: #556; margin: 0 0 4px; }
  .banner { margin: 12px 0 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid #d7e4fc; background: #f4f8ff; font-size: 13px; font-weight: 600; color: #334; line-height: 1.45; }
  .banner-k { font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px; color: #0b1220; }
  .stack { margin-bottom: 22px; }
  section { margin-bottom: 18px; break-inside: avoid; }
  h2 { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #3d8fff; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #d7e4fc; display: flex; justify-content: space-between; gap: 12px; }
  h2 .m { color: #667; font-weight: 700; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
  ol { margin: 0; padding: 0; list-style: none; }
  li { display: flex; gap: 10px; align-items: flex-start; margin: 0; padding: 10px 0; border-top: 1px solid #e8eef4; }
  li:first-child { border-top: none; padding-top: 2px; }
  .n { width: 22px; flex-shrink: 0; font-size: 13px; font-weight: 800; color: #3d8fff; font-variant-numeric: tabular-nums; text-align: right; line-height: 1.3; padding-top: 2px; }
  .body { flex: 1; min-width: 0; }
  .ex { font-size: 16px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; }
  .cue { font-size: 12px; font-weight: 600; color: #556; margin-top: 3px; line-height: 1.35; }
  .sub { font-size: 12px; font-weight: 600; color: #334; margin-top: 3px; line-height: 1.35; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 8px; background: #eef4ff; color: #0057FF; }
  .foot { margin-top: 28px; font-size: 11px; color: #889; }
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
  <div class="stack">
  ${bannerHtml}
  ${gearHtml}
  ${cueHtml}
  </div>
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

function printViaHiddenIframe(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Impression séance");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => {
    try { iframe.remove(); } catch { /* déjà retiré */ }
  };
  iframe.contentWindow?.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, 60_000);
  return true;
}

/**
 * Ouvre le dialogue d’impression (imprimante ou PDF).
 * Pas de `noopener` sur window.open : le handle serait null.
 */
export function openSessionPrint(session) {
  if (typeof window === "undefined" || !session) return false;
  const html = buildSessionPrintHtml(session);
  let w = null;
  try {
    w = window.open("", "_blank");
  } catch {
    w = null;
  }
  if (w?.document) {
    try {
      w.opener = null;
      w.document.open();
      w.document.write(html);
      w.document.close();
      return true;
    } catch {
      try { w.close(); } catch { /* ignore */ }
    }
  }
  return printViaHiddenIframe(html);
}

/**
 * Copie dans le presse-papiers (async).
 * @param {object} session
 * @param {string} [textOverride], si fourni, copie ce texte tel quel
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
