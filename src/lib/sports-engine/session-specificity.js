/**
 * sessionSpecificity — distinct de strokeFocus.
 * strokeFocus = quelles nages travailler / préférer
 * sessionSpecificity = à quel point la séance doit coller à ce focus / objectif / course
 */
import {
  allocateStrokeMeters,
  buildFourNagesStrokeSetsFromAlloc,
  fourNagesMix,
  FOUR_STROKES,
} from "./four-nages-mix.js";

/** @typedef {'general'|'stroke_focus'|'goal_specific'|'race_specific'} SessionSpecificity */

export const SESSION_SPECIFICITY_IDS = Object.freeze([
  "general",
  "stroke_focus",
  "goal_specific",
  "race_specific",
]);

/**
 * Résout la spécificité (rôle hebdo > brief > défaut).
 */
export function resolveSessionSpecificity(brief = {}, role = {}) {
  const raw = role.sessionSpecificity || brief.sessionSpecificity || null;
  if (raw && SESSION_SPECIFICITY_IDS.includes(raw)) return raw;

  const stroke = brief.strokeFocus || "mixte";
  const intent = brief.sessionIntent || role.sessionIntent || "";
  const obj = brief.objectif || "";

  if (intent === "quatre_nages" || stroke === "4n") {
    // Par défaut stroke_focus : tech multi-nages, corps majoritairement crawl
    return "stroke_focus";
  }
  if (obj === "triathlon" || intent === "triathlon") return "goal_specific";
  if (obj === "eau_libre" || intent === "eau_libre") return "goal_specific";
  if (brief.qualitySession) return "general";
  return "general";
}

/**
 * Part du volume corps allouée au multi-nages / spécificité course.
 * 0 = corps mono-nage (crawl), 1 = corps très 4N.
 */
export function fourNagesCorpsShare(specificity, strokeFocus) {
  if (strokeFocus !== "4n") return 0;
  switch (specificity) {
    case "race_specific":
      return 0.55;
    case "stroke_focus":
      // J3 : part corps 4N réelle (plus seulement tech + touches)
      return 0.4;
    case "goal_specific":
      return 0.45;
    case "general":
    default:
      return 0.3;
  }
}

/**
 * Construit une portion corps 4 nages : une série par nage, jamais un intitulé vague.
 * Mix selon la préférence ; papillon toujours présent, fractionné (longueur de bassin).
 */
export function buildFourNagesCorpsPortion(
  targetM,
  {
    papillonOk = true,
    restFor,
    cue = "nage explicite",
    maxContinuous = 100,
    pool = 25,
    preferredStroke = null,
    mix = null,
    level = "regulier",
    includeStrokes = null,
  } = {},
) {
  void papillonOk;
  const weights = mix || fourNagesMix(preferredStroke);
  const unit = pool === 50 ? 50 : 25;
  const strokes = includeStrokes || FOUR_STROKES;
  const allocAll = allocateStrokeMeters(targetM, weights, pool);
  const alloc = {};
  for (const s of strokes) alloc[s] = allocAll[s];
  const built = buildFourNagesStrokeSetsFromAlloc(alloc, {
    pool,
    level,
    restFor,
    block: "corps",
    cue,
    maxContinuous: Math.max(unit, maxContinuous),
    includeStrokes: strokes,
    easy: level === "decouverte",
    exercisePrefix: "corps_4n",
    maxReps: 12,
  });
  return built;
}
