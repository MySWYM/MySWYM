/**
 * Estimation capacité interne (ne modifie pas le niveau UI).
 * Étape H : mise à jour progressive depuis FeedbackSignal / tendance.
 * Readiness V1 : signal d'entrée soft (questionnaire), jamais prioritaire vs feedback/historique.
 */
import { normalizeUiLevel } from "./types.js";
import { estimateReadinessModifier, readinessHistoryWeight } from "./readiness.js";

const LEVEL_BASE = {
  decouverte: 0.35,
  regulier: 0.55,
  sportif: 0.75,
  performance: 0.95,
};

export function blankCapacityDimensions(score = 0.55) {
  const s = Math.min(1, Math.max(0.2, Number(score) || 0.55));
  return {
    continuousCapacity: s,
    volumeTolerance: s,
    intensityTolerance: Math.max(0.2, s - 0.05),
    recoveryTolerance: Math.max(0.25, s - 0.1),
    technicalConfidence: Math.max(0.25, s - 0.08),
  };
}

/**
 * Confiance selon richesse d'historique / cohérence.
 */
export function confidenceFromSampleCount(n, coherent = false) {
  if (n <= 1) return "low";
  if (n <= 3) return coherent ? "medium" : "low";
  if (n <= 7) return coherent ? "high" : "medium";
  return "high";
}

/**
 * @param {object} sportProfile, buildSportProfile()
 * @param {object} [history], { recentEasy, recentHard, completedSessions, avgWeekDistance, daysSinceLast }
 */
export function estimateCapacity(sportProfile, history = {}) {
  const level = sportProfile.level || normalizeUiLevel(sportProfile.levelRaw);
  let score = LEVEL_BASE[level] ?? 0.55;
  let confidence = 0.25;

  if (sportProfile.pace100 > 0) {
    const p = sportProfile.pace100;
    if (p < 75) score += 0.08;
    else if (p < 90) score += 0.04;
    else if (p > 120) score -= 0.05;
    confidence += 0.2;
  }

  const completed = Number(history.completedSessions) || 0;
  if (completed >= 3) confidence += 0.15;
  if (completed >= 8) confidence += 0.15;
  if (completed >= 20) confidence += 0.1;

  const easy = Number(history.recentEasy) || 0;
  const hard = Number(history.recentHard) || 0;
  if (easy >= 2) score += 0.04;
  if (hard >= 2) score -= 0.06;

  // Dimensions persistées (Étape H), influence douce
  const dims = history.capacityDimensions || history.capacityUpdate?.dimensions;
  if (dims && typeof dims === "object") {
    const vt = Number(dims.volumeTolerance);
    const it = Number(dims.intensityTolerance);
    if (Number.isFinite(vt)) score = score * 0.7 + vt * 0.3;
    if (Number.isFinite(it) && it < 0.4) score = Math.min(score, 0.55);
  }

  if (sportProfile.hasPainConstraint || history.painProtection) {
    score = Math.min(score, 0.5);
    confidence = Math.min(confidence, 0.4);
  }

  const daysSince = Number(history.daysSinceLast);
  if (Number.isFinite(daysSince) && daysSince >= 21) {
    score *= 0.75;
    confidence = Math.min(confidence, 0.35);
  }

  if (history.postRaceRecovery) {
    score = Math.min(score, 0.55);
    confidence = Math.min(confidence, 0.45);
  }

  score = Math.min(1, Math.max(0.2, score));
  confidence = Math.min(1, Math.max(0.15, confidence));

  // Readiness questionnaire, entrée soft, fade si historique / feedback réel
  const readinessMod = estimateReadinessModifier(sportProfile.readinessProfile);
  const hardFeedback = (Number(history.recentHard) || 0) >= 1;
  const muteReadiness =
    !readinessMod ||
    hardFeedback ||
    !!(history.painProtection || sportProfile.hasPainConstraint);
  const readinessW = muteReadiness ? 0 : readinessHistoryWeight(history);

  if (readinessMod && readinessW > 0) {
    score = Math.min(1, Math.max(0.2, score + readinessMod.scoreDelta * readinessW));
    confidence = Math.min(1, Math.max(0.15, confidence + readinessMod.confidence * readinessW));
  }

  let volumeFactor = 0.5 + score * 0.9;
  if (readinessMod && readinessW > 0) {
    const mul = 1 + (readinessMod.volumeFactor - 1) * readinessW;
    volumeFactor *= mul;
  }

  const dimensions = {
    ...blankCapacityDimensions(score),
    ...(dims && typeof dims === "object" ? dims : {}),
  };

  if (readinessMod && readinessW > 0) {
    if (readinessMod.intensitySoftCap != null) {
      const cap = readinessMod.intensitySoftCap;
      const it = Number(dimensions.intensityTolerance);
      if (Number.isFinite(it)) {
        dimensions.intensityTolerance = it * (1 - readinessW) + Math.min(it, cap) * readinessW;
      }
    }
    if (readinessMod.technicalBias) {
      dimensions.technicalConfidence = Math.min(
        1,
        (Number(dimensions.technicalConfidence) || 0.3) + 0.06 * readinessW,
      );
    }
  }

  const conservative =
    confidence < 0.4 ||
    !!(readinessMod && readinessW > 0.45 && readinessMod.conservative);

  return {
    score,
    confidence,
    volumeFactor,
    conservative,
    resumeMode: Number.isFinite(daysSince) && daysSince >= 21,
    dimensions,
    confidenceBand: confidenceFromSampleCount(completed, completed >= 3),
    readiness: readinessMod
      ? { ...readinessMod, weight: readinessW, applied: readinessW > 0 }
      : null,
  };
}

function clamp01(n, lo = 0.15, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Mise à jour progressive des dimensions, jamais brutale sur 1 feedback.
 * @param {object} base, estimateCapacity()
 * @param {object} adaptation, decideWeeklyAdaptation()
 */
export function applyCapacitySignalUpdate(base, adaptation = {}, opts = {}) {
  const dims = { ...(base.dimensions || blankCapacityDimensions(base.score)) };
  const sampleCount = Number(opts.sampleCount) || 1;
  const band = confidenceFromSampleCount(sampleCount, adaptation.confidence === "medium" || adaptation.confidence === "high");

  // Alpha faible si low confidence / observeOnly
  let alpha = band === "high" ? 0.22 : band === "medium" ? 0.14 : 0.06;
  if (adaptation.observeOnly) alpha *= 0.5;
  if (adaptation.safety === "pain") alpha = Math.max(alpha, 0.25);

  const action = adaptation.action || "HOLD";
  const lever = adaptation.primaryLever || "volume";
  const deltas = {
    continuousCapacity: 0,
    volumeTolerance: 0,
    intensityTolerance: 0,
    recoveryTolerance: 0,
    technicalConfidence: 0,
  };

  if (adaptation.safety === "pain") {
    deltas.intensityTolerance = -0.12;
    deltas.recoveryTolerance = -0.08;
    deltas.volumeTolerance = -0.06;
  } else if (action === "REDUCE" || action === "RECOVER") {
    if (lever === "intensity" || lever === "density") {
      deltas.intensityTolerance = -0.06;
      deltas.recoveryTolerance = -0.04;
    } else {
      deltas.volumeTolerance = -0.05;
      deltas.continuousCapacity = -0.03;
    }
  } else if (action === "PROGRESS" && !adaptation.taperBlocked) {
    // Une séance easy ≠ preuve de capacité ↑, exige confiance medium+
    if (band !== "low") {
      if (lever === "volume") {
        deltas.volumeTolerance = 0.04;
        deltas.continuousCapacity = 0.03;
      } else if (lever === "intensity") {
        deltas.intensityTolerance = 0.03;
      } else {
        deltas.technicalConfidence = 0.03;
      }
    }
  } else if (action === "HOLD" || action === "ADJUST") {
    // stabilité : micro consolidation technique si good
    if ((adaptation.counts?.good || 0) >= 2) {
      deltas.technicalConfidence = 0.02;
    }
  }

  for (const k of Object.keys(deltas)) {
    if (!deltas[k]) continue;
    dims[k] = clamp01(dims[k] * (1 - alpha) + (dims[k] + deltas[k]) * alpha);
  }

  let score = base.score;
  score = clamp01(score * (1 - alpha * 0.5) + ((dims.volumeTolerance + dims.intensityTolerance) / 2) * (alpha * 0.5));

  // Pain : plafond immédiat (sécurité)
  let painProtection = !!base.painProtection;
  if (adaptation.safety === "pain") {
    score = Math.min(score, 0.5);
    dims.intensityTolerance = Math.min(dims.intensityTolerance, 0.4);
    painProtection = true;
  }

  const volumeFactor = 0.5 + score * 0.9;

  return {
    capacity: {
      ...base,
      score,
      volumeFactor,
      dimensions: dims,
      confidenceBand: band,
      conservative: band === "low" || score < 0.45,
      painProtection,
    },
    dimensions: dims,
    confidence: band,
    deltas,
    alpha,
    rationale: `capacity EMA α=${alpha.toFixed(2)} action=${action} lever=${lever} band=${band}`,
  };
}
