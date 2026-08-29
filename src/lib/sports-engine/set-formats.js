/**
 * Formats de séries Régulier, évite le défaut systématique Nx50.
 * Le format répété reste utile ; il n'est plus la réponse unique.
 */

/** @typedef {'repeated'|'progressive'|'pyramid'|'block'|'alternating'|'continuous'|'broken'|'mixed'|'descending'|'race_pace'} SetFormatId */

export const SET_FORMAT_IDS = Object.freeze([
  "repeated",
  "progressive",
  "pyramid",
  "block",
  "alternating",
  "continuous",
  "broken",
  "mixed",
  "descending",
  "race_pace",
]);

/**
 * Volume max d'UNE pyramide (montée+sommet+descente).
 * Au-delà (~1750 m Ironman perf) : trop long, illisible, aucune info coach utile.
 * Le reste du corps = séries explicites (Nx100 / Nx200…), pas un « fill » pyramide.
 */
export const MAX_PYRAMID_VOLUME = 1000;

import { collapseSetsToDisplayLinesExact } from "./display-sets.js";

function pyramidStepOf(s) {
  return s?.meta?.pyramidStep ?? s?.pyramidStep;
}

function isPyramidFill(s) {
  return !!(s?.meta?.pyramidFill || s?.pyramidFill);
}

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

function pickOne(arr, rng) {
  if (!arr?.length) return null;
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/**
 * Candidats de format selon intention / capacité / volume corps.
 * Pyramide seulement si le corps reste dans une taille lisible (≤ MAX_PYRAMID_VOLUME).
 */
export function candidateSetFormats(ctx = {}) {
  const {
    intentId = "endurance",
    qualitySession = false,
    maxContinuous = 200,
    corpsTarget = 800,
    allowContinuous = true,
    level = "regulier",
    taperSafe = false,
    painSafe = false,
    forbidComplexFormats = false,
  } = ctx;

  const complexBlocked = !!(taperSafe || painSafe || forbidComplexFormats);
  const pyramidOk = corpsTarget <= MAX_PYRAMID_VOLUME && !complexBlocked;
  const withPyramid = (arr, at = -1) => {
    if (!pyramidOk) return arr;
    if (at < 0 || at >= arr.length) return [...arr, "pyramid"];
    const next = [...arr];
    next.splice(at, 0, "pyramid");
    return next;
  };

  if (level === "sportif" || level === "performance") {
    if (intentId === "vitesse" || intentId === "vo2") {
      return ["broken", "repeated", "descending"];
    }
    if (intentId === "seuil" || intentId === "allure_specifique" || intentId === "race_pace") {
      // J3 : jamais block/progressive pour intensité annoncée (sinon facile/modéré ≠ Z3)
      return ["repeated", "race_pace"];
    }
    if (intentId === "test") {
      return ["repeated"];
    }
    if (intentId === "course_piscine") {
      return ["race_pace", "repeated"];
    }
    // Ironman / triathlon / OW : pyramide géante = absurde ; privilégier séries claires + allure.
    if (intentId === "eau_libre" || intentId === "triathlon") {
      const base = ["mixed", "broken", "repeated", "block"];
      if (pyramidOk && corpsTarget <= 800) base.splice(2, 0, "pyramid");
      if (allowContinuous && maxContinuous >= 300 && corpsTarget >= 600) base.push("continuous");
      if (level === "performance") base.unshift("race_pace");
      return base;
    }
    if (qualitySession) {
      return ["repeated", "race_pace"];
    }
    if (intentId === "recuperation" || intentId === "reprise") {
      return ["mixed", "alternating", "broken"];
    }
    // Endurance : formats classiques d'abord ; pyramide seulement si volume corps raisonnable
    if (complexBlocked) {
      const safe = ["repeated", "mixed", "alternating"];
      if (allowContinuous && maxContinuous >= 300 && corpsTarget >= 600) safe.push("continuous");
      return safe;
    }
    const base = ["repeated", "mixed", "broken", "block", "descending"];
    if (pyramidOk && corpsTarget <= 800) base.splice(1, 0, "pyramid");
    if (allowContinuous && maxContinuous >= 400 && corpsTarget >= 800) base.push("continuous");
    return base;
  }

  if (qualitySession || intentId === "qualite" || intentId === "allure_progressive") {
    return ["progressive", "block", "mixed"];
  }

  switch (intentId) {
    case "recuperation":
      return ["mixed", "broken", "alternating"];
    case "reprise":
      return ["mixed", "broken", "alternating", "repeated"];
    case "seance_courte":
      return ["mixed", "repeated", "broken"];
    case "eau_libre":
    case "triathlon": {
      const base = ["mixed", "broken", "repeated"];
      if (pyramidOk && corpsTarget <= 800) base.splice(1, 0, "pyramid");
      if (allowContinuous && maxContinuous >= 300 && corpsTarget >= 600) base.push("continuous");
      return base;
    }
    case "quatre_nages":
      return ["alternating", "mixed", "broken", "repeated"];
    case "technique_endurance":
      return withPyramid(["mixed", "broken", "repeated"]);
    case "endurance":
    default: {
      const base = ["repeated", "mixed", "broken", "alternating"];
      if (pyramidOk && corpsTarget <= 800) base.splice(1, 0, "pyramid");
      if (allowContinuous && maxContinuous >= 400 && corpsTarget >= 400) base.push("continuous");
      return base;
    }
  }
}

/**
 * Choisit un setFormat déterministe (rng seedé).
 * Si forcedFormat fourni (tests / reprise pattern), il prime s'il est valide.
 */
export function selectSetFormat(ctx = {}, rng = Math.random) {
  if (ctx.forcedFormat && SET_FORMAT_IDS.includes(ctx.forcedFormat)) {
    return ctx.forcedFormat;
  }
  const candidates = candidateSetFormats(ctx);
  return pickOne(candidates, rng) || "repeated";
}

function makeSet({ reps, unit, restSec, label, cue, exerciseId, continuous = false, meta = {} }) {
  const safeRest = continuous ? 0 : Math.max(1, Number(restSec) || 20);
  return {
    reps,
    distancePerRep: unit,
    restSec: continuous ? 0 : safeRest,
    label,
    cue,
    block: "corps",
    exerciseId,
    continuous,
    setFormat: meta.setFormat,
    // Nested meta + spread (rétrocompat : pyramidStep / intensity lus à plat ou via .meta)
    meta: { ...meta },
    ...meta,
  };
}

/**
 * Choisit une unité nageable pour coller au volume en ≤ maxReps (sans « suite »).
 */
function pickNageableUnit(target, maxReps, preferredUnit, quantum = 50) {
  const prefs = [];
  if (preferredUnit) prefs.push(preferredUnit);
  for (const u of [200, 150, 100, 75, 50, 25]) {
    if (!prefs.includes(u) && (u % quantum === 0 || (quantum === 25 && u >= 25))) prefs.push(u);
  }
  for (const unit of prefs) {
    if (unit < quantum && quantum === 50 && unit === 25) continue;
    const reps = Math.max(1, Math.round(target / unit));
    const vol = reps * unit;
    if (reps >= 2 && reps <= maxReps && Math.abs(vol - target) <= Math.max(unit, 50)) {
      return { unit, reps, vol };
    }
  }
  let best = null;
  for (const unit of prefs) {
    if (unit < quantum && quantum === 50 && unit === 25) continue;
    const reps = Math.min(maxReps, Math.max(2, Math.floor(target / unit)));
    const vol = reps * unit;
    const err = Math.abs(vol - target);
    if (!best || err < best.err) best = { unit, reps, vol, err };
  }
  return best || { unit: quantum * 2, reps: 4, vol: quantum * 8 };
}

/**
 * Découpe un volume en séries nageables ≤ maxReps.
 * J3 : jamais de filler « suite », préfère changer d'unité ou 2 blocs intentionnels.
 */
function buildCappedRepeatedSets(target, unit, { maxReps = 12, restSec = 20, label, cue, exerciseId, meta = {} }) {
  const sets = [];
  const tgt = Math.max(unit, target);
  const quantum = unit <= 25 ? 25 : 50;

  const fit = pickNageableUnit(tgt, maxReps, unit, quantum);
  if (fit && fit.reps <= maxReps && Math.abs(fit.vol - tgt) <= Math.max(fit.unit, 100)) {
    sets.push(makeSet({ reps: fit.reps, unit: fit.unit, restSec, label, cue, exerciseId, meta }));
    return sets;
  }

  const unitA = fit?.unit || unit;
  const totalReps = Math.max(4, Math.round(tgt / unitA));
  if (totalReps <= maxReps * 2) {
    let a = Math.ceil(totalReps / 2);
    let b = totalReps - a;
    if (a > maxReps) { b += a - maxReps; a = maxReps; }
    if (b > maxReps) b = maxReps;
    if (a >= 2) {
      sets.push(makeSet({ reps: a, unit: unitA, restSec, label, cue, exerciseId, meta: { ...meta, blockPart: 1 } }));
    }
    if (b >= 2) {
      let unitB = unitA;
      let repsB = b;
      if (b > maxReps) {
        const fitB = pickNageableUnit(b * unitA, maxReps, unitA >= 100 ? 50 : 100, quantum);
        unitB = fitB.unit;
        repsB = fitB.reps;
      }
      sets.push(makeSet({
        reps: repsB, unit: unitB, restSec, label,
        cue: /même allure|2ᵉ série/i.test(String(cue)) ? cue : `${cue} - 2ᵉ série, même allure`,
        exerciseId: `${exerciseId}_b`,
        meta: { ...meta, blockPart: 2 },
      }));
    }
    return sets.length ? sets : [makeSet({ reps: Math.min(maxReps, 6), unit: unitA, restSec, label, cue, exerciseId, meta })];
  }

  const longUnit = tgt >= 1000 ? 200 : 100;
  const longFit = pickNageableUnit(Math.round(tgt * 0.6), maxReps, longUnit, quantum);
  const remain = Math.max(0, tgt - longFit.vol);
  sets.push(makeSet({ reps: longFit.reps, unit: longFit.unit, restSec, label, cue, exerciseId, meta }));
  if (remain >= quantum * 2) {
    const shortFit = pickNageableUnit(remain, maxReps, Math.min(100, longFit.unit), quantum);
    if (shortFit.reps >= 2) {
      sets.push(makeSet({
        reps: shortFit.reps, unit: shortFit.unit, restSec, label,
        cue: `${cue} - complément`,
        exerciseId: `${exerciseId}_c`,
        meta: { ...meta, blockPart: 2 },
      }));
    }
  }
  return sets;
}

/** Ajuste la dernière série pour coller au target (± unit), sans dépasser maxReps. */
function fitLastToTarget(sets, target, unit, maxReps = 12) {
  const sum = () => sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  let vol = sum();
  if (!sets.length) return sets;
  const last = sets[sets.length - 1];
  if (last.continuous) {
    if (Math.abs(vol - target) > unit / 2 && target >= unit) {
      last.distancePerRep = roundTo(Math.min(target, last.distancePerRep + (target - vol)), unit) || last.distancePerRep;
    }
    return sets;
  }
  while (vol > target + unit && last.reps > 1) {
    last.reps -= 1;
    vol -= last.distancePerRep;
  }
  while (vol < target - unit && last.reps < maxReps) {
    last.reps += 1;
    vol += last.distancePerRep;
  }
  // Reliquat : 2ᵉ bloc intentionnel (pas « suite »)
  if (vol < target - Math.max(unit, 50) && sets.length < 2) {
    const need = target - vol;
    const extra = buildCappedRepeatedSets(need, last.distancePerRep || unit, {
      maxReps,
      restSec: last.restSec || 20,
      label: last.label,
      cue: `${last.cue || "facile"} - 2ᵉ série, même allure`,
      exerciseId: `${last.exerciseId || "corps"}_b`,
      meta: { setFormat: last.setFormat || "repeated", blockPart: 2 },
    });
    sets.push(...extra);
  }
  return sets;
}

/**
 * Construit les sets corps pour un format donné.
 * @returns {{ sets: object[], setFormat: string, lines: string[] }}
 */
export function buildCorpsByFormat(format, corpsTarget, opts = {}) {
  const {
    label = "crawl",
    altLabel = "dos",
    cue = "allure confortable",
    restFor,
    exerciseId = "corps",
    maxContinuous = 200,
    pool = 50,
    preferredUnit = null,
    maxRepsPerSet = 12,
  } = opts;
  const quantum = pool === 25 ? 25 : 50;
  const maxReps = Math.max(4, Number(maxRepsPerSet) || 12);
  const target = Math.max(quantum * 2, roundTo(corpsTarget, quantum));
  const rest = (intensity, unit, extra = {}) => {
    const r =
      typeof restFor === "function"
        ? restFor({ intensity, distancePerRep: unit, setFormat: format, ...extra })
        : extra.defaultRest ?? 20;
    return Math.max(1, Number(r) || 20);
  };

  const sets = [];
  const fmt = SET_FORMAT_IDS.includes(format) ? format : "repeated";

  if (fmt === "continuous") {
    const d = Math.min(target, Math.max(quantum, roundTo(Math.min(target, maxContinuous), quantum)));
    const main = makeSet({
      reps: 1,
      unit: d,
      restSec: 0,
      label,
      cue: `${cue} - sans pause`,
      exerciseId: `${exerciseId}_cont`,
      continuous: true,
      meta: { setFormat: "continuous" },
    });
    sets.push(main);
    let used = d;
    if (target - used >= quantum * 2) {
      const fillUnit = Math.min(100, quantum * 2);
      sets.push(
        ...buildCappedRepeatedSets(target - used, fillUnit, {
          maxReps,
          restSec: rest("facile", fillUnit, { defaultRest: 25 }),
          label,
          cue: "facile",
          exerciseId: `${exerciseId}_fill`,
          meta: { setFormat: "continuous" },
        }),
      );
    }
    fitLastToTarget(sets, target, quantum, maxReps);
  } else if (fmt === "progressive") {
    const unit = target >= 900 ? 100 : 50;
    // Cap total reps then split into phases ≤ maxReps each
    const totalReps = Math.min(maxReps * 3, Math.max(6, Math.round(target / unit)));
    let easy = Math.max(2, Math.min(maxReps, Math.floor(totalReps / 2)));
    let mod = Math.max(2, Math.min(maxReps, Math.floor(totalReps / 3)));
    let hard = Math.max(1, Math.min(maxReps, totalReps - easy - mod));
    let sum = (easy + mod + hard) * unit;
    while (sum > target + unit && easy > 2) {
      easy -= 1;
      sum -= unit;
    }
    const parts = [
      { n: easy, cue: "facile", intensity: "facile" },
      { n: mod, cue: "modéré", intensity: "modere" },
      { n: hard, cue: "soutenu", intensity: "soutenu" },
    ];
    for (const p of parts) {
      if (p.n <= 0) continue;
      if (p.n > maxReps) {
        sets.push(
          ...buildCappedRepeatedSets(p.n * unit, unit, {
            maxReps,
            restSec: rest(p.intensity, unit, { defaultRest: p.cue === "soutenu" ? 30 : 25 }),
            label,
            cue: p.cue,
            exerciseId: `${exerciseId}_prog_${p.cue}`,
            meta: { setFormat: "progressive", intensity: p.intensity },
          }),
        );
      } else {
        sets.push(
          makeSet({
            reps: p.n,
            unit,
            restSec: rest(p.intensity, unit, { defaultRest: p.cue === "soutenu" ? 30 : 25 }),
            label,
            cue: p.cue,
            exerciseId: `${exerciseId}_prog_${p.cue}`,
            meta: { setFormat: "progressive", intensity: p.intensity },
          }),
        );
      }
    }
    fitLastToTarget(sets, target, unit, maxReps);
  } else if (fmt === "block") {
    const unit = 100;
    // J3 : si cue porte déjà une zone/intensité, ne pas écraser en facile/modéré
    const qualityCue = /Z3|Z4|seuil|soutenu|race|allure cible|spécifique/i.test(String(cue || ""));
    if (qualityCue) {
      sets.push(
        ...buildCappedRepeatedSets(target, unit, {
          maxReps: Math.min(maxReps, 8),
          restSec: rest("soutenu", unit, { defaultRest: 30 }),
          label,
          cue,
          exerciseId: `${exerciseId}_blk_q`,
          meta: { setFormat: "block", intensity: "soutenu" },
        }),
      );
    } else {
      const half = Math.max(2, Math.min(maxReps, Math.round(target / 2 / unit)));
      sets.push(
        makeSet({
          reps: half,
          unit,
          restSec: rest("facile", unit, { defaultRest: 25 }),
          label,
          cue: "facile",
          exerciseId: `${exerciseId}_blk_easy`,
          meta: { setFormat: "block", intensity: "facile" },
        }),
      );
      sets.push(
        ...buildCappedRepeatedSets(Math.max(unit * 2, target - half * unit), unit, {
          maxReps,
          restSec: rest("modere", unit, { defaultRest: 30 }),
          label,
          cue: "modéré",
          exerciseId: `${exerciseId}_blk_mod`,
          meta: { setFormat: "block", intensity: "modere" },
        }),
      );
    }
    fitLastToTarget(sets, target, unit, maxReps);
  } else if (fmt === "pyramid") {
    // Profils lisibles, jamais scale×2 vers 1600-1750 m (Ironman perf : absurde).
    // Volume pyramide plafonné ; surplus → séries explicites (pas du « fill pyramide »).
    const pyramidBudget = Math.min(target, MAX_PYRAMID_VOLUME);
    let stepProfile;
    if (pyramidBudget <= 500) {
      stepProfile = [50, 100, 150, 100, 50]; // 450
    } else if (pyramidBudget <= 750) {
      stepProfile = [50, 100, 150, 200, 150, 100, 50]; // 800 → clamp below
    } else {
      stepProfile = [100, 200, 300, 200, 100]; // 900, sommet 300m max utile
    }
    // Ajuste si le budget est plus petit que le profil (retire les ailes).
    let distances = [...stepProfile];
    while (distances.reduce((a, b) => a + b, 0) > pyramidBudget + 25 && distances.length > 3) {
      distances = distances.slice(1, -1);
    }
    // Respect maxContinuous sur chaque palier
    distances = distances.map((d) => {
      if (maxContinuous >= d) return d;
      return Math.max(quantum, roundTo(Math.min(d, maxContinuous), quantum));
    });
    const peakIdx = Math.floor(distances.length / 2);
    let used = 0;
    distances.forEach((d, i) => {
      const isPeak = i === peakIdx;
      const isAscent = i < peakIdx;
      const intensity = isPeak ? "modere" : "facile";
      const stepCue = isPeak ? "régulier" : "";
      sets.push(
        makeSet({
          reps: 1,
          unit: d,
          restSec: rest(intensity, d, {
            defaultRest: d >= 200 ? 30 : d >= 150 ? 25 : 20,
          }),
          label,
          cue: stepCue,
          exerciseId: `${exerciseId}_pyr_${i}`,
          continuous: false,
          meta: {
            setFormat: "pyramid",
            pyramidStep: i,
            pyramidRole: isPeak ? "sommet" : isAscent ? "montee" : "descente",
          },
        }),
      );
      used += d;
    });
    // Surplus hors pyramide = séries lisibles (Nx100 / Nx50), pas une fausse pyramide 1750m
    const pyrUsed = used;
    if (target - used >= quantum * 2) {
      const fillUnit = target - used >= 800 ? 100 : target - used >= 400 ? 100 : 50;
      const fillSets = buildCappedRepeatedSets(target - used, fillUnit, {
        maxReps,
        restSec: rest("facile", fillUnit, { defaultRest: fillUnit >= 100 ? 25 : 20 }),
        label,
        cue: "nage appliquée - hors pyramide",
        exerciseId: `${exerciseId}_pyr_fill`,
        meta: { setFormat: "repeated", pyramidFill: true },
      });
      fitLastToTarget(fillSets, target - pyrUsed, fillUnit, maxReps);
      for (const s of fillSets) {
        if (!s.meta) s.meta = {};
        s.meta.setFormat = "repeated";
        s.meta.pyramidFill = true;
      }
      sets.push(...fillSets);
    }
    // Ne pas fitLastToTarget sur les paliers (déformerait la pyramide)
  } else if (fmt === "broken") {
    // 2×(N×unit), deux blocs séparés, reps plafonnées
    const unit = target >= 1000 ? 100 : 50;
    const halfTarget = Math.round(target / 2);
    for (let b = 0; b < 2; b++) {
      sets.push(
        ...buildCappedRepeatedSets(halfTarget, unit, {
          maxReps,
          restSec: rest("facile", unit, { defaultRest: unit >= 100 ? 25 : 20 }),
          label,
          cue: b === 0 ? `${cue} - 1er bloc` : `${cue} - 2e bloc, contraste`,
          exerciseId: `${exerciseId}_brk_${b}`,
          meta: { setFormat: "broken", brokenBlock: b + 1 },
        }),
      );
    }
    fitLastToTarget(sets, target, unit, maxReps);
  } else if (fmt === "alternating") {
    const unit = 50;
    const half = Math.round(target / 2);
    sets.push(
      ...buildCappedRepeatedSets(half, unit, {
        maxReps,
        restSec: rest("facile", unit, { defaultRest: 20 }),
        label,
        cue,
        exerciseId: `${exerciseId}_alt_a`,
        meta: { setFormat: "alternating" },
      }),
    );
    sets.push(
      ...buildCappedRepeatedSets(target - half, unit, {
        maxReps,
        restSec: rest("facile", unit, { defaultRest: 20 }),
        label: altLabel,
        cue: "alterne / contraste",
        exerciseId: `${exerciseId}_alt_b`,
        meta: { setFormat: "alternating" },
      }),
    );
    fitLastToTarget(sets, target, unit, maxReps);
  } else if (fmt === "mixed") {
    // Toujours viser un vrai mix 100+50 dès que le volume le permet (≥600)
    if (target >= 600) {
      const longUnit = 100;
      const longReps = Math.max(2, Math.min(maxReps, Math.min(6, Math.round((target * 0.55) / longUnit))));
      let used = longReps * longUnit;
      sets.push(
        makeSet({
          reps: longReps,
          unit: longUnit,
          restSec: rest("facile", longUnit, { defaultRest: 25 }),
          label,
          cue,
          exerciseId: `${exerciseId}_mix_100`,
          meta: { setFormat: "mixed" },
        }),
      );
      const shortRemain = Math.max(0, target - used);
      if (shortRemain >= 50) {
        sets.push(
          ...buildCappedRepeatedSets(shortRemain, 50, {
            maxReps,
            restSec: rest("facile", 50, { defaultRest: 15 }),
            label,
            cue: "facile, relâché",
            exerciseId: `${exerciseId}_mix_50`,
            meta: { setFormat: "mixed" },
          }),
        );
      }
    } else {
      // Petit volume : plafonner les reps
      sets.push(
        ...buildCappedRepeatedSets(target, 50, {
          maxReps,
          restSec: rest("facile", 50, { defaultRest: 20 }),
          label,
          cue,
          exerciseId: `${exerciseId}_mix_a`,
          meta: { setFormat: "mixed" },
        }),
      );
    }
    fitLastToTarget(sets, target, 50, maxReps);
  } else if (fmt === "descending") {
    // Cycles descendants, distances compatibles bassin
    const steps = target >= 1200 ? [200, 150, 100, 50] : [100, 50];
    const useSteps = steps.filter((d) => d % quantum === 0 || d >= 50);
    let used = 0;
    let cycle = 0;
    while (used < target - 40 && cycle < 6) {
      for (let i = 0; i < useSteps.length; i++) {
        const d = useSteps[i];
        if (used + d > target + 50) break;
        sets.push(
          makeSet({
            reps: 1,
            unit: d,
            restSec: rest(i === 0 ? "soutenu" : "facile", d, { defaultRest: d >= 150 ? 35 : 25 }),
            label,
            cue: i === 0 ? `${cue} - départ long` : cue,
            exerciseId: `${exerciseId}_desc_${cycle}_${i}`,
            continuous: false,
            meta: { setFormat: "descending", intensity: i === 0 ? "soutenu" : "facile" },
          }),
        );
        used += d;
      }
      cycle += 1;
    }
    fitLastToTarget(sets, target, quantum, maxReps);
  } else if (fmt === "race_pace") {
    // Touches / séries allure, plafonnées (jamais 8×200 si petit budget)
    let unit = preferredUnit || 50;
    if (!preferredUnit) {
      if (target >= 1600) unit = 200;
      else if (target >= 900) unit = 100;
      else if (target >= 400) unit = 50;
      else unit = 50;
    }
    // Pour petits budgets taper : 4×50 plutôt que gros blocs
    if (target <= 300) unit = Math.min(unit, 50);
    else if (target <= 500) unit = Math.min(unit, 100);
    sets.push(
      ...buildCappedRepeatedSets(target, unit, {
        maxReps: Math.min(maxReps, unit >= 200 ? 6 : 10),
        restSec: rest("modere", unit, { defaultRest: unit >= 200 ? 40 : 30 }),
        label,
        cue: cue || "allure spécifique",
        exerciseId: `${exerciseId}_race`,
        meta: { setFormat: "race_pace", intensity: "modere" },
      }),
    );
    fitLastToTarget(sets, target, unit, maxReps);
  } else {
    // repeated
    const unit =
      preferredUnit ||
      (target >= 1600 ? 200 : target >= 1200 ? 100 : target >= 700 ? 100 : 50);
    sets.push(
      ...buildCappedRepeatedSets(target, unit, {
        maxReps: Math.min(maxReps, unit >= 200 ? 8 : maxReps),
        restSec: rest("facile", unit, { defaultRest: unit >= 200 ? 30 : unit >= 100 ? 25 : 20 }),
        label,
        cue,
        exerciseId: `${exerciseId}_rep`,
        meta: { setFormat: "repeated" },
      }),
    );
    fitLastToTarget(sets, target, unit, maxReps);
  }

  const lines = sets.map((s) => {
    const cueTxt = s.cue ? ` - ${s.cue}` : "";
    if (s.continuous || s.reps === 1) {
      const restTxt = s.continuous || !s.restSec ? "" : ` - repos ${s.restSec}s`;
      return `-${s.distancePerRep}m ${s.label}${cueTxt}${restTxt}`;
    }
    return `-${s.reps} × ${s.distancePerRep}m ${s.label}${cueTxt} - repos ${s.restSec}s`;
  });

  let displayLines;
  if (fmt === "pyramid") {
    const pyrSets = sets.filter((s) => pyramidStepOf(s) != null);
    const fillSets = sets.filter((s) => isPyramidFill(s) || (pyramidStepOf(s) == null && (s.setFormat === "repeated" || s.meta?.setFormat === "repeated")));
    const collapsedPyr = collapseSetsToDisplayLinesExact(pyrSets, "pyramid");
    const fillLines = fillSets.map((s) => {
      if (s.reps === 1) {
        return `-${s.distancePerRep}m ${s.label} - ${s.cue} - repos ${s.restSec}s`;
      }
      return `-${s.reps} × ${s.distancePerRep}m ${s.label} - ${s.cue} - repos ${s.restSec}s`;
    });
    displayLines = [
      ...(collapsedPyr || lines.filter((_, i) => pyramidStepOf(sets[i]) != null)),
      ...fillLines,
    ];
  } else if (fmt === "broken" && sets.length >= 2) {
    const a = sets[0];
    displayLines = [
      `-2 blocs de ${a.reps} × ${a.distancePerRep}m ${a.label} - ${cue} - repos ${a.restSec || 20}s`,
    ];
  } else {
    const collapsed = collapseSetsToDisplayLinesExact(sets, fmt);
    displayLines = collapsed || lines;
  }

  return { sets, setFormat: fmt, lines, displayLines };
}
