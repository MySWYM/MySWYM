/**
 * Readiness V1 — disponibilité actuelle pour progresser (pas un profil médical).
 * Signal d'entrée pour estimateCapacity uniquement.
 * Priorité : feedback réel > historique > readiness questionnaire.
 */

export const ACTIVITY_LEVELS = ["low", "moderate", "active", "high"];
export const SWIMMING_RECENCIES = ["current", "recent", "returning", "long_break"];
export const FITNESS_LEVELS = ["low", "normal", "good"];
export const RECOVERY_LEVELS = ["poor", "normal", "good"];

/**
 * @typedef {object} ReadinessProfile
 * @property {'low'|'moderate'|'active'|'high'} activityLevel
 * @property {'current'|'recent'|'returning'|'long_break'} swimmingRecency
 * @property {'low'|'normal'|'good'} currentFitness
 * @property {'poor'|'normal'|'good'} recoveryQuality
 * @property {boolean} trainingCaution
 */

/**
 * @param {unknown} raw
 * @returns {ReadinessProfile|null}
 */
export function normalizeReadinessProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  const activityLevel = ACTIVITY_LEVELS.includes(raw.activityLevel) ? raw.activityLevel : null;
  const swimmingRecency = SWIMMING_RECENCIES.includes(raw.swimmingRecency) ? raw.swimmingRecency : null;
  const currentFitness = FITNESS_LEVELS.includes(raw.currentFitness) ? raw.currentFitness : null;
  const recoveryQuality = RECOVERY_LEVELS.includes(raw.recoveryQuality) ? raw.recoveryQuality : null;
  const trainingCaution = raw.trainingCaution === true || raw.trainingCaution === false
    ? !!raw.trainingCaution
    : null;

  // Incomplete → null (compat / skip)
  if (!activityLevel || !swimmingRecency || !currentFitness || !recoveryQuality || trainingCaution == null) {
    return null;
  }

  return {
    activityLevel,
    swimmingRecency,
    currentFitness,
    recoveryQuality,
    trainingCaution,
  };
}

/**
 * Modificateur readiness → signal doux pour estimateCapacity.
 * Ne décide PAS de séances / zones / taper.
 * volumeFactor = multiplicateur ≤ 1 (jamais de surcharge artificielle).
 * confidence = delta de confiance (−0.12…+0.12).
 *
 * @param {ReadinessProfile|null|undefined} readiness
 * @returns {{ volumeFactor: number, confidence: number, reason: string, scoreDelta: number, intensitySoftCap: number|null, conservative: boolean, technicalBias: boolean }|null}
 */
export function estimateReadinessModifier(readiness) {
  const r = normalizeReadinessProfile(readiness);
  if (!r) return null;

  let scoreDelta = 0;
  let confidence = 0;
  let volumeFactor = 1;
  let intensitySoftCap = null; // null = no cap from readiness
  let conservative = false;
  let technicalBias = false;
  const reasons = [];

  // Recency — reprise longue = prudent
  if (r.swimmingRecency === "long_break") {
    scoreDelta -= 0.08;
    volumeFactor *= 0.88;
    confidence -= 0.05;
    conservative = true;
    technicalBias = true;
    reasons.push("long_break");
  } else if (r.swimmingRecency === "returning") {
    scoreDelta -= 0.04;
    volumeFactor *= 0.94;
    conservative = true;
    technicalBias = true;
    reasons.push("returning");
  } else if (r.swimmingRecency === "recent") {
    scoreDelta -= 0.02;
    volumeFactor *= 0.97;
    reasons.push("recent");
  } else {
    confidence += 0.03;
    reasons.push("current_swim");
  }

  // Activity outside swimming — context only, mild
  if (r.activityLevel === "low") {
    scoreDelta -= 0.03;
    volumeFactor *= 0.97;
    reasons.push("activity_low");
  } else if (r.activityLevel === "high") {
    confidence += 0.04;
    // jamais +volume artificiel
    reasons.push("activity_high");
  } else if (r.activityLevel === "active") {
    confidence += 0.02;
    reasons.push("activity_active");
  }

  // Felt fitness — good = confiance, pas de surcharge
  if (r.currentFitness === "low") {
    scoreDelta -= 0.05;
    volumeFactor *= 0.94;
    conservative = true;
    technicalBias = true;
    reasons.push("fitness_low");
  } else if (r.currentFitness === "good") {
    confidence += 0.05;
    reasons.push("fitness_good");
  }

  // Recovery — poor → favoriser charge douce (cap intensité soft via dims)
  if (r.recoveryQuality === "poor") {
    scoreDelta -= 0.06;
    volumeFactor *= 0.92;
    intensitySoftCap = 0.42; // dims.intensityTolerance soft ceiling
    conservative = true;
    technicalBias = true;
    reasons.push("recovery_poor");
  } else if (r.recoveryQuality === "good") {
    confidence += 0.04;
    reasons.push("recovery_good");
  }

  if (r.trainingCaution) {
    scoreDelta -= 0.03;
    volumeFactor *= 0.95;
    conservative = true;
    technicalBias = true;
    reasons.push("caution");
  }

  volumeFactor = Math.min(1, Math.max(0.82, Math.round(volumeFactor * 1000) / 1000));
  scoreDelta = Math.max(-0.18, Math.min(0.06, scoreDelta));
  confidence = Math.max(-0.12, Math.min(0.12, confidence));

  return {
    volumeFactor,
    confidence,
    reason: reasons.join("+") || "neutral",
    scoreDelta,
    intensitySoftCap,
    conservative,
    technicalBias,
  };
}

/**
 * Poids du readiness vs historique.
 * 1 = readiness plein effet ; 0 = historique dominant (ignoré).
 */
export function readinessHistoryWeight(history = {}) {
  const completed = Number(history.completedSessions) || 0;
  // Après ~8 séances validées, readiness ≈ 0
  return Math.max(0, Math.min(1, 1 - completed / 8));
}
