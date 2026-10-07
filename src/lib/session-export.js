/**
 * Export séance, texte (Strava / WhatsApp) et impression bord de bassin.
 * Impression web = HTML compact (vise 1 page A4).
 * Sur Capacitor iOS : Share sheet PDF (window.print est un no-op en WKWebView).
 */
import { buildWorkoutView } from "./workout-display.js";
import { humanizeArthurDisplayTerms } from "./sports-engine/session-labels.js";
import {
  fourNagesDisplayCue,
  parseRepMetersFromVolumeLabel,
} from "./natation-sheet/parse.js";
import { isNativeIos } from "./native-platform.js";
import { translateSessionText } from "../i18n/session-terms.js";
import { translateDisplayText, translateDomTree } from "../i18n/dom-translate.js";

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
  return translateSessionText(out);
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
  const drills = printDrills(ex);
  const isFourNages = /4\s*nages/i.test(String(ex?.strokeLabel || ""));
  const modeCue = fourNagesDisplayCue(ex.fourNagesMode, ex.volumeLabel, {
    educatifCount: !isFourNages && drills.length > 1 ? drills.length : null,
  });
  if (modeCue) return modeCue;
  if (drills.length > 1) {
    return isFourNages ? "4 éducatifs (1 / nage)" : `${drills.length} éducatifs`;
  }
  const blob = `${ex?.strokeLabel || ""} ${ex?.volumeLabel || ""} ${ex?.cue || ""}`;
  if (/4\s*nages/i.test(blob) && /25\s*m/i.test(ex?.cue || "") && /\+/.test(ex?.cue || "")) {
    return "4 éducatifs (1 / nage)";
  }
  const cue = capitalizeCue(ex.cue);
  return cue ? nageurText(cue) : "";
}

const FOUR_NAGES_STROKE_LABELS = ["papillon", "dos", "brasse", "crawl"];

/** Papier : 1 ligne par nage (4 nages) ou par éducatif (round-robin Soft). */
function formatPrintDrillLines(ex) {
  const drills = printDrills(ex);
  if (drills.length <= 1) return [];
  const mode = ex.fourNagesMode;
  const isFourNages = /4\s*nages/i.test(String(ex?.strokeLabel || ""));
  const repMeters = parseRepMetersFromVolumeLabel(ex.volumeLabel)
    || (ex.meters ? Number(ex.meters) : null)
    || 50;
  const slice = mode?.sliceMeters || 25;
  return drills
    .map((d, i) => {
      const name = nageurText(d.name || d.nom || "").trim();
      if (!name) return "";
      if (!isFourNages) {
        if (mode?.kind === "drill_then_swim") {
          return `${repMeters} m : ${slice} m ${name} + ${slice} m nage`;
        }
        return name;
      }
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
  const chips = printAllureKeys(ex).map((k) => translateSessionText(ALLURE_PRINT_LABEL[k]));
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
    body.push(`▸ ${translateSessionText(section.label)}${meters}`);
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

/** Nom de fichier pour Share / téléchargement. */
export function sessionPrintFilename(session, now = new Date(), ext = "pdf") {
  const view = buildWorkoutView(session || {});
  const raw = String(view.header?.title || "seance")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const safeExt = String(ext || "pdf").replace(/^\./, "").toLowerCase() || "pdf";
  return `myswym-${raw || "seance"}-${y}${m}${d}.${safeExt}`;
}

/**
 * PDF texte propre (A4), bord de bassin.
 * @param {object} session
 * @returns {Promise<Blob>}
 */
export async function buildSessionPrintPdf(session) {
  const { jsPDF } = await import("jspdf");
  const view = buildWorkoutView(session || {});
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const marginTop = 16;
  const marginBottom = 16;
  const contentW = pageW - marginX * 2;
  let y = marginTop;

  const ensureSpace = (needMm) => {
    if (y + needMm <= pageH - marginBottom) return;
    doc.addPage();
    y = marginTop;
  };

  const writeWrapped = (text, { size = 10, style = "normal", color = [28, 35, 51], gap = 4, indent = 0 } = {}) => {
    const line = String(text || "").trim();
    if (!line) return;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(translateDisplayText(line), contentW - indent);
    const lineH = size * 0.42;
    ensureSpace(lines.length * lineH + 1);
    doc.text(lines, marginX + indent, y);
    y += lines.length * lineH + gap;
  };

  const title = nageurText(view.header?.title || "Séance");
  const meta = [
    view.header?.distanceLabel,
    view.header?.durationLabel,
    view.header?.intensityZone ? nageurText(view.header.intensityZone) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  writeWrapped("MySWYM", { size: 9, style: "bold", color: [37, 99, 235], gap: 3 });
  writeWrapped(title, { size: 16, style: "bold", color: [15, 23, 42], gap: 3 });
  if (meta) writeWrapped(meta, { size: 10, color: [71, 85, 105], gap: 3 });

  const equipmentLabel = (view.header?.equipment || [])
    .map((id) => translateSessionText(EQUIPMENT_LABELS[id] || id))
    .filter(Boolean)
    .join(" · ");
  if (equipmentLabel) {
    writeWrapped(`${translateSessionText("Matériel")} · ${equipmentLabel}`, {
      size: 9,
      color: [71, 85, 105],
      gap: 2,
    });
  }
  if (view.header?.intensityCue) {
    writeWrapped(
      `${translateSessionText("Objectif")} · ${nageurText(capitalizeCue(view.header.intensityCue))}`,
      { size: 9, color: [71, 85, 105], gap: 2 },
    );
  }
  const banner = session?.sheetWeekRole;
  if (banner?.banner) {
    const bannerLine = [banner.label, nageurText(banner.banner)].filter(Boolean).join(" · ");
    writeWrapped(bannerLine, { size: 9, style: "italic", color: [51, 65, 85], gap: 3 });
  }

  y += 2;
  ensureSpace(2);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  for (const sid of SECTION_ORDER) {
    const section = (view.sections || []).find((s) => s.id === sid);
    if (!section?.exercises?.length) continue;
    const meters = section.metersLabel ? ` · ${section.metersLabel}` : "";
    writeWrapped(`${translateSessionText(section.label)}${meters}`, {
      size: 11,
      style: "bold",
      color: [15, 23, 42],
      gap: 3,
    });

    for (const ex of section.exercises) {
      const n = ex.phaseIndex || ex.index || "";
      const headline = formatPrintHeadline(ex);
      writeWrapped(n ? `${n}. ${headline}` : headline, {
        size: 10,
        style: "bold",
        color: [30, 41, 59],
        gap: 1.5,
        indent: 2,
      });
      const cue = formatPrintCue(ex);
      if (cue) {
        writeWrapped(cue, { size: 9, color: [51, 65, 85], gap: 1.2, indent: 6 });
      }
      for (const drill of formatPrintDrillLines(ex)) {
        writeWrapped(`· ${drill}`, { size: 9, color: [71, 85, 105], gap: 1, indent: 6 });
      }
      const chips = formatPrintChips(ex);
      if (chips.length) {
        writeWrapped(chips.join(" · "), { size: 8, color: [100, 116, 139], gap: 2.5, indent: 6 });
      } else {
        y += 1.5;
      }
    }
    y += 2;
  }

  if (!(view.sections || []).some((s) => s?.exercises?.length)) {
    const details = Array.isArray(session?.details) ? session.details : [];
    for (const d of details) {
      const t = String(d || "").trim();
      if (t) writeWrapped(t, { size: 10, color: [30, 41, 59], gap: 2 });
    }
  }

  y += 4;
  ensureSpace(8);
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageW - marginX, y);
  y += 5;
  writeWrapped("MySWYM · myswym.app", { size: 8, color: [148, 163, 184], gap: 0 });

  return doc.output("blob");
}

/**
 * HTML impression compacte (vise 1 page A4).
 * @param {object} session
 * @param {{ autoPrint?: boolean }} [opts] autoPrint=false pour Share iOS (pas de window.print).
 */
/** La fiche imprimée est du HTML hors écran : on la traduit avant de l’ouvrir. */
function translatePrintHtml(html) {
  try {
    if (typeof DOMParser === "undefined") return html;
    const parsed = new DOMParser().parseFromString(html, "text/html");
    translateDomTree(parsed.documentElement);
    return `<!doctype html>${parsed.documentElement.outerHTML}`;
  } catch {
    return html;
  }
}

export function buildSessionPrintHtml(session, opts = {}) {
  const autoPrint = opts.autoPrint !== false;
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
    .map((id) => translateSessionText(EQUIPMENT_LABELS[id] || id))
    .filter(Boolean)
    .join(" · ");
  const gearBits = [];
  if (equipmentLabel) gearBits.push(`${escapeHtml(translateSessionText("Matériel"))} · ${escapeHtml(equipmentLabel)}`);
  if (view.header?.intensityCue) {
    gearBits.push(`${escapeHtml(translateSessionText("Objectif"))} · ${escapeHtml(nageurText(capitalizeCue(view.header.intensityCue)))}`);
  }
  const gearHtml = gearBits.length
    ? `<div class="gear">${gearBits.join(" · ")}</div>`
    : "";
  const banner = session?.sheetWeekRole;
  const bannerHtml = banner?.banner
    ? `<div class="banner">${escapeHtml(banner.label || "")}${banner.label ? " · " : ""}${escapeHtml(nageurText(banner.banner))}</div>`    : "";

  const sectionsHtml = (view.sections || []).map((section) => {
    if (!section?.exercises?.length) return "";
    const phaseClass =
      section.id === "warm" ? "is-warm"
        : section.id === "cool" ? "is-cool"
          : "is-main";
    const meters = section.metersLabel
      ? ` <span class="m">${escapeHtml(section.metersLabel)}</span>`
      : "";
    const items = section.exercises
      .map((ex) => {
        const headline = escapeHtml(formatPrintHeadline(ex));
        const cue = formatPrintCue(ex);
        const drills = formatPrintDrillLines(ex);
        const chips = formatPrintChips(ex);
        const chipTxt = chips.length
          ? ` <span class="chips">${chips.map((c) => escapeHtml(c)).join(" · ")}</span>`
          : "";
        const n = ex.phaseIndex || ex.index || "";
        const extras = [
          cue ? `<div class="cue">${escapeHtml(cue)}</div>` : "",
          ...drills.map((d) => `<div class="sub">${escapeHtml(d)}</div>`),
        ].join("");
        return `<li><span class="n">${n}</span><div class="body"><div class="ex">${headline}${chipTxt}</div>${extras}</div></li>`;
      })
      .join("");
    return `<section class="${phaseClass}"><h2>${escapeHtml(translateSessionText(section.label))}${meters}</h2><ol>${items}</ol></section>`;
  }).join("");

  const origin =
    (typeof window !== "undefined" && window.location?.origin)
      ? window.location.origin
      : "https://www.myswym.app";
  const wordUrl = `${origin}/logo-myswym-on-light.png`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}, MySWYM</title>
<style>
  @page { margin: 10mm 12mm; size: A4; }
  :root {
    color-scheme: light;
    --ink: #0f1b2d;
    --muted: #4a5d72;
    --blue: #006bfd;
    --mint: #1fae86;
    --coral: #e85a68;
    --line: rgba(15, 27, 45, 0.12);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 12px 14px;
    font-family: Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--ink);
    background: #fff;
    font-size: 11px;
    line-height: 1.25;
    -webkit-font-smoothing: antialiased;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid var(--ink);
  }
  .brand img {
    height: 14px;
    width: auto;
    display: block;
    position: relative;
    top: 1px;
  }
  h1 {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0;
  }
  .meta {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    margin: 0 0 4px;
    font-variant-numeric: tabular-nums;
  }
  .gear, .banner {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted);
    margin: 0 0 3px;
    line-height: 1.3;
  }
  .banner { color: var(--blue); }
  section {
    margin: 8px 0 0;
    padding: 0;
    border: none;
    background: none;
  }
  section.is-warm { --phase: var(--blue); }
  section.is-main { --phase: var(--coral); }
  section.is-cool { --phase: var(--mint); }
  h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--phase, var(--blue));
    margin: 0 0 2px;
    padding: 0 0 2px;
    border-bottom: 1px solid color-mix(in srgb, var(--phase, var(--blue)) 35%, transparent);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  h2 .m {
    color: var(--muted);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    font-size: 10px;
  }
  ol { margin: 0; padding: 0; list-style: none; }
  li {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    margin: 0;
    padding: 3px 0;
    border-bottom: 1px solid var(--line);
  }
  li:last-child { border-bottom: none; }
  .n {
    width: 14px;
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 700;
    color: var(--phase, var(--blue));
    font-variant-numeric: tabular-nums;
    text-align: right;
    line-height: 1.35;
  }
  .body { flex: 1; min-width: 0; }
  .ex {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ink);
  }
  .chips {
    font-weight: 600;
    color: var(--muted);
  }
  .cue, .sub {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted);
    margin-top: 1px;
    line-height: 1.3;
  }
  .sub { color: var(--ink); }
  .foot {
    margin-top: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--line);
    font-size: 9px;
    font-weight: 500;
    color: var(--muted);
    text-align: right;
  }
  @media print {
    body { padding: 0; }
    .noprint { display: none !important; }
  }
</style>
</head>
<body>
  <div class="head">
    <span class="brand"><img src="${escapeHtml(wordUrl)}" alt="MySWYM" height="14" width="60"/></span>
    <h1>${title}</h1>
  </div>
  ${meta ? `<div class="meta">${meta}</div>` : ""}
  ${bannerHtml}
  ${gearHtml}
  ${sectionsHtml || "<p>Détail de séance indisponible.</p>"}
  <div class="foot">myswym.app</div>
  ${autoPrint ? `<script>
    window.addEventListener("load", () => {
      const imgs = Array.from(document.images || []);
      Promise.all(imgs.map((img) => (
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => { img.onload = img.onerror = resolve; })
      ))).then(() => { try { window.print(); } catch (e) {} });
    });
  </script>` : ""}
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
 * Share sheet iOS (AirPrint / Fichiers / Messages).
 * window.print() ne marche pas dans le WKWebView Capacitor.
 * @returns {Promise<{ ok: boolean, shared?: boolean, aborted?: boolean, reason?: string }>}
 */
export async function shareSessionPrint(session) {
  if (typeof window === "undefined" || !session) {
    return { ok: false, reason: "unavailable" };
  }
  const filename = sessionPrintFilename(session, new Date(), "pdf");
  const title = "Séance MySWYM";
  const shareText = "Fiche bord de bassin MySWYM";

  try {
    const pdfBlob = await buildSessionPrintPdf(session);
    const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile], title, text: shareText });
      return { ok: true, shared: true };
    }
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: true, shared: false, aborted: true };
    }
  }

  try {
    const plain = formatSessionPlainText(session);
    const txtName = filename.replace(/\.pdf$/i, ".txt");
    const txtFile = new File([plain], txtName, { type: "text/plain" });
    if (navigator.canShare?.({ files: [txtFile] })) {
      await navigator.share({ files: [txtFile], title, text: shareText });
      return { ok: true, shared: true };
    }
    if (navigator.share) {
      await navigator.share({ title, text: plain });
      return { ok: true, shared: true };
    }
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: true, shared: false, aborted: true };
    }
  }

  return { ok: false, reason: "share_unavailable" };
}

/**
 * Impression web (dialogue) ou Share sheet sur Capacitor iOS.
 * Pas de `noopener` sur window.open : le handle serait null.
 * @returns {Promise<{ ok: boolean, shared?: boolean, printed?: boolean, aborted?: boolean, reason?: string }>}
 */
export async function openSessionPrint(session) {
  if (typeof window === "undefined" || !session) {
    return { ok: false, reason: "unavailable" };
  }
  if (isNativeIos()) {
    return shareSessionPrint(session);
  }
  const html = translatePrintHtml(buildSessionPrintHtml(session));
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
      return { ok: true, printed: true };
    } catch {
      try { w.close(); } catch { /* ignore */ }
    }
  }
  const viaIframe = printViaHiddenIframe(html);
  return viaIframe ? { ok: true, printed: true } : { ok: false, reason: "print_blocked" };
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
