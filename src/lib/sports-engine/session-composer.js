/**
 * Composeur de séances V1 — exécute un SessionBrief (COMMENT), sans décider la stratégie.
 *
 * Flux : VolumeTarget → BlockSplit → ExerciseSelection → SetComposition → Validation → FinalSession
 *
 * Étape C : Découverte + Régulier. Flag levels dans SESSION_COMPOSER_ENABLED_LEVELS.
 */
import { calcDetailsDistance } from "../swim-session-generator.js";
import { FINS_SEMAINE } from "../swim-session-generator.js";
import { composeSessionBlueprint, displayIntensity, sessionFitsEquipment } from "./session-compose.js";
import { validateSession } from "./validate.js";
import {
  getExerciseInventory,
  filterExercises,
  rejectsDecouverteComplexity,
  rejectsMissingEquipment,
  ADVANCED_RE,
  COMPLEX_SERIES_RE,
} from "./exercise-library.js";
import { pedagogyFlags } from "./pedagogy-flags.js";
import { buildArthurWarmupForBudget } from "./arthur-warmup-recipes.js";
import {
  mapBriefToPedagogyObjective,
  buildArthurCooldownForBudget,
  buildArthurTechniqueBlock,
  buildArthurFunMainBlock,
} from "./arthur-pedagogy-blocks.js";
import {
  maxContinuousForDecouverte,
  resolveDecouverteIntent,
  coherentVolumeForDecouverte,
} from "./decouverte-intents.js";
import {
  maxContinuousForRegulier,
  resolveRegulierIntent,
  coherentVolumeForRegulier,
} from "./regulier-intents.js";
import {
  maxContinuousForSportif,
  resolveSportifIntent,
  coherentVolumeForSportif,
  coherentVolumeForPerformance,
} from "./sportif-intents.js";
import { buildRaceDaySession, buildRestDaySession, taperRacePaceTouch } from "./taper-load.js";
import {
  canUsePapillon,
  strokeSwimLabel,
  strokeDepartLabel,
} from "./stroke-focus.js";
import {
  allocateStrokeMeters,
  buildFourNagesCoverageSets,
  buildFourNagesStrokeSetsFromAlloc,
  fourNagesMixFromBrief,
  isFourNagesDeclared,
  measureStrokeVolume,
} from "./four-nages-mix.js";
import { buildFourNagesImSets } from "./four-nages-im.js";
import { selectSetFormat, buildCorpsByFormat as buildCorpsByFormatRaw } from "./set-formats.js";
import { collapseSetsToDisplayLinesExact } from "./display-sets.js";
import { restSecFor } from "./recovery.js";
import { resolveEquipmentUsage, labelWithEquipment, isEquipmentEngagementExempt } from "./equipment-usage.js";
import { resolveSessionSpecificity } from "./session-specificity.js";
import { composeWithQualityGate } from "./composer-quality-gate.js";
import { resolveHardConstraints } from "./composer-constraints.js";

/** buildCorpsByFormat + hard constraints (maxReps / maxContinuous). */
function buildCorpsByFormat(format, corpsTarget, opts = {}, brief = null) {
  const hc = brief?.hardConstraints || {};
  return buildCorpsByFormatRaw(format, corpsTarget, {
    ...opts,
    maxRepsPerSet: opts.maxRepsPerSet || hc.maxRepsPerSet || 12,
    maxContinuous: Math.min(
      opts.maxContinuous ?? 400,
      hc.maxContinuousDistance || opts.maxContinuous || 400,
    ),
  });
}
import { selectReprisePattern } from "./reprise-patterns.js";
import { humanizeUserFacingText } from "./user-facing.js";
import { concreteApplyCue, concreteTechLabel } from "./session-labels.js";
import { effortCue, resolvePaceContext } from "./pace-display.js";
import { finalizeCoachSession } from "./coach-restitution.js";
import { pickTechniqueFromBank, buildTechniqueFromBank, resolveTechPrimaryForComposer } from "./technique-from-bank.js";
import {
  shouldUseCorpsBank,
  pickCorpsFromBank,
  buildCorpsFromBank,
} from "./corps-from-bank.js";

export { maxContinuousForDecouverte } from "./decouverte-intents.js";
export { resolveDecouverteIntent, coherentVolumeForDecouverte } from "./decouverte-intents.js";
export { maxContinuousForRegulier, resolveRegulierIntent, coherentVolumeForRegulier } from "./regulier-intents.js";
export { maxContinuousForSportif, resolveSportifIntent, coherentVolumeForSportif, coherentVolumeForPerformance } from "./sportif-intents.js";
export { selectSetFormat, candidateSetFormats, SET_FORMAT_IDS } from "./set-formats.js";
export { restSecFor } from "./recovery.js";
export {
  resolveEquipmentUsage,
  isEquipmentEngagementExempt,
  normalizeEquipmentList,
} from "./equipment-usage.js";
export {
  resolveSessionSpecificity,
  fourNagesCorpsShare,
  SESSION_SPECIFICITY_IDS,
  buildFourNagesCorpsPortion,
} from "./session-specificity.js";
export { selectReprisePattern, REPRISE_PATTERNS } from "./reprise-patterns.js";
export { humanizeUserFacingText, USER_FACING_TERMS } from "./user-facing.js";
export { effortCue, resolvePaceContext } from "./pace-display.js";
export { scaleSessionLinesToVolume, scaleDetailLine } from "./arthur-scale.js";

/** Étape D : Découverte + Régulier + Sportif. Performance hors scope. */
export const SESSION_COMPOSER_ENABLED_LEVELS = Object.freeze([
  "decouverte",
  "regulier",
  "sportif",
  "performance",
]);

export const VOLUME_TOLERANCE_M = 100;

/* ---- RNG déterministe (mulberry32) ---- */
export function hashSeed(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let a = typeof seed === "number" ? seed >>> 0 : hashSeed(seed || "myswym");
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickIndex(arr, rng) {
  if (!arr.length) return -1;
  return Math.floor(rng() * arr.length) % arr.length;
}

function pickOne(arr, rng) {
  const i = pickIndex(arr, rng);
  return i < 0 ? null : arr[i];
}

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

/**
 * Volume calculé UNIQUEMENT depuis les séries structurées (source de vérité composeur).
 * @param {Array<{reps:number, distancePerRep:number}>} sets
 */
export function volumeFromSets(sets = []) {
  return sets.reduce((sum, s) => {
    const reps = Number(s.reps) || 0;
    const d = Number(s.distancePerRep) || 0;
    return sum + reps * d;
  }, 0);
}

/** Vérifie cohérence sets ↔ details parse ↔ distance annoncée */
export function assertVolumeConsistency({ sets, details, announcedDistance, tolerance = VOLUME_TOLERANCE_M }) {
  const fromSets = volumeFromSets(sets);
  const fromDetails = calcDetailsDistance(details);
  const announced = parseInt(String(announcedDistance || "").replace(/\D/g, ""), 10) || 0;
  const errors = [];
  if (Math.abs(fromSets - fromDetails) > tolerance) {
    errors.push(`sets(${fromSets}) vs details(${fromDetails})`);
  }
  if (announced > 0 && Math.abs(fromSets - announced) > tolerance) {
    errors.push(`sets(${fromSets}) vs annoncé(${announced})`);
  }
  return { ok: errors.length === 0, fromSets, fromDetails, announced, errors };
}

function formatSetLine(set, _beginnerFriendly) {
  const continuous = set.continuous === true || (set.reps === 1 && set.continuous !== false);
  const rest =
    !continuous && set.restSec > 0
      ? ` — repos ${set.restSec}s`
      : "";
  let cue = set.cue ? String(set.cue).trim() : "";
  // Évite le bruit narratif / doublon d'intensité
  if (/^applique\b/i.test(cue) || /^nage tranquillement/i.test(cue)) cue = "";
  if (/^montée$|^descente$/i.test(cue)) cue = "";
  const cueTxt = cue ? ` — ${cue}` : "";
  if (continuous || set.reps === 1) {
    return `-${set.distancePerRep}m ${set.label || "nage"}${cueTxt}`;
  }
  return `-${set.reps} × ${set.distancePerRep}m ${set.label || "nage"}${cueTxt}${rest}`;
}

/** Ancien header « Technique · … : » — plus exposé au nageur (reste dispo pour debug). */
function formatTechniqueHeader(exerciseName, equipmentNote) {
  void exerciseName;
  void equipmentNote;
  return null;
}

/** Matériel sur la ligne nageable (pas dans un header Technique ·). */
function labelWithMatos(label, matosNote) {
  if (!matosNote) return label;
  const base = String(label || "nage").trim();
  if (/palmes|tuba|pull|planche|plaquette|avec\s/i.test(base)) return base;
  const note = String(matosNote).replace(/\bpalmes\s*\+\s*tuba(?:\s+frontal)?/gi, "palmes et tuba frontal");
  return `${base} avec ${note}`;
}

function isFourNSession(brief, strokeFocus) {
  return (
    strokeFocus === "4n" ||
    brief?.hardConstraints?.isFourN ||
    isFourNagesDeclared(brief) ||
    brief?.sessionIntent === "quatre_nages"
  );
}

function fourNagesAllowsPapillon(sessionLike = {}, opts = {}) {
  return (
    isFourNagesDeclared(sessionLike) ||
    isFourNagesDeclared(opts) ||
    sessionLike.strokeFocus === "4n" ||
    opts.strokeFocus === "4n" ||
    opts.fourN === true
  );
}

function appendFourNagesTechniqueBlock({
  brief,
  techniqueVolume,
  pool,
  restFor,
  zone,
  cue,
  matosNote,
  sets,
  details,
  exerciseIds,
}) {
  const mix = fourNagesMixFromBrief(brief);
  const alloc = allocateStrokeMeters(techniqueVolume, mix, pool);
  const safeCue = /\d+\s*m\b/i.test(String(cue || "")) ? "geste propre" : cue || "geste propre";
  const built = buildFourNagesStrokeSetsFromAlloc(alloc, {
    pool,
    level: brief.level,
    restFor,
    block: "technique",
    cue: safeCue,
    zone,
    easy: brief.level === "decouverte",
    exercisePrefix: "tech_4n",
    maxReps: 12,
  });
  for (const s of built.sets) {
    s.label = labelWithMatos(s.label, matosNote);
    sets.push(s);
    details.push(formatSetLine(s, brief.level === "decouverte"));
    exerciseIds.push(s.exerciseId);
  }
  return built.used;
}

function planFourNagesCorps({
  brief,
  sessionSpecificity,
  corpsTarget,
  volumeTotal,
  usedSets,
  pool,
  restFor,
  maxContinuous,
  finReserve = 0,
  rng,
}) {
  void finReserve;
  const mix = fourNagesMixFromBrief(brief);
  const used = measureStrokeVolume({ sets: usedSets });
  const targets = allocateStrokeMeters(volumeTotal, mix, pool);
  const unit = pool === 50 ? 50 : 25;
  const minCrawl = unit * 2;
  const others = ["dos", "brasse", "papillon"];
  const need = {};
  let needSum = 0;
  for (const s of others) {
    need[s] = Math.max(unit, (targets[s] || 0) - (used.meters[s] || 0));
    needSum += need[s];
  }
  const maxFourN = Math.max(unit * 3, Math.max(0, Number(corpsTarget) - minCrawl));
  const fourNBudget = Math.min(needSum, maxFourN);
  const setCap =
    Number(brief.hardConstraints?.maxContinuousDistance) ||
    (brief.level === "regulier" ? 200 : brief.level === "decouverte" ? maxContinuous : 400);
  const im = buildFourNagesImSets({
    brief,
    budget: fourNBudget,
    pool,
    restFor,
    rng,
    maxSetContinuous: setCap,
    maxStrokeContinuous: maxContinuous,
  });
  const remainingBudget = Math.max(0, fourNBudget - (im.used || 0));
  const usedAfterIm = measureStrokeVolume({ sets: [...(usedSets || []), ...(im.sets || [])] });
  const still = {};
  let stillSum = 0;
  for (const s of others) {
    still[s] = Math.max(0, (targets[s] || 0) - (usedAfterIm.meters[s] || 0));
    stillSum += still[s];
  }
  const fillBudget = Math.min(remainingBudget, stillSum);
  const fillStrokes = others.filter((s) => still[s] >= unit);
  let mono = { sets: [], lines: [], used: 0 };
  if (fillBudget >= unit * Math.max(1, fillStrokes.length) && fillStrokes.length) {
    const weights = {};
    for (const s of fillStrokes) weights[s] = still[s] / stillSum;
    const alloc = allocateStrokeMeters(fillBudget, weights, pool, { strokes: fillStrokes });
    mono = buildFourNagesStrokeSetsFromAlloc(alloc, {
      pool,
      level: brief.level,
      restFor,
      block: "corps",
      cue: sessionSpecificity === "race_specific" ? "enchaîne proprement" : "nage explicite",
      maxContinuous,
      includeStrokes: fillStrokes,
      easy: brief.level === "decouverte",
      exercisePrefix: "corps_4n",
      maxReps: 12,
    });
  }
  const fourNPortion = {
    sets: [...(im.sets || []), ...(mono.sets || [])],
    lines: [...(im.lines || []), ...(mono.lines || [])],
    used: (im.used || 0) + (mono.used || 0),
  };
  return {
    fourNPortion,
    mainCorpsTarget: Math.max(minCrawl, Number(corpsTarget) - (fourNPortion.used || 0)),
    mix,
  };
}

function attachFourNagesCoverage(result, brief) {
  if (!result?.ok || !result.session || !isFourNSession(brief, brief.strokeFocus)) return result;
  for (const s of result.session.sets || []) {
    if (!s.stroke && s.stroke !== "im" && (s.block === "corps" || s.block === "depart" || s.block === "fin")) {
      s.stroke = "crawl";
    }
  }
  const extra = buildFourNagesCoverageSets(result.session, brief);
  if (!extra.sets.length) return result;
  const session = result.session;
  session.sets = [...(session.sets || []), ...extra.sets];
  session.details = [...(session.details || []), ...extra.lines];
  const vol = session.sets.reduce((a, s) => a + (Number(s.reps) || 1) * (Number(s.distancePerRep) || 0), 0);
  session.volumeFromSets = vol;
  session.trainingDistance = vol;
  session.distance = `${vol}m`;
  return result;
}

function equipmentNoteForDecouverte(equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) return "";
  const hasPalmes = equipment.includes("palmes");
  const hasTuba = equipment.includes("tuba");
  const hasPlanche = equipment.includes("planche");
  if (hasPalmes && hasTuba) return "palmes et tuba frontal";
  if (hasPalmes) return "palmes";
  if (hasTuba) return "tuba frontal";
  if (hasPlanche) return "planche";
  return "";
}

/**
 * Plafond de nage continue — voir decouverte-intents.js (réexporté).
 * Intention pédagogique — résolue via resolveDecouverteIntent.
 */
/** J3 : cue objectif injecté dans le corps (pas seulement le titre). */
function objectiveBodyCue(brief = {}, intent = {}) {
  if (brief.painProtection || brief.hasPainConstraint || brief._qualityGateForceSafe) return null;
  const obj = brief.objectif || "";
  const existing = `${intent.applyCue || ""} ${intent.headline || ""}`;
  if (obj === "eau_libre") {
    if (/sighting|visée|orientation|navigation/i.test(existing)) return null;
    return "sighting + allure régulière";
  }
  if (obj === "triathlon") {
    if (/triathlon|économie|draft|énergie/i.test(existing)) return null;
    return "économie d\'énergie — allure régulière";
  }
  if (obj === "course_piscine") {
    if (/allure course|seuil|race|spécifique/i.test(existing)) return null;
    return null; // intensité gérée via Z3 block
  }
  return null;
}

/** Injecte cue objectif sur une ligne corps si absent (QG eau libre / triathlon). */
function ensureObjectiveCueInDetails(details, brief, intent) {
  void intent;
  const joined = details.join("\n");
  if (
    (brief.objectif === "eau_libre" || brief.family === "eau_libre") &&
    !/sighting|visée|orientation|navigation|lève|repér/i.test(joined)
  ) {
    const objCue = "sighting + allure régulière";
    const corpsIdx = details.findIndex(
      (l) =>
        /^-\d/.test(l) &&
        /crawl|jambes|nage/i.test(l) &&
        !/mise en route|dos à deux|retour au calme|focus geste/i.test(l),
    );
    if (corpsIdx >= 0) details[corpsIdx] = `${details[corpsIdx]} — ${objCue}`;
    else details.splice(Math.min(3, details.length), 0, `-Cue eau libre : ${objCue}`);
  }
  if (
    (brief.objectif === "triathlon" || brief.family === "triathlon") &&
    !/triathlon|économie|draft|énergie|allure régulière/i.test(joined)
  ) {
    const objCue = "économie d'énergie — allure régulière";
    const corpsIdx = details.findIndex(
      (l) =>
        /^-\d/.test(l) &&
        /crawl|jambes/i.test(l) &&
        !/mise en route|dos à deux|focus geste/i.test(l),
    );
    if (corpsIdx >= 0) details[corpsIdx] = `${details[corpsIdx]} — ${objCue}`;
  }
}

/** Matos visible dans les détails → liste appliquée (engagement QG). */
function harvestEquipmentFromDetails(details, inventory = []) {
  const joined = (details || []).join("\n");
  const out = [];
  for (const e of inventory) {
    if (e === "pull" && /pull/i.test(joined)) out.push("pull");
    else if (e === "palmes" && /palmes/i.test(joined)) out.push("palmes");
    else if (e === "tuba" && /tuba/i.test(joined)) out.push("tuba");
    else if (e === "planche" && /planche/i.test(joined)) out.push("planche");
    else if (e === "plaquettes" && /plaquette/i.test(joined)) out.push("plaquettes");
  }
  return out;
}

/** Si inventaire non vide et rien d’appliqué : annoter une ligne technique. */
function ensureEquipmentEngagement(details, eqList, brief) {
  if (!eqList?.length || isEquipmentEngagementExempt(brief)) return [];
  let used = harvestEquipmentFromDetails(details, eqList);
  if (used.length) return used;
  const inject = [];
  // Un seul item suffit pour l’engagement QG (évite palmes+tuba systématique)
  if (eqList.includes("tuba")) inject.push("tuba");
  else if (eqList.includes("palmes")) inject.push("palmes");
  else if (eqList.includes("planche")) inject.push("planche");
  else if (eqList.includes("pull")) inject.push("pull-buoy");
  if (!inject.length) return used;
  const label = inject.map((x) => (x === "tuba" ? "tuba frontal" : x)).join(" et ");
  const matosRe = /palmes|tuba|pull|planche|plaquette|élastique|elastique/i;
  const candidates = [];
  for (let i = 0; i < details.length; i++) {
    const l = details[i];
    if (!/×.*m/i.test(l)) continue;
    if (/mise en route|dos à deux|retour au calme|récup/i.test(l)) continue;
    if (matosRe.test(l)) continue;
    candidates.push(i);
  }
  for (const techIdx of candidates) {
    const before = details[techIdx];
    // « avec un doigt » n’est pas du matos — injecter avant le 1er tiret cadratin
    if (/ — /.test(before)) {
      details[techIdx] = before.replace(/ — /, ` avec ${label} — `);
    } else {
      details[techIdx] = `${before} avec ${label}`;
    }
    used = harvestEquipmentFromDetails(details, eqList);
    if (used.length) return used;
    details[techIdx] = before;
  }
  return [];
}

export function pedagogicalIntentDecouverte(brief = {}) {
  return resolveDecouverteIntent(brief);
}

/**
 * Hard constraints Découverte sur texte / sets.
 */
export function validateDecouverteHard(sessionLike, opts = {}) {
  const errors = [];
  const text = (sessionLike.details || []).join("\n");
  if (/Z3|Z4/i.test(text)) errors.push("Z3/Z4 interdit Découverte");
  if (/\bCSS\b/i.test(text)) errors.push("CSS interdit Découverte");
  if (/hypoxie|apnée|apnee/i.test(text)) errors.push("hypoxie/apnée interdit Découverte");
  if (COMPLEX_SERIES_RE.test(text)) errors.push("séries complexes interdites Découverte");
  if (/seuil|VO2|sprint|à bloc|culbute|petit chien|rattrapé|lactate/i.test(text)) {
    errors.push("contenu avancé interdit Découverte");
  }
  if (/sans pause[^\n]*repos|repos[^\n]*sans pause/i.test(text)) {
    errors.push("repos incohérent après nage continue");
  }
  // Papillon non maîtrisé : pas de distance papillon réelle — sauf profil 4 nages
  if (!fourNagesAllowsPapillon(sessionLike, opts) && (opts.papillonOk === false || sessionLike.papillonMastered === false)) {
    if (/\bpapillon\b/i.test(text) && !/ondulation|prépa|adapt/i.test(text)) {
      errors.push("papillon imposé sans maîtrise");
    }
  }
  const setLines = (sessionLike.details || []).filter(
    (l) => /^\s*-?\d/.test(String(l).trim()) || /×|x\s*\d/i.test(l),
  );
  if (setLines.length > 12) errors.push("trop de changements d'exercice");
  for (const line of sessionLike.details || []) {
    if (String(line).length > 140) errors.push("consigne trop longue");
  }

  const maxCont = opts.maxContinuous ?? sessionLike.maxContinuousAllowed ?? 100;
  if (sessionLike.sets) {
    for (const s of sessionLike.sets) {
      if (s.block === "technique" && s.distancePerRep > 50) {
        errors.push("distance technique trop longue Découverte");
      }
      const continuous = s.continuous === true || (s.reps === 1 && s.block !== "technique");
      if (continuous && s.restSec > 0) {
        errors.push("repos affiché sur série continue");
      }
      // Tous les blocs (départ/corps/fin) : plafond continu
      if (continuous && s.distancePerRep > maxCont) {
        errors.push(`distance continue trop longue (>${maxCont}m, block=${s.block || "?"})`);
      }
      if (!s.continuous && Number(s.reps) > 1 && Number(s.restSec) === 0) {
        errors.push("série répétée avec rest=0");
      }
      if (!s.continuous && Number(s.reps) > 12) {
        errors.push(`trop de répétitions (${s.reps})`);
      }
      // 75/100 m seulement si capacité le justifie
      if (!opts.allowLongReps && s.distancePerRep >= 75 && s.block === "corps" && maxCont < 100) {
        errors.push("reps ≥75m sans capacité suffisante");
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Série répétée exacte — J3 : pas de « suite », préfère unité / 2 blocs. */
function buildRepeatedExact(targetM, unit, { label, cue, restSec, block, exerciseId, maxReps = 12, maxContinuous }) {
  const target = Math.max(unit, roundTo(targetM, unit));
  const rest = Math.max(1, Number(restSec) || 20);
  const cap = Math.max(4, Number(maxReps) || 12);
  const maxU = Number(maxContinuous) > 0 ? Number(maxContinuous) : Infinity;
  const unitsTry = [unit, 50, 100, 200]
    .filter((u, i, a) => u > 0 && u <= maxU && a.indexOf(u) === i)
    .sort((a, b) => a - b);
  for (const u of unitsTry) {
    const reps = Math.round(target / u);
    if (reps >= 2 && reps <= cap && Math.abs(reps * u - target) <= u) {
      return [{ reps, distancePerRep: u, restSec: rest, label, cue, block, exerciseId, continuous: false }];
    }
  }
  // Découpe en plusieurs séries à l’unité (respecte maxContinuous + maxReps)
  const u = Math.min(unit, Number.isFinite(maxU) ? maxU : unit);
  const totalReps = Math.max(2, Math.round(target / u));
  const nParts = Math.max(1, Math.ceil(totalReps / cap));
  const base = Math.floor(totalReps / nParts);
  let rem = totalReps - base * nParts;
  const sets = [];
  for (let part = 0; part < nParts; part++) {
    const reps = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    if (reps < 2) continue;
    sets.push({
      reps: Math.min(cap, reps),
      distancePerRep: u,
      restSec: rest,
      label,
      cue: part === 0 ? cue : `${cue} — 2e bloc, contraste`,
      block,
      exerciseId: part === 0 ? exerciseId : `${exerciseId}_b${part}`,
      continuous: false,
    });
  }
  return sets.length
    ? sets
    : [{ reps: Math.min(cap, 2), distancePerRep: u, restSec: rest, label, cue, block, exerciseId, continuous: false }];
}

/** Continu court (1 × distance), jamais de repos affiché. */
function buildContinuous(distanceM, { label, cue, block, exerciseId }) {
  return {
    reps: 1,
    distancePerRep: distanceM,
    restSec: 0,
    label,
    cue,
    block,
    exerciseId,
    continuous: true,
  };
}

/**
 * Bascule pédagogie warmups : recette Arthur si flag ON et volume compatible.
 * Sinon false → le composeur garde le départ synthétique actuel.
 */
function tryArthurDepart({ budget, pool, level, brief, strokeFocus, rng, sets, details, exerciseIds, maxContinuous }) {
  if (!pedagogyFlags().warmups) return false;
  const built = buildArthurWarmupForBudget({
    budget,
    pool,
    level,
    fourNages: isFourNSession(brief, strokeFocus),
    maxContinuous: maxContinuous ?? (level === "decouverte" ? 50 : 200),
    rng,
  });
  if (!built) return false;
  sets.push(built.set);
  details.push(built.detailLine);
  exerciseIds.push(built.recipeId);
  return true;
}

/** RAC Arthur (D10 dos à deux bras) — fallback FINS_SEMAINE si échec. */
function tryArthurFin({
  budget,
  pool,
  level,
  brief,
  intent,
  equipment,
  rng,
  sets,
  details,
  exerciseIds,
  maxContinuous,
  zone = null,
  fourNages = false,
}) {
  if (!pedagogyFlags().cooldowns) return false;
  const built = buildArthurCooldownForBudget({
    budget,
    pool,
    level,
    objective: mapBriefToPedagogyObjective(brief, intent),
    equipment: equipment || [],
    maxContinuous: maxContinuous ?? (level === "decouverte" ? 50 : 200),
    rng,
    zone,
  });
  if (!built?.sets?.length) return false;
  for (const s of built.sets) {
    if (fourNages && /crawl/i.test(s.label || "")) s.stroke = "crawl";
    sets.push(s);
  }
  details.push(...built.lines);
  exerciseIds.push(built.recipeId);
  return true;
}

/** Éducatifs Arthur en bloc technique — fallback banque / synthétique. */
function tryArthurTechnique({
  budget,
  pool,
  level,
  brief,
  intent,
  equipment,
  rng,
  sets,
  details,
  exerciseIds,
  maxContinuous,
  zone = null,
}) {
  if (!pedagogyFlags().drills) return false;
  const engageEq = !isEquipmentEngagementExempt(brief);
  const built = buildArthurTechniqueBlock({
    budget,
    pool,
    level,
    objective: mapBriefToPedagogyObjective(brief, intent),
    equipment: engageEq ? equipment || [] : [],
    maxContinuous: maxContinuous ?? (level === "decouverte" ? 50 : 200),
    rng,
    zone,
    papillonOk: canUsePapillon(brief),
    engageEquipment: engageEq,
  });
  if (!built?.sets?.length) return false;
  {
    const th = formatTechniqueHeader(
      built.drills.map((d) => d.name).filter(Boolean).join(" & ") || "Éducatifs",
      "",
    );
    if (th) details.push(th);
  }
  for (const s of built.sets) {
    sets.push(s);
    exerciseIds.push(s.exerciseId);
    if (s.continuous || (s.reps === 1 && !(s.restSec > 0))) {
      details.push(`-${s.distancePerRep} m ${s.label}${s.cue ? ` — ${s.cue}` : ""}`);
    } else {
      details.push(
        `-${s.reps} × ${s.distancePerRep} m ${s.label}${s.cue ? ` — ${s.cue}` : ""} — repos ${s.restSec || 20}s`,
      );
    }
  }
  return true;
}

/** Corps fun par objectif — fallback formats / banque existants. */
function tryArthurFunCorps({
  budget,
  pool,
  level,
  brief,
  intent,
  rng,
  maxContinuous,
  zone = null,
  maxReps = null,
}) {
  if (!pedagogyFlags().funMainSets) return null;
  if (brief?.hardConstraints?.painProtection || brief?.taperShortQuality) return null;
  if (brief?.taperLoad?.taperStage === "race_day") return null;
  // Séances qualité : garder prep → quality → consolidation (rôles + headers)
  if (brief?.qualitySession || intent?.quality) return null;
  const intentId = String(intent?.id || brief?.sessionIntent || "").toLowerCase();
  if (/^(vitesse|vo2|seuil|css|test)$/.test(intentId)) return null;
  // Garder une part de formats classiques (variété setFormat / tests)
  if (typeof rng === "function" && rng() < 0.35) return null;
  const built = buildArthurFunMainBlock({
    budget,
    pool,
    level,
    objective: mapBriefToPedagogyObjective(brief, intent),
    maxContinuous: maxContinuous ?? (level === "decouverte" ? 50 : 200),
    rng,
    zone,
  });
  if (!built?.sets?.length) return null;
  const cap = Number(maxReps) || brief?.hardConstraints?.maxRepsPerSet || 0;
  if (cap > 0 && built.sets.some((s) => !s.continuous && (s.reps || 0) > cap)) return null;
  return built;
}

/**
 * Remplit un quota : séries courtes par défaut ; continu seulement si ≤ maxContinuous.
 */
function fillAccessibleVolume(targetM, pool, maxContinuous, opts) {
  const quantum = pool === 25 ? 25 : 50;
  const target = Math.max(quantum, roundTo(targetM, quantum));
  const unit = opts.unit || quantum;

  if (opts.forceContinuous && target <= maxContinuous) {
    return [buildContinuous(target, opts)];
  }
  // Corps / application : toujours préférer répétitions si > maxContinuous
  if (target > maxContinuous || opts.preferSeries) {
    return buildRepeatedExact(target, unit, { ...opts, maxContinuous });
  }
  return [buildContinuous(target, opts)];
}

/**
 * Compose une séance Découverte complète à partir d'un SessionBrief.
 */
function composeDecouverteSession(brief, rng) {
  const inventory = getExerciseInventory();
  const engineVolume = brief.volumeTarget;
  const coherentVolume = coherentVolumeForDecouverte(brief);
  const blueprint = composeSessionBlueprint({
    volumeTarget: coherentVolume,
    family: brief.family,
    level: "decouverte",
    phase: brief.phase,
    isKeySession: brief.keySession,
    objectif: brief.objectif,
    roleObjectif: brief.roleObjectif,
  });
  const blocks = blueprint.blocks;
  const pool = brief.pool || 50;
  const beginnerFriendly = true;
  const equipment = brief.equipment;
  const matosNote = equipmentNoteForDecouverte(equipment);
  const eqList = Array.isArray(equipment) ? equipment : [];
  const maxCont = maxContinuousForDecouverte(brief);
  const intent = resolveDecouverteIntent(brief);
  const strokeFocus = brief.strokeFocus || "mixte";
  const papillonOk = canUsePapillon(brief);
  const techUnit = 25;
  const swimLabel = strokeSwimLabel(strokeFocus, { papillonOk });
  const departLabel = strokeDepartLabel(strokeFocus);

  const sets = [];
  const details = [];
  const exerciseIds = [];

  // --- DÉPART ---
  // Bascule warmups Arthur (flag) — sinon départ synthétique inchangé
  const arthurDepartOk = tryArthurDepart({
    budget: blocks.depart,
    pool,
    level: "decouverte",
    brief,
    strokeFocus,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: maxCont,
  });
  if (!arthurDepartOk) {
  // Hard: jamais de continu > maxContinuous (même en échauffement)
  const departCandidates = filterExercises(inventory, brief, { block: "depart" }).filter(
    (ex) => !rejectsDecouverteComplexity(ex) && !rejectsMissingEquipment(ex, eqList),
  );
  const departEx = pickOne(departCandidates, rng);
  let departSets;
  if (blocks.depart <= maxCont) {
    departSets = [
      buildContinuous(blocks.depart, {
        label: departLabel,
        cue: "nage tranquillement",
        block: "depart",
        exerciseId: departEx?.id || "depart_synth_easy",
      }),
    ];
  } else {
    departSets = fillAccessibleVolume(blocks.depart, pool, maxCont, {
      label: departLabel,
      cue: "échauffement",
      restSec: 15,
      block: "depart",
      exerciseId: departEx?.id || "depart_synth_easy",
      preferSeries: true,
      unit: pool === 25 ? 25 : 50,
    });
  }
  for (const s of departSets) {
    if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    sets.push(s);
    details.push(formatSetLine(s, beginnerFriendly));
  }
  if (departEx) exerciseIds.push(departEx.id);
  }

  // --- TECHNIQUE ---
  if (intent.id === "decouverte_4n" || isFourNSession(brief, strokeFocus)) {
    appendFourNagesTechniqueBlock({
      brief,
      techniqueVolume: blocks.technique,
      pool,
      restFor: () => 15,
      cue: intent.learnCue,
      matosNote,
      sets,
      details,
      exerciseIds,
    });
  } else {
    const arthurTech = tryArthurTechnique({
      budget: blocks.technique,
      pool,
      level: "decouverte",
      brief,
      intent,
      equipment: eqList,
      rng,
      sets,
      details,
      exerciseIds,
      maxContinuous: maxCont,
    });
    if (!arthurTech) {
    const techCandidates = filterExercises(inventory, brief, { block: "technique" });
    let techEx = pickOne(techCandidates, rng);
    if (!techEx) {
      const soft = inventory.filter(
        (ex) =>
          ex.type === "technique" &&
          (ex.focusKey === "technique_fleche" || ex.focusKey === "technique_grand_chien") &&
          !rejectsMissingEquipment(ex, eqList),
      );
      techEx = pickOne(soft, rng);
    }
    if (!techEx) {
      return { ok: false, reason: "aucun exercice technique Découverte compatible" };
    }

    const primaryKey = intent.techPrimary || "flèche";
    const altKey = intent.techAlt || "nage";
    const labelOf = (k) => {
      if (k === "chien") return "grand chien";
      if (k === "nage") return "crawl facile, respiration sur le côté habituel";
      if (k === "flèche") return "flèche";
      return k;
    };
    const cueOf = (k) => {
      if (k === "chien") return "bras sous l'eau, lentement";
      if (k === "nage") return "retrouve la sensation";
      if (k === "flèche") return "poussée mur + glisse, tête entre les bras";
      return intent.learnCue;
    };

    const half = Math.max(techUnit * 2, roundTo(blocks.technique / 2, techUnit));
    const other = Math.max(techUnit * 2, blocks.technique - half);
    const techPrimary = buildRepeatedExact(half, techUnit, {
      label: labelWithMatos(labelOf(primaryKey), matosNote),
      cue: cueOf(primaryKey),
      restSec: 15,
      block: "technique",
      exerciseId: techEx.id,
    });
    const techAlt = buildRepeatedExact(other, techUnit, {
      label: labelWithMatos(labelOf(altKey), matosNote),
      cue: cueOf(altKey),
      restSec: 15,
      block: "technique",
      exerciseId: `${techEx.id}_${altKey}`,
    });
    let techVol = volumeFromSets([...techPrimary, ...techAlt]);
    if (techVol !== blocks.technique && techAlt[0]) {
      techAlt[0].reps = Math.max(2, techAlt[0].reps + Math.round((blocks.technique - techVol) / techUnit));
    }

    {
      const th = formatTechniqueHeader(`${labelOf(primaryKey)} & ${labelOf(altKey)}`, matosNote);
      if (th) details.push(th);
    }
    for (const ts of [...techPrimary, ...techAlt]) {
      sets.push(ts);
      const isApply = /crawl facile|respiration sur le côté/i.test(ts.label);
      const mid = isApply
        ? `${ts.reps} × ${ts.distancePerRep}m ${ts.label}`
        : `${ts.reps} × ${ts.distancePerRep}m : ${ts.label} + crawl facile`;
      details.push(`-${mid}${ts.cue && !isApply ? ` — ${ts.cue}` : ""} — repos ${ts.restSec}s`);
    }
    exerciseIds.push(techEx.id);
    }
  }

  // --- CORPS ---
  const corpsUnit =
    intent.preferLongerReps && maxCont >= 100 ? 100 : pool === 25 ? 25 : 50;
  const safeUnit = corpsUnit >= 75 && maxCont < 100 ? (pool === 25 ? 25 : 50) : corpsUnit;
  let corpsTarget = blocks.corps;
  let fourNPortion = null;
  if (isFourNSession(brief, strokeFocus)) {
    const planned = planFourNagesCorps({
      brief,
      sessionSpecificity: "stroke_focus",
      corpsTarget: blocks.corps,
      volumeTotal: coherentVolume,
      usedSets: sets,
      pool,
      restFor: () => 20,
      maxContinuous: maxCont,
      finReserve: blocks.rac,
      rng,
    });
    fourNPortion = planned.fourNPortion;
    corpsTarget = planned.mainCorpsTarget;
  }
  const corpsMaxReps = brief.hardConstraints?.maxRepsPerSet || 10;
  const corpsSets = fillAccessibleVolume(corpsTarget, pool, maxCont, {
    label: isFourNSession(brief, strokeFocus) ? "crawl facile" : swimLabel,
    cue: intent.applyCue,
    restSec: safeUnit >= 100 ? 30 : 20,
    block: "corps",
    exerciseId: `corps_${intent.id}_${strokeFocus}`,
    preferSeries: true,
    unit: safeUnit,
    maxReps: corpsMaxReps,
  });
  const arthurCorps = !isFourNSession(brief, strokeFocus)
    ? tryArthurFunCorps({
        budget: corpsTarget,
        pool,
        level: "decouverte",
        brief,
        intent,
        rng,
        maxContinuous: maxCont,
        maxReps: corpsMaxReps,
      })
    : null;
  if (arthurCorps?.sets?.length && arthurCorps.sets.every((s) => (s.reps || 1) <= corpsMaxReps)) {
    for (const cs of arthurCorps.sets) {
      sets.push(cs);
      exerciseIds.push(cs.exerciseId);
    }
    details.push(...arthurCorps.lines);
  } else {
  for (const cs of corpsSets) {
    if (isFourNSession(brief, strokeFocus)) cs.stroke = "crawl";
    sets.push(cs);
    details.push(formatSetLine(cs, beginnerFriendly));
  }
  exerciseIds.push(corpsSets[0].exerciseId);
  }
  if (fourNPortion) {
    for (const s of fourNPortion.sets) {
      sets.push(s);
      exerciseIds.push(s.exerciseId);
    }
    details.push(...fourNPortion.lines);
  }

  // --- FIN --- (respecte maxContinuous : pas de 100–150m continu si plafond 50)
  const finLabel = isFourNSession(brief, strokeFocus) ? "crawl facile" : "au choix (récup)";
  const arthurFinOk = tryArthurFin({
    budget: blocks.rac,
    pool,
    level: "decouverte",
    brief,
    intent,
    equipment: eqList,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: maxCont,
    fourNages: isFourNSession(brief, strokeFocus),
  });
  if (!arthurFinOk) {
  let finSets;
  if (blocks.rac <= maxCont) {
    finSets = [
      buildContinuous(blocks.rac, {
        label: finLabel,
        cue: "très facile",
        block: "fin",
        exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
      }),
    ];
  } else {
    finSets = fillAccessibleVolume(blocks.rac, pool, maxCont, {
      label: finLabel,
      cue: "très facile",
      restSec: 15,
      block: "fin",
      exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
      preferSeries: true,
      unit: pool === 25 ? 25 : 50,
      maxReps: 10,
    });
  }
  for (const s of finSets) {
    if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    sets.push(s);
    if (isFourNSession(brief, strokeFocus)) {
      details.push(formatSetLine(s, beginnerFriendly));
    } else if (s.continuous || s.reps === 1) {
      const finIdx = parseInt(String(s.exerciseId).replace(/\D/g, ""), 10) || 0;
      const finText = humanizeUserFacingText(
        FINS_SEMAINE[finIdx % FINS_SEMAINE.length](s.distancePerRep)
          .replace(/\(Z1\)/i, "(facile)")
          .replace(/\(RAC\)/i, "(récup)"),
        { level: "decouverte" },
      );
      details.push(finText.startsWith("-") ? finText : `-${finText}`);
    } else {
      details.push(formatSetLine(s, beginnerFriendly));
    }
  }
  }

  ensureObjectiveCueInDetails(details, brief, intent);

  const volumeSets = volumeFromSets(sets);
  const consistency = assertVolumeConsistency({
    sets,
    details,
    announcedDistance: volumeSets,
    tolerance: VOLUME_TOLERANCE_M,
  });
  if (Math.abs(consistency.fromSets - consistency.fromDetails) > VOLUME_TOLERANCE_M) {
    return {
      ok: false,
      reason: `volume incohérent: ${consistency.errors.join("; ")}`,
      debug: consistency,
    };
  }

  const usedEq = [];
  const joinedDetails = details.join("\n");
  for (const e of eqList) {
    if (e === "pull" && /pull/i.test(joinedDetails)) usedEq.push("pull");
    else if (e === "palmes" && /palmes/i.test(joinedDetails)) usedEq.push("palmes");
    else if (e === "tuba" && /tuba/i.test(joinedDetails)) usedEq.push("tuba");
    else if (e === "planche" && /planche/i.test(joinedDetails)) usedEq.push("planche");
    else if (e === "plaquettes" && /plaquette/i.test(joinedDetails)) usedEq.push("plaquettes");
  }

  // Engagement matos : inventaire non vide → annoter une ligne technique si rien de visible
  if (eqList.length && !usedEq.length && !isEquipmentEngagementExempt(brief)) {
    const applied = ensureEquipmentEngagement(details, eqList, brief);
    usedEq.push(...applied);
  }

  const session = {
    type: intent.id === "decouverte_4n" || strokeFocus === "4n" ? "TECHNIQUE" : brief.family === "technique" ? "TECHNIQUE" : "ENDURANCE",
    title: intent.headline.replace(/^Aujourd'hui :\s*/i, "Découverte · "),
    intensity: displayIntensity(brief.intensityTarget, "decouverte", true),
    details,
    distance: `${volumeSets}m`,
    duration: Math.max(20, Math.min(brief.durationTarget || 45, Math.round(volumeSets / 28))),
    completed: false,
    skipped: null,
    family: brief.family,
    isKeySession: brief.keySession || undefined,
    objectives: [intent.headline, "Apprendre → appliquer → nager → récupérer"],
    strokeFocus,
    papillonMastered: papillonOk,
    engineWhy: brief.why,
    composerWhy: {
      engineVolumeTarget: engineVolume,
      volumeTarget: coherentVolume,
      volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
      volumeSoftReduced: coherentVolume < engineVolume,
      blocks,
      exercises: exerciseIds,
      primaryTechnicalGoal: brief.primaryTechnicalGoal,
      intensityTarget: brief.intensityTarget,
      lever: brief.progressionLever,
      seed: brief.seed,
      intent: intent.id,
      strokeFocus,
      papillonOk,
      maxContinuous: maxCont,
      pedagogical: intent.headline,
      equipmentUsage: usedEq.length ? "meaningful" : "none",
      equipmentApplied: usedEq,
    },
    sets,
    volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
    maxContinuousAllowed: maxCont,
    equipmentRequired: usedEq,
    equipmentUsed: usedEq,
  };

  const hard = validateDecouverteHard(session, {
    maxContinuous: maxCont,
    papillonOk,
    allowLongReps: maxCont >= 100,
  });
  if (!hard.ok) {
    return { ok: false, reason: hard.errors.join("; "), session };
  }

  if (!sessionFitsEquipment(session.details, equipment)) {
    return { ok: false, reason: "matériel incompatible avec inventaire", session };
  }

  const v = validateSession(
    session,
    { level: "decouverte", equipment, hasPainConstraint: !!(brief.painProtection || brief.hasPainConstraint) },
    {
      volumeTarget: coherentVolume,
      maxIntensityZone: "Z2",
      durationMin: brief.durationTarget,
    },
  );
  if (!v.ok) {
    return { ok: false, reason: v.errors.join("; "), session, warnings: v.warnings };
  }

  const ratio = volumeSets / Math.max(1, coherentVolume);
  if (ratio < 0.85 || ratio > 1.15) {
    return {
      ok: false,
      reason: `volume hors tolérance (${volumeSets}m vs cohérent ${coherentVolume}m)`,
      session,
    };
  }

  return { ok: true, session: finalizeCoachSession(session), warnings: v.warnings };
}


/**
 * Hard constraints Régulier — pas de club confirmé automatique.
 */
export function validateRegulierHard(sessionLike, opts = {}) {
  const errors = [];
  const text = (sessionLike.details || []).join("\n");
  if (/Z4|VO2|hypoxie|lactate|CSS\s*@/i.test(text)) errors.push("intensité trop avancée pour Régulier");
  if (/sans pause[^\n]*repos|repos[^\n]*sans pause/i.test(text)) {
    errors.push("repos incohérent après nage continue");
  }
  if (!fourNagesAllowsPapillon(sessionLike, opts) && (opts.papillonOk === false || sessionLike.papillonMastered === false)) {
    if (/\bpapillon\b/i.test(text) && !/ondulation|prépa|adapt/i.test(text)) {
      errors.push("papillon imposé sans maîtrise");
    }
  }
  if (sessionLike.sets) {
    for (const s of sessionLike.sets) {
      const continuous = s.continuous === true;
      if (continuous && s.restSec > 0) errors.push("repos affiché sur série continue");
    }
  }
  // Une séance qualité : ok d'avoir « soutenu » ; sinon éviter densités agressives
  if (!opts.qualitySession && /R10|R15''|repos 10s/i.test(text) && /soutenu/i.test(text)) {
    errors.push("densité trop haute hors séance qualité");
  }
  return { ok: errors.length === 0, errors };
}

/** Technique banque réelle ; false → fallback générique. */
function tryAppendTechniqueFromBank({
  inventory,
  techMeta,
  brief,
  eqList,
  eqUsage,
  rng,
  targetVol,
  pool,
  restFor,
  swimLabel,
  applyCue,
  matosNote,
  zone,
  maxReps,
  sets,
  details,
  exerciseIds,
}) {
  if (!techMeta?.focus) return false;
  const techAllowed = (eqUsage?.applied || []).filter((eq) => eq && eq !== "pull");
  const pickEq = techAllowed.length ? techAllowed : [];
  const avoid = [];
  if (pickEq.includes("palmes")) avoid.push("pull");
  if (techMeta.focus === "technique_roulis") avoid.push("plaquettes");
  const techEx = pickTechniqueFromBank({
    focusKey: techMeta.focus,
    level: brief.level,
    equipment: pickEq.length ? pickEq : [],
    painProtection: !!(brief.painProtection || brief.hardConstraints?.painProtection),
    inventory,
    rng,
    preferEquipment: pickEq,
    avoidEquipment: avoid,
  });
  const built = buildTechniqueFromBank({
    techEx,
    targetVol,
    pool,
    swimLabel,
    applyCue,
    matosNote,
    zone,
    maxReps: maxReps || brief.hardConstraints?.maxRepsPerSet || 12,
    restFor,
  });
  if (!built.usedBank || !built.sets.length) return false;
  for (const ts of built.sets) {
    sets.push(ts);
    exerciseIds.push(ts.exerciseId);
  }
  details.push(...built.lines);
  return true;
}

function tryBuildCorpsFromBank({
  brief,
  intent,
  rng,
  targetVol,
  pool,
  restFor,
  swimLabel,
  applyCue,
  zone,
  maxContinuous,
  maxReps,
  qualitySession,
  preferredFormat,
}) {
  if (preferredFormat === "pyramid" || preferredFormat === "alternating") {
    return null;
  }
  if (
    !shouldUseCorpsBank({
      level: brief.level,
      qualitySession: !!(qualitySession || brief.qualitySession || intent.quality),
      intentId: intent.id,
      objectif: brief.objectif,
      taperStage: brief.taperLoad?.taperStage || brief.hardConstraints?.taperStage,
      taperHot: !!brief.taperShortQuality,
    })
  ) {
    return null;
  }
  const corpsEx = pickCorpsFromBank({
    intentId: intent.id,
    objectif: brief.objectif,
    level: brief.level,
    equipment: brief.equipment,
    painProtection: !!(brief.painProtection || brief.hardConstraints?.painProtection),
    pool,
    maxContinuous,
    targetVol,
    inventory: getExerciseInventory(),
    rng,
  });
  const built = buildCorpsFromBank({
    corpsEx,
    targetVol,
    pool,
    swimLabel,
    applyCue,
    zone,
    maxReps: maxReps || brief.hardConstraints?.maxRepsPerSet || 12,
    maxContinuous,
    restFor,
  });
  if (!built.usedBank || !built.sets.length) return null;
  built.setFormat = preferredFormat || built.setFormat;
  return built;
}

function techLabelsRegulier(primary) {
  const map = {
    rattrape: { label: "crawl rattrapé", cue: "bras dans l'axe, glisse", focus: "technique_catchup" },
    respiration: { label: "crawl en expirant continûment dans l'eau", cue: "expire sans t'arrêter", focus: "technique_respiration" },
    roulis: { label: "battements sur le côté", cue: "épaule qui sort, rotation douce", focus: "technique_roulis" },
    jambes: { label: "battements crawl", cue: "battements sans forcer", focus: "technique_jambes" },
    chiens: { label: "grand chien", cue: "bras sous l'eau, traction large", focus: "technique_chiens" },
    virages: { label: "coulée après virage", cue: "rotation groupée, mains basses", focus: "technique_virages" },
    nage: { label: "crawl facile, respiration sur le côté habituel", cue: "mouvement propre", focus: null },
    "4n": { label: "plusieurs nages", cue: "une nage propre par longueur", focus: null },
  };
  return map[primary] || map.rattrape;
}

/**
 * Compose une séance Régulier — vraies séries, formats variés, qualité contrôlée.
 */
function composeRegulierSession(brief, rng) {
  const inventory = getExerciseInventory();
  const engineVolume = brief.volumeTarget;
  const coherentVolume = coherentVolumeForRegulier(brief);
  const blueprint = composeSessionBlueprint({
    volumeTarget: coherentVolume,
    family: brief.family,
    level: "regulier",
    phase: brief.phase,
    isKeySession: brief.keySession,
    objectif: brief.objectif,
    roleObjectif: brief.roleObjectif,
  });
  const blocks = blueprint.blocks;
  const pool = brief.pool || 50;
  const equipment = brief.equipment;
  const eqList = Array.isArray(equipment) ? equipment : [];
  const maxCont = maxContinuousForRegulier(brief);
  let intent = resolveRegulierIntent(brief);
  const qualitySession = !!(brief.qualitySession || intent.quality);
  const strokeFocus = brief.strokeFocus || "mixte";
  const papillonOk = canUsePapillon({ ...brief, level: "regulier" });
  const sessionSpecificity = resolveSessionSpecificity(brief);

  const reprisePattern =
    intent.id === "reprise" ? selectReprisePattern(brief, rng) : null;
  if (reprisePattern) {
    intent = {
      ...intent,
      headline: reprisePattern.headline,
      learnCue: reprisePattern.learnCue,
      applyCue: reprisePattern.applyCue,
      techPrimary: reprisePattern.techPrimary,
    };
  }

  const techPrimary = resolveTechPrimaryForComposer({ ...brief, level: "regulier" }, intent);
  const techMeta = techLabelsRegulier(techPrimary);
  const eqUsage = resolveEquipmentUsage(
    {
      ...brief,
      level: "regulier",
      sessionIntent: intent.id,
      qualitySession,
      techFocus: techMeta.focus,
    },
    rng,
  );

  const swimLabelRaw = strokeSwimLabel(strokeFocus, { papillonOk });
  const swimLabel = labelWithEquipment(
    swimLabelRaw.replace(" facile", "") || "crawl",
    eqUsage,
  );
  const departLabel = strokeDepartLabel(strokeFocus);

  const setFormat = selectSetFormat(
    {
      intentId: intent.id,
      qualitySession,
      maxContinuous: maxCont,
      corpsTarget: blocks.corps,
      allowContinuous: intent.id !== "reprise" && intent.id !== "recuperation",
      forcedFormat: brief.forcedSetFormat || reprisePattern?.setFormat || null,
    },
    rng,
  );

  const restFor = (ctx) =>
    restSecFor({
      ...ctx,
      intentId: intent.id,
      qualitySession,
      level: "regulier",
      setFormat: ctx.setFormat || setFormat,
    });

  const sets = [];
  const details = [];
  const exerciseIds = [];

  // DÉPART — Arthur warmups (flag) ou synthétique actuel
  const departDist = blocks.depart;
  const arthurDepartOk = tryArthurDepart({
    budget: departDist,
    pool,
    level: "regulier",
    brief,
    strokeFocus,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: maxCont,
  });
  if (!arthurDepartOk) {
  if (departDist <= maxCont) {
    const s = buildContinuous(departDist, {
      label: departLabel,
      cue: "échauffement facile",
      block: "depart",
      exerciseId: "depart_regulier",
    });
    if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    sets.push(s);
    details.push(formatSetLine(s, false).replace(/ \(Z1\)/, " (facile)"));
  } else {
    const ds = buildRepeatedExact(departDist, 50, {
      label: departLabel,
      cue: "échauffement",
      restSec: restFor({ intensity: "facile", distancePerRep: 50, block: "depart" }),
      block: "depart",
      exerciseId: "depart_regulier",
      maxReps: 12,
    });
    for (const s of ds) {
      if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
      sets.push(s);
      details.push(formatSetLine(s, false));
    }
  }
  exerciseIds.push("depart_regulier");
  }

  // TECHNIQUE
  const techFocus =
    intent.techPrimary === "4n" || strokeFocus === "4n"
      ? null
      : inventory.find(
          (ex) =>
            ex.focusKey === techMeta.focus &&
            !rejectsMissingEquipment(ex, eqList) &&
            !ex.incompatibilities?.includes("regulier"),
        ) ||
        inventory.find(
          (ex) =>
            ex.type === "technique" &&
            ex.focusKey === "technique_catchup" &&
            !rejectsMissingEquipment(ex, eqList),
        );

  const techMatos = eqUsage.techNote || "";

  if (intent.techPrimary === "4n" || isFourNSession(brief, strokeFocus)) {
    appendFourNagesTechniqueBlock({
      brief,
      techniqueVolume: blocks.technique,
      pool,
      restFor,
      cue: intent.learnCue,
      matosNote: techMatos,
      sets,
      details,
      exerciseIds,
    });
  } else {
    const arthurTech = tryArthurTechnique({
      budget: blocks.technique,
      pool,
      level: "regulier",
      brief,
      intent,
      equipment: eqList,
      rng,
      sets,
      details,
      exerciseIds,
      maxContinuous: maxCont,
    });
    if (!arthurTech) {
    const fromBank = tryAppendTechniqueFromBank({
      inventory,
      techMeta,
      brief: { ...brief, level: "regulier" },
      eqList,
      eqUsage,
      rng,
      targetVol: blocks.technique,
      pool,
      restFor,
      swimLabel: swimLabelRaw.replace(" facile", "") || "crawl",
      applyCue: concreteApplyCue(intent.applyCue, swimLabelRaw.replace(" facile", "") || "crawl"),
      matosNote: techMatos,
      zone: null,
      maxReps: 12,
      sets,
      details,
      exerciseIds,
    });
    if (!fromBank) {
      const half = Math.max(100, roundTo(blocks.technique * 0.6, 50));
      const other = Math.max(50, blocks.technique - half);
      const unit = 50;
      const primary = buildRepeatedExact(half, unit, {
        label: labelWithMatos(concreteTechLabel(techMeta.label, techMeta.focus), techMatos),
        cue: techMeta.cue,
        restSec: restFor({ intensity: "facile", distancePerRep: unit, block: "technique" }),
        block: "technique",
        exerciseId: techFocus?.id || "tech_regulier",
      });
      const apply = buildRepeatedExact(other, unit, {
        label: concreteApplyCue(intent.applyCue, swimLabelRaw.replace(" facile", "") || "crawl"),
        cue: "",
        restSec: restFor({ intensity: "facile", distancePerRep: unit, block: "technique" }),
        block: "technique",
        exerciseId: "tech_apply",
      });
      {
        const th = formatTechniqueHeader(`${techMeta.label} → nage`, techMatos);
        if (th) details.push(th);
      }
      for (const ts of [...primary, ...apply]) {
        sets.push(ts);
        const isApply = ts.exerciseId === "tech_apply";
        const mid = isApply
          ? `${ts.reps} × ${ts.distancePerRep}m ${ts.label}`
          : `${ts.reps} × ${ts.distancePerRep}m : ${ts.label} + crawl facile`;
        details.push(`-${mid}${!isApply && ts.cue ? ` — ${ts.cue}` : ""} — repos ${ts.restSec}s`);
      }
      exerciseIds.push(primary[0].exerciseId, "tech_apply");
    }
    }
  }

  // CORPS
  const corpsTarget = blocks.corps;
  let mainCorpsTarget = corpsTarget;
  let fourNPortion = null;

  if (isFourNSession(brief, strokeFocus)) {
    const planned = planFourNagesCorps({
      brief,
      sessionSpecificity,
      corpsTarget,
      volumeTotal: coherentVolume,
      usedSets: sets,
      pool,
      restFor,
      maxContinuous: maxCont,
      finReserve: blocks.rac || blocks.fin || 0,
      rng,
    });
    fourNPortion = planned.fourNPortion;
    mainCorpsTarget = planned.mainCorpsTarget;
  }

  const corpsLabel = isFourNSession(brief, strokeFocus)
    ? labelWithEquipment("crawl", eqUsage)
    : swimLabel;

  const altLabel = isFourNSession(brief, strokeFocus)
    ? "crawl"
    : strokeFocus === "mixte" || strokeFocus === "crawl"
      ? "dos"
      : "crawl";

  // Reprise intensité légère : block facile/modéré sans « soutenu »
  let corpsBuilt;
  const arthurFunReg = !isFourNSession(brief, strokeFocus) && !reprisePattern?.lightQuality
    ? tryArthurFunCorps({
        budget: mainCorpsTarget,
        pool,
        level: "regulier",
        brief,
        intent,
        rng,
        maxContinuous: intent.id === "reprise" ? Math.min(maxCont, 100) : maxCont,
      })
    : null;
  if (arthurFunReg?.sets?.length) {
    corpsBuilt = {
      sets: arthurFunReg.sets,
      lines: arthurFunReg.lines,
      displayLines: arthurFunReg.lines,
      setFormat: arthurFunReg.setFormat || "arthur_fun",
    };
  } else if (reprisePattern?.lightQuality) {
    corpsBuilt = buildCorpsByFormat("block", mainCorpsTarget, {
      label: corpsLabel,
      altLabel,
      cue: reprisePattern.corpsCue,
      restFor: (c) => restFor({ ...c, intensity: c.intensity === "soutenu" ? "modere" : c.intensity }),
      exerciseId: `corps_reprise_${reprisePattern.id}`,
      maxContinuous: Math.min(maxCont, 100),
      pool,
    });
    // Soften cues
    for (const s of corpsBuilt.sets) {
      if (/soutenu/i.test(s.cue)) s.cue = "un cran au-dessus";
    }
    corpsBuilt.lines = corpsBuilt.sets.map((s) => {
      if (s.continuous || (s.reps === 1 && s.restSec === 0)) {
        return `-${s.distancePerRep}m ${s.label} — ${s.cue}`;
      }
      if (s.reps === 1) {
        return `-${s.distancePerRep}m ${s.label} — ${s.cue} — repos ${s.restSec}s`;
      }
      return `-${s.reps} × ${s.distancePerRep}m ${s.label} — ${s.cue} — repos ${s.restSec}s`;
    });
    const collapsed = collapseSetsToDisplayLinesExact(corpsBuilt.sets, corpsBuilt.setFormat);
    corpsBuilt.displayLines = collapsed || corpsBuilt.lines;
    corpsBuilt = buildCorpsByFormat(
      setFormat === "repeated" ? "progressive" : setFormat,
      mainCorpsTarget,
      {
        label: corpsLabel.includes("/") ? "crawl" : corpsLabel,
        altLabel,
        cue: intent.applyCue,
        restFor,
        exerciseId: `corps_qual`,
        maxContinuous: maxCont,
        pool,
      },
    );
  } else {
    const bankCorps = isFourNSession(brief, strokeFocus)
      ? null
      : tryBuildCorpsFromBank({
      brief: { ...brief, level: "regulier" },
      intent,
      rng,
      targetVol: mainCorpsTarget,
      pool,
      restFor,
      swimLabel: corpsLabel.includes("/") && setFormat !== "alternating" ? "crawl" : corpsLabel,
      applyCue: (() => {
        const base = reprisePattern?.corpsCue || intent.applyCue;
        const obj = objectiveBodyCue(brief, intent);
        return obj ? `${base || "nage"} — ${obj}` : base;
      })(),
      zone: null,
      maxContinuous: intent.id === "reprise" ? Math.min(maxCont, 100) : maxCont,
      maxReps: 12,
      qualitySession,
      preferredFormat: setFormat,
    });
    corpsBuilt =
      bankCorps ||
      buildCorpsByFormat(isFourNSession(brief, strokeFocus) ? "repeated" : setFormat, mainCorpsTarget, {
        label: corpsLabel.includes("/") && setFormat !== "alternating" ? "crawl" : corpsLabel,
        altLabel: isFourNSession(brief, strokeFocus) ? "crawl" : altLabel,
        cue: (() => {
          const base = reprisePattern?.corpsCue || intent.applyCue;
          const obj = objectiveBodyCue(brief, intent);
          return obj ? `${base || "nage"} — ${obj}` : base;
        })(),
        restFor,
        exerciseId: `corps_${intent.id}`,
        maxContinuous: intent.id === "reprise" ? Math.min(maxCont, 100) : maxCont,
        pool,
      });
  }

  // race_specific : portion 4N d'abord ou après selon volume
  if (fourNPortion && sessionSpecificity === "race_specific") {
    for (const s of fourNPortion.sets) {
      sets.push(s);
      exerciseIds.push(s.exerciseId);
    }
    details.push(...fourNPortion.lines);
  }

  for (const s of corpsBuilt.sets) {
    sets.push(s);
    exerciseIds.push(s.exerciseId);
  }
  details.push(...(corpsBuilt.displayLines || corpsBuilt.lines));

  if (fourNPortion && sessionSpecificity !== "race_specific") {
    for (const s of fourNPortion.sets) {
      sets.push(s);
      exerciseIds.push(s.exerciseId);
    }
    details.push(...fourNPortion.lines);
  }

  // FIN — Arthur RAC (D10) ou FINS_SEMAINE
  const finLabel = isFourNSession(brief, strokeFocus) ? "crawl facile" : "au choix (récup)";
  const arthurFinReg = tryArthurFin({
    budget: blocks.rac,
    pool,
    level: "regulier",
    brief,
    intent,
    equipment: eqList,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: maxCont,
    fourNages: isFourNSession(brief, strokeFocus),
  });
  if (!arthurFinReg) {
  let finSets;
  if (blocks.rac <= maxCont) {
    finSets = [
      buildContinuous(blocks.rac, {
        label: finLabel,
        cue: "facile",
        block: "fin",
        exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
      }),
    ];
  } else {
    finSets = buildRepeatedExact(blocks.rac, 50, {
      label: finLabel,
      cue: "facile",
      restSec: restFor({ intensity: "facile", distancePerRep: 50, block: "fin" }),
      block: "fin",
      exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
      maxReps: 12,
    });
  }
  for (const s of finSets) {
    if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    sets.push(s);
    if (isFourNSession(brief, strokeFocus)) {
      details.push(formatSetLine(s, false));
    } else if (s.continuous || s.reps === 1) {
      const finIdx = parseInt(String(s.exerciseId).replace(/\D/g, ""), 10) || 0;
      const finText = FINS_SEMAINE[finIdx % FINS_SEMAINE.length](s.distancePerRep)
        .replace(/\(Z1\)/i, "(facile)")
        .replace(/\(RAC\)/i, "(récup)");
      details.push(finText.startsWith("-") ? finText : `-${finText}`);
    } else {
      details.push(formatSetLine(s, false));
    }
  }
  }

  ensureObjectiveCueInDetails(details, brief, intent);
  const appliedEq = ensureEquipmentEngagement(details, eqList, brief);
  // Uniquement le matos visible (sauf exempt récup/taper : pas de phantom / declared_unused)
  const eqUsageFinal = {
    ...eqUsage,
    applied: appliedEq,
    usage: appliedEq.length
      ? "meaningful"
      : isEquipmentEngagementExempt(brief)
        ? eqUsage.usage || "none"
        : eqList.length
          ? "declared_unused"
          : eqUsage.usage,
  };

  const volumeSets = volumeFromSets(sets);
  const consistency = assertVolumeConsistency({
    sets,
    details,
    announcedDistance: volumeSets,
    tolerance: VOLUME_TOLERANCE_M,
  });
  if (Math.abs(consistency.fromSets - consistency.fromDetails) > VOLUME_TOLERANCE_M) {
    return {
      ok: false,
      reason: `volume incohérent: ${consistency.errors.join("; ")}`,
      debug: consistency,
    };
  }

  const intensityLabel = qualitySession
    ? displayIntensity("Z3", "regulier")
    : displayIntensity(brief.intensityTarget || "Z1", "regulier");

  const session = {
    type: qualitySession ? "SEUIL" : intent.id === "quatre_nages" ? "TECHNIQUE" : "ENDURANCE",
    title: intent.headline.replace(/^Aujourd'hui :\s*/i, "Régulier · "),
    intensity: intensityLabel,
    details,
    distance: `${volumeSets}m`,
    duration: Math.max(25, Math.min(brief.durationTarget || 45, Math.round(volumeSets / 35))),
    completed: false,
    skipped: null,
    family: brief.family,
    isKeySession: brief.keySession || qualitySession || undefined,
    qualitySession,
    objectives: [intent.headline, "Technique → application → séries → récup"],
    strokeFocus,
    sessionSpecificity,
    papillonMastered: papillonOk,
    engineWhy: brief.why,
    composerWhy: {
      engineVolumeTarget: engineVolume,
      volumeTarget: coherentVolume,
      volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
      volumeSoftReduced: coherentVolume < engineVolume,
      blocks,
      exercises: exerciseIds,
      intent: intent.id,
      techPrimary,
      strokeFocus,
      sessionSpecificity,
      setFormat: corpsBuilt.setFormat,
      reprisePattern: reprisePattern?.id || null,
      equipmentUsage: eqUsageFinal.usage,
      equipmentApplied: eqUsageFinal.applied,
      papillonOk,
      qualitySession,
      maxContinuous: maxCont,
      pedagogical: intent.headline,
      seed: brief.seed,
      level: "regulier",
    },
    sets,
    volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
    maxContinuousAllowed: maxCont,
    equipmentRequired: eqUsageFinal.applied || [],
    equipmentUsed: eqUsageFinal.applied || [],
  };

  if (!sessionFitsEquipment(session.details, equipment)) {
    return { ok: false, reason: "matériel incompatible avec inventaire", session };
  }

  const hard = validateRegulierHard(session, { papillonOk, qualitySession });
  if (!hard.ok) {
    return { ok: false, reason: hard.errors.join("; "), session };
  }

  const v = validateSession(
    session,
    { level: "regulier", equipment, hasPainConstraint: !!(brief.painProtection || brief.hasPainConstraint) },
    {
      volumeTarget: coherentVolume,
      maxIntensityZone: qualitySession ? "Z3" : "Z2",
      durationMin: brief.durationTarget,
    },
  );
  if (!v.ok) {
    return { ok: false, reason: v.errors.join("; "), session, warnings: v.warnings };
  }

  const ratio = volumeSets / Math.max(1, coherentVolume);
  if (ratio < 0.8 || ratio > 1.2) {
    return {
      ok: false,
      reason: `volume hors tolérance (${volumeSets}m vs cohérent ${coherentVolume}m)`,
      session,
    };
  }

  return { ok: true, session: finalizeCoachSession(session), warnings: v.warnings };
}

/**
 * Hard constraints Sportif — polarisation, Z4 limitée, allures fiables.
 */
export function validateSportifHard(sessionLike, opts = {}) {
  const errors = [];
  const text = (sessionLike.details || []).join("\n");
  if (/sans pause[^\n]*repos|repos[^\n]*sans pause/i.test(text)) {
    errors.push("repos incohérent après nage continue");
  }
  if (!fourNagesAllowsPapillon(sessionLike, opts) && (opts.papillonOk === false || sessionLike.papillonMastered === false)) {
    if (/\bpapillon\b/i.test(text) && !/ondulation|prépa|adapt/i.test(text)) {
      errors.push("papillon imposé sans maîtrise");
    }
  }
  if (sessionLike.sets) {
    for (const s of sessionLike.sets) {
      if (s.continuous === true && s.restSec > 0) errors.push("repos affiché sur série continue");
    }
  }
  // Z4 volume limité (touches, pas séance entière en Z4)
  const z4Sets = (sessionLike.sets || []).filter(
    (s) => s.block === "corps" && (s.zone === "Z4" || /rapide|Z4/i.test(s.cue || "")),
  );
  const z4Vol = z4Sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  const total = volumeFromSets(sessionLike.sets || []);
  const intentId = opts.intentId || sessionLike.composerWhy?.intent || "";
  if (intentId === "vitesse" || intentId === "vo2") {
    if (z4Vol > 900) errors.push("volume Z4 trop élevé pour séance vitesse");
  } else if (total > 0 && z4Vol / total > 0.22) {
    errors.push("volume Z4 trop élevé (>22%) hors séance vitesse");
  }
  // Allures inventées interdites si pas de pace
  if (!opts.allowPaces && /@\d+:\d+/.test(text)) {
    errors.push("allure @mm:ss sans donnée T100 fiable");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Compose une séance Sportif — polarisation, qualité intentionnelle, allures si T100.
 */
function composeSportifSession(brief, rng) {
  const isPerf = brief.level === "performance" || brief._performanceMode;
  if (isPerf && (brief.sessionIntent === "race" || brief.isRaceDay)) {
    const raceSession = buildRaceDaySession({
      raceTarget: brief.raceTarget || brief.performanceStrategy?.raceAnalysis?.target,
      raceDistance: brief.raceDistance,
      strokeFocus: brief.strokeFocus,
    });
    return { ok: true, session: raceSession, warnings: [] };
  }
  if (
    isPerf &&
    (brief.isRestDay ||
      brief.sessionIntent === "repos" ||
      (brief.taperRestPreferred && brief.optional && (brief.taperLoad?.daysToComp ?? 99) <= 1))
  ) {
    return {
      ok: true,
      session: buildRestDaySession({
        taperActivation: !!brief.taperActivation,
        taperRestPreferred: !!brief.taperRestPreferred,
        taperStage: brief.taperLoad?.taperStage,
      }),
      warnings: [],
    };
  }

  const inventory = getExerciseInventory();
  if (!brief.hardConstraints) brief.hardConstraints = resolveHardConstraints(brief);
  const hcEarly = brief.hardConstraints;
  let engineVolume = brief.volumeTarget;
  if (hcEarly.maxVolume != null && engineVolume > hcEarly.maxVolume) {
    engineVolume = hcEarly.maxVolume;
    brief.volumeTarget = engineVolume;
  }
  const coherentVolume = isPerf ? coherentVolumeForPerformance(brief) : coherentVolumeForSportif(brief);
  if (isPerf && coherentVolume <= 0) {
    if (brief.isRaceDay || brief.sessionIntent === "race") {
      return {
        ok: true,
        session: buildRaceDaySession({
          raceTarget: brief.raceTarget,
          strokeFocus: brief.strokeFocus,
        }),
        warnings: [],
      };
    }
    return {
      ok: true,
      session: buildRestDaySession({
        taperRestPreferred: true,
        taperStage: brief.taperLoad?.taperStage,
      }),
      warnings: [],
    };
  }
  const blueprint = composeSessionBlueprint({
    volumeTarget: coherentVolume,
    family: brief.family,
    level: isPerf ? "performance" : "sportif",
    phase: brief.phase,
    isKeySession: brief.keySession,
    objectif: brief.objectif,
    roleObjectif: brief.roleObjectif,
  });
  let blocks = { ...blueprint.blocks };
  const taperLoadEarly = brief.taperLoad || brief.performanceStrategy?.taperLoad || null;
  // Taper : densifier moins — réduire coquille (départ/tech/rac) pour coller au volume cible
  if (
    isPerf &&
    taperLoadEarly &&
    ["s1", "race_week"].includes(taperLoadEarly.taperStage) &&
    coherentVolume > 0
  ) {
    const dens = Math.min(1, Number(taperLoadEarly.densityFactor) || 0.5);
    const round50 = (n) => Math.max(50, Math.round(n / 50) * 50);
    let depart = round50(blocks.depart * dens);
    let technique = round50(blocks.technique * dens);
    let rac = round50(blocks.rac * dens);
    let corps = Math.max(150, coherentVolume - depart - technique - rac);
    corps = Math.round(corps / 50) * 50;
    let sum = depart + technique + rac + corps;
    if (sum > coherentVolume) {
      corps = Math.max(150, corps - (sum - coherentVolume));
      sum = depart + technique + rac + corps;
    }
    blocks = { depart, technique, corps, rac, total: sum };
  }
  const pool = brief.pool || 50;
  const equipment = brief.equipment;
  const eqList = Array.isArray(equipment) ? equipment : [];
  const maxContCrawl = maxContinuousForSportif(brief, { stroke: "crawl" });
  const maxCont4n = maxContinuousForSportif(brief, { stroke: "4n" });
  // Capacité continue pertinente pour la nage du brief (pas un max global unique)
  const maxCont =
    brief.strokeFocus === "4n" || brief.sessionIntent === "quatre_nages"
      ? maxCont4n
      : maxContCrawl;
  let intent = resolveSportifIntent(brief);
  const qualitySession = !!(brief.qualitySession || intent.quality);
  const strokeFocus = brief.strokeFocus || "mixte";
  const papillonOk = canUsePapillon({ ...brief, level: isPerf ? "performance" : "sportif" });
  const sessionSpecificity = resolveSessionSpecificity(brief);
  const paceCtx = resolvePaceContext(brief);
  const zone = intent.zone || brief.intensityTarget || "Z2";

  const reprisePattern =
    intent.id === "reprise" ? selectReprisePattern(brief, rng) : null;
  if (reprisePattern) {
    intent = {
      ...intent,
      headline: reprisePattern.headline,
      learnCue: reprisePattern.learnCue,
      applyCue: reprisePattern.applyCue,
      techPrimary: reprisePattern.techPrimary,
    };
  }

  const techPrimary = resolveTechPrimaryForComposer(
    { ...brief, level: isPerf ? "performance" : "sportif" },
    intent,
  );
  const techMeta = techLabelsRegulier(techPrimary);
  const eqUsage = resolveEquipmentUsage(
    {
      ...brief,
      level: isPerf ? "performance" : "sportif",
      sessionIntent: intent.id,
      qualitySession,
      techFocus: techMeta.focus,
    },
    rng,
  );

  const swimLabelRaw = strokeSwimLabel(strokeFocus, { papillonOk }).replace(" facile", "") || "crawl";
  const swimLabel = labelWithEquipment(swimLabelRaw, eqUsage);
  const departLabel = strokeDepartLabel(strokeFocus);

  const hcFmt = brief.hardConstraints || hcEarly || {};
  const setFormat = selectSetFormat(
    {
      intentId: intent.id,
      qualitySession,
      maxContinuous: maxCont,
      corpsTarget: blocks.corps,
      allowContinuous: !["vitesse", "vo2", "test"].includes(intent.id),
      forcedFormat: brief.forcedSetFormat || reprisePattern?.setFormat || null,
      level: isPerf ? "performance" : "sportif",
      taperSafe: !!(hcFmt.forbidComplexFormats || hcFmt.forbidPyramidFiller || hcFmt.taperConstraints),
      painSafe: !!hcFmt.painProtection,
      forbidComplexFormats: !!hcFmt.forbidComplexFormats,
    },
    rng,
  );

  const taperLoad = brief.taperLoad || brief.performanceStrategy?.taperLoad || null;
  const recoveryMul = Number(taperLoad?.recoveryFactor) > 1 ? Number(taperLoad.recoveryFactor) : 1;
  const intensityRetain = Number(taperLoad?.intensityRetention);
  const densityRetain = Number(taperLoad?.densityFactor);

  const restFor = (ctx) => {
    const base = restSecFor({
      ...ctx,
      intentId: intent.id,
      qualitySession,
      level: isPerf ? "performance" : "sportif",
      zone: ctx.zone || zone,
      setFormat: ctx.setFormat || setFormat,
    });
    if (recoveryMul <= 1) return base;
    return Math.round(base * Math.min(1.6, recoveryMul) / 5) * 5;
  };

  const cueFor = (z, dist, fallback) =>
    effortCue({
      zone: z,
      distancePerRep: dist,
      brief,
      rpeFallback: fallback,
    });

  const sets = [];
  const details = [];
  const exerciseIds = [];

  // DÉPART — Arthur warmups (flag) ou Z1 synthétique actuel
  const departDist = blocks.depart;
  const depCue = cueFor("Z1", departDist, "échauffement facile");
  const departMaxCont = maxContCrawl;
  const arthurDepartOk = tryArthurDepart({
    budget: departDist,
    pool,
    level: isPerf ? "performance" : "sportif",
    brief,
    strokeFocus,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: departMaxCont,
  });
  if (!arthurDepartOk) {
  if (departDist <= departMaxCont) {
    const s = buildContinuous(departDist, {
      label: departLabel,
      cue: depCue,
      block: "depart",
      exerciseId: "depart_sportif",
    });
    s.zone = "Z1";
    s.blockRole = "preparation";
    if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    sets.push(s);
    details.push(`-${departDist}m ${departLabel} — ${depCue}`);
  } else {
    const unit = departMaxCont >= 100 ? 100 : 50;
    const ds = buildRepeatedExact(departDist, unit, {
      label: departLabel,
      cue: depCue,
      restSec: restFor({ intensity: "facile", distancePerRep: unit, block: "depart", zone: "Z1" }),
      block: "depart",
      exerciseId: "depart_sportif",
      maxReps: 12,
    });
    for (const s of ds) {
      s.zone = "Z1";
      s.blockRole = "preparation";
      if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
      sets.push(s);
      details.push(formatSetLine(s, false));
    }
  }
  exerciseIds.push("depart_sportif");
  }

  // TECHNIQUE
  const techMatos = eqUsage.techNote || "";
  if (intent.techPrimary === "4n" || isFourNSession(brief, strokeFocus)) {
    appendFourNagesTechniqueBlock({
      brief,
      techniqueVolume: blocks.technique,
      pool,
      restFor,
      zone: "Z2",
      cue: intent.learnCue,
      matosNote: techMatos,
      sets,
      details,
      exerciseIds,
    });
  } else {
    const arthurTech = tryArthurTechnique({
      budget: blocks.technique,
      pool,
      level: isPerf ? "performance" : "sportif",
      brief,
      intent,
      equipment: eqList,
      rng,
      sets,
      details,
      exerciseIds,
      maxContinuous: maxContCrawl,
      zone: "Z2",
    });
    if (!arthurTech) {
    const fromBank = tryAppendTechniqueFromBank({
      inventory,
      techMeta,
      brief: { ...brief, level: isPerf ? "performance" : "sportif" },
      eqList,
      eqUsage,
      rng,
      targetVol: blocks.technique,
      pool,
      restFor,
      swimLabel: swimLabelRaw,
      applyCue: concreteApplyCue(intent.applyCue, swimLabelRaw),
      matosNote: techMatos,
      zone: "Z2",
      maxReps: brief.hardConstraints?.maxRepsPerSet || 12,
      sets,
      details,
      exerciseIds,
    });
    if (!fromBank) {
      const techFocus =
        inventory.find(
          (ex) =>
            ex.focusKey === techMeta.focus &&
            !rejectsMissingEquipment(ex, eqList) &&
            !ex.incompatibilities?.includes("sportif"),
        ) ||
        inventory.find(
          (ex) =>
            ex.type === "technique" &&
            ex.focusKey === "technique_catchup" &&
            !rejectsMissingEquipment(ex, eqList),
        );
      const half = Math.max(100, roundTo(blocks.technique * 0.55, 50));
      const other = Math.max(50, blocks.technique - half);
      const unit = 50;
      const primary = buildRepeatedExact(half, unit, {
        label: labelWithMatos(concreteTechLabel(techMeta.label, techMeta.focus), techMatos),
        cue: techMeta.cue,
        restSec: restFor({ intensity: "facile", distancePerRep: unit, block: "technique", zone: "Z2" }),
        block: "technique",
        exerciseId: techFocus?.id || "tech_sportif",
      });
      const apply = buildRepeatedExact(other, unit, {
        label: concreteApplyCue(intent.applyCue, swimLabelRaw),
        cue: "",
        restSec: restFor({ intensity: "facile", distancePerRep: unit, block: "technique", zone: "Z2" }),
        block: "technique",
        exerciseId: "tech_apply",
      });
      {
        const th = formatTechniqueHeader(`${techMeta.label} → nage`, techMatos);
        if (th) details.push(th);
      }
      for (const ts of [...primary, ...apply]) {
        ts.zone = "Z2";
        sets.push(ts);
        const isApply = ts.exerciseId === "tech_apply";
        const mid = isApply
          ? `${ts.reps} × ${ts.distancePerRep}m ${ts.label}`
          : `${ts.reps} × ${ts.distancePerRep}m : ${ts.label} + crawl facile`;
        details.push(`-${mid}${!isApply && ts.cue ? ` — ${ts.cue}` : ""} — repos ${ts.restSec}s`);
      }
      exerciseIds.push(primary[0].exerciseId, "tech_apply");
    }
    }
  }

  // CORPS
  const corpsTarget = blocks.corps;
  let mainCorpsTarget = corpsTarget;
  let fourNPortion = null;

  if (isFourNSession(brief, strokeFocus) || brief.hardConstraints?.isFourN) {
    const planned = planFourNagesCorps({
      brief,
      sessionSpecificity,
      corpsTarget,
      volumeTotal: coherentVolume,
      usedSets: sets,
      pool,
      restFor,
      maxContinuous: maxCont4n,
      finReserve: blocks.rac || blocks.fin || 0,
      rng,
    });
    fourNPortion = planned.fourNPortion;
    mainCorpsTarget = planned.mainCorpsTarget;
  }

  const corpsLabel = isFourNSession(brief, strokeFocus)
    ? labelWithEquipment("crawl", eqUsage)
    : swimLabel;

  const arthurFunSp =
    intent.id !== "test" && !isFourNSession(brief, strokeFocus)
      ? tryArthurFunCorps({
          budget: mainCorpsTarget,
          pool,
          level: isPerf ? "performance" : "sportif",
          brief,
          intent,
          rng,
          maxContinuous: maxContCrawl,
          zone: ["Z3", "Z4"].includes(zone) ? zone : "Z2",
        })
      : null;

  if (arthurFunSp?.sets?.length) {
    if (fourNPortion && sessionSpecificity === "race_specific") {
      for (const s of fourNPortion.sets) {
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...fourNPortion.lines);
    }
    for (const s of arthurFunSp.sets) {
      if (!s.zone) s.zone = ["Z3", "Z4"].includes(zone) ? zone : "Z2";
      sets.push(s);
      exerciseIds.push(s.exerciseId);
    }
    details.push(...arthurFunSp.lines);
    if (fourNPortion && sessionSpecificity !== "race_specific") {
      for (const s of fourNPortion.sets) {
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...fourNPortion.lines);
    }
  } else {

  let preferredUnit = null;
  let corpsFormat = setFormat;
  let corpsCue = cueFor(zone, 200, intent.applyCue);

  if (intent.id === "test") {
    // Test structuré : 1×100 + 1×400 (ou 1000 selon capacité)
    const testSets = [];
    const t100 = {
      reps: 1,
      distancePerRep: 100,
      restSec: restFor({ intensity: "soutenu", distancePerRep: 100, zone: "Z3", intentId: "test" }),
      label: "crawl",
      cue: cueFor("Z3", 100, "test 100 — chrono"),
      block: "corps",
      exerciseId: "test_100",
      continuous: false,
      zone: "Z3",
      setFormat: "repeated",
    };
    testSets.push(t100);
    const remain = Math.max(400, mainCorpsTarget - 100);
    const longDist = remain >= 900 && maxCont >= 800 ? 1000 : 400;
    testSets.push({
      reps: 1,
      distancePerRep: longDist,
      restSec: 0,
      label: "crawl",
      cue: cueFor("Z3", longDist, longDist >= 1000 ? "test long — chrono" : "test 400 — chrono"),
      block: "corps",
      exerciseId: `test_${longDist}`,
      continuous: true,
      zone: "Z3",
      setFormat: "repeated",
    });
    // Fill easy if needed
    let used = 100 + longDist;
    if (used < mainCorpsTarget - 100) {
      const fill = buildRepeatedExact(mainCorpsTarget - used, 100, {
        label: "crawl",
        cue: cueFor("Z1", 100, "récup facile"),
        restSec: 20,
        block: "corps",
        exerciseId: "test_fill",
      });
      for (const s of fill) {
        s.zone = "Z1";
        testSets.push(s);
      }
    }
    if (fourNPortion && sessionSpecificity === "race_specific") {
      for (const s of fourNPortion.sets) {
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...fourNPortion.lines);
    }
    for (const s of testSets) {
      sets.push(s);
      exerciseIds.push(s.exerciseId);
      if (s.continuous || s.reps === 1) {
        details.push(
          `-${s.distancePerRep}m ${s.label} — ${s.cue}${s.restSec ? ` — repos ${s.restSec}s` : ""}`,
        );
      } else {
        details.push(`-${s.reps} × ${s.distancePerRep}m ${s.label} — ${s.cue} — repos ${s.restSec}s`);
      }
    }
    if (fourNPortion && sessionSpecificity !== "race_specific") {
      for (const s of fourNPortion.sets) {
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...fourNPortion.lines);
    }
  } else {
    if ((intent.id === "vitesse" || intent.id === "vo2") && !brief.hardConstraints?.painProtection) {
      // Architecture explicite : préparation → qualité Z4 → consolidation (pas de « fill Z2 »)
      preferredUnit = 50;
      corpsFormat = setFormat === "continuous" ? "broken" : setFormat;
      let prepVol = Math.max(200, roundTo(mainCorpsTarget * 0.28, 50));
      let z4Cap = Math.min(700, Math.max(300, roundTo(mainCorpsTarget * 0.35, 50)));
      // Taper : rappeler la vitesse sans fatigue — intensité courte
      if (Number.isFinite(intensityRetain) && intensityRetain < 1) {
        z4Cap = Math.max(100, roundTo(z4Cap * intensityRetain, 50));
      }
      if (brief.taperShortQuality || taperLoad?.taperStage === "s1" || taperLoad?.taperStage === "race_week") {
        const touch = taperRacePaceTouch(brief.raceTarget?.distance || brief.raceDistance);
        z4Cap = Math.min(z4Cap, touch.reps * touch.dist);
        prepVol = Math.min(prepVol, Math.max(100, roundTo(mainCorpsTarget * 0.35, 50)));
      }
      const consolVol = Math.max(100, mainCorpsTarget - prepVol - z4Cap);

          const prepBuilt = buildCorpsByFormat("repeated", prepVol, {
        label: "crawl",
        cue: cueFor("Z2", 100, "préparation — rythme aisé"),
        restFor: (c) => restFor({ ...c, zone: "Z2" }),
        exerciseId: `corps_${intent.id}_prep`,
        maxContinuous: Math.min(maxContCrawl, 200),
        pool,
        preferredUnit: 100,
      });
      for (const s of prepBuilt.sets) {
        s.zone = "Z2";
        s.blockRole = "preparation";
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...(prepBuilt.displayLines || prepBuilt.lines));

          corpsCue = cueFor("Z4", 50, "rapide — récupère bien");
      const z4Built = buildCorpsByFormat(corpsFormat, z4Cap, {
        label: corpsLabel.includes("/") ? "crawl" : corpsLabel,
        altLabel: "crawl",
        cue: corpsCue,
        restFor: (c) => restFor({ ...c, zone: "Z4" }),
        exerciseId: `corps_${intent.id}_z4`,
        maxContinuous: 50,
        pool,
        preferredUnit: 50,
      });
      for (const s of z4Built.sets) {
        s.zone = "Z4";
        s.blockRole = "quality";
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...(z4Built.displayLines || z4Built.lines));

          const consolBuilt = buildCorpsByFormat("mixed", consolVol, {
        label: "crawl",
        cue: cueFor("Z2", 100, "consolidation — nage propre après vitesse"),
        restFor: (c) => restFor({ ...c, zone: "Z2" }),
        exerciseId: `corps_${intent.id}_consol`,
        maxContinuous: maxContCrawl,
        pool,
        preferredUnit: 100,
      });
      for (const s of consolBuilt.sets) {
        s.zone = "Z2";
        s.blockRole = "consolidation";
        sets.push(s);
        exerciseIds.push(s.exerciseId);
      }
      details.push(...(consolBuilt.displayLines || consolBuilt.lines));
      brief._lastSetFormat = z4Built.setFormat;
      if (fourNPortion) {
        for (const s of fourNPortion.sets) {
          s.zone = "Z2";
          s.blockRole = s.blockRole || "specific";
          sets.push(s);
          exerciseIds.push(s.exerciseId);
        }
        details.push(...fourNPortion.lines);
      }
    } else {
      const hc = brief.hardConstraints || resolveHardConstraints(brief);
      const painBlocked = !!hc.painProtection;
      const raceTouches =
        !painBlocked &&
        hc.allowRacePaceTouch !== false &&
        (brief.racePaceTouches ||
          (sessionSpecificity === "race_specific" &&
            (intent.id === "endurance" || intent.id === "aerobie" || intent.id === "course_piscine") &&
            !qualitySession));
      const coursePeakHot =
        !painBlocked &&
        intent.id === "course_piscine" &&
        (brief.phase === "peak" || brief.phase === "specifique");

      // Sous pain / maxIntensity Z2 : jamais seuil / Z3
      const wantSeuil =
        !painBlocked &&
        !hc.forbidThresholdBlock &&
        (intent.id === "seuil" || intent.id === "allure_specifique" || coursePeakHot);

      if (wantSeuil || (brief._qualityGateShortTouch && !painBlocked)) {
        // Taper / short touch : budget Z3 borné
        let z3Budget = mainCorpsTarget;
        if (hc.maxZ3Meters != null) z3Budget = Math.min(z3Budget, hc.maxZ3Meters);
        if (hc.maxRacePaceMeters != null && (brief._qualityGateShortTouch || intent.id === "allure_specifique")) {
          z3Budget = Math.min(z3Budget, hc.maxRacePaceMeters);
        }
        if (Number.isFinite(intensityRetain) && intensityRetain < 1) {
          z3Budget = Math.max(100, roundTo(z3Budget * Math.max(0.35, intensityRetain), 50));
        }
        preferredUnit = z3Budget <= 300 ? 50 : z3Budget <= 600 ? 100 : mainCorpsTarget >= 1600 ? 200 : 100;
        // J3 : formats filler interdits pour intensité réelle
        corpsFormat = brief._qualityGateShortTouch
          ? "race_pace"
          : ["block", "progressive", "pyramid", "broken", "mixed"].includes(setFormat)
            ? "repeated"
            : setFormat === "race_pace"
              ? "race_pace"
              : "repeated";
        // Coquille aérobie si gros volume restant
        const aeroShell = Math.max(0, mainCorpsTarget - z3Budget);
        if (aeroShell >= 200) {
          const aeroBuilt = buildCorpsByFormat("repeated", aeroShell, {
            label: corpsLabel,
            cue: cueFor("Z2", 100, "aérobie — coquille"),
            restFor: (c) => restFor({ ...c, zone: "Z2" }),
            exerciseId: `corps_${intent.id}_aero`,
            maxContinuous: maxContCrawl,
            pool,
            preferredUnit: 100,
            maxRepsPerSet: hc.maxRepsPerSet,
          }, brief);
          for (const s of aeroBuilt.sets) {
            s.zone = "Z2";
            s.blockRole = "preparation";
            sets.push(s);
            exerciseIds.push(s.exerciseId);
          }
          details.push(...(aeroBuilt.displayLines || aeroBuilt.lines));
        }
        const objCue = objectiveBodyCue(brief, intent);
        const z3Fallback = objCue
          ? `${intent.applyCue || "allure seuil"} — ${objCue}`
          : (intent.applyCue || "allure seuil");
        corpsCue = cueFor("Z3", preferredUnit, z3Fallback);
        const z3Built = buildCorpsByFormat(corpsFormat, z3Budget, {
          label: corpsLabel.includes("/") ? "crawl" : corpsLabel,
          cue: corpsCue,
          restFor: (c) => restFor({ ...c, zone: "Z3" }),
          exerciseId: `corps_${intent.id}_z3`,
          maxContinuous: Math.min(maxContCrawl, hc.maxContinuousDistance || maxContCrawl),
          pool,
          preferredUnit,
          maxRepsPerSet: hc.maxRepsPerSet,
        }, brief);
        for (const s of z3Built.sets) {
          s.zone = "Z3";
          s.blockRole = brief._qualityGateShortTouch ? "specific" : "quality";
          sets.push(s);
          exerciseIds.push(s.exerciseId);
        }
        details.push(...(z3Built.displayLines || z3Built.lines));
        brief._lastSetFormat = z3Built.setFormat;
      } else if ((raceTouches || intent.id === "course_piscine") && !coursePeakHot && !qualitySession && !painBlocked) {
        let touchVol = Math.min(400, Math.max(150, roundTo(mainCorpsTarget * 0.18, 50)));
        if (hc.maxRacePaceMeters != null) touchVol = Math.min(touchVol, hc.maxRacePaceMeters);
        if (hc.maxZ3Meters != null) touchVol = Math.min(touchVol, hc.maxZ3Meters);
        if (touchVol < 100) {
          // pas de touches
        } else {
          const aeroTarget = Math.max(400, mainCorpsTarget - touchVol);
          const objCueA = objectiveBodyCue(brief, intent);
          const aeroCueA = objCueA ? `${intent.applyCue || "aérobie"} — ${objCueA}` : intent.applyCue;
          let aeroFmtA = ["pyramid", "block"].includes(setFormat) ? "repeated" : setFormat;
          const aeroBuilt = buildCorpsByFormat(aeroFmtA, aeroTarget, {
            label: corpsLabel,
            cue: cueFor("Z2", 100, aeroCueA),
            restFor: (c) => restFor({ ...c, zone: "Z2" }),
            exerciseId: `corps_${intent.id}_aero`,
            maxContinuous: maxContCrawl,
            pool,
            maxRepsPerSet: hc.maxRepsPerSet,
          }, brief);
          for (const s of aeroBuilt.sets) {
            s.zone = "Z2";
            sets.push(s);
            exerciseIds.push(s.exerciseId);
          }
          details.push(...(aeroBuilt.displayLines || aeroBuilt.lines));
                  const raceTouchBuilt = buildCorpsByFormat("race_pace", touchVol, {
            cue: cueFor("Z3", 50, "touches allure course"),
            restFor: (c) => restFor({ ...c, zone: "Z3" }),
            preferredUnit: 50,
            maxRepsPerSet: hc.maxRepsPerSet,
            maxContinuous: 50,
            pool,
          }, brief);
          for (const s of raceTouchBuilt.sets) {
            s.zone = "Z3";
            s.blockRole = "specific";
            sets.push(s);
            exerciseIds.push(s.exerciseId);
          }
          details.push(...(raceTouchBuilt.displayLines || raceTouchBuilt.lines));
          brief._lastSetFormat = aeroBuilt.setFormat;
        }
      } else {
        // Aérobie / récup / pain : Z1-Z2 only
        const zoneMain = painBlocked || intent.id === "recuperation" ? "Z1" : "Z2";
        const objCue = objectiveBodyCue(brief, intent);
        const aeroCueBase = objCue
          ? `${intent.applyCue || "aérobie"} — ${objCue}`
          : intent.applyCue;
        let aeroFmt = isFourNSession(brief, strokeFocus) ? "repeated" : setFormat;
        if (hc.forbidComplexFormats || hc.forbidPyramidFiller || hc.painProtection) {
          if (["pyramid", "broken", "block", "progressive"].includes(aeroFmt)) aeroFmt = "repeated";
        } else if (hc.forbidLongProgressive && aeroFmt === "progressive") {
          aeroFmt = "repeated";
        }
        const bankCorps = isFourNSession(brief, strokeFocus)
          ? null
          : tryBuildCorpsFromBank({
          brief: { ...brief, level: isPerf ? "performance" : "sportif" },
          intent,
          rng,
          targetVol: mainCorpsTarget,
          pool,
          restFor: (c) => restFor({ ...c, zone: zoneMain }),
          swimLabel: corpsLabel,
          applyCue: cueFor(zoneMain, 100, aeroCueBase),
          zone: zoneMain,
          maxContinuous: maxContCrawl,
          maxReps: hc.maxRepsPerSet || 12,
          qualitySession,
          preferredFormat: aeroFmt,
        });
        const aeroBuilt =
          bankCorps ||
          buildCorpsByFormat(
            aeroFmt,
            mainCorpsTarget,
            {
              label: corpsLabel,
              cue: cueFor(zoneMain, 100, aeroCueBase),
              restFor: (c) => restFor({ ...c, zone: zoneMain }),
              exerciseId: `corps_${intent.id}`,
              maxContinuous: maxContCrawl,
              pool,
              maxRepsPerSet: hc.maxRepsPerSet,
            },
            brief,
          );
        for (const s of aeroBuilt.sets) {
          s.zone = zoneMain;
          sets.push(s);
          exerciseIds.push(s.exerciseId);
        }
        details.push(...(aeroBuilt.displayLines || aeroBuilt.lines));
        brief._lastSetFormat = aeroBuilt.setFormat;
      }

      // Portion 4N après le corps principal (sauf déjà injectée en race_specific côté vitesse)
      if (fourNPortion) {
        for (const s of fourNPortion.sets) {
          s.zone = "Z2";
          s.blockRole = s.blockRole || "specific";
          sets.push(s);
          exerciseIds.push(s.exerciseId);
        }
        details.push(...fourNPortion.lines);
      }
    }
  }
  } // fin else arthurFunSp

  // FIN Z1 — Arthur RAC (D10) ou FINS_SEMAINE
  const finMaxCont = Math.min(maxContCrawl, brief.hardConstraints?.maxContinuousDistance || maxContCrawl);
  const finLabel = isFourNSession(brief, strokeFocus) ? "crawl facile" : "au choix (récup)";
  const arthurFinSp = tryArthurFin({
    budget: blocks.rac,
    pool,
    level: isPerf ? "performance" : "sportif",
    brief,
    intent,
    equipment: eqList,
    rng,
    sets,
    details,
    exerciseIds,
    maxContinuous: finMaxCont,
    zone: "Z1",
    fourNages: isFourNSession(brief, strokeFocus),
  });
  if (!arthurFinSp) {
  let finSets;
  if (blocks.rac <= finMaxCont) {
    const finSet = buildContinuous(blocks.rac, {
      label: finLabel,
      cue: cueFor("Z1", blocks.rac, "récupération"),
      block: "fin",
      exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
    });
    finSet.zone = "Z1";
    if (isFourNSession(brief, strokeFocus)) finSet.stroke = "crawl";
    finSets = [finSet];
  } else {
    finSets = buildRepeatedExact(blocks.rac, Math.min(100, finMaxCont), {
      label: finLabel,
      cue: cueFor("Z1", 100, "récupération"),
      restSec: restFor({ intensity: "facile", distancePerRep: 100, block: "fin", zone: "Z1" }),
      block: "fin",
      exerciseId: `fin_${pickIndex(FINS_SEMAINE, rng)}`,
      maxReps: 12,
    });
    for (const s of finSets) {
      s.zone = "Z1";
      if (isFourNSession(brief, strokeFocus)) s.stroke = "crawl";
    }
  }
  for (const s of finSets) {
    sets.push(s);
    if (isFourNSession(brief, strokeFocus)) {
      details.push(formatSetLine(s, false));
    } else if (s.continuous || s.reps === 1) {
      const finIdx = parseInt(String(s.exerciseId).replace(/\D/g, ""), 10) || 0;
      const finText = FINS_SEMAINE[finIdx % FINS_SEMAINE.length](s.distancePerRep)
        .replace(/\(Z1\)/i, "(facile)")
        .replace(/\(RAC\)/i, "(récup)");
      details.push(finText.startsWith("-") ? finText : `-${finText}`);
    } else {
      details.push(formatSetLine(s, false));
    }
  }
  }

  ensureObjectiveCueInDetails(details, brief, intent);
  const appliedEqSp = ensureEquipmentEngagement(details, eqList, brief);
  // Uniquement le matos visible (sauf exempt récup/taper : pas de phantom / declared_unused)
  const eqUsageFinalSp = {
    ...eqUsage,
    applied: appliedEqSp,
    usage: appliedEqSp.length
      ? "meaningful"
      : isEquipmentEngagementExempt(brief)
        ? eqUsage.usage || "none"
        : eqList.length
          ? "declared_unused"
          : eqUsage.usage,
  };

  const volumeSets = volumeFromSets(sets);
  const consistency = assertVolumeConsistency({
    sets,
    details,
    announcedDistance: volumeSets,
    tolerance: VOLUME_TOLERANCE_M,
  });
  if (Math.abs(consistency.fromSets - consistency.fromDetails) > VOLUME_TOLERANCE_M) {
    return {
      ok: false,
      reason: `volume incohérent: ${consistency.errors.join("; ")}`,
      debug: consistency,
    };
  }

  // J3 safety-net : cue objectif visible même si collapse a mangé le cue set
  {
    const objCue = objectiveBodyCue(brief, intent);
    const joined = details.join("\n");
    if (objCue && brief.objectif === "eau_libre" && !/sighting|visée|orientation|navigation|lève|repér/i.test(joined)) {
      // Annoter la première ligne corps
      const corpsIdx = details.findIndex((l) => /^-\d/.test(l) && !/Technique|souple —|échauff/i.test(l) && details.indexOf(l) > 0);
      if (corpsIdx >= 0) {
        details[corpsIdx] = `${details[corpsIdx]} — ${objCue}`;
      } else {
        details.splice(Math.min(3, details.length), 0, `-Cue eau libre : ${objCue}`);
      }
    }
    if (brief.objectif === "triathlon" && !/triathlon|économie|draft|énergie|allure régulière/i.test(joined)) {
      const triCue = objCue || "économie d'énergie — allure régulière";
      const corpsIdx = details.findIndex(
        (l) =>
          /^-\d/.test(l) &&
          !/souple|échauff|récup|au choix|Technique/i.test(l) &&
          (/\(Z[23]\)|Z[23]\s*@/.test(l) || /\d+\s*[×x]\s*(100|200|400)\s*m/i.test(l)),
      );
      const fallbackIdx = details.findIndex((l) => /^-\d/.test(l) && !/souple|Technique/i.test(l));
      const idx = corpsIdx >= 0 ? corpsIdx : fallbackIdx;
      if (idx >= 0) details[idx] = `${details[idx]} — ${triCue}`;
    }
  }

  // Polarisation check soft: majority Z1/Z2 on non-quality
  const byZone = { Z1: 0, Z2: 0, Z3: 0, Z4: 0 };
  for (const s of sets) {
    const z = s.zone || "Z2";
    byZone[z] = (byZone[z] || 0) + s.reps * s.distancePerRep;
  }

  const intensityLabel = displayIntensity(zone, isPerf ? "performance" : "sportif");
  const session = {
    type:
      intent.id === "test"
        ? "TEST"
        : intent.id === "vitesse" || intent.id === "vo2"
          ? "VITESSE"
          : qualitySession
            ? "SEUIL"
            : intent.id === "quatre_nages"
              ? "TECHNIQUE"
              : "ENDURANCE",
    title: intent.headline.replace(/^Aujourd'hui :\s*/i, isPerf ? "Performance · " : "Sportif · "),
    intensity: intensityLabel,
    details,
    distance: `${volumeSets}m`,
    duration: Math.max(
      35,
      Math.min(brief.durationTarget || (isPerf ? 70 : 60), Math.round(volumeSets / (isPerf ? 42 : 40))),
    ),
    completed: false,
    skipped: null,
    family: brief.family,
    isKeySession: brief.keySession || qualitySession || undefined,
    qualitySession,
    isTest: !!intent.isTest,
    performanceStrategy: brief.performanceStrategy || null,
    objectives: [intent.headline, "Aérobie majoritaire · qualité intentionnelle"],
    strokeFocus,
    sessionSpecificity,
    papillonMastered: papillonOk,
    engineWhy: brief.why,
    composerWhy: {
      engineVolumeTarget: engineVolume,
      volumeTarget: coherentVolume,
      volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
      volumeSoftReduced: coherentVolume < engineVolume,
      blocks,
      exercises: exerciseIds,
      intent: intent.id,
      techPrimary,
      strokeFocus,
      sessionSpecificity,
      setFormat: brief._lastSetFormat || setFormat,
      reprisePattern: reprisePattern?.id || null,
      equipmentUsage: eqUsageFinalSp.usage,
      equipmentApplied: eqUsageFinalSp.applied,
      papillonOk,
      qualitySession,
      zone,
      zoneVolumes: byZone,
      absoluteMetersByZone: byZone,
      allowPaces: paceCtx.allowPaces,
      maxContinuous: maxCont,
      pedagogical: intent.headline,
      seed: brief.seed,
      level: isPerf ? "performance" : "sportif",
      performancePrimary: brief.performanceStrategy?.primaryQuality || null,
      taperStage: taperLoad?.taperStage || null,
      taperLoad: taperLoad || null,
    },
    sets,
    volumeFromSets: volumeSets,
    trainingDistance: volumeSets,
    absoluteMetersByZone: byZone,
    maxContinuousAllowed: maxCont,
    equipmentRequired: eqUsageFinalSp.applied || [],
    equipmentUsed: eqUsageFinalSp.applied || [],
  };

  if (!sessionFitsEquipment(session.details, equipment)) {
    return { ok: false, reason: "matériel incompatible avec inventaire", session };
  }

  const hard = validateSportifHard(session, {
    papillonOk,
    qualitySession,
    allowPaces: paceCtx.allowPaces,
  });
  if (!hard.ok) {
    return { ok: false, reason: hard.errors.join("; "), session };
  }

  const v = validateSession(
    session,
    { level: isPerf ? "performance" : "sportif", equipment, hasPainConstraint: !!(brief.painProtection || brief.hasPainConstraint || brief.hardConstraints?.painProtection) },
    {
      volumeTarget: coherentVolume,
      maxIntensityZone: qualitySession ? (intent.zone === "Z4" ? "Z4" : "Z3") : "Z2",
      durationMin: brief.durationTarget,
    },
  );
  if (!v.ok) {
    return { ok: false, reason: v.errors.join("; "), session, warnings: v.warnings };
  }

  const ratio = volumeSets / Math.max(1, coherentVolume);
  const tapering = !!(taperLoad?.taperStage && taperLoad.taperStage !== "post_race");
  const lo = tapering ? 0.5 : 0.75;
  const hi = tapering ? (taperLoad.taperStage === "race_week" ? 1.55 : 1.45) : 1.25;
  if (ratio < lo || ratio > hi) {
    return {
      ok: false,
      reason: `volume hors tolérance (${volumeSets}m vs cohérent ${coherentVolume}m)`,
      session,
    };
  }

  return { ok: true, session: finalizeCoachSession(session), warnings: v.warnings };
}

/**
 * Point d'entrée composeur + Quality Gate (Étape J2).
 * @returns {{ ok: true, session: object } | { ok: false, reason: string }}
 */
export function composeSession(brief) {
  if (!brief || !brief.volumeTarget) {
    return { ok: false, reason: "SessionBrief invalide" };
  }
  return composeWithQualityGate(brief, composeSessionOnce);
}

/** Composition interne (une tentative) — appelée par le quality gate. */
export function composeSessionOnce(brief) {
  if (!brief || !brief.volumeTarget) {
    return { ok: false, reason: "SessionBrief invalide" };
  }
  // Injecte hard constraints si absentes
  if (!brief.hardConstraints) {
    brief.hardConstraints = resolveHardConstraints(brief);
  }
  const rng = createRng(brief.seed);

  let result;
  if (brief.level === "decouverte") {
    result = composeDecouverteSession(brief, rng);
  } else if (brief.level === "regulier") {
    result = composeRegulierSession(brief, rng);
  } else if (brief.level === "sportif" || brief.level === "performance") {
    result = composeSportifSession(brief, rng);
  } else {
    return { ok: false, reason: `composeur non actif pour niveau=${brief.level}` };
  }
  return attachFourNagesCoverage(result, brief);
}

export function isComposerEnabledForLevel(level) {
  return SESSION_COMPOSER_ENABLED_LEVELS.includes(level);
}

/**
 * Log DEV explicite + payload traçable (jamais bruyant en production).
 */
export function logComposerFallback(reason, meta = {}) {
  const payload = {
    tag: "COMPOSER_FALLBACK",
    reason: String(reason || "unknown"),
    level: meta.level,
    weekIndex: meta.weekIndex,
    sessionIndex: meta.sessionIndex,
    seed: meta.seed,
  };
  const isDev =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
    (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development");
  if (isDev) {
    // eslint-disable-next-line no-console
    console.info("[COMPOSER_FALLBACK]", payload.reason, payload);
  }
  return payload;
}

/** Helpers exposés pour tests cas 6 / 7 */
export function rejectExerciseForBrief(exercise, brief) {
  if (rejectsMissingEquipment(exercise, brief.equipment || [])) {
    return { rejected: true, reason: "matériel absent" };
  }
  if (brief.level === "decouverte" && rejectsDecouverteComplexity(exercise)) {
    return { rejected: true, reason: "trop complexe pour Découverte" };
  }
  const filtered = filterExercises([exercise], brief, { block: exercise.allowedBlocks?.[0] });
  if (!filtered.length) {
    return { rejected: true, reason: "filtre brief" };
  }
  return { rejected: false };
}

export { rejectsDecouverteComplexity, rejectsMissingEquipment, ADVANCED_RE };
