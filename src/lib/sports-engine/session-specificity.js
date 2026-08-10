/**
 * sessionSpecificity — distinct de strokeFocus.
 * strokeFocus = quelles nages travailler / préférer
 * sessionSpecificity = à quel point la séance doit coller à ce focus / objectif / course
 */

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
 * Construit une portion corps multi-nages (dos/brasse/crawl[/ondulation]).
 * Respecte maxContinuous stroke-aware : 4N faible → 25/50, pas de long continu.
 */
export function buildFourNagesCorpsPortion(
  targetM,
  { papillonOk = false, restFor, cue = "nages enchaînées", maxContinuous = 100 } = {},
) {
  const strokes = papillonOk
    ? ["dos", "brasse", "crawl", "papillon"]
    : ["dos", "brasse", "crawl", "ondulation (prépa papillon)"];
  // Capacité 4N faible → unités courtes (25/50) ; élevée → 50/100
  const unit =
    maxContinuous <= 50 ? 25 : maxContinuous <= 100 ? 50 : maxContinuous <= 200 ? 50 : 100;
  const target = Math.max(unit * strokes.length, Math.round(targetM / unit) * unit);
  const totalReps = Math.max(strokes.length, Math.round(target / unit));
  // Répartir équitablement ; le surplus va au crawl (pas à l'ondulation/papillon)
  const base = Math.floor(totalReps / strokes.length);
  const repsArr = strokes.map(() => Math.max(1, base));
  let assigned = repsArr.reduce((a, b) => a + b, 0);
  let crawlIdx = strokes.findIndex((s) => s === "crawl");
  if (crawlIdx < 0) crawlIdx = 0;
  while (assigned < totalReps) {
    repsArr[crawlIdx] += 1;
    assigned += 1;
  }
  while (assigned > totalReps && repsArr[crawlIdx] > 1) {
    repsArr[crawlIdx] -= 1;
    assigned -= 1;
  }
  const sets = [];
  strokes.forEach((st, i) => {
    const restSec =
      typeof restFor === "function"
        ? restFor({ intensity: "facile", distancePerRep: unit, setFormat: "alternating", block: "corps" })
        : 20;
    const distPerRep = Math.min(unit, maxContinuous);
    sets.push({
      reps: repsArr[i],
      distancePerRep: distPerRep,
      restSec,
      label: st,
      cue,
      block: "corps",
      exerciseId: `corps_4n_${i}`,
      continuous: false,
      setFormat: "alternating",
      blockRole: "specific",
    });
  });
  // Recalibrate volume if unit changed by maxContinuous clamp
  let used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  if (used < target - unit && maxContinuous >= unit) {
    const need = Math.round((target - used) / unit);
    if (need > 0) {
      sets[crawlIdx].reps += need;
      used += need * unit;
    }
  }
  const lines = sets.map(
    (s) => `-${s.reps} × ${s.distancePerRep}m ${s.label} — ${s.cue} — repos ${s.restSec}s`,
  );
  used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  return { sets, lines, used };
}
