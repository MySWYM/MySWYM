/**
 * Étape H, Boucle adaptative :
 * Feedback → FeedbackSignal → CapacityUpdate → Trend → Adaptation → semaine suivante.
 *
 * Réutilise adapt.js / capacity.js / gates.js, pas un 2e moteur.
 * Pas de réaction brutale à un seul feedback (sauf pain = sécurité).
 */

import {
  estimateCapacity,
  applyCapacitySignalUpdate,
  confidenceFromSampleCount,
} from "./capacity.js";
import { evaluateGates } from "./gates.js";
import { buildRaceResultStub } from "./taper-load.js";

/** Local, évite import circulaire avec adapt.js */
function missedSessionPolicyLocal({ isKeySession = false, missedInWeek = 1, totalMissed = 1 }) {
  if (totalMissed >= 3) return "recompute";
  if (isKeySession && missedInWeek <= 1) return "reschedule";
  return "drop";
}

/** @typedef {'too_low'|'appropriate'|'too_high'|'unknown'} LoadSignal */
/** @typedef {'none'|'pain'} SafetySignal */
/** @typedef {'progress'|'hold'|'reduce'|'unknown'} ProgressionSignal */
/** @typedef {'improving'|'stable'|'fatiguing'|'unknown'} FeedbackTrend */
/** @typedef {'low'|'medium'|'high'} AdaptConfidence */
/** @typedef {'volume'|'effort_duration'|'density'|'intensity'|'specificity'|'recovery'} AdaptLever */
/** @typedef {'HOLD'|'ADJUST'|'PROGRESS'|'REDUCE'|'PROTECT'|'RECOVER'} WeeklyAdaptAction */
/** @typedef {'-large'|'-small'|'0'|'+small'|'+large'} Magnitude */

const QUALITY_INTENTS = new Set([
  "seuil",
  "vitesse",
  "vo2",
  "allure_specifique",
  "course_piscine",
  "test",
]);
const AEROBIC_INTENTS = new Set(["aerobie", "endurance", "technique_endurance", "recuperation", "reprise"]);
const TECH_INTENTS = new Set(["technique_endurance", "quatre_nages"]);

/**
 * Normalise un retour séance (champs optionnels).
 */
export function normalizeSessionFeedback(raw = {}) {
  const difficultyRaw = raw.difficulty ?? raw.rating ?? raw.feedback ?? null;
  let difficulty = null;
  if (difficultyRaw != null) {
    const s = String(difficultyRaw).toLowerCase();
    if (s === "too_easy" || s === "easy" || s === "trop_facile") difficulty = "too_easy";
    else if (s === "good" || s === "ok" || s === "bien") difficulty = "good";
    else if (s === "hard" || s === "difficile") difficulty = "hard";
    else if (s === "too_hard" || s === "trop_difficile") difficulty = "too_hard";
    else difficulty = s;
  }

  const pain =
    raw.pain === true ||
    raw.pain === "true" ||
    raw.skipReason === "pain" ||
    raw.skipReason === "douleur" ||
    difficulty === "pain";

  const completed =
    raw.completed === false || raw.finished === false
      ? false
      : raw.completed === true || raw.finished === true
        ? true
        : raw.missed
          ? false
          : null;

  return {
    sessionId: raw.sessionId ?? raw.id ?? null,
    completed,
    difficulty: pain && !difficulty ? null : difficulty,
    pain: !!pain,
    missed: !!(raw.missed || raw.skipReason === "missed" || (completed === false && !pain && !raw.skipReason)),
    skipReason: raw.skipReason || null,
    actualDistance: Number.isFinite(Number(raw.actualDistance)) ? Number(raw.actualDistance) : null,
    actualDuration: Number.isFinite(Number(raw.actualDuration)) ? Number(raw.actualDuration) : null,
    actualTime: Number.isFinite(Number(raw.actualTime)) ? Number(raw.actualTime) : null,
    notes: raw.notes || raw.comment || null,
    recordedAt: raw.recordedAt || raw.at || null,
    sessionIntent: raw.sessionIntent || raw.intent || null,
    qualitySession: !!raw.qualitySession,
    isKeySession: !!raw.isKeySession,
    zone: raw.zone || null,
    family: raw.family || null,
  };
}

/**
 * Feedback → FeedbackSignal (interprétation, pas adaptation directe).
 */
export function interpretFeedback(feedbackInput = {}, context = {}) {
  const fb = normalizeSessionFeedback(feedbackInput);
  const evidence = [];
  let loadSignal = /** @type {LoadSignal} */ ("unknown");
  let safetySignal = /** @type {SafetySignal} */ ("none");
  let progressionSignal = /** @type {ProgressionSignal} */ ("unknown");
  let confidence = /** @type {AdaptConfidence} */ ("low");

  if (fb.pain) {
    safetySignal = "pain";
    loadSignal = "too_high";
    progressionSignal = "reduce";
    confidence = "high";
    evidence.push("pain_flag");
  } else if (fb.missed || fb.completed === false) {
    loadSignal = "unknown";
    progressionSignal = "hold";
    evidence.push(fb.skipReason ? `missed:${fb.skipReason}` : "missed");
  } else if (fb.difficulty === "too_easy") {
    loadSignal = "too_low";
    progressionSignal = "progress";
    evidence.push("difficulty:too_easy");
  } else if (fb.difficulty === "good") {
    loadSignal = "appropriate";
    progressionSignal = "hold";
    evidence.push("difficulty:good");
    confidence = "medium";
  } else if (fb.difficulty === "hard") {
    loadSignal = "too_high";
    progressionSignal = "hold";
    evidence.push("difficulty:hard");
  } else if (fb.difficulty === "too_hard") {
    loadSignal = "too_high";
    progressionSignal = "reduce";
    evidence.push("difficulty:too_hard");
    confidence = "medium";
  }

  // Contexte séance : nuance too_easy / too_hard
  const intent = fb.sessionIntent || context.sessionIntent || null;
  const quality = fb.qualitySession || context.qualitySession;
  if (fb.difficulty === "too_easy" && quality) {
    evidence.push("quality_session_too_easy - ne pas durcir brutalement");
  }
  if (fb.difficulty === "too_easy" && TECH_INTENTS.has(intent)) {
    evidence.push("tech_too_easy - volume léger possible, conserver technique");
  }
  if (fb.difficulty === "too_hard" && quality) {
    evidence.push("quality_too_hard - réduire stimulus qualité, garder aérobie");
  }

  // Taper : bloquer progressions
  const phase = context.phase || context.taperLoad?.phase;
  const taperStage = context.taperStage || context.taperLoad?.taperStage;
  if ((phase === "taper" || phase === "race" || taperStage) && progressionSignal === "progress") {
    progressionSignal = "hold";
    evidence.push("taper_blocks_load_progress");
  }

  return {
    loadSignal,
    confidence,
    safetySignal,
    progressionSignal,
    evidence,
    feedback: fb,
    sessionIntent: intent,
    qualitySession: !!quality,
  };
}

/**
 * Tendance multi-séances.
 * @param {Array} feedbacks, raw ou normalisés
 */
export function computeFeedbackTrend(feedbacks = []) {
  const signals = feedbacks.map((f) => interpretFeedback(f));
  if (!signals.length) {
    return { trend: /** @type {FeedbackTrend} */ ("unknown"), confidence: "low", counts: {}, evidence: ["no_feedback"] };
  }

  const counts = { too_easy: 0, good: 0, hard: 0, too_hard: 0, pain: 0, missed: 0 };
  for (const s of signals) {
    if (s.safetySignal === "pain") counts.pain += 1;
    else if (s.feedback?.missed || s.feedback?.completed === false) counts.missed += 1;
    else if (s.feedback?.difficulty && counts[s.feedback.difficulty] != null) counts[s.feedback.difficulty] += 1;
  }

  const n = signals.length;
  const hardish = counts.hard + counts.too_hard;
  const easyish = counts.too_easy;
  const painRecent = counts.pain > 0;

  let trend = /** @type {FeedbackTrend} */ ("stable");
  const evidence = [];

  if (painRecent) {
    trend = "fatiguing";
    evidence.push("pain_in_window");
  } else if (hardish >= 2 || counts.too_hard >= 1 && hardish >= 2) {
    trend = "fatiguing";
    evidence.push(`hardish=${hardish}/${n}`);
  } else if (easyish >= 2 && counts.too_hard === 0 && counts.hard <= 1) {
    trend = "improving";
    evidence.push(`too_easy=${easyish}/${n}`);
  } else if (counts.good >= Math.ceil(n * 0.6) && hardish <= 1) {
    trend = "stable";
    evidence.push("mostly_good");
  } else if (n === 1) {
    trend = "unknown";
    evidence.push("single_sample");
  }

  const confidence = confidenceFromSampleCount(n, trend !== "unknown" && (easyish >= 2 || hardish >= 2 || counts.good >= 3));

  return { trend, confidence, counts, evidence, signals };
}

function pickPrimaryLever(signals, context = {}) {
  const qualityHard = signals.filter(
    (s) =>
      s.qualitySession &&
      (s.feedback?.difficulty === "too_hard" || s.feedback?.difficulty === "hard"),
  );
  const aerobicEasy = signals.filter(
    (s) =>
      !s.qualitySession &&
      AEROBIC_INTENTS.has(s.sessionIntent) &&
      s.feedback?.difficulty === "too_easy",
  );
  const techEasy = signals.filter(
    (s) => TECH_INTENTS.has(s.sessionIntent) && s.feedback?.difficulty === "too_easy",
  );
  const anyTooHard = signals.some((s) => s.feedback?.difficulty === "too_hard");
  const anyPain = signals.some((s) => s.safetySignal === "pain");

  if (anyPain) return "recovery";
  if (qualityHard.length && anyTooHard) return "intensity";
  if (qualityHard.length) return "density";
  if (techEasy.length && !anyTooHard) return "volume";
  if (aerobicEasy.length && !anyTooHard) return "volume";
  if (signals.some((s) => s.progressionSignal === "reduce")) return "volume";
  if (signals.some((s) => s.progressionSignal === "progress")) {
    return context.gates?.nextLever || "volume";
  }
  return "volume";
}

function magnitudeFromTrend(trend, action, singleSoft) {
  if (action === "PROTECT" || action === "RECOVER") return "-large";
  if (action === "REDUCE") return singleSoft ? "-small" : "-small";
  if (action === "PROGRESS") return singleSoft ? "+small" : "+small";
  if (action === "ADJUST") return singleSoft ? "0" : "-small";
  return "0";
}

function volumeMulFor(action, magnitude, { taperBlock = false, observeOnly = false } = {}) {
  if (taperBlock && (action === "PROGRESS" || magnitude.startsWith("+"))) return 1;
  if (observeOnly) return 1;
  switch (magnitude) {
    case "+large":
      return 1.06;
    case "+small":
      return 1.04;
    case "-small":
      return 0.94;
    case "-large":
      return 0.85;
    default:
      return 1;
  }
}

/**
 * Adaptation hebdomadaire explicable.
 * @returns {object} WeeklyAdaptation
 */
export function decideWeeklyAdaptation(weekFeedbacks = [], context = {}) {
  const normalized = weekFeedbacks.map((f) => normalizeSessionFeedback(f));
  const interpreted = normalized.map((f) => interpretFeedback(f, context));
  const trendInfo = computeFeedbackTrend(normalized);
  const gates = context.gates || evaluateGates(context.history || {});

  const pain = interpreted.some((s) => s.safetySignal === "pain");
  const tooHardCount = interpreted.filter((s) => s.feedback?.difficulty === "too_hard").length;
  const hardCount = interpreted.filter((s) => s.feedback?.difficulty === "hard").length;
  const easyCount = interpreted.filter((s) => s.feedback?.difficulty === "too_easy").length;
  const goodCount = interpreted.filter((s) => s.feedback?.difficulty === "good").length;
  const missed = normalized.filter((f) => f.missed || f.completed === false);
  const qualityTooHard = interpreted.filter(
    (s) => s.qualitySession && (s.feedback?.difficulty === "too_hard" || s.feedback?.difficulty === "hard"),
  );

  const phase = context.phase || context.taperLoad?.phase || "development";
  const taperStage = context.taperStage || context.taperLoad?.taperStage || null;
  const taperBlock = phase === "taper" || phase === "race" || !!taperStage || phase === "competition";
  const postRace = phase === "bilan" || context.postRaceRecovery || taperStage === "post_race";

  /** @type {WeeklyAdaptAction} */
  let action = "HOLD";
  /** @type {AdaptConfidence} */
  let confidence = "low";
  const rationaleParts = [];
  let observeOnly = true;
  let safety = "none";
  let affectedSessions = [];

  // Missed policies
  let missedPolicy = null;
  if (missed.length) {
    const keyMissed = missed.some((m) => m.isKeySession || m.qualitySession);
    missedPolicy = missedSessionPolicyLocal({
      isKeySession: keyMissed,
      missedInWeek: missed.length,
      totalMissed: Number(context.totalMissed) || missed.length,
    });
    rationaleParts.push(`missed_policy=${missedPolicy}`);
    if (missedPolicy === "drop") {
      rationaleParts.push("no_catchup_double");
    } else if (missedPolicy === "reschedule") {
      rationaleParts.push("reschedule_if_calendar_allows");
    } else if (missedPolicy === "recompute") {
      action = "ADJUST";
      observeOnly = false;
      rationaleParts.push("recompute_week_without_doubling");
    }
  }

  if (pain) {
    action = "PROTECT";
    safety = "pain";
    confidence = "high";
    observeOnly = false;
    rationaleParts.push("pain → safety first (cap intensity, favor recovery)");
  } else if (context.painProtection || context.history?.painProtection) {
    // Protection ne disparaît pas au premier good
    const goods = goodCount;
    if (goods < 3 || hardCount + tooHardCount > 0) {
      action = "HOLD";
      safety = "pain";
      observeOnly = true;
      confidence = "medium";
      rationaleParts.push("pain_protection_active - hold until sustained recovery signals");
    }
  } else if (postRace) {
    action = "RECOVER";
    observeOnly = false;
    confidence = "medium";
    rationaleParts.push("post_race_recovery - no normal load yet");
  } else if (taperBlock && easyCount > 0 && tooHardCount === 0 && !pain) {
    action = "HOLD";
    observeOnly = true;
    confidence = "medium";
    rationaleParts.push("taper: too_easy does NOT increase load");
  } else if (trendInfo.trend === "fatiguing" || tooHardCount >= 1 && hardCount + tooHardCount >= 2) {
    action = tooHardCount >= 1 ? "REDUCE" : "REDUCE";
    observeOnly = false;
    confidence = trendInfo.confidence === "high" ? "high" : "medium";
    rationaleParts.push("repeated high-load feedback → reduce");
  } else if (tooHardCount >= 1) {
    action = "REDUCE";
    observeOnly = false;
    confidence = "medium";
    rationaleParts.push("too_hard → reduce responsible lever");
    if (qualityTooHard.length) {
      rationaleParts.push("KEEP aerobic; REDUCE quality stimulus");
      affectedSessions = qualityTooHard.map((s) => s.feedback?.sessionId).filter(Boolean);
    }
  } else if (hardCount === 1 && easyCount === 0 && goodCount >= 0 && interpreted.length <= 2) {
    // Séquence D / single hard : ne pas sur-réagir
    action = "HOLD";
    observeOnly = true;
    confidence = "low";
    rationaleParts.push("single hard → observe, hold");
  } else if (hardCount >= 2) {
    action = "ADJUST";
    observeOnly = false;
    confidence = "medium";
    rationaleParts.push("multiple hard → slight reduce / densité");
  } else if (easyCount >= 2 && !taperBlock) {
    action = "PROGRESS";
    observeOnly = false;
    confidence = "medium";
    rationaleParts.push("several too_easy → gradual progress (one lever)");
  } else if (easyCount === 1 && !taperBlock) {
    action = "PROGRESS";
    observeOnly = true;
    confidence = "low";
    rationaleParts.push("single too_easy → micro observe, no big jump");
  } else if (goodCount >= 1 && easyCount === 0 && hardCount === 0 && tooHardCount === 0) {
    action = "HOLD";
    observeOnly = true;
    confidence = goodCount >= 3 ? "medium" : "low";
    rationaleParts.push("good → continuity, gradual stimulus repetition");
  } else if (!normalized.length) {
    action = "HOLD";
    observeOnly = true;
    confidence = "low";
    rationaleParts.push("insufficient feedback → stability");
  }

  // Performance : qualité reste pertinente même si too_hard
  if (context.level === "performance" || context.performanceStrategy) {
    if (qualityTooHard.length) {
      rationaleParts.push(
        "Performance: QualityToDevelop kept - load too high for current stimulus, not wrong diagnosis",
      );
    }
  }

  const primaryLever =
    action === "PROTECT" || action === "RECOVER"
      ? "recovery"
      : pickPrimaryLever(interpreted, { ...context, gates });

  const singleSoft = normalized.length <= 1 || (easyCount + hardCount + tooHardCount <= 1 && !pain);
  const magnitude = magnitudeFromTrend(trendInfo.trend, action, singleSoft && action !== "REDUCE");

  // Never progress volume+intensity+density together, one lever
  const volumeMul = volumeMulFor(action, magnitude, { taperBlock, observeOnly });

  // Map legacy action names for App.jsx
  const legacyAction =
    action === "PROGRESS"
      ? "PROGRESSER"
      : action === "REDUCE" || action === "PROTECT" || action === "RECOVER"
        ? "RECUPERER"
        : action === "ADJUST"
          ? "AJUSTER"
          : "MAINTENIR";

  const adaptation = {
    action,
    legacyAction,
    primaryLever,
    magnitude,
    volumeMul,
    observeOnly,
    rationale: rationaleParts.join(" · ") || "stable",
    confidence,
    safety,
    affectedSessions,
    trend: trendInfo.trend,
    trendConfidence: trendInfo.confidence,
    missedPolicy,
    taperBlocked: taperBlock,
    qualityLoadNote: qualityTooHard.length
      ? "reduce_quality_stimulus_keep_aerobic"
      : null,
    signals: interpreted,
    counts: trendInfo.counts,
    gatesNextLever: gates.nextLever,
  };

  adaptation.devExplain = formatAdaptDevExplain(adaptation, normalized);
  return adaptation;
}

/**
 * Explication DEV inspectable.
 */
export function formatAdaptDevExplain(adaptation, weekFeedbacks = []) {
  const lines = [];
  lines.push("=== Adaptive loop (Étape H) ===");
  if (weekFeedbacks.length) {
    lines.push("Feedback:");
    for (const f of weekFeedbacks) {
      const n = normalizeSessionFeedback(f);
      const label = n.pain ? "pain" : n.missed ? "missed" : n.difficulty || "?";
      lines.push(
        `  - ${n.sessionId || "session"} [${n.sessionIntent || " - "}] → ${label}${n.qualitySession ? " (quality)" : ""}`,
      );
    }
  }
  lines.push(`Trend: ${adaptation.trend} (${adaptation.trendConfidence})`);
  lines.push(`Decision: ${adaptation.action}`);
  lines.push(`Primary lever: ${adaptation.primaryLever}`);
  lines.push(`Magnitude: ${adaptation.magnitude}`);
  lines.push(`Volume mul: ${adaptation.volumeMul}${adaptation.observeOnly ? " (observeOnly)" : ""}`);
  if (adaptation.qualityLoadNote) lines.push(`Quality: ${adaptation.qualityLoadNote}`);
  if (adaptation.taperBlocked) lines.push("Taper: load progress blocked");
  if (adaptation.missedPolicy) lines.push(`Missed: ${adaptation.missedPolicy} (no auto-double)`);
  lines.push(`Reason: ${adaptation.rationale}`);
  lines.push(`Confidence: ${adaptation.confidence}`);
  lines.push(`Safety: ${adaptation.safety}`);
  return lines.join("\n");
}

/**
 * Met à jour la capacité progressivement à partir des signaux.
 */
export function updateCapacityFromWeek(sportProfile, history = {}, weekFeedbacks = [], context = {}) {
  const base = estimateCapacity(sportProfile, history);
  const adaptation = context.adaptation || decideWeeklyAdaptation(weekFeedbacks, context);
  const update = applyCapacitySignalUpdate(base, adaptation, {
    sampleCount: (Number(history.completedSessions) || 0) + weekFeedbacks.length,
  });
  return { capacity: update.capacity, capacityUpdate: update, adaptation };
}

/**
 * Race result → recentBest / gap evidence (jamais inventé).
 */
export function applyRaceResultToPerformance(raceResultInput = {}, evidence = {}) {
  const stub =
    raceResultInput?.raceResult ||
    buildRaceResultStub({
      distance: raceResultInput.distance,
      stroke: raceResultInput.stroke,
      resultTimeSec: raceResultInput.resultTimeSec,
      targetTimeSec: raceResultInput.targetTimeSec,
    });
  if (!stub?.raceResult) {
    return {
      ok: false,
      reason: "no_real_result",
      evidence,
      postRaceRecovery: true,
    };
  }
  const rr = stub.raceResult;
  const recentBest = { ...(evidence.recentBest || evidence.recentBests || {}) };
  if (rr.distance && Number.isFinite(rr.resultTimeSec)) {
    const prev = recentBest[rr.distance];
    if (!prev || rr.resultTimeSec < prev) {
      recentBest[rr.distance] = rr.resultTimeSec;
    }
  }
  return {
    ok: true,
    raceCompleted: true,
    raceResult: rr,
    evidence: {
      ...evidence,
      recentBest,
      recentBests: recentBest,
      currentTimeSec: rr.resultTimeSec,
      currentSource: "race_result",
    },
    postRaceRecovery: true,
    note: "RaceGap may be recomputed from evidence - cause not auto-diagnosed",
  };
}

/**
 * État post-course simple.
 */
export function resolvePostRaceRecovery(ctx = {}) {
  return {
    state: "post_race_recovery",
    volumeMul: 0.7,
    primaryLever: "recovery",
    action: "RECOVER",
    blockProgression: true,
    days: Number(ctx.daysSinceRace) || 0,
    rationale: "post-race: recover before normal development week",
  };
}

/**
 * Boucle complète observable (tests / rapport).
 */
export function runAdaptiveLoop({
  weekFeedbacks = [],
  sportProfile = {},
  history = {},
  context = {},
} = {}) {
  const adaptation = decideWeeklyAdaptation(weekFeedbacks, {
    ...context,
    history,
    level: sportProfile.level || context.level,
    painProtection: !!(history.painProtection || context.painProtection),
  });
  const { capacity, capacityUpdate } = updateCapacityFromWeek(sportProfile, history, weekFeedbacks, {
    ...context,
    adaptation,
  });
  const hardStreakNext =
    adaptation.trend === "fatiguing"
      ? Math.max(2, Number(history.hardStreak) || 0)
      : adaptation.counts?.hard
        ? 1
        : 0;
  const unfinishedRecent = weekFeedbacks.filter((f) => normalizeSessionFeedback(f).missed).length;
  const deload =
    hardStreakNext >= 2 ||
    unfinishedRecent >= 2 ||
    adaptation.action === "PROTECT" ||
    adaptation.action === "RECOVER" ||
    adaptation.safety === "pain";

  const nextHistory = {
    ...history,
    hardStreak: hardStreakNext,
    easyStreak: adaptation.counts?.too_easy || 0,
    okStreak: adaptation.counts?.good || 0,
    unfinishedRecent,
    weeklyAdaptation: adaptation,
    capacityUpdate,
    capacityDimensions: capacityUpdate.dimensions,
    painProtection:
      !!history.painProtection ||
      !!capacity.painProtection ||
      adaptation.safety === "pain",
    trend: adaptation.trend,
    volumeAdj: Number(history.volumeAdj) || 1,
    volumeAdjNext: (Number(history.volumeAdj) || 1) * (adaptation.observeOnly ? 1 : adaptation.volumeMul),
    adaptiveDeload: deload,
    postRaceRecovery: !!context.postRaceRecovery,
  };

  return {
    feedbacks: weekFeedbacks.map(normalizeSessionFeedback),
    signals: adaptation.signals,
    trend: adaptation.trend,
    capacity,
    capacityUpdate,
    adaptation,
    nextHistory,
    nextVolumeAdj: nextHistory.volumeAdjNext,
    devExplain: adaptation.devExplain,
  };
}

/** Compat : rating legacy → difficulty Étape H */
export function legacyRatingToDifficulty(rating) {
  if (rating === "too_easy" || rating === "easy") return "too_easy";
  if (rating === "too_hard") return "too_hard";
  if (rating === "hard") return "hard";
  if (rating === "good" || rating === "ok") return "good";
  return "good";
}
