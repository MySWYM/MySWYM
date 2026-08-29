/**
 * RaceGap, écart entre performance actuelle et RaceTarget.
 * Peut être insufficient_data : ne jamais inventer un chrono courant.
 */

import { formatRaceTime, raceTargetPacePer100 } from "./race-target.js";

/** @typedef {'ahead'|'on_track'|'behind'} GapDirection */
/** @typedef {'high'|'medium'|'low'} GapConfidence */

/**
 * @typedef {object} RaceGapOk
 * @property {'ok'} status
 * @property {number} targetTimeSec
 * @property {number} currentTimeSec
 * @property {number} gapSec, current − target (positif = derrière)
 * @property {number} gapPct, gapSec / targetTimeSec
 * @property {GapDirection} direction
 * @property {GapConfidence} confidence
 * @property {object} [evidence]
 */

/**
 * @typedef {object} RaceGapInsufficient
 * @property {'insufficient_data'} status
 * @property {string} reason
 * @property {number|null} [targetTimeSec]
 */

/**
 * Extrait le chrono actuel pour la distance cible.
 * Sources (ordre) :
 * 1. evidence.currentTimeSec
 * 2. evidence.recentBest[distance]
 * 3. evidence.splits[distance]
 * 4. projection T100 seulement si opts.allowT100Projection (défaut false, prudent)
 *
 * @param {import('./race-target.js').RaceTarget} target
 * @param {object} evidence
 * @returns {{ timeSec: number, source: string, confidence: GapConfidence }|null}
 */
export function resolveCurrentRaceTime(target, evidence = {}) {
  if (!target) return null;

  if (Number.isFinite(Number(evidence.currentTimeSec)) && Number(evidence.currentTimeSec) > 0) {
    return {
      timeSec: Number(evidence.currentTimeSec),
      source: evidence.currentSource || "current",
      confidence: evidence.currentConfidence || "high",
    };
  }

  const dist = target.distance;
  const bestMap = evidence.recentBest || evidence.recentBests || evidence.bests || {};
  if (Number.isFinite(Number(bestMap[dist])) && Number(bestMap[dist]) > 0) {
    return {
      timeSec: Number(bestMap[dist]),
      source: "recent_best",
      confidence: "high",
    };
  }
  // Clés string
  if (Number.isFinite(Number(bestMap[String(dist)])) && Number(bestMap[String(dist)]) > 0) {
    return {
      timeSec: Number(bestMap[String(dist)]),
      source: "recent_best",
      confidence: "high",
    };
  }

  const splits = evidence.splits || {};
  if (Number.isFinite(Number(splits[dist])) && Number(splits[dist]) > 0) {
    return {
      timeSec: Number(splits[dist]),
      source: "split",
      confidence: "medium",
    };
  }
  if (Number.isFinite(Number(splits[String(dist)])) && Number(splits[String(dist)]) > 0) {
    return {
      timeSec: Number(splits[String(dist)]),
      source: "split",
      confidence: "medium",
    };
  }

  // Projection T100 optionnelle (jamais par défaut)
  if (evidence.allowT100Projection && Number(evidence.pace100) > 0) {
    const projected = (Number(evidence.pace100) / 100) * dist;
    // Facteur fatigue très prudent selon distance
    const fatigue = dist <= 100 ? 1.0 : dist <= 200 ? 1.06 : dist <= 400 ? 1.12 : 1.18;
    return {
      timeSec: Math.round(projected * fatigue * 10) / 10,
      source: "t100_projection",
      confidence: "low",
    };
  }

  return null;
}

/**
 * @param {import('./race-target.js').RaceTarget|null} target
 * @param {object} [evidence]
 * @returns {RaceGapOk|RaceGapInsufficient}
 */
export function computeRaceGap(target, evidence = {}) {
  if (!target) {
    return { status: "insufficient_data", reason: "no_race_target", targetTimeSec: null };
  }

  const current = resolveCurrentRaceTime(target, evidence);
  if (!current) {
    return {
      status: "insufficient_data",
      reason: "no_current_time",
      targetTimeSec: target.targetTimeSec,
    };
  }

  const gapSec = Math.round((current.timeSec - target.targetTimeSec) * 10) / 10;
  const gapPct = target.targetTimeSec > 0 ? gapSec / target.targetTimeSec : 0;
  let direction = "on_track";
  if (gapSec > 1.5) direction = "behind";
  else if (gapSec < -1.5) direction = "ahead";

  /** @type {GapConfidence} */
  let confidence = current.confidence || "medium";
  // Multi-chronos disponibles → confiance gap un cran mieux si recent_best
  const splitCount = countKnownSplits(evidence);
  if (splitCount >= 2 && confidence === "medium") confidence = "high";
  if (current.source === "t100_projection") confidence = "low";

  return {
    status: "ok",
    targetTimeSec: target.targetTimeSec,
    currentTimeSec: current.timeSec,
    gapSec,
    gapPct: Math.round(gapPct * 1000) / 1000,
    direction,
    confidence,
    evidence: {
      currentSource: current.source,
      targetPacePer100: raceTargetPacePer100(target),
      currentPacePer100: (current.timeSec / target.distance) * 100,
      splitCount,
      label: `${formatRaceTime(current.timeSec)} vs ${formatRaceTime(target.targetTimeSec)} (${gapSec >= 0 ? "+" : ""}${gapSec}s)`,
    },
  };
}

export function countKnownSplits(evidence = {}) {
  const maps = [evidence.splits, evidence.recentBest, evidence.recentBests, evidence.bests];
  const dists = [50, 100, 200, 400];
  let n = 0;
  for (const m of maps) {
    if (!m || typeof m !== "object") continue;
    for (const d of dists) {
      if (Number(m[d]) > 0 || Number(m[String(d)]) > 0) n += 1;
    }
  }
  // Dedupe roughly: unique distances with any source
  const seen = new Set();
  for (const m of maps) {
    if (!m) continue;
    for (const d of dists) {
      if (Number(m[d]) > 0 || Number(m[String(d)]) > 0) seen.add(d);
    }
  }
  return seen.size;
}

/**
 * Pace (sec/100) pour une distance donnée depuis evidence.
 */
export function pacePer100FromEvidence(evidence, distance) {
  const maps = [evidence.splits, evidence.recentBest, evidence.recentBests, evidence.bests];
  for (const m of maps) {
    if (!m) continue;
    const t = Number(m[distance] ?? m[String(distance)]);
    if (t > 0) return (t / distance) * 100;
  }
  if (distance === 100 && Number(evidence.pace100) > 0) return Number(evidence.pace100);
  return null;
}
