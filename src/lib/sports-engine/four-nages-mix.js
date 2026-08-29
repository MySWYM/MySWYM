/**
 * Répartition des 4 nages, volume total nagé, blocs explicites.
 * Distinct du focus UX : swimStyle=4_nages impose les 4 nages.
 * Plus de pondération par nage favorite.
 */
import { isAvanceLevelId, isDebutantLevelId } from "../onboarding-level-gate.js";

export const FOUR_STROKES = Object.freeze(["crawl", "dos", "brasse", "papillon"]);

export const FOUR_NAGES_MIX = Object.freeze({
  none: { crawl: 0.4, dos: 0.2, brasse: 0.2, papillon: 0.2 },
  crawl: { crawl: 0.5, dos: 0.17, brasse: 0.17, papillon: 0.16 },
  dos: { crawl: 0.4, dos: 0.3, brasse: 0.15, papillon: 0.15 },
  brasse: { crawl: 0.4, dos: 0.15, brasse: 0.3, papillon: 0.15 },
  papillon: { crawl: 0.4, dos: 0.15, brasse: 0.15, papillon: 0.3 },
});

const FOUR_NAGES_ALIASES = new Set([
  "4n",
  "4_nages",
  "4nages",
  "quatre_nages",
  "quatre nages",
  "4 nages",
  "medley",
]);

export function isFourNagesStyle(value) {
  return FOUR_NAGES_ALIASES.has(String(value || "").toLowerCase().trim());
}

export function isFourNagesDeclared(profile = {}) {
  if (isDebutantLevelId(profile.level) || isDebutantLevelId(profile.levelRaw)) return false;
  if (isAvanceLevelId(profile.level) || isAvanceLevelId(profile.levelRaw)) return true;
  return [
    profile.strokeFocus,
    profile.swimStyle,
    profile.strokesPreference,
    profile.sessionIntent,
    profile.hardConstraints?.isFourN ? "4n" : null,
  ].some(isFourNagesStyle);
}

export function normalizePreferredStroke(profile = {}) {
  const raw = String(profile.preferredStroke || profile.favoriteStroke || "").toLowerCase().trim();
  if (raw === "nl" || raw === "freestyle") return "crawl";
  if (FOUR_STROKES.includes(raw)) return raw;
  return null;
}

export function fourNagesMix(preferredStroke = null) {
  if (preferredStroke && FOUR_NAGES_MIX[preferredStroke]) {
    return { ...FOUR_NAGES_MIX[preferredStroke] };
  }
  return { ...FOUR_NAGES_MIX.none };
}

export function fourNagesMixFromBrief(brief = {}) {
  return fourNagesMix(null);
}

/**
 * Répartit `total` mètres selon le mix, multiples du bassin, au moins 1 longueur / nage.
 * `options.strokes` : sous-ensemble (ex. dos/brasse/papillon sans crawl).
 */
export function allocateStrokeMeters(total, mix, pool = 25, options = {}) {
  const unit = pool === 50 ? 50 : 25;
  const list =
    Array.isArray(options.strokes) && options.strokes.length
      ? options.strokes.filter((s) => FOUR_STROKES.includes(s))
      : FOUR_STROKES.slice();
  const weights = mix && typeof mix === "object" ? mix : FOUR_NAGES_MIX.none;
  const target = Math.max(unit * list.length, Math.round(Number(total) / unit) * unit);
  const slots = Math.round(target / unit);
  const exact = list.map((s) => (Number(weights[s]) || 0) * slots);
  const floors = exact.map((x) => Math.max(1, Math.floor(x)));
  let assigned = floors.reduce((a, b) => a + b, 0);

  while (assigned > slots) {
    let idx = 0;
    for (let i = 1; i < floors.length; i += 1) {
      if (floors[i] > floors[idx]) idx = i;
    }
    if (floors[idx] <= 1) break;
    floors[idx] -= 1;
    assigned -= 1;
  }

  const remainders = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r);
  let r = 0;
  while (assigned < slots) {
    floors[remainders[r % remainders.length].i] += 1;
    assigned += 1;
    r += 1;
  }

  const crawlIdx = list.indexOf("crawl");
  if (crawlIdx >= 0) {
    while (true) {
      let steal = -1;
      let stealVal = floors[crawlIdx];
      for (let i = 0; i < floors.length; i += 1) {
        if (i === crawlIdx) continue;
        if (floors[i] > stealVal) {
          stealVal = floors[i];
          steal = i;
        }
      }
      if (steal < 0 || floors[steal] <= 1) break;
      floors[steal] -= 1;
      floors[crawlIdx] += 1;
    }
  }

  /** @type {Record<string, number>} */
  const out = { crawl: 0, dos: 0, brasse: 0, papillon: 0 };
  list.forEach((s, i) => {
    out[s] = floors[i] * unit;
  });
  return out;
}

export function leftoverStrokeWeights(targets, used = {}, reserved = {}) {
  /** @type {Record<string, number>} */
  const raw = {};
  let sum = 0;
  for (const s of FOUR_STROKES) {
    const w = Math.max(0, (targets[s] || 0) - (used[s] || 0) - (reserved[s] || 0));
    raw[s] = w;
    sum += w;
  }
  if (sum <= 0) return fourNagesMix(null);
  for (const s of FOUR_STROKES) raw[s] /= sum;
  return raw;
}

export function inferStrokeFromLabel(label = "") {
  const t = String(label || "").toLowerCase();
  if (!t.trim()) return null;
  if (
    (/papillon/.test(t) && /\bdos\b/.test(t) && /brasse/.test(t) && /crawl/.test(t)) ||
    /4 nages enchaîné|changement au milieu|changement tous les 12/i.test(t)
  ) {
    return "im";
  }
  if (/4 nages|plusieurs nages|multi-nages|nages enchaînées|nages au choix/i.test(t)) {
    return "vague";
  }
  if (/papillon/.test(t) && !/prépa|ondulation/.test(t)) return "papillon";
  if (/brasse/.test(t)) return "brasse";
  if (/crawl/.test(t) && /\bdos\b/.test(t)) return "split_crawl_dos";
  if (/\bdos\b/.test(t)) return "dos";
  if (/crawl|nl\b|nage libre/.test(t)) return "crawl";
  if (/ondulation/.test(t)) return null;
  return null;
}

function addMeters(bag, stroke, meters) {
  if (!stroke || !meters) return;
  bag[stroke] = (bag[stroke] || 0) + meters;
}

/**
 * Volume nagé par nage (sets d'abord, sinon lignes). Les intitulés vagues ne comptent pas.
 */
export function measureStrokeVolume(sessionLike = {}) {
  const meters = { crawl: 0, dos: 0, brasse: 0, papillon: 0 };
  const present = { crawl: false, dos: false, brasse: false, papillon: false };
  const sets = Array.isArray(sessionLike.sets) ? sessionLike.sets : [];

  const mark = (stroke, dist) => {
    if (!FOUR_STROKES.includes(stroke) || dist <= 0) return;
    addMeters(meters, stroke, dist);
    present[stroke] = true;
  };

  const markIm = (dist) => {
    if (dist <= 0) return;
    for (const s of FOUR_STROKES) mark(s, dist / 4);
  };

  if (sets.length) {
    for (const s of sets) {
      const dist = (Number(s.reps) || 1) * (Number(s.distancePerRep) || 0);
      if (s.stroke === "im" || Array.isArray(s.imSegments)) {
        const segs = Array.isArray(s.imSegments) ? s.imSegments : [];
        const sum = segs.reduce((a, x) => a + (Number(x.meters) || 0), 0);
        if (sum > 0) {
          for (const seg of segs) mark(seg.stroke, dist * ((Number(seg.meters) || 0) / sum));
        } else {
          markIm(dist);
        }
        continue;
      }
      const tagged = FOUR_STROKES.includes(s.stroke)
        ? s.stroke
        : inferStrokeFromLabel(`${s.label || ""} ${s.cue || ""}`);
      if (tagged === "im") markIm(dist);
      else if (tagged === "split_crawl_dos") {
        mark("crawl", dist / 2);
        mark("dos", dist / 2);
      } else if (tagged && tagged !== "vague") {
        mark(tagged, dist);
      }
    }
  } else {
    for (const line of sessionLike.details || []) {
      const text = String(line);
      const mRep = text.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
      const mCont = text.match(/-?\s*(\d+)\s*m\b/i);
      let dist = 0;
      if (mRep) dist = Number(mRep[1]) * Number(mRep[2]);
      else if (mCont) dist = Number(mCont[1]);
      const tagged = inferStrokeFromLabel(text);
      if (tagged === "im") markIm(dist);
      else if (tagged === "split_crawl_dos") {
        mark("crawl", dist / 2);
        mark("dos", dist / 2);
      } else if (tagged && tagged !== "vague") {
        mark(tagged, dist);
      }
    }
  }

  const total = FOUR_STROKES.reduce((a, s) => a + meters[s], 0);
  const pct = {};
  for (const s of FOUR_STROKES) {
    pct[s] = total > 0 ? meters[s] / total : 0;
  }
  return { meters, present, pct, total, allPresent: FOUR_STROKES.every((s) => present[s]) };
}

export function papillonRepDistance(level, pool = 25) {
  const p = pool === 50 ? 50 : 25;
  if (level === "decouverte" || level === "regulier") return p;
  return p;
}

function strokeLabel(stroke, { easy = false } = {}) {
  if (stroke === "papillon") return easy ? "papillon facile" : "papillon";
  if (easy) return `${stroke} facile`;
  return stroke;
}

function unitForStroke(stroke, { pool, block, level }) {
  const p = pool === 50 ? 50 : 25;
  if (stroke === "papillon") return p;
  if (block === "technique" || level === "decouverte") return p;
  return 50;
}

/**
 * Construit des séries explicites (une nage par série), jamais un intitulé « 4 nages ».
 */
export function buildFourNagesStrokeSetsFromAlloc(alloc, opts = {}) {
  const pool = opts.pool === 50 ? 50 : 25;
  const level = opts.level || "regulier";
  const block = opts.block || "corps";
  const cue = opts.cue || "nages distinctes";
  const include = opts.includeStrokes || FOUR_STROKES;
  const maxReps = Math.max(4, Number(opts.maxReps) || 12);
  const restFor = opts.restFor;
  const sets = [];
  const lines = [];

  for (const stroke of include) {
    const meters = Math.max(0, Number(alloc[stroke]) || 0);
    if (meters < pool) continue;
    const unit = unitForStroke(stroke, { pool, block, level });
    const maxCont = Number(opts.maxContinuous) || 400;
    const distPerRep = Math.min(unit, maxCont, meters);
    let reps = Math.max(1, Math.round(meters / distPerRep));
    const chunks = [];
    while (reps > maxReps) {
      chunks.push(maxReps);
      reps -= maxReps;
    }
    if (reps >= 1) chunks.push(reps);
    const label = strokeLabel(stroke, { easy: !!opts.easy });
    chunks.forEach((repCount, idx) => {
      const continuous = repCount === 1;
      const restSec = continuous
        ? 0
        : typeof restFor === "function"
          ? restFor({
              intensity: "facile",
              distancePerRep: distPerRep,
              setFormat: "repeated",
              block,
              stroke,
            })
          : 20;
      const set = {
        reps: repCount,
        distancePerRep: distPerRep,
        restSec,
        label,
        cue,
        block,
        exerciseId: `${opts.exercisePrefix || "4n"}_${stroke}${idx ? `_${idx}` : ""}`,
        continuous,
        setFormat: continuous ? "continuous" : "repeated",
        stroke,
        zone: opts.zone || null,
      };
      sets.push(set);
      if (continuous) {
        lines.push(`-${distPerRep}m ${label} - ${cue}`);
      } else {
        lines.push(`-${repCount} × ${distPerRep}m ${label} - ${cue} - repos ${restSec}s`);
      }
    });
  }

  const used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  return { sets, lines, used };
}

export function buildFourNagesCoverageSets(sessionLike, brief = {}) {
  const pool = brief.pool === 50 ? 50 : 25;
  const measured = measureStrokeVolume(sessionLike);
  const missing = FOUR_STROKES.filter((s) => !measured.present[s]);
  if (!missing.length) return { sets: [], lines: [], used: 0 };
  const alloc = {};
  for (const s of missing) alloc[s] = pool * (brief.level === "decouverte" ? 2 : 4);
  return buildFourNagesStrokeSetsFromAlloc(alloc, {
    pool,
    level: brief.level,
    block: "corps",
    cue: "nage explicite - 4 nages",
    includeStrokes: missing,
    easy: brief.level === "decouverte",
    exercisePrefix: "4n_ensure",
    restFor: () => 20,
    maxReps: 12,
  });
}

/**
 * Tolérance de mix : bassins 25/50 + blocs indivisibles.
 * Présence des 4 nages exigée ; écart de % borné.
 */
export function mixWithinTolerance(measured, targetMix, { pool = 25, maxPctPoints = 0.12 } = {}) {
  if (!measured?.allPresent) return false;
  for (const s of FOUR_STROKES) {
    const target = Number(targetMix[s]) || 0;
    const actual = Number(measured.pct[s]) || 0;
    const minMeters = 25;
    if ((measured.meters[s] || 0) < minMeters) return false;
    if (Math.abs(actual - target) > maxPctPoints) return false;
  }
  return true;
}
