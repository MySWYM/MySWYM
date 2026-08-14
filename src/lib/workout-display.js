/**
 * Affichage séance — parse rétrocompatible des `details` string[] existants.
 * Ne modifie pas le moteur : lecture seule pour l’UI.
 */
import { toCoachDetailLines } from "./sports-engine/coach-restitution.js";
import { prettifySessionDetailLine } from "./sports-engine/session-labels.js";
import { matchEducatif } from "../content/educatifs-catalog.js";

const REST_CHUNK_RE = /^(R\d+["']?|repos\s+\d+\s*(?:s|sec|min)?|D(?:toutes les )?\d+['′]\d+"|D\d+")$/i;
const SWIM_SET_PART_RE = /^(?:\d+\s*[x×]\s*\d+\s*m|\d+\s*m)\b/i;

/** Même logique que PyramidBlockViz.parsePyramidLine (copie pure JS pour tests Node). */
export function parsePyramidLine(raw) {
  const text = String(raw || "").replace(/^[\s\-–—·]+/, "").trim();
  if (!/pyramide/i.test(text)) return null;
  const arrowMatch = text.match(/(\d+(?:\s*→\s*\d+)+)/);
  let steps = [];
  if (arrowMatch) {
    steps = arrowMatch[1]
      .split(/\s*→\s*/)
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  if (steps.length < 3) {
    const dotted = [...text.matchAll(/(\d+)\s*m\b/gi)].map((m) => parseInt(m[1], 10));
    if (dotted.length >= 4) {
      const maybeVol = dotted[0];
      const rest = dotted.slice(1);
      const sumRest = rest.reduce((a, b) => a + b, 0);
      steps = Math.abs(sumRest - maybeVol) <= 50 ? rest : dotted;
    }
  }
  if (steps.length < 3) return null;
  const volume = steps.reduce((a, b) => a + b, 0);
  const peak = Math.max(...steps);
  const restMatch = text.match(/repos\s+(\d+(?:\s*[–\-]\s*\d+)?)\s*s/i);
  const labelMatch = text.match(/pyramide\s+([^:—–]+)/i);
  return {
    steps,
    peak,
    volume,
    rest: restMatch ? `repos ${restMatch[1]}s` : null,
    label: (labelMatch?.[1] || "crawl").trim(),
  };
}

export function stripDetailPrefix(raw) {
  return String(raw || "").trim().replace(/^[-–—·]\s*/, "");
}

export function classifyDetailLine(raw) {
  const full = String(raw || "");
  const trimmed = full.trim();
  if (!trimmed) return "empty";
  const body = stripDetailPrefix(trimmed);
  const isSubPrefix = /^[·]/.test(trimmed) || (/^\s/.test(full) && !/^[-–—]/.test(trimmed));
  if (isSubPrefix) return "sub";
  const isNx = /^\d+\s*[x×]\s*\d+/i.test(body) || /^\d+\s*[x×]\s*\(/i.test(body);
  if (/^\d+\s*m\b/i.test(body) && !isNx) return "header";
  return "work";
}

function estimateSetPartMeters(part) {
  const t = String(part);
  let m = t.match(/(\d+)\s*[x×]\s*(\d+)\s*m/i);
  if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
  m = t.match(/(\d+)\s*m\b/i);
  return m ? parseInt(m[1], 10) : 0;
}

export function expandCompoundDetailLines(details = []) {
  const source = toCoachDetailLines(details);
  const out = [];
  for (const raw of source) {
    const full = String(raw ?? "");
    const text = full.trim();
    if (!text) continue;
    if (/^[·]/.test(text) || (/^\s/.test(full) && !/^[-–—]/.test(text))) {
      out.push(full.startsWith("  ") ? full : `  ${text}`);
      continue;
    }
    const emParts = text.replace(/^[-–—]\s*/, "").split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
    const swimMain = emParts[0] || text.replace(/^[-–—]\s*/, "");
    const cues = emParts.slice(1);
    const parts = swimMain.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
    const allSets = parts.length >= 2 && parts.every((p) => SWIM_SET_PART_RE.test(p));
    if (allSets) {
      const total = parts.reduce((a, p) => a + estimateSetPartMeters(p), 0);
      const cueStr = cues.join(" — ");
      out.push(total > 0 ? `-${total}m${cueStr ? ` — ${cueStr}` : ""} :` : `-Série${cueStr ? ` — ${cueStr}` : ""} :`);
      parts.forEach((p) => out.push(`  · ${p}`));
    } else {
      out.push(text);
    }
  }
  return out.map((line) => prettifySessionDetailLine(line));
}

export function groupSessionDetails(details = []) {
  const groups = [];
  let i = 0;
  while (i < details.length) {
    const raw = details[i];
    const kind = classifyDetailLine(raw);
    if (kind === "empty") { i += 1; continue; }
    if (kind === "header") {
      const children = [];
      i += 1;
      while (i < details.length && classifyDetailLine(details[i]) === "sub") {
        children.push(details[i]);
        i += 1;
      }
      groups.push({ type: "block", header: raw, children });
      continue;
    }
    if (kind === "sub") {
      groups.push({ type: "work", lines: [raw] });
      i += 1;
      continue;
    }
    const lines = [raw];
    i += 1;
    while (i < details.length && classifyDetailLine(details[i]) === "work") {
      lines.push(details[i]);
      i += 1;
    }
    groups.push({ type: "work", lines });
  }
  return groups;
}

export function parseIntensity(raw) {
  if (!raw) return { zone: null, cue: null };
  const parts = String(raw).split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return { zone: null, cue: null };
  return { zone: parts[0], cue: parts.slice(1).join(". ") || null };
}

export function parseSessionDetail(raw) {
  const text = stripDetailPrefix(raw);
  if (!text) return null;

  let kind = "work";
  let label = null;
  let body = text;

  if (/^échauffement\s*:/i.test(text)) {
    kind = "warm";
    label = "Échauffement";
    body = text.replace(/^échauffement\s*:\s*/i, "");
  } else if (/^retour(\s+au\s+calme)?\s*:/i.test(text)) {
    kind = "cool";
    label = "Retour au calme";
    body = text.replace(/^retour(\s+au\s+calme)?\s*:\s*/i, "");
  }

  body = body.replace(/\s*:\s*$/, "");
  const chunks = body.split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
  let main = chunks[0] || body;
  const restParts = [];
  const cues = [];

  for (let i = 1; i < chunks.length; i++) {
    const c = chunks[i];
    if (REST_CHUNK_RE.test(c)) restParts.push(c.replace(/^Dtoutes les /i, "D"));
    else cues.push(c.replace(/\s*·\s*/g, " · ").replace(/\s+/g, " ").trim());
  }

  if (!restParts.length) {
    const embedded = main.match(/\s+(R\d+["']?|repos\s+\d+\s*(?:s|sec|min)?|D(?:toutes les )?\d+['′]\d+"|D\d+")\s*$/i);
    if (embedded) {
      restParts.push(embedded[1].replace(/^Dtoutes les /i, "D"));
      main = main.slice(0, embedded.index).trim();
    }
  }

  let steps = null;
  const stepSource = main.includes(":") ? main.slice(main.indexOf(":") + 1).trim() : main;
  const stepSplit = stepSource.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
  const isProgressiveChip = (s) =>
    s.length <= 14 && /^\d/.test(s) && !/\d+\s*m\b/i.test(s) && !/\d+\s*[x×]/i.test(s);
  if (stepSplit.length >= 3 && stepSplit.every(isProgressiveChip)) {
    steps = stepSplit;
    main = main.includes(":") ? main.slice(0, main.indexOf(":")).trim() : null;
  }

  return {
    kind,
    label,
    main,
    steps,
    rest: restParts[0] || null,
    cues,
  };
}

export function parseMetersFromLine(text) {
  const t = String(text || "");
  const nxm = t.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
  if (nxm) return parseInt(nxm[1], 10) * parseInt(nxm[2], 10);
  const pyramid = parsePyramidLine(t);
  if (pyramid?.volume) return pyramid.volume;
  const single = t.match(/(\d+)\s*m\b/i);
  return single ? parseInt(single[1], 10) : 0;
}

export function formatDurationShort(mins) {
  const n = Number(mins) || 0;
  if (n <= 0) return null;
  if (n < 60) return `~${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `~${h}h${String(m).padStart(2, "0")}` : `~${h}h`;
}

export function formatRestLabel(rest) {
  if (!rest) return null;
  const s = String(rest);
  if (/^D/i.test(s)) return s.replace(/^D/i, "Départ ");
  if (/^R(\d+)/i.test(s)) return `Récup. ${s.replace(/^R/i, "")}`;
  if (/repos/i.test(s)) return s.replace(/repos/i, "Récup.");
  return s;
}

/** Extrait « 8 × 50 m » et « CRAWL » d’un main pour la hiérarchie visuelle. */
export function splitHeadline(main) {
  if (!main) return { volume: null, stroke: null, rest: main };
  let text = String(main).trim();
  let volume = null;
  const nx = text.match(/^(\d+\s*[x×]\s*\d+\s*m)\b/i);
  const sm = text.match(/^(\d+\s*m)\b/i);
  if (nx) {
    volume = nx[1].replace(/x/gi, "×").replace(/\s+/g, " ");
    text = text.slice(nx[0].length).trim();
  } else if (sm) {
    volume = sm[1].replace(/\s+/g, " ");
    text = text.slice(sm[0].length).trim();
  }
  text = text.replace(/^[-–—·:,]\s*/, "");
  const strokeMatch = text.match(/^(crawl|dos|brasse|papillon|nl|mix|4\s*nages|médley|im)\b/i);
  let stroke = null;
  if (strokeMatch) {
    stroke = strokeMatch[1].toUpperCase().replace(/\s+/g, " ");
    if (stroke === "NL") stroke = "CRAWL";
    text = text.slice(strokeMatch[0].length).trim().replace(/^[-–—·:,]\s*/, "");
  }
  return { volume, stroke, rest: text || null };
}

function sectionForKind(kind, cues, main) {
  if (kind === "warm") return "warm";
  if (kind === "cool") return "cool";
  const blob = `${main || ""} ${ (cues || []).join(" ") }`.toLowerCase();
  if (/échauff|souple|mise en route/.test(blob)) return "warm";
  if (/retour|calme|récupération/.test(blob)) return "cool";
  return "main";
}

/**
 * Construit la vue workout à partir d’une séance existante (rétrocompatible).
 * @returns {{ header, sections, exercises, totalMeters }}
 */
export function buildWorkoutView(session = {}) {
  const intensity = parseIntensity(session.intensity);
  const lines = expandCompoundDetailLines(session.details || []);
  const groups = groupSessionDetails(lines);
  const exercises = [];
  let index = 0;

  const pushExercise = ({ raw, parsed, children = [], section }) => {
    const pyramid = parsePyramidLine(raw) || (children[0] ? parsePyramidLine(children[0]) : null);
    const childParsed = children.map((c) => parseSessionDetail(c)).filter(Boolean);
    const meters =
      pyramid?.volume ||
      parseMetersFromLine(parsed?.main || raw) ||
      childParsed.reduce((a, c) => a + parseMetersFromLine(c.main), 0);
    const headline = splitHeadline(parsed?.main);
    const cuePrimary = parsed?.cues?.[0] || headline.rest || null;
    const educatif = matchEducatif([parsed?.main, cuePrimary, ...(parsed?.cues || []), ...childParsed.map((c) => c.main)].filter(Boolean).join(" — "));
    index += 1;
    exercises.push({
      id: `ex_${index}`,
      index,
      section: section || sectionForKind(parsed?.kind, parsed?.cues, parsed?.main),
      raw,
      kind: parsed?.kind || "work",
      label: parsed?.label || null,
      main: parsed?.main || stripDetailPrefix(raw),
      volumeLabel: headline.volume || (pyramid ? `${pyramid.volume} m` : null),
      strokeLabel: headline.stroke,
      cue: cuePrimary,
      cues: parsed?.cues || [],
      rest: parsed?.rest || null,
      restLabel: formatRestLabel(parsed?.rest),
      steps: parsed?.steps || null,
      pyramid,
      children: childParsed.map((c) => ({
        main: c.main,
        rest: c.rest,
        restLabel: formatRestLabel(c.rest),
        cues: c.cues || [],
        headline: splitHeadline(c.main),
      })),
      meters,
      educatifId: educatif?.id || null,
      educatif,
    });
  };

  for (const g of groups) {
    if (g.type === "block") {
      const parsed = parseSessionDetail(g.header);
      if (!parsed) continue;
      pushExercise({
        raw: g.header,
        parsed,
        children: g.children,
        section: sectionForKind(parsed.kind, parsed.cues, parsed.main),
      });
      continue;
    }
    for (const raw of g.lines || []) {
      const parsed = parseSessionDetail(raw);
      if (!parsed) continue;
      pushExercise({
        raw,
        parsed,
        section: sectionForKind(parsed.kind, parsed.cues, parsed.main),
      });
    }
  }

  const fromDistance = parseInt(String(session.distance || "").replace(/\D/g, ""), 10) || 0;
  const summed = exercises.reduce((a, e) => a + (e.meters || 0), 0);
  const totalMeters = fromDistance || summed;

  const equipment = Array.isArray(session.equipmentUsed)
    ? session.equipmentUsed
    : [];

  const sections = [
    { id: "warm", label: "Échauffement", exercises: exercises.filter((e) => e.section === "warm") },
    { id: "main", label: "Corps de séance", exercises: exercises.filter((e) => e.section === "main") },
    { id: "cool", label: "Retour au calme", exercises: exercises.filter((e) => e.section === "cool") },
  ].filter((s) => s.exercises.length > 0);

  // Si rien n’a été classé warm/cool, tout en une section
  if (sections.length === 0 && exercises.length > 0) {
    sections.push({ id: "main", label: "Séance", exercises });
  }

  return {
    header: {
      title: session.title || "Séance",
      type: session.type || null,
      distanceLabel: totalMeters ? `${totalMeters.toLocaleString("fr-FR")} m` : (session.distance || null),
      durationLabel: formatDurationShort(session.duration),
      intensityZone: intensity.zone,
      intensityCue: intensity.cue,
      equipment,
    },
    sections,
    exercises,
    totalMeters,
  };
}

/** Mètres cumulés jusqu’à l’exercice index (0-based, exclusive end = inclusive current start). */
export function metersBeforeIndex(exercises, index) {
  return exercises.slice(0, Math.max(0, index)).reduce((a, e) => a + (e.meters || 0), 0);
}

export function metersThroughIndex(exercises, index) {
  return exercises.slice(0, Math.max(0, index + 1)).reduce((a, e) => a + (e.meters || 0), 0);
}
