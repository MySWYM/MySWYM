/**
 * Formats 4 nages enchaînés (ordre olympique), 100 / 200 / 400 IM + variantes.
 * Papillon → dos → brasse → crawl. Distinct des séries mono-nage.
 */

import { FOUR_STROKES } from "./four-nages-mix.js";

/** Ordre olympique (pas crawl en premier). */
export const IM_ORDER = Object.freeze(["papillon", "dos", "brasse", "crawl"]);

const EMPTY = Object.freeze({ sets: [], lines: [], used: 0, formatId: null });

function levelOf(brief = {}) {
  const raw = String(brief.level || "").toLowerCase();
  if (raw.startsWith("decouv") || raw.startsWith("découv")) return "decouverte";
  if (raw.startsWith("sport")) return "sportif";
  if (raw.startsWith("perf")) return "performance";
  return "regulier";
}

function formatSplitMeters(n) {
  if (n === 12.5) return "12,5";
  return String(n);
}

function olympicCue(perStroke, variant, pool) {
  const parts = IM_ORDER.map((s) => {
    const short = s === "papillon" ? "papillon" : s;
    return `${formatSplitMeters(perStroke)} ${short}`;
  }).join(" / ");
  if (variant === "mid_pool") {
    const parts = IM_ORDER.map((s) => `${formatSplitMeters(perStroke)} m ${s}`).join(" / ");
    const where = pool === 50 ? "changement tous les 12,5 m" : "changement au milieu du bassin";
    return `${parts} - ${where}`;
  }
  if (variant === "legs") {
    return `${formatSplitMeters(perStroke)} m par nage, dont 25 nage complète / 25 jambes`;
  }
  if (variant === "drill") {
    return `${formatSplitMeters(perStroke)} m par nage, dont 25 nage complète / 25 technique de la nage`;
  }
  return parts;
}

function imLabel(variant) {
  if (variant === "mid_pool") return "4 nages";
  if (variant === "legs") return "4 nages";
  if (variant === "drill") return "4 nages";
  return "4 nages enchaîné";
}

/**
 * Catalogue selon niveau / bassin / plafonds.
 * 100 IM (25/nage) surtout en 25 m ; 200/400 en 25 et 50.
 */
export function imFormatCatalog(brief = {}, ctx = {}) {
  const level = levelOf(brief);
  const pool = ctx.pool === 50 ? 50 : 25;
  const setCap = Number(ctx.maxSetContinuous) || 400;
  const strokeCap = Number(ctx.maxStrokeContinuous) || 100;
  const budget = Number(ctx.budget) || 0;
  const intent = String(brief.sessionIntent || "");
  const pain = !!(brief.painProtection || brief.hardConstraints?.painProtection);
  const recovery = /recuperation|reprise/.test(intent);
  const funOk =
    !pain &&
    !recovery &&
    (level === "sportif" || level === "performance") &&
    brief.sessionSpecificity !== "race_specific";

  if (level === "decouverte" || pain || recovery) return [];

  const all = [
    {
      id: "im_100",
      dist: 100,
      perStroke: 25,
      minReps: 1,
      maxReps: 6,
      variant: "plain",
      pools: [25],
    },
    {
      id: "im_200",
      dist: 200,
      perStroke: 50,
      minReps: 1,
      maxReps: 3,
      variant: "plain",
      pools: [25, 50],
    },
    {
      id: "im_400",
      dist: 400,
      perStroke: 100,
      minReps: 1,
      maxReps: 1,
      variant: "plain",
      pools: [25, 50],
      levels: ["sportif", "performance"],
    },
    {
      id: "im_50",
      dist: 50,
      perStroke: 12.5,
      minReps: 6,
      maxReps: 8,
      variant: "mid_pool",
      pools: [25, 50],
    },
    {
      id: "im_400_legs",
      dist: 400,
      perStroke: 100,
      minReps: 1,
      maxReps: 1,
      variant: "legs",
      pools: [25, 50],
      levels: ["sportif", "performance"],
      fun: true,
    },
    {
      id: "im_400_drill",
      dist: 400,
      perStroke: 100,
      minReps: 1,
      maxReps: 1,
      variant: "drill",
      pools: [25, 50],
      levels: ["sportif", "performance"],
      fun: true,
    },
  ];

  return all.filter((f) => {
    if (f.fun && !funOk) return false;
    if (Array.isArray(f.levels) && !f.levels.includes(level)) return false;
    if (Array.isArray(f.pools) && !f.pools.includes(pool)) return false;
    if (f.perStroke > strokeCap + 1e-6) return false;
    if (f.dist > setCap) return false;
    if (f.dist * f.minReps > budget) return false;
    return true;
  });
}

export function pickImFormat(brief, ctx = {}) {
  const forced = brief.forcedImFormat;
  const catalog = imFormatCatalog(brief, ctx);
  if (forced) {
    const hit = catalog.find((f) => f.id === forced) || imFormatCatalog(brief, { ...ctx, budget: 9999 }).find((f) => f.id === forced);
    if (hit) return hit;
  }
  if (!catalog.length) return null;
  const rng = typeof ctx.rng === "function" ? ctx.rng : Math.random;
  return catalog[Math.floor(rng() * catalog.length) % catalog.length];
}

function repsForFormat(fmt, budget) {
  let reps = Math.floor(Number(budget) / fmt.dist);
  reps = Math.min(fmt.maxReps, Math.max(0, reps));
  if (reps < fmt.minReps) return 0;
  const keepMono = Math.floor((Number(budget) * 0.5) / fmt.dist);
  if (keepMono >= fmt.minReps) reps = Math.min(reps, Math.max(fmt.minReps, keepMono));
  return Math.max(fmt.minReps, reps);
}

/**
 * Une série IM (éventuellement 0 si niveau / plafond incompatible).
 */
export function buildFourNagesImSets(opts = {}) {
  const brief = opts.brief || {};
  const pool = opts.pool === 50 ? 50 : 25;
  const budget = Math.max(0, Number(opts.budget) || 0);
  const fmt = pickImFormat(brief, {
    budget,
    pool,
    rng: opts.rng,
    maxSetContinuous: opts.maxSetContinuous,
    maxStrokeContinuous: opts.maxStrokeContinuous,
  });
  if (!fmt) return { ...EMPTY };
  const reps = repsForFormat(fmt, budget);
  if (reps < 1) return { ...EMPTY };

  const restFor = opts.restFor;
  const continuous = reps === 1;
  const restSec = continuous
    ? 0
    : typeof restFor === "function"
      ? restFor({
          intensity: "facile",
          distancePerRep: fmt.dist,
          setFormat: "repeated",
          block: "corps",
          stroke: "im",
        })
      : 25;
  const cue = olympicCue(fmt.perStroke, fmt.variant, pool);
  const label = imLabel(fmt.variant);
  const imSegments = IM_ORDER.map((stroke) => ({
    stroke,
    meters: fmt.perStroke,
    mode: fmt.variant === "legs" ? "legs" : fmt.variant === "drill" ? "drill" : "swim",
  }));
  const set = {
    reps,
    distancePerRep: fmt.dist,
    restSec,
    label,
    cue,
    block: "corps",
    exerciseId: `corps_im_${fmt.id}`,
    continuous,
    setFormat: continuous ? "continuous" : "repeated",
    stroke: "im",
    imFormat: fmt.id,
    imSegments,
    zone: opts.zone || null,
  };
  const line = continuous
    ? `-${fmt.dist}m ${label} - ${cue}`
    : `-${reps} × ${fmt.dist}m ${label} - ${cue} - repos ${restSec}s`;
  return {
    sets: [set],
    lines: [line],
    used: reps * fmt.dist,
    formatId: fmt.id,
  };
}

export function isImSet(set = {}) {
  return set.stroke === "im" || Array.isArray(set.imSegments);
}

export function splitImMeters(set = {}) {
  const dist = (Number(set.reps) || 1) * (Number(set.distancePerRep) || 0);
  const segs = Array.isArray(set.imSegments) ? set.imSegments : [];
  const bag = { crawl: 0, dos: 0, brasse: 0, papillon: 0 };
  if (!dist) return bag;
  const sum = segs.reduce((a, s) => a + (Number(s.meters) || 0), 0);
  if (sum > 0) {
    for (const s of segs) {
      const st = s.stroke;
      if (FOUR_STROKES.includes(st)) bag[st] += dist * ((Number(s.meters) || 0) / sum);
    }
    return bag;
  }
  for (const st of IM_ORDER) bag[st] += dist / 4;
  return bag;
}
