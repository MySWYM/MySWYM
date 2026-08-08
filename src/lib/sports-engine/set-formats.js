/**
 * Formats de séries Régulier — évite le défaut systématique Nx50.
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

import { collapseSetsToDisplayLinesExact } from "./display-sets.js";

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

function pickOne(arr, rng) {
  if (!arr?.length) return null;
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/**
 * Candidats de format selon intention / capacité / volume corps.
 */
export function candidateSetFormats(ctx = {}) {
  const {
    intentId = "endurance",
    qualitySession = false,
    maxContinuous = 200,
    corpsTarget = 800,
    allowContinuous = true,
    level = "regulier",
  } = ctx;

  if (level === "sportif") {
    if (intentId === "vitesse" || intentId === "vo2") {
      return ["broken", "repeated", "descending"];
    }
    if (intentId === "seuil" || intentId === "allure_specifique") {
      return ["repeated", "broken", "block", "race_pace"];
    }
    if (intentId === "test") {
      return ["repeated"];
    }
    if (intentId === "course_piscine") {
      return ["race_pace", "broken", "repeated", "block"];
    }
    if (qualitySession) {
      return ["repeated", "block", "broken", "progressive"];
    }
    if (intentId === "recuperation" || intentId === "reprise") {
      return ["mixed", "alternating", "broken"];
    }
    const base = ["repeated", "pyramid", "mixed", "broken", "descending", "block"];
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
    case "triathlon":
      return ["mixed", "pyramid", "broken", "repeated"].concat(
        allowContinuous && maxContinuous >= 300 && corpsTarget >= 600 ? ["continuous"] : [],
      );
    case "quatre_nages":
      return ["alternating", "mixed", "broken", "repeated"];
    case "technique_endurance":
      return ["mixed", "broken", "repeated", "pyramid"];
    case "endurance":
    default: {
      const base = ["repeated", "pyramid", "mixed", "broken", "alternating"];
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
    ...meta,
  };
}

/**
 * Découpe un volume en plusieurs séries ≤ maxReps (jamais 33×50).
 * Si le volume restant ne tient pas proprement → sous-volume (préférable).
 */
function buildCappedRepeatedSets(target, unit, { maxReps = 12, restSec = 20, label, cue, exerciseId, meta = {} }) {
  const sets = [];
  let remaining = Math.max(unit, target);
  let part = 0;
  while (remaining >= unit && part < 6) {
    const maxChunk = maxReps * unit;
    const chunk = Math.min(remaining, maxChunk);
    let reps = Math.max(1, Math.floor(chunk / unit));
    if (reps > maxReps) reps = maxReps;
    if (reps === 1 && remaining > unit) {
      // préférer au moins 2 reps si possible, sinon continu géré ailleurs
      reps = Math.min(maxReps, Math.max(2, Math.floor(remaining / unit)));
    }
    sets.push(
      makeSet({
        reps,
        unit,
        restSec,
        label,
        cue: part === 0 ? cue : `${cue} — suite`,
        exerciseId: part === 0 ? exerciseId : `${exerciseId}_p${part}`,
        meta,
      }),
    );
    remaining -= reps * unit;
    part += 1;
    // Ne pas remplir aveuglément un reliquat absurde
    if (remaining > 0 && remaining < unit) break;
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
  // Reliquat trop gros → nouvelle série plafonnée plutôt que 33 reps
  if (vol < target - unit) {
    const need = target - vol;
    const extra = buildCappedRepeatedSets(need, last.distancePerRep || unit, {
      maxReps,
      restSec: last.restSec || 20,
      label: last.label,
      cue: "facile, relâché",
      exerciseId: `${last.exerciseId || "corps"}_fit`,
      meta: { setFormat: last.setFormat || "repeated" },
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
      cue: `${cue} — sans pause`,
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
    const half = Math.max(2, Math.min(maxReps, Math.round(target / 2 / unit)));
    let modN = Math.max(2, Math.min(maxReps, Math.round(target / unit) - half));
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
    void modN;
    fitLastToTarget(sets, target, unit, maxReps);
  } else if (fmt === "pyramid") {
    const steps = [50, 100, 150, 200, 150, 100, 50];
    let base = steps.reduce((a, b) => a + b, 0);
    let scale = 1;
    if (target >= base * 1.6) scale = 2;
    const distances = steps.map((d) => d * scale);
    let used = 0;
    distances.forEach((d, i) => {
      if (used + d > target + 50 && i > 2) return;
      // Respect maxContinuous on pyramid steps that look continuous (reps=1)
      const stepDist = Math.min(d, maxContinuous >= d ? d : Math.min(d, maxContinuous) || d);
      sets.push(
        makeSet({
          reps: 1,
          unit: stepDist,
          restSec: rest(i < 3 ? "facile" : i > 4 ? "facile" : "modere", stepDist, {
            defaultRest: stepDist >= 150 ? 30 : 20,
          }),
          label,
          cue: i === 3 ? "sommet — régulier" : cue,
          exerciseId: `${exerciseId}_pyr_${i}`,
          continuous: false,
          meta: { setFormat: "pyramid", pyramidStep: i },
        }),
      );
      used += stepDist;
    });
    if (used < target - 50) {
      sets.push(
        ...buildCappedRepeatedSets(target - used, 50, {
          maxReps,
          restSec: rest("facile", 50, { defaultRest: 20 }),
          label,
          cue: "facile",
          exerciseId: `${exerciseId}_pyr_fill`,
          meta: { setFormat: "pyramid" },
        }),
      );
    }
    fitLastToTarget(sets, target, 50, maxReps);
  } else if (fmt === "broken") {
    // 2×(N×unit) — deux blocs séparés, reps plafonnées
    const unit = target >= 1000 ? 100 : 50;
    const halfTarget = Math.round(target / 2);
    for (let b = 0; b < 2; b++) {
      sets.push(
        ...buildCappedRepeatedSets(halfTarget, unit, {
          maxReps,
          restSec: rest("facile", unit, { defaultRest: unit >= 100 ? 25 : 20 }),
          label,
          cue: b === 0 ? `${cue} — 1er bloc` : `${cue} — 2e bloc`,
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
    // Cycles descendants — distances compatibles bassin
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
            cue: i === 0 ? `${cue} — départ long` : cue,
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
    // Touches / séries allure — plafonnées (jamais 8×200 si petit budget)
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
    if (s.continuous || s.reps === 1) {
      const restTxt = s.continuous || !s.restSec ? "" : ` — repos ${s.restSec}s`;
      return `-${s.distancePerRep}m ${s.label} — ${s.cue}${restTxt}`;
    }
    return `-${s.reps} × ${s.distancePerRep}m ${s.label} — ${s.cue} — repos ${s.restSec}s`;
  });

  const collapsed = collapseSetsToDisplayLinesExact(sets, fmt);
  const displayLines = collapsed || lines;

  return { sets, setFormat: fmt, lines, displayLines };
}
