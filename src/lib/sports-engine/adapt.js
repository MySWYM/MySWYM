/**
 * Adaptation feedback (§25–30) + Étape H (boucle FeedbackSignal).
 *
 * decideAdaptAction reste le point d'entrée App — enrichi, pas remplacé.
 */

import {
  normalizeSessionFeedback,
  interpretFeedback,
  decideWeeklyAdaptation,
  legacyRatingToDifficulty,
} from "./feedback-loop.js";

/** Labels UX V1 ↔ ratings legacy */
export const FEEDBACK_LABELS = [
  { id: "too_easy", label: "Trop facile", legacy: "easy" },
  { id: "ok", label: "Bien", legacy: "ok" },
  { id: "good", label: "Bien", legacy: "ok" },
  { id: "hard", label: "Difficile", legacy: "hard" },
  { id: "too_hard", label: "Trop difficile", legacy: "hard" },
];

export function normalizeFeedbackRating(rating) {
  if (rating === "too_easy" || rating === "easy") return "easy";
  if (rating === "too_hard") return "hard";
  if (rating === "hard") return "hard";
  if (rating === "good") return "ok";
  return "ok";
}

/**
 * Décide PROGRESSER / MAINTENIR / AJUSTER / RÉCUPÉRER.
 * 1 signal = observation ; 2 consécutifs = ajustement.
 * Contexte optionnel → leviers Étape H (sans casser l'API legacy).
 */
export function decideAdaptAction({
  rating,
  finished = true,
  skipReason = null,
  previousSignals = [],
  isKeySession = false,
  weekFeedbacks = null,
  sessionIntent = null,
  qualitySession = false,
  phase = null,
  taperStage = null,
  level = null,
  performanceStrategy = null,
} = {}) {
  const pain = skipReason === "pain" || skipReason === "douleur";

  const hasWeek = Array.isArray(weekFeedbacks) && weekFeedbacks.length > 0;
  const feedbacks = hasWeek
    ? weekFeedbacks
    : [
        {
          difficulty: pain ? null : legacyRatingToDifficulty(rating),
          pain,
          completed: finished,
          missed:
            !finished &&
            !pain &&
            skipReason !== "time" &&
            skipReason !== "pool" &&
            skipReason !== "logistics" &&
            skipReason !== "manque_de_temps" &&
            skipReason !== "piscine",
          skipReason,
          sessionIntent,
          qualitySession,
          isKeySession,
        },
      ];

  const weekly = decideWeeklyAdaptation(feedbacks, {
    phase,
    taperStage,
    level,
    performanceStrategy,
    sessionIntent,
    qualitySession,
  });

  const nonSportSkip = ["time", "pool", "logistics", "manque_de_temps", "piscine"].includes(skipReason);
  if (!finished && nonSportSkip && !pain) {
    return {
      action: "MAINTENIR",
      volumeMul: 1,
      observeOnly: true,
      reason: "skip_logistique",
      primaryLever: "volume",
      magnitude: "0",
      confidence: "low",
      safety: "none",
      weeklyAdaptation: weekly,
      feedbackSignal: interpretFeedback(feedbacks[0], { phase, taperStage, sessionIntent, qualitySession }),
    };
  }

  // Garde rétrocompat : previousSignals hard×2 sans weekFeedbacks
  if (!hasWeek && !pain) {
    const r = normalizeFeedbackRating(rating);
    const signal = !finished ? "hard" : r;
    const recent = [...previousSignals, signal].slice(-3);
    const hardCount = recent.filter((s) => s === "hard").length;
    const easyCount = recent.filter((s) => s === "easy").length;
    if (hardCount >= 2 || (signal === "hard" && !finished && isKeySession)) {
      return {
        ...wrapWeekly(weekly, {
          action: "RECUPERER",
          volumeMul: Math.min(weekly.volumeMul, 0.88),
          observeOnly: false,
          reason: "charge_haute",
        }),
      };
    }
    if (signal === "hard" && hardCount === 1 && weekly.action === "HOLD") {
      return wrapWeekly(weekly, {
        action: "AJUSTER",
        volumeMul: 0.95,
        observeOnly: true,
        reason: "observation_difficile",
      });
    }
    if (easyCount >= 2 && signal === "easy" && !weekly.taperBlocked) {
      return wrapWeekly(weekly, {
        action: "PROGRESSER",
        volumeMul: Math.max(weekly.volumeMul, 1.06),
        observeOnly: false,
        reason: "assimilation",
      });
    }
  }

  return {
    action: weekly.legacyAction,
    volumeMul: weekly.volumeMul,
    observeOnly: weekly.observeOnly,
    reason: weekly.rationale,
    primaryLever: weekly.primaryLever,
    magnitude: weekly.magnitude,
    confidence: weekly.confidence,
    safety: weekly.safety,
    trend: weekly.trend,
    weeklyAdaptation: weekly,
    feedbackSignal: weekly.signals?.[weekly.signals.length - 1] || null,
    devExplain: weekly.devExplain,
  };
}

function wrapWeekly(weekly, override) {
  return {
    action: override.action,
    volumeMul: override.volumeMul,
    observeOnly: override.observeOnly,
    reason: override.reason,
    primaryLever: weekly.primaryLever,
    magnitude: weekly.magnitude,
    confidence: weekly.confidence,
    safety: weekly.safety,
    trend: weekly.trend,
    weeklyAdaptation: weekly,
    feedbackSignal: weekly.signals?.[weekly.signals.length - 1] || null,
    devExplain: weekly.devExplain,
  };
}

/**
 * Politique séance manquée.
 * @returns {'drop'|'reschedule'|'recompute'}
 */
export function missedSessionPolicy({ isKeySession = false, missedInWeek = 1, totalMissed = 1 }) {
  if (totalMissed >= 3) return "recompute";
  if (isKeySession && missedInWeek <= 1) return "reschedule";
  return "drop";
}

/**
 * Décharge adaptative si RPE élevé / non-terminées.
 */
export function shouldAdaptiveDeload(history = {}) {
  const hardStreak = Number(history.hardStreak) || 0;
  const unfinished = Number(history.unfinishedRecent) || 0;
  if (history.painProtection || history.weeklyAdaptation?.safety === "pain") return true;
  if (history.weeklyAdaptation?.action === "PROTECT" || history.weeklyAdaptation?.action === "RECOVER") return true;
  if (history.adaptiveDeload) return true;
  return hardStreak >= 2 || unfinished >= 2;
}

export { normalizeSessionFeedback, interpretFeedback, decideWeeklyAdaptation };
