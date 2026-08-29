/**
 * QualityToDevelop, qualité limitante à travailler.
 * Ne pas inventer un diagnostic précis sans données → qualité prudente + low confidence.
 */

import { computeRaceGap, countKnownSplits, pacePer100FromEvidence } from "./race-gap.js";
import { formatRaceTime, resolveRaceTarget } from "./race-target.js";

export const QUALITY_TO_DEVELOP_IDS = Object.freeze([
  "aerobic_capacity",
  "threshold",
  "speed",
  "race_pace",
  "technical_efficiency",
  "pacing",
  "specific_endurance",
  "specific_speed",
]);

/**
 * @typedef {'high'|'medium'|'low'} QualityConfidence
 * @typedef {object} QualityToDevelop
 * @property {string} quality
 * @property {QualityConfidence} confidence
 * @property {string} reason
 * @property {object[]} evidence
 */

/**
 * Bundle d'analyse course pour rôles / debug.
 * @typedef {object} RaceWeekAnalysis
 * @property {import('./race-target.js').RaceTarget|null} target
 * @property {object} gap
 * @property {QualityToDevelop|null} qualityToDevelop
 * @property {string} devExplain
 * @property {boolean} active, true si usable pour influencer les rôles
 */

/**
 * Résout qualité à développer.
 * @param {import('./race-target.js').RaceTarget|null} target
 * @param {object} gap, résultat computeRaceGap
 * @param {object} [evidence]
 * @returns {QualityToDevelop|null}
 */
export function resolveQualityToDevelop(target, gap, evidence = {}) {
  if (!target || !gap || gap.status === "insufficient_data") {
    return null;
  }

  const evidenceList = [];
  evidenceList.push({
    type: "gap",
    gapSec: gap.gapSec,
    gapPct: gap.gapPct,
    direction: gap.direction,
  });

  const splitCount = countKnownSplits(evidence);
  const pace50 = pacePer100FromEvidence(evidence, 50);
  const pace100 = pacePer100FromEvidence(evidence, 100) || (Number(evidence.pace100) > 0 ? Number(evidence.pace100) : null);
  const pace200 = pacePer100FromEvidence(evidence, 200);
  const pace400 = pacePer100FromEvidence(evidence, 400);
  const targetPace = gap.evidence?.targetPacePer100;

  // --- Niveau 2 : multi-chronos (différencier vitesse / endurance) ---
  if (splitCount >= 2 && targetPace) {
    let shortPace;
    let longPace;
    if (target.distance <= 100) {
      shortPace = pace50;
      longPace = pace100 || gap.evidence?.currentPacePer100 || null;
    } else {
      shortPace = pace50 || pace100;
      longPace = pace400 || pace200 || gap.evidence?.currentPacePer100 || null;
    }

    if (shortPace && longPace) {
      const shortDelta = (shortPace - targetPace) / targetPace;
      const longDelta = (longPace - targetPace) / targetPace;
      evidenceList.push({ type: "split_paces", shortPace, longPace, shortDelta, longDelta, targetPace });

      // Court proche de la cible, long nettement derrière → endurance spécifique
      if (target.distance >= 200 && shortDelta <= 0.03 && longDelta >= 0.05) {
        return {
          quality: "specific_endurance",
          confidence: "high",
          reason: `short pace near target (${shortDelta >= 0 ? "+" : ""}${(shortDelta * 100).toFixed(1)}%) but longer pace lags (+${(longDelta * 100).toFixed(1)}%)`,
          evidence: evidenceList,
        };
      }
      // Court déjà loin → déficit vitesse
      if (shortDelta >= 0.05 && longDelta <= shortDelta + 0.02) {
        return {
          quality: "specific_speed",
          confidence: "high",
          reason: `short-distance pace lags target by +${(shortDelta * 100).toFixed(1)}% (speed limiter)`,
          evidence: evidenceList,
        };
      }
      // Écart homogène → seuil / race pace
      if (Math.abs(shortDelta - longDelta) < 0.025 && gap.gapPct >= 0.03) {
        return {
          quality: gap.gapPct >= 0.07 ? "threshold" : "race_pace",
          confidence: "medium",
          reason: `homogeneous pace deficit across distances (~${(gap.gapPct * 100).toFixed(1)}%)`,
          evidence: evidenceList,
        };
      }
    }
  }

  // --- Niveau 3 : T100 / CSS ---
  if (pace100 && targetPace) {
    const t100Delta = (pace100 - targetPace) / targetPace;
    evidenceList.push({ type: "t100", pace100, targetPace, t100Delta });
    if (target.distance <= 100 && t100Delta >= 0.04) {
      return {
        quality: "specific_speed",
        confidence: "medium",
        reason: `T100 ${pace100.toFixed(1)}s/100 vs target pace ${targetPace.toFixed(1)}s/100`,
        evidence: evidenceList,
      };
    }
    if (target.distance >= 200 && t100Delta <= 0.02 && gap.gapPct >= 0.04) {
      return {
        quality: "specific_endurance",
        confidence: "medium",
        reason: `T100 OK vs target pace but race gap +${gap.gapSec}s suggests sustaining issue`,
        evidence: evidenceList,
      };
    }
  }

  // --- Niveau 4 : feedback (si fourni) ---
  const fb = evidence.feedbackHints || evidence.feedback || {};
  if (fb.hardSessions >= 2 && gap.direction === "behind") {
    evidenceList.push({ type: "feedback", hardSessions: fb.hardSessions });
    return {
      quality: "aerobic_capacity",
      confidence: "medium",
      reason: "recent hard feedback + still behind target → build aerobic base first",
      evidence: evidenceList,
    };
  }
  if (fb.pacingIssues) {
    return {
      quality: "pacing",
      confidence: "medium",
      reason: "feedback indicates pacing issues",
      evidence: evidenceList,
    };
  }

  // --- Niveau 1 : chrono cible + meilleur récent uniquement ---
  // Prior faible selon distance, confidence low/medium, jamais affirmée sans multi-data
  if (gap.direction === "ahead" || gap.direction === "on_track") {
    return {
      quality: "race_pace",
      confidence: "low",
      reason: `gap ${gap.gapSec}s - maintain race-pace sharpness (limited evidence)`,
      evidence: evidenceList,
    };
  }

  if (target.distance <= 100) {
    if (gap.gapPct >= 0.06) {
      return {
        quality: "specific_speed",
        confidence: "low",
        reason: `only target+current on ${target.distance}m (gap +${gap.gapSec}s) - weak prior for speed; need more splits to confirm`,
        evidence: evidenceList,
      };
    }
    return {
      quality: "race_pace",
      confidence: "low",
      reason: `small/medium gap on ${target.distance}m without split profile - race_pace prior`,
      evidence: evidenceList,
    };
  }

  if (target.distance >= 200) {
    if (gap.gapPct >= 0.04) {
      return {
        quality: "specific_endurance",
        confidence: "low",
        reason: `only target+current on ${target.distance}m (gap +${gap.gapSec}s) - weak prior for specific endurance`,
        evidence: evidenceList,
      };
    }
    return {
      quality: "threshold",
      confidence: "low",
      reason: `modest gap on ${target.distance}m without split profile - threshold prior`,
      evidence: evidenceList,
    };
  }

  // Prudent par défaut
  return {
    quality: "aerobic_capacity",
    confidence: "low",
    reason: "insufficient limiting-factor evidence - prudent aerobic_capacity",
    evidence: evidenceList,
  };
}

/**
 * Analyse complète pour une semaine course.
 * @param {object} profileOrCtx, profil ou ctx roles
 * @param {object} [extraEvidence]
 * @returns {RaceWeekAnalysis}
 */
export function analyzeRaceWeek(profileOrCtx = {}, extraEvidence = {}) {
  const target = resolveRaceTarget(profileOrCtx, profileOrCtx);
  const evidence = {
    currentTimeSec: profileOrCtx.currentTimeSec ?? extraEvidence.currentTimeSec,
    currentSource: profileOrCtx.currentSource ?? extraEvidence.currentSource,
    recentBest: profileOrCtx.recentBest || profileOrCtx.recentBests || extraEvidence.recentBest,
    recentBests: profileOrCtx.recentBests || extraEvidence.recentBests,
    splits: profileOrCtx.splits || extraEvidence.splits,
    pace100: profileOrCtx.pace100 ?? extraEvidence.pace100,
    allowT100Projection: !!(profileOrCtx.allowT100Projection || extraEvidence.allowT100Projection),
    feedbackHints: profileOrCtx.feedbackHints || extraEvidence.feedbackHints,
    feedback: profileOrCtx.feedback || extraEvidence.feedback,
  };

  const gap = computeRaceGap(target, evidence);
  const qualityToDevelop = resolveQualityToDevelop(target, gap, evidence);
  const active = !!(target && gap.status === "ok" && qualityToDevelop);

  const devExplain = formatRaceDevExplain({ target, gap, qualityToDevelop });

  return { target, gap, qualityToDevelop, devExplain, active };
}

export function formatRaceDevExplain({ target, gap, qualityToDevelop }) {
  const lines = [];
  if (!target) {
    lines.push("Race target: none");
    lines.push("Status: insufficient_data - using default Sportif course_piscine roles");
    return lines.join("\n");
  }
  lines.push(
    `Race target: ${target.distance}m ${target.stroke} = ${formatRaceTime(target.targetTimeSec)} (source=${target.source})`,
  );
  if (gap.status === "insufficient_data") {
    lines.push(`Current best: unknown (${gap.reason})`);
    lines.push("Status: insufficient_data - using default Sportif course_piscine roles");
    return lines.join("\n");
  }
  lines.push(`Current best: ${formatRaceTime(gap.currentTimeSec)}`);
  lines.push(`Gap: ${gap.gapSec >= 0 ? "+" : ""}${gap.gapSec}s (${(gap.gapPct * 100).toFixed(1)}%, ${gap.direction}, conf=${gap.confidence})`);
  if (qualityToDevelop) {
    lines.push(`Quality: ${qualityToDevelop.quality}`);
    lines.push(`Confidence: ${qualityToDevelop.confidence}`);
    lines.push(`Reason: ${qualityToDevelop.reason}`);
  }
  return lines.join("\n");
}
