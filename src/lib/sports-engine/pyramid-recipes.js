/**
 * Banque des blocs pyramide + règles de plafond.
 * `pyramidVariants` = dimensions qui changent vraiment d’un palier à l’autre.
 */

/** @typedef {'nage'|'allure'|'respiration'|'exercice'} PyramidVariant */

export const PYRAMID_VARIANT_KEYS = Object.freeze(["nage", "allure", "respiration", "exercice"]);

/** Plafond d’une pyramide simple (moins de 2 variantes) et de toute pyramide Découverte. */
export const MAX_PYRAMID_VOLUME = 1000;

/** Part du corps physio visée par le builder (entre 65 et 70 %). */
export const PYRAMID_EXTENDED_CORPS_SHARE = 0.68;

/** Plafond QG : jamais toute la séance / tout le corps d’un coup. */
export const PYRAMID_EXTENDED_CORPS_SHARE_MAX = 0.7;

export const EXTENDED_PYRAMID_INTENTS = Object.freeze(["endurance", "aerobie", "seuil", "test"]);
export const EXTENDED_PYRAMID_LEVELS = Object.freeze(["regulier", "sportif", "performance"]);

/**
 * Blocs pyramide existants (Gold + recettes composeur).
 * Gold : une seule dimension réelle → restent sous le plafond 1000 m si elles passent le QG.
 */
export const PYRAMID_RECIPES = Object.freeze([
  {
    id: "generated-distance",
    source: "composer",
    title: "Pyramide distance (paliers seuls)",
    pyramidVariants: Object.freeze([]),
    notes: "Seule la distance change. Filler au-delà de 1000 m.",
  },
  {
    id: "gold-pyramide-400-symetrique",
    source: "session_templates",
    title: "Pyramide 400 symétrique",
    pyramidVariants: Object.freeze(["exercice"]),
    notes: "Crawl / pull / jambes ; même allure Z2.",
  },
  {
    id: "gold-pyramide-4nages-fly-free",
    source: "session_templates",
    title: "Pyramide 4 nages Fly↔Free",
    pyramidVariants: Object.freeze(["nage"]),
    notes: "Papillon / dos / brasse / crawl en miroir.",
  },
  {
    id: "gold-pyramide-600-pull-kick",
    source: "session_templates",
    title: "Pyramide volume & pull",
    pyramidVariants: Object.freeze(["exercice"]),
    notes: "Crawl / pull / jambes ; même allure Z2.",
  },
  {
    id: "varied-exercice-allure",
    source: "composer",
    title: "Pyramide exercice × allure",
    pyramidVariants: Object.freeze(["exercice", "allure"]),
    notes: "Nage complète / pull / jambes + allure qui monte puis descend.",
  },
  {
    id: "varied-nage-allure",
    source: "composer",
    title: "Pyramide nage × allure",
    pyramidVariants: Object.freeze(["nage", "allure"]),
    notes: "Crawl / dos / brasse + allure par palier (mixte / 4 nages).",
  },
  {
    id: "varied-exercice-respiration",
    source: "composer",
    title: "Pyramide exercice × respiration",
    pyramidVariants: Object.freeze(["exercice", "respiration"]),
    notes: "Nage / pull / jambes + 3 / 5 / 7 temps.",
  },
]);

export function normalizePyramidVariants(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const v of raw) {
    const key = String(v || "").toLowerCase();
    if (PYRAMID_VARIANT_KEYS.includes(key) && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export function pyramidRecipeById(id) {
  return PYRAMID_RECIPES.find((r) => r.id === id) || null;
}

export function pyramidVariantsFromSets(sets = []) {
  const step = (sets || []).find((s) => (s?.meta?.pyramidStep ?? s?.pyramidStep) != null);
  return normalizePyramidVariants(step?.meta?.pyramidVariants || step?.pyramidVariants);
}

export function isExtendedPyramidJustified(ctx = {}) {
  if (ctx.painSafe || ctx.painProtection || ctx.taperSafe || ctx.forbidPyramidFiller) return false;
  const level = ctx.level || "regulier";
  if (level === "decouverte") return false;
  if (!EXTENDED_PYRAMID_LEVELS.includes(level)) return false;
  const intent = String(ctx.intentId || ctx.sessionIntent || "");
  return EXTENDED_PYRAMID_INTENTS.includes(intent);
}

/**
 * Volume max d’une pyramide (QG). Douleur / affûtage : interdiction totale ailleurs.
 */
export function maxPyramidVolume(ctx = {}) {
  const level = ctx.level || "";
  const variants = normalizePyramidVariants(ctx.pyramidVariants);
  if (level === "decouverte" || variants.length < 2) return MAX_PYRAMID_VOLUME;
  const corps = Number(ctx.corpsPhysioVolume) || 0;
  if (corps > 0) {
    return Math.round(corps * PYRAMID_EXTENDED_CORPS_SHARE_MAX);
  }
  return MAX_PYRAMID_VOLUME;
}

export function resolvePyramidRecipe(ctx = {}) {
  if (ctx.pyramidRecipeId) {
    const found = pyramidRecipeById(ctx.pyramidRecipeId);
    if (found) return found;
  }
  if (Array.isArray(ctx.pyramidVariants) && ctx.pyramidVariants.length) {
    const variants = normalizePyramidVariants(ctx.pyramidVariants);
    const match = PYRAMID_RECIPES.find(
      (r) =>
        r.pyramidVariants.length === variants.length &&
        variants.every((v, i) => r.pyramidVariants[i] === v),
    );
    if (match) return match;
    return { id: "custom", source: "custom", pyramidVariants: variants, title: "Pyramide custom" };
  }
  const corpsTarget = Number(ctx.corpsTarget) || 0;
  if (isExtendedPyramidJustified(ctx) && corpsTarget > MAX_PYRAMID_VOLUME) {
    const focus = ctx.strokeFocus || "";
    if (focus === "4n" || focus === "mixte") return pyramidRecipeById("varied-nage-allure");
    return pyramidRecipeById("varied-exercice-allure");
  }
  return pyramidRecipeById("generated-distance");
}

function mirroredPos(i, peakIdx) {
  return i <= peakIdx ? i : 2 * peakIdx - i;
}

/**
 * Libellé + cue d’un palier selon les variantes de la recette.
 */
export function pyramidStepFields(recipe, i, peakIdx, baseLabel = "crawl") {
  const variants = normalizePyramidVariants(recipe?.pyramidVariants);
  const isPeak = i === peakIdx;
  const isAscent = i < peakIdx;
  const pos = mirroredPos(i, peakIdx);
  let stepLabel = baseLabel || "crawl";
  const cueParts = [];

  if (variants.includes("nage")) {
    const nages = ["crawl", "dos", "brasse"];
    stepLabel = nages[pos % nages.length];
  }
  if (variants.includes("exercice")) {
    const exos = ["nage complète", "pull", "jambes"];
    const exo = exos[pos % exos.length];
    if (exo === "pull") stepLabel = `${stepLabel} pull`;
    else if (exo === "jambes") stepLabel = `jambes ${stepLabel}`;
  }
  if (variants.includes("allure")) {
    if (isPeak) cueParts.push("soutenu");
    else if (isAscent && i === peakIdx - 1) cueParts.push("modéré");
    else if (isAscent) cueParts.push("facile");
    else cueParts.push("facile, relâché");
  } else if (isPeak) {
    cueParts.push("régulier");
  }
  if (variants.includes("respiration")) {
    const resps = ["respiration 3 temps", "respiration 5 temps", "respiration 7 temps"];
    cueParts.push(resps[Math.min(pos, resps.length - 1)]);
  }

  return {
    label: stepLabel,
    cue: cueParts.join(" — "),
    intensity: isPeak ? "modere" : isAscent && i === peakIdx - 1 ? "modere" : "facile",
  };
}
