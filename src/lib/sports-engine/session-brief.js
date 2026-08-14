/**
 * SessionBrief — contrat entre sports-engine (POURQUOI/QUOI) et session-composer (COMMENT).
 */
import { composeSessionBlueprint } from "./session-compose.js";
import { explainSessionWhy } from "./types.js";
import { normalizeStrokeFocus } from "./stroke-focus.js";
import { resolveHardConstraints } from "./composer-constraints.js";

const FOCUS_DECOUVERTE = ["technique_fleche", "technique_grand_chien"];

/**
 * @typedef {object} SessionBrief
 * @property {string} level
 * @property {string} objectif
 * @property {string} phase
 * @property {string} family
 * @property {boolean} keySession
 * @property {number} durationTarget
 * @property {number} volumeTarget
 * @property {string} intensityTarget
 * @property {string[]|null} equipment
 * @property {string} primaryTechnicalGoal
 * @property {string} progressionLever
 * @property {object|null} previousSessionContext
 * @property {number} pool
 * @property {number} weekIndex
 * @property {number} sessionIndex
 * @property {string} seed
 * @property {object} blocks
 * @property {string} why
 */

/**
 * Construit un SessionBrief à partir du contexte semaine + rôle séance.
 * Ne décide pas des exercices — seulement le brief pour le composeur.
 */
export function buildSessionBrief({
  sport,
  weekCtx,
  role = {},
  weekIndex = 0,
  sessionIndex = 0,
  durationTarget = 30,
  previousSessionContext = null,
  seed = null,
} = {}) {
  const level = sport?.level || weekCtx?.sport?.level || "regulier";
  const objectif = sport?.objectifV1 || weekCtx?.sport?.objectifV1 || "nager_progresser";
  const phase = weekCtx?.volumePlan
    ? (typeof weekCtx.phaseKey === "string" ? weekCtx.phaseKey : "foncier")
    : "foncier";
  const phaseName =
    weekCtx?.effectivePhase ||
    weekCtx?.orchestration?.effectivePhase ||
    (weekCtx && (weekCtx._phaseName || null)) ||
    role.phase ||
    phase;
  const volumeTarget =
    weekCtx?.volumePlan?.sessionTargets?.[sessionIndex] ||
    Math.round((weekCtx?.volumePlan?.weekTarget || 1200) / Math.max(1, sport?.sessionsPerWeek || 3));
  const family = role.family || role.intent || "endurance";
  const intensityTarget = role.zone || (level === "decouverte" ? "Z1" : "Z2");
  const equipment = sport?.equipment ?? weekCtx?.sport?.equipment ?? null;
  const lever = weekCtx?.volumePlan?.lever || "volume";
  const strokeFocus =
    sport?.strokeFocus ||
    normalizeStrokeFocus(sport || {}, objectif) ||
    "mixte";

  const wishHints = sport?.trainingWishHints || null;

  let primaryTechnicalGoal = "technique_fleche";
  if (level === "decouverte") {
    primaryTechnicalGoal = FOCUS_DECOUVERTE[(weekIndex + sessionIndex) % FOCUS_DECOUVERTE.length];
  } else if (role.objectif?.startsWith("technique_")) {
    primaryTechnicalGoal = role.objectif;
  } else if (wishHints?.preferTech?.includes("virages") && level !== "decouverte") {
    primaryTechnicalGoal = "technique_virages";
  } else if (wishHints?.preferTech?.includes("rattrape") && level !== "decouverte") {
    primaryTechnicalGoal = "technique_catchup";
  }

  const blueprint = composeSessionBlueprint({
    volumeTarget,
    family,
    level,
    phase: phaseName,
    isKeySession: !!role.isKeySession,
  });

  const resolvedSeed =
    seed != null
      ? String(seed)
      : `${level}|${objectif}|${phaseName}|w${weekIndex}|s${sessionIndex}|v${blueprint.volumeTarget}|${family}|${strokeFocus}`;

  let brief = {
    level,
    objectif,
    phase: phaseName,
    family,
    keySession: !!role.isKeySession,
    durationTarget: Math.max(20, Number(durationTarget) || 30),
    volumeTarget: blueprint.volumeTarget,
    intensityTarget,
    equipment,
    primaryTechnicalGoal,
    progressionLever: lever,
    previousSessionContext,
    pool: sport?.pool === 25 ? 25 : 50,
    weekIndex,
    sessionIndex,
    seed: resolvedSeed,
    blocks: blueprint.blocks,
    why: explainSessionWhy({
      objectifV1: objectif,
      phase: phaseName,
      family,
      volumeTarget: blueprint.volumeTarget,
      lever,
      intent: role.intent || family,
    }),
    maxIntensityZone: weekCtx?.maxZone || (level === "decouverte" ? "Z2" : "Z4"),
    roleObjectif: role.objectif || family,
    capacity: sport?.capacity || weekCtx?.capacity || null,
    maxContinuousDistance:
      previousSessionContext?.maxContinuousDistance ??
      sport?.capacity?.maxContinuousDistance ??
      weekCtx?.capacity?.maxContinuousDistance ??
      null,
    strokeFocus,
    papillonMastered: !!sport?.papillonMastered,
    strokesMastered: sport?.strokesMastered || null,
    preferredStroke: sport?.preferredStroke || null,
    wishHints,
    wishPreferEquipment: wishHints?.preferEquipment || [],
    sessionIntent: role.sessionIntent || sport?.sessionIntent || null,
    qualitySession: !!role.qualitySession,
    sessionSpecificity: role.sessionSpecificity || sport?.sessionSpecificity || null,
    racePaceTouches: !!(role.racePaceTouches || sport?.racePaceTouches),
    performanceStrategy: role.performanceStrategy || sport?.performanceStrategy || null,
    taperLoad: role.taperLoad || role.performanceStrategy?.taperLoad || weekCtx?.taperLoad || sport?.taperLoad || null,
    taperShortQuality: !!(role.taperShortQuality || role.taperActivation),
    isRaceDay: !!role.isRaceDay,
    isRestDay: !!role.isRestDay || role.sessionIntent === "repos",
    taperRestPreferred: !!role.taperRestPreferred,
    taperActivation: !!role.taperActivation,
    optional: !!role.optional,
    volumeFinalized: !!(weekCtx?.volumeFinalized || weekCtx?.orchestration?.volumeFinalized),
    taperAppliedUpstream: !!(weekCtx?.taperAppliedUpstream || weekCtx?.orchestration?.taperAppliedUpstream),
    orchestration: weekCtx?.orchestration || null,
    raceTarget: sport?.raceTarget || weekCtx?.sport?.raceTarget || null,
    limitingStroke: role.limitingStroke || sport?.limitingStroke || null,
    reprisePattern: role.reprisePattern || sport?.reprisePattern || null,
    forcedSetFormat: role.forcedSetFormat || null,
    pace100Sec: Number(sport?.pace100) > 0 ? Number(sport.pace100) : null,
    isPremium: !!sport?.isPremium,
    allowPaces: !!(sport?.isPremium && Number(sport?.pace100) > 0),
    // Étape J2 — safety
    painProtection: !!(
      sport?.hasPainConstraint ||
      weekCtx?.painProtection ||
      weekCtx?.capacity?.painProtection ||
      role.painProtected
    ),
    hasPainConstraint: !!(sport?.hasPainConstraint || role.painProtected),
  };

  // Soft wish stroke (compatible only)
  if (wishHints?.ready) {
    if (wishHints.preferFourN && level !== "decouverte") {
      brief.strokeFocus = "4n";
    } else if (wishHints.preferStroke === "crawl") {
      brief.strokeFocus = "crawl";
    } else if (wishHints.preferStroke === "dos" || wishHints.preferStroke === "brasse") {
      brief.strokeFocus = "mixte";
      brief.preferredStroke = wishHints.preferStroke;
    }
  }

  brief.hardConstraints = resolveHardConstraints(brief);
  if (brief.hardConstraints.maxVolume != null && brief.volumeTarget > brief.hardConstraints.maxVolume) {
    brief.volumeTarget = brief.hardConstraints.maxVolume;
  }
  if (brief.hardConstraints.painProtection) {
    brief.racePaceTouches = false;
    brief.maxIntensityZone = "Z2";
  }
  if (brief.hardConstraints.isFourN) {
    if (!brief.strokeFocus || brief.strokeFocus === "mixte") brief.strokeFocus = "4n";
    brief._minFourNageBodyShare = brief.hardConstraints.minFourNageBodyShare;
  }
  if (brief.hardConstraints.maxContinuousDistance) {
    brief.maxContinuousDistance = brief.hardConstraints.maxContinuousDistance;
  }

  return brief;
}
