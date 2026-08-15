/**
 * Recettes d’échauffement Arthur — branchées au composeur via flag `warmups`.
 * Fallback : départ synthétique existant (inchangé si flag off ou recette incompatible).
 * Source tableur : propositions arthur_echauff_* (validées pédagogiquement).
 */

import { humanizeArthurDisplayTerms } from "./session-labels.js";

/** @typedef {{
 *  id: string,
 *  kind: 'cycle'|'fixed'|'fixed_choice',
 *  levels: string[],
 *  cycleM?: number,
 *  parts?: string[],
 *  minTotal?: number,
 *  maxTotal?: number,
 *  step?: number,
 *  total?: number,
 *  line?: string,
 *  choices?: number[],
 *  label?: string,
 *  needs4n?: boolean,
 * }} ArthurWarmupRecipe */

/** @type {ArthurWarmupRecipe[]} */
export const ARTHUR_WARMUP_RECIPES = [
  {
    id: "arthur_echauff_cr_dos_50",
    kind: "cycle",
    cycleM: 100,
    parts: ["50 m crawl", "50 m dos"],
    minTotal: 200,
    maxTotal: 600,
    step: 100,
    levels: ["decouverte", "regulier", "sportif", "performance"],
  },
  {
    id: "arthur_echauff_cr_dos_25",
    kind: "cycle",
    cycleM: 50,
    parts: ["25 m crawl", "25 m dos"],
    minTotal: 200,
    maxTotal: 600,
    step: 50,
    levels: ["decouverte", "regulier", "sportif", "performance"],
  },
  {
    id: "arthur_echauff_cr_dos_100",
    kind: "cycle",
    cycleM: 200,
    parts: ["100 m crawl", "100 m dos"],
    minTotal: 200,
    maxTotal: 600,
    step: 200,
    levels: ["regulier", "sportif", "performance"],
  },
  {
    id: "arthur_echauff_cr_autre_50",
    kind: "cycle",
    cycleM: 100,
    parts: ["50 m crawl", "50 m autre nage"],
    minTotal: 200,
    maxTotal: 600,
    step: 100,
    levels: ["regulier", "sportif", "performance"],
  },
  {
    id: "arthur_echauff_4n_formats",
    kind: "fixed_choice",
    choices: [100, 200, 300, 400],
    label: "4 nages",
    levels: ["sportif", "performance"],
    needs4n: true,
  },
  {
    id: "arthur_echauff_cr_dos_4n",
    kind: "fixed",
    total: 300,
    line: "200 m crawl/dos + 100 m 4 nages",
    levels: ["sportif", "performance"],
    needs4n: true,
  },
];

function roundTo(m, pool) {
  const p = pool === 50 ? 50 : 25;
  return Math.max(p, Math.round(Number(m) / p) * p);
}

function pick(rng, arr) {
  if (!arr?.length) return null;
  const r = typeof rng === "function" ? rng() : Math.random();
  return arr[Math.floor(r * arr.length)];
}

/**
 * Construit une ligne d’échauffement Arthur compatible avec le budget départ.
 * Respecte maxContinuous (Découverte ≤ 50 m) via séries de cycles, pas un continu long.
 * @returns {{ distance: number, detailLine: string, recipeId: string, set: object } | null}
 */
export function buildArthurWarmupForBudget({
  budget,
  pool = 25,
  level = "regulier",
  fourNages = false,
  maxContinuous = 200,
  rng = Math.random,
} = {}) {
  const target = roundTo(budget, pool);
  if (!target || target < 100) return null;

  let recipes = ARTHUR_WARMUP_RECIPES.filter((r) => r.levels.includes(level));
  if (!fourNages) recipes = recipes.filter((r) => !r.needs4n);
  // Cycles trop longs pour le max continuous → exclus (ex. 100+100 en découverte)
  recipes = recipes.filter((r) => {
    if (r.kind === "cycle") {
      // Chaque cycle doit tenir dans maxContinuous (QG)
      return (r.cycleM || 0) <= maxContinuous;
    }
    if (r.kind === "fixed") return (r.total || 0) <= maxContinuous || level !== "decouverte";
    if (r.kind === "fixed_choice") return true;
    return true;
  });
  if (level === "decouverte") {
    recipes = recipes.filter((r) => r.kind === "cycle" && (r.cycleM || 0) <= maxContinuous);
  }
  if (!recipes.length) return null;

  const recipe = pick(rng, recipes);
  if (!recipe) return null;

  const cue = "mise en route, facile";
  let distance = target;
  let text = "";
  let reps = 1;
  let distancePerRep = distance;
  let continuous = true;

  if (recipe.kind === "fixed") {
    distance = recipe.total;
    if (Math.abs(distance - target) > target * 0.35) return null;
    if (distance > maxContinuous) {
      // découper en séries de maxContinuous
      distancePerRep = maxContinuous;
      reps = Math.max(1, Math.round(distance / maxContinuous));
      distance = reps * distancePerRep;
      continuous = false;
      text = `${reps} × ${distancePerRep} m — ${recipe.line} — ${cue}`;
    } else {
      text = `${distance} m — ${recipe.line} — ${cue}`;
    }
  } else if (recipe.kind === "fixed_choice") {
    const choices = (recipe.choices || []).filter((c) => c <= target + 50 && (c <= maxContinuous || level !== "decouverte"));
    distance = pick(rng, choices.length ? choices : [Math.min(200, maxContinuous)]) || 200;
    if (distance > maxContinuous) {
      distancePerRep = maxContinuous;
      reps = Math.max(1, Math.round(distance / maxContinuous));
      distance = reps * distancePerRep;
      continuous = false;
      text = `${reps} × ${distancePerRep} m ${recipe.label} — ${cue}`;
    } else {
      text = `${distance} m ${recipe.label} — ${cue}`;
    }
  } else {
    const step = recipe.step || recipe.cycleM;
    // Coller au budget départ (ne pas remonter à minTotal si budget plus bas)
    let total = Math.min(recipe.maxTotal, Math.max(step, target));
    total = Math.floor(total / step) * step;
    if (total < step) total = step;
    if (step === 50 && total % 100 === 25) total -= 25;
    if (step === 50 && total % 100 === 75) total -= 25;
    let n = Math.max(1, Math.round(total / recipe.cycleM));
    distance = n * recipe.cycleM;
    // Si trop loin du budget : recalage strict sur le bassin
    if (Math.abs(distance - target) > 50) {
      n = Math.max(1, Math.floor(target / recipe.cycleM));
      distance = n * recipe.cycleM;
      if (distance < recipe.cycleM || Math.abs(distance - target) > 75) return null;
    }
    const parts = (recipe.parts || []).join(" + ");
    // Représenter en séries de cycle (évite continu > maxContinuous)
    reps = n;
    distancePerRep = recipe.cycleM;
    continuous = false;
    // QG Découverte : maxRepsPerSet souvent 10
    if (reps > 10) {
      reps = 10;
      distance = reps * distancePerRep;
    }
    text = `${reps} × ${distancePerRep} m (${parts}) — ${cue}`;
  }

  if (Math.abs(distance - target) > 75) return null;

  const detailLine = `-${humanizeArthurDisplayTerms(text)}`;
  return {
    distance,
    detailLine,
    recipeId: recipe.id,
    set: {
      kind: continuous ? "continuous" : "series",
      reps,
      distancePerRep,
      restSec: continuous ? 0 : 15,
      distance,
      label: "échauffement",
      cue,
      block: "depart",
      exerciseId: recipe.id,
      stroke: "mixte",
      continuous: continuous === true,
      zone: "Z1",
    },
  };
}
