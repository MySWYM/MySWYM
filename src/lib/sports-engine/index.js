/**
 * Façade moteur sportif V1.
 */
export {
  OBJECTIF_V1,
  SESSION_FAMILIES,
  EQUIPMENT_IDS,
  EQUIPMENT_LABELS,
  normalizeProfileEquipment,
  mapGoalToObjectifV1,
  objectifV1ToProfilObj,
  normalizeUiLevel,
  buildSportProfile,
  explainSessionWhy,
} from "./types.js";

export {
  estimateCapacity,
  applyCapacitySignalUpdate,
  blankCapacityDimensions,
  confidenceFromSampleCount,
} from "./capacity.js";
export {
  DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE,
  shouldAskDecouverteContinuous,
  decouverteContinuousPrompt,
  applyDecouverteContinuousResponse,
  previousSessionContextFromContinuous,
  pickContinuousHistoryFields,
  metersFromContinuousBand,
} from "./decouverte-continuous-report.js";
export {
  estimateReadinessModifier,
  normalizeReadinessProfile,
  readinessHistoryWeight,
  ACTIVITY_LEVELS,
  SWIMMING_RECENCIES,
  FITNESS_LEVELS,
  RECOVERY_LEVELS,
} from "./readiness.js";
export { resolvePlanHorizon, mapPhaseToGenerator, PHASE_TO_GENERATOR } from "./periodization.js";
export {
  enrichWeekRoles,
  decouverteWeekRoles,
  regulierWeekRoles,
  sportifWeekRoles,
  isEducatifSession,
  ensureWeeklyEducatif,
} from "./week-roles.js";
export { performanceWeekRoles } from "./performance-week-roles.js";
export {
  resolvePerformanceStrategy,
  weeksToCompetition,
  horizonBandFromWeeks,
  qualitiesForRaceDistance,
  qualitiesForObjectif,
  PERFORMANCE_QUALITY_IDS,
} from "./performance-strategy.js";
export {
  daysToCompetition,
  taperStageFromDays,
  resolveTaperPhase,
  resolveTaperLoad,
  taperWeekRoleIntents,
  raceWeekDayPlan,
  taperRacePaceTouch,
  buildRaceDaySession,
  isRaceDaySession,
  buildRestDaySession,
  buildRaceResultStub,
  arthurFitsTaper,
  TAPER_GOLD_SCENARIOS,
} from "./taper-load.js";
export {
  weekStartDate,
  resolveEffectiveWeekPhase,
  resolveEffectiveWeekVolume,
  buildWeekOrchestration,
  trainingDistanceOfSession,
  sumTrainingDistance,
  applyPainSafetyToRoles,
  biasWeekRolesForTaste,
  formatEffectiveEngineWhy,
} from "./week-orchestration.js";
export {
  SESSION_DISTANCE_PRESETS,
  formatSessionDistanceLabel,
  defaultSessionDistanceForLevel,
  nearestSessionDistancePreset,
  normalizeTargetSessionDistance,
  applyTargetSessionDistanceToTargets,
  sessionDistancePhaseScale,
} from "./session-distance-pref.js";
export {
  parseTrainingWish,
  trainingWishToHints,
  biasRolesForTrainingWish,
  applyWishStrokeToBrief,
} from "./training-wish.js";
export {
  normalizeRaceTarget,
  resolveRaceTarget,
  raceTargetPacePer100,
  formatRaceTime,
} from "./race-target.js";
export { computeRaceGap, resolveCurrentRaceTime, countKnownSplits } from "./race-gap.js";
export {
  resolveQualityToDevelop,
  analyzeRaceWeek,
  formatRaceDevExplain,
  QUALITY_TO_DEVELOP_IDS,
} from "./race-quality.js";
export { applyQualityToCourseRoles, RACE_DECISION_PRIORITY } from "./race-week-roles.js";
export {
  planWeekVolume,
  splitSessionBlocks,
  splitSessionBlocksDecouverte,
  splitSessionBlocksRegulier,
  splitSessionBlocksSportif,
  splitSessionBlocksPerformance,
  biasBlocksForObjectif,
  applySessionShape,
} from "./volume.js";
export {
  composeSessionBlueprint,
  displayIntensity,
  sessionFitsEquipment,
  detectEquipmentInDetails,
  hasPullPalmesConflict,
} from "./session-compose.js";
export { validateSession, maxZoneForProfile } from "./validate.js";
export {
  decideAdaptAction,
  missedSessionPolicy,
  shouldAdaptiveDeload,
  normalizeFeedbackRating,
  FEEDBACK_LABELS,
} from "./adapt.js";
export {
  normalizeSessionFeedback,
  interpretFeedback,
  computeFeedbackTrend,
  decideWeeklyAdaptation,
  updateCapacityFromWeek,
  applyRaceResultToPerformance,
  resolvePostRaceRecovery,
  runAdaptiveLoop,
  formatAdaptDevExplain,
  legacyRatingToDifficulty,
} from "./feedback-loop.js";
export { evaluateGates } from "./gates.js";
export { buildSessionBrief } from "./session-brief.js";
export {
  buildExerciseInventory,
  getExerciseInventory,
  countTechniqueDrills,
  filterExercises,
  rejectsMissingEquipment,
  rejectsDecouverteComplexity,
} from "./exercise-library.js";
export {
  composeSession,
  composeSessionOnce,
  isComposerEnabledForLevel,
  logComposerFallback,
  SESSION_COMPOSER_ENABLED_LEVELS,
  assertVolumeConsistency,
  volumeFromSets,
  validateDecouverteHard,
  validateRegulierHard,
  validateSportifHard,
  rejectExerciseForBrief,
  coherentVolumeForPerformance,
  maxContinuousForSportif,
  resolveSportifIntent,
  coherentVolumeForSportif,
  maxContinuousForDecouverte,
  resolveDecouverteIntent,
  coherentVolumeForDecouverte,
  coherentVolumeForRegulier,
  maxContinuousForRegulier,
  resolveRegulierIntent,
  REPRISE_PATTERNS,
  selectSetFormat,
  candidateSetFormats,
  restSecFor,
  effortCue,
  resolvePaceContext,
  scaleSessionLinesToVolume,
  scaleDetailLine,
  humanizeUserFacingText,
} from "./session-composer.js";
export { pedagogyFlags, PEDAGOGY_FLAGS } from "./pedagogy-flags.js";
export { ARTHUR_WARMUP_RECIPES, buildArthurWarmupForBudget } from "./arthur-warmup-recipes.js";
export {
  validateComposedSession,
  validateArthurCandidate,
  composeWithQualityGate,
  logQualityGateAttempt,
} from "./composer-quality-gate.js";
export {
  resolveHardConstraints,
  taperConstraintsFromLoad,
  applyConstraintsToBrief,
  minFourNageBodyShare,
  maxRepsForLevel,
  FORBIDDEN_PAIN_INTENTS,
} from "./composer-constraints.js";
export { SPORTIF_GOLD_SCENARIOS } from "./sportif-intents.js";
export { GOLD_SCENARIOS, DECOUVERTE_INTENTS } from "./decouverte-intents.js";
export { REGULIER_GOLD_SCENARIOS, REGULIER_INTENTS } from "./regulier-intents.js";
export { buildCorpsByFormat, MAX_PYRAMID_VOLUME } from "./set-formats.js";
export {
  PYRAMID_RECIPES,
  PYRAMID_VARIANT_KEYS,
  PYRAMID_EXTENDED_CORPS_SHARE,
  PYRAMID_EXTENDED_CORPS_SHARE_MAX,
  maxPyramidVolume,
  isExtendedPyramidJustified,
  resolvePyramidRecipe,
} from "./pyramid-recipes.js";
export { collapseSetsToDisplayLinesExact, collapseSetsToDisplayLines } from "./display-sets.js";
export {
  toCoachDetailLines,
  finalizeCoachSession,
  findAmbiguousCoachLines,
  expandPyramidDetailLine,
} from "./coach-restitution.js";
export { ARTHUR_GOLD_TEST_FIXTURES } from "./arthur-gold-fixtures.js";
export { findInternalJargon } from "./user-facing.js";
export {
  sanitizeSessionDetailLine,
  prettifySessionDetailLine,
  sanitizeSessionDetails,
  humanizeArthurDisplayTerms,
  isVagueVolumeThemeTitle,
  hasEducatifOrConcreteSwim,
  containsForbiddenIntensityCode,
  assertDisplayLabelsClean,
} from "./session-labels.js";
export { normalizeStrokeFocus, canUsePapillon, strokeSwimLabel, STROKE_FOCUS_IDS } from "./stroke-focus.js";
export {
  fourNagesMix,
  allocateStrokeMeters,
  measureStrokeVolume,
  isFourNagesDeclared,
  FOUR_STROKES,
  FOUR_NAGES_MIX,
  mixWithinTolerance,
} from "./four-nages-mix.js";
export { fourNagesCorpsShare } from "./session-specificity.js";
export {
  IM_ORDER,
  buildFourNagesImSets,
  pickImFormat,
  imFormatCatalog,
} from "./four-nages-im.js";

import { buildSportProfile } from "./types.js";
import { estimateCapacity } from "./capacity.js";
import { resolvePlanHorizon, mapPhaseToGenerator } from "./periodization.js";
import { enrichWeekRoles } from "./week-roles.js";
import { evaluateGates } from "./gates.js";
import { shouldAdaptiveDeload } from "./adapt.js";
import { maxZoneForProfile } from "./validate.js";
import { weekStartDate, buildWeekOrchestration } from "./week-orchestration.js";

/**
 * Prépare le contexte moteur pour une semaine (avant génération des lignes).
 * Étape I : effectivePhase + effectiveWeekVolume (single source of truth).
 */
export function prepareWeekContext(profile, phase, wi, freq, prevWeekDistance, history = {}) {
  const planStart = history.planStartDate || profile.planStartDate || new Date();
  const weekStart = weekStartDate(planStart, wi);
  const capacity = estimateCapacity(buildSportProfile(profile), history);
  const sport = buildSportProfile(profile, { capacity });
  const horizon = resolvePlanHorizon(sport, history.requestedWeeks);
  const gates = evaluateGates({ ...history, level: sport.level });
  const adaptiveDeload = shouldAdaptiveDeload(history);

  const phaseListPhase = phase?.phase || phase;
  const competitionDate =
    sport.raceTarget?.competitionDate ||
    profile.competitionDate ||
    profile.raceTarget?.competitionDate ||
    null;

  const tasteMul = Number(history.tasteVolumeMul);
  const orchestration = buildWeekOrchestration({
    level: sport.level,
    phaseListPhase,
    competitionDate,
    weekStart,
    weekIndex: wi,
    freq,
    capacity,
    history: {
      ...history,
      volumeAdj: history.volumeAdj ?? sport.volumeAdj,
    },
    tasteVolumeMul: Number.isFinite(tasteMul) ? tasteMul : 1,
    ambition: horizon.ambition,
    leverHint: history.weeklyAdaptation?.primaryLever || gates.nextLever,
    prevWeekDistance,
    adaptiveDeload,
    objectifV1: sport.objectifV1,
    raceTarget: sport.raceTarget,
    targetSessionDistance: sport.targetSessionDistance,
  });

  const volumePlan = {
    weekTarget: orchestration.volume.effectiveWeekVolume,
    sessionTargets: orchestration.volume.sessionTargets,
    lever: orchestration.volume.lever,
    typeSemaine: orchestration.volume.typeSemaine,
    why: orchestration.why,
    trail: orchestration.volume.trail,
    factors: orchestration.volume.factors,
    adaptation: orchestration.adaptation,
  };

  return {
    sport,
    capacity,
    horizon,
    gates,
    adaptation: orchestration.adaptation,
    orchestration,
    volumePlan,
    effectivePhase: orchestration.effectivePhase,
    effectiveTaperStage: orchestration.effectiveTaperStage,
    daysToComp: orchestration.daysToComp,
    weekStart,
    taperLoad: orchestration.taperLoad,
    volumeFinalized: true,
    taperAppliedUpstream: true,
    phaseKey: mapPhaseToGenerator(orchestration.effectivePhase),
    maxZone: maxZoneForProfile(sport),
    why: orchestration.why,
    _phaseName: orchestration.effectivePhase,
  };
}

export { enrichWeekRoles as applyFamilyRoles };
