/**
 * Point d’entrée façade serveur Arthur → moteur MySWYM.
 */
export {
  generateArthurPlan,
  normalizeArthurProfile,
  ARTHUR_PLAN_VERSION,
} from "./generateArthurPlan.js";
export {
  shouldPreserveWeek,
  mergePreservingProgress,
  countPreservedWeeks,
  isSessionResolved,
} from "./preserve-progress.js";
export {
  buildPlanPhases,
  buildWellnessPhases,
  computePlanTotalWeeks,
  buildPhaseListForProfile,
  PLAN_TIPS,
} from "./plan-phases.js";
