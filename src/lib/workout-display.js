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

/**
 * Aligne le libellé UI sur le Sheet (plus de « crawl normal » / « dos normal »).
 * Retire aussi les virgules décoratives en fin de consigne (souvent dans le Sheet).
 */
export function scrubLegacyNormalWording(text) {
  if (!text) return text;
  return String(text)
    .replace(/\b(crawl|dos|brasse|papillon|nage)\s+normal(e)?\b/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/,+\s*$/g, "")
    .trim();
}

/**
 * Sous-texte d'intensité générique (pas d'info utile sous le volume).
 * Ex. « Facile, sans forcer », « Allure tenable, focus économie ».
 */
export function isSoftFillCue(cue) {
  const t = String(cue || "")
    .trim()
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return true;
  if (
    /^(facile|très facile|confortable|soutenu|relâché|relache|sans forcer|normal)(\s+(facile|sans forcer|relâché|relache|normal))*$/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^nage normale?$/.test(t)) return true;
  if (/allure tenable/.test(t) && /economie|économie/.test(t)) return true;
  if (/^focus (economie|économie|geste)$/.test(t)) return true;
  if (/^(mise en route|retour au calme)$/.test(t)) return true;
  if (/^(nage libre|crawl|dos|brasse|mix|au choix)\s+(facile|souple)$/i.test(t)) return true;
  if (/^allure r[eé]guli[eè]re$/.test(t)) return true;
  return false;
}

/**
 * Déduit le libellé nage pour l’UI :
 * - 4 nages / médley / 4 strokes → « 4 NAGES »
 * - ≥2 nages, ou 1 nage + au choix, ou « mix » → « MIXTE »
 * - sinon nage unique / nage au choix
 */
export function inferStrokeLabel(blob) {
  const text = String(blob || "").trim();
  if (!text) return { label: null, consumePrefix: null };

  const lower = text.toLowerCase();

  if (/\b4\s*nages\b/.test(lower) || /\bm[eé]dley\b/.test(lower) || /(^|[^a-z])im([^a-z]|$)/i.test(lower)) {
    const m = text.match(/^(4\s*nages|m[eé]dley|im)\b/i);
    return { label: "4 NAGES", consumePrefix: m ? m[0] : null };
  }

  const strokes = new Set();
  if (/\bcrawl\b/.test(lower) || /\bnl\b/.test(lower)) strokes.add("crawl");
  if (/\bdos\b/.test(lower)) strokes.add("dos");
  if (/\bbrasse\b/.test(lower)) strokes.add("brasse");
  if (/\bpapillon\b/.test(lower)) strokes.add("papillon");
  const free = /\b(nage\s+libre|nage\s+au\s+choix|au\s+choix)\b/.test(lower);
  const mixWord = /\bmix(te)?\b/.test(lower);

  if (strokes.size >= 4) {
    return { label: "4 NAGES", consumePrefix: null };
  }

  const isMixte = strokes.size >= 2 || (strokes.size >= 1 && free) || mixWord;
  if (isMixte) {
    // Consommer seulement un préfixe « mix » / « mixte » seul en tête
    const m = text.match(/^(mix(te)?)\b/i);
    const onlyMixPrefix = m && strokes.size === 0 && !free;
    return { label: "MIXTE", consumePrefix: onlyMixPrefix ? m[0] : null };
  }

  const freeMatch = text.match(/^(nage\s+libre|nage\s+au\s+choix|au\s+choix)\b/i);
  if (freeMatch) {
    return { label: "NAGE AU CHOIX", consumePrefix: freeMatch[0] };
  }
  if (free) {
    return { label: "NAGE AU CHOIX", consumePrefix: null };
  }

  const strokeMatch = text.match(/^(crawl|dos|brasse|papillon|nl)\b/i);
  if (strokeMatch) {
    const raw = strokeMatch[1].toLowerCase();
    if (raw === "nl") return { label: "CRAWL", consumePrefix: strokeMatch[0] };
    return { label: strokeMatch[1].toUpperCase(), consumePrefix: strokeMatch[0] };
  }

  return { label: null, consumePrefix: null };
}

/** Extrait « 8 × 50 m » et « CRAWL » / « MIXTE » d’un main pour la hiérarchie visuelle. */
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

  const inferred = inferStrokeLabel(text);
  let stroke = inferred.label;
  if (inferred.consumePrefix) {
    text = text.slice(inferred.consumePrefix.length).trim().replace(/^[-–—·:,]\s*/, "");
  }
  return { volume, stroke, rest: text || null };
}

function sectionForKind(kind, cues, main) {
  if (kind === "warm") return "warm";
  if (kind === "cool") return "cool";
  const blob = `${main || ""} ${(cues || []).join(" ")}`.toLowerCase();
  if (/échauff|mise en route/.test(blob)) return "warm";
  if (/retour(\s+au\s+calme)?|cool\s*down/.test(blob)) return "cool";
  return "main";
}

/** Mappe les blocs moteur → sections UI (3 phases). */
export function sectionFromSetBlock(block) {
  const b = String(block || "").toLowerCase();
  if (b === "depart" || b === "warmup" || b === "warm") return "warm";
  if (b === "fin" || b === "rac" || b === "cooldown" || b === "cool") return "cool";
  return "main"; // technique, corps, …
}

/** Si `sets` est aligné 1:1 avec les exercices, impose la section depuis le moteur. */
function applySetBlockSections(exercises, sets = []) {
  if (!exercises?.length || !sets?.length || sets.length !== exercises.length) {
    return exercises;
  }
  return exercises.map((ex, i) => ({
    ...ex,
    section: sectionFromSetBlock(sets[i]?.block),
    setBlock: sets[i]?.block || null,
  }));
}

const SECTION_META = {
  warm: { id: "warm", label: "Échauffement" },
  main: { id: "main", label: "Corps de séance" },
  cool: { id: "cool", label: "Retour au calme" },
};

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
    const headline = splitHeadline(scrubLegacyNormalWording(parsed?.main));
    let cuePrimary = scrubLegacyNormalWording(parsed?.cues?.[0] || headline.rest || null);
    if (isSoftFillCue(cuePrimary)) cuePrimary = null;
    const cues = (parsed?.cues || [])
      .map((c) => scrubLegacyNormalWording(c))
      .filter((c) => c && !isSoftFillCue(c));
    if (!cuePrimary && cues[0]) cuePrimary = cues[0];
    const mainClean = scrubLegacyNormalWording(parsed?.main || stripDetailPrefix(raw));
    const blob = [parsed?.main, cuePrimary, ...cues, ...childParsed.map((c) => c.main)].filter(Boolean).join(" — ");
    let educatif = null;
    if (session.composedBy === "natation-sheet") {
      // Source de vérité = onglet Éducatifs du Sheet (attaché à la séance)
      const sheetFiche = session.sheetEducatif;
      if (sheetFiche?.name) {
        const re = new RegExp(sheetFiche.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        if (re.test(blob) || re.test(String(mainClean || ""))) {
          educatif = sheetFiche;
        }
      }
    } else {
      educatif = matchEducatif(blob);
    }
    index += 1;
    exercises.push({
      id: `ex_${index}`,
      index,
      section: section || sectionForKind(parsed?.kind, parsed?.cues, parsed?.main),
      raw,
      kind: parsed?.kind || "work",
      label: parsed?.label || null,
      main: mainClean,
      volumeLabel: headline.volume || (pyramid ? `${pyramid.volume} m` : null),
      strokeLabel: headline.stroke,
      cue: cuePrimary,
      cues,
      rest: parsed?.rest || null,
      restLabel: formatRestLabel(parsed?.rest),
      steps: parsed?.steps || null,
      pyramid,
      children: childParsed.map((c) => ({
        main: c.main,
        rest: c.rest,
        restLabel: formatRestLabel(c.rest),
        cues: (c.cues || []).filter((x) => !isSoftFillCue(x)),
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

  const withSections = applySetBlockSections(exercises, session.sets);

  // Numérotation par phase (1…n dans chaque bloc)
  const phaseCounters = { warm: 0, main: 0, cool: 0 };
  const numbered = withSections.map((ex) => {
    const sec = ex.section || "main";
    phaseCounters[sec] = (phaseCounters[sec] || 0) + 1;
    return { ...ex, index: phaseCounters[sec], phaseIndex: phaseCounters[sec] };
  });

  const fromDistance = parseInt(String(session.distance || "").replace(/\D/g, ""), 10) || 0;
  const summed = numbered.reduce((a, e) => a + (e.meters || 0), 0);
  const totalMeters = fromDistance || summed;

  const equipment = Array.isArray(session.equipmentUsed)
    ? session.equipmentUsed
    : [];

  const sections = ["warm", "main", "cool"]
    .map((id) => {
      const list = numbered.filter((e) => e.section === id);
      const meters = list.reduce((a, e) => a + (e.meters || 0), 0);
      return {
        ...SECTION_META[id],
        exercises: list,
        meters,
        metersLabel: meters > 0 ? `${meters.toLocaleString("fr-FR")} m` : null,
      };
    })
    .filter((s) => s.exercises.length > 0);

  // Si rien n’a été classé warm/cool, tout en une section
  if (sections.length === 0 && numbered.length > 0) {
    const meters = numbered.reduce((a, e) => a + (e.meters || 0), 0);
    sections.push({
      id: "main",
      label: "Séance",
      exercises: numbered,
      meters,
      metersLabel: meters > 0 ? `${meters.toLocaleString("fr-FR")} m` : null,
    });
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
    exercises: numbered,
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
