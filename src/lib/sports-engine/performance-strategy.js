/**
 * PerformanceStrategy — ce que le plan développe maintenant
 * (phase + capacité + échéance + diagnostic Race).
 *
 * Distinct de QualityToDevelop (= ce qui limite probablement).
 * Réutilise analyzeRaceWeek / RaceTarget / RaceGap — pas de 2e diagnostic.
 */

import { analyzeRaceWeek } from "./race-quality.js";
import { resolveRaceTarget, formatRaceTime } from "./race-target.js";
import { resolveTaperLoad } from "./taper-load.js";

/** @typedef {'high'|'medium'|'low'} StrategyConfidence */
/** @typedef {'high'|'medium'|'low'|'reduce'} StrategyPriority */

/**
 * @typedef {object} PerformanceStrategy
 * @property {string} phase
 * @property {string} primaryQuality
 * @property {string|null} secondaryQuality
 * @property {StrategyConfidence} confidence
 * @property {string} rationale
 * @property {StrategyPriority} priority
 * @property {string} [horizonBand]
 * @property {number|null} [weeksToComp]
 * @property {string|null} [limitingStroke]
 * @property {object|null} [raceAnalysis]
 * @property {string} [devExplain]
 */

export const PERFORMANCE_QUALITY_IDS = Object.freeze([
  "aerobic_capacity",
  "threshold",
  "speed",
  "specific_speed",
  "specific_endurance",
  "race_pace",
  "pacing",
  "technical_efficiency",
  "economy",
  "sighting",
  "open_water_specificity",
  "speed_change",
  "weak_stroke",
]);

/**
 * Semaines jusqu'à la compétition (null si pas de date).
 */
export function weeksToCompetition(competitionDate, now = new Date()) {
  if (!competitionDate) return null;
  const d = competitionDate instanceof Date ? competitionDate : new Date(competitionDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - now.getTime();
  return Math.round(ms / (7 * 24 * 3600 * 1000));
}

/**
 * Bande d'échéance.
 * `pre_race` (<2 semaines) déclenche le taper réel (Étape G) via `resolveTaperLoad`.
 * @returns {'far'|'build_specific'|'specific_dominant'|'pre_race'|null}
 */
export function horizonBandFromWeeks(weeks) {
  if (weeks == null || !Number.isFinite(weeks)) return null;
  if (weeks > 8) return "far";
  if (weeks >= 4) return "build_specific";
  if (weeks >= 2) return "specific_dominant";
  return "pre_race";
}

/**
 * Qualités candidates selon distance course.
 */
export function qualitiesForRaceDistance(distance) {
  const d = Number(distance) || 0;
  if (d > 0 && d <= 100) {
    return ["speed", "specific_speed", "threshold", "race_pace", "technical_efficiency", "pacing"];
  }
  if (d <= 200) {
    return ["threshold", "specific_endurance", "race_pace", "specific_speed", "pacing", "technical_efficiency"];
  }
  if (d <= 400) {
    return ["aerobic_capacity", "threshold", "specific_endurance", "race_pace", "pacing", "technical_efficiency"];
  }
  // 800 / 1500+
  return ["aerobic_capacity", "threshold", "specific_endurance", "race_pace", "pacing", "technical_efficiency"];
}

/**
 * Qualités candidates selon objectif.
 */
export function qualitiesForObjectif(objectifV1) {
  switch (objectifV1) {
    case "eau_libre":
      return [
        "aerobic_capacity",
        "specific_endurance",
        "race_pace",
        "pacing",
        "technical_efficiency",
        "sighting",
        "open_water_specificity",
        "speed_change",
      ];
    case "triathlon":
      return ["aerobic_capacity", "specific_endurance", "race_pace", "technical_efficiency", "economy", "pacing"];
    case "course_piscine":
      return null; // selon distance
    default:
      return ["aerobic_capacity", "threshold", "technical_efficiency", "race_pace"];
  }
}

function clampQualityToAllowed(quality, allowed) {
  if (!allowed?.length) return quality;
  if (allowed.includes(quality)) return quality;
  // Fallbacks
  if ((quality === "speed" || quality === "specific_speed") && allowed.includes("threshold")) return "threshold";
  if (quality === "specific_endurance" && allowed.includes("threshold")) return "threshold";
  if (allowed.includes("aerobic_capacity")) return "aerobic_capacity";
  return allowed[0];
}

function secondaryFor(primary, phase, horizon, objectif) {
  if (primary === "aerobic_capacity") return "technical_efficiency";
  if (primary === "threshold" || primary === "specific_endurance") return "aerobic_capacity";
  if (primary === "speed" || primary === "specific_speed") return "race_pace";
  if (primary === "race_pace" || primary === "pacing") return "aerobic_capacity";
  if (primary === "sighting" || primary === "open_water_specificity") return "aerobic_capacity";
  if (primary === "economy") return "aerobic_capacity";
  if (primary === "weak_stroke") return "threshold";
  if (primary === "technical_efficiency") return phase === "base" ? "aerobic_capacity" : "race_pace";
  if (objectif === "eau_libre") return "sighting";
  if (horizon === "far") return "aerobic_capacity";
  return "aerobic_capacity";
}

/**
 * Résout PerformanceStrategy.
 * @param {object} ctx
 * @returns {PerformanceStrategy}
 */
export function resolvePerformanceStrategy(ctx = {}) {
  const asOf = ctx.asOf || ctx.weekStart || ctx.now || new Date();
  const taperLoad = resolveTaperLoad(ctx, asOf);
  const phase = taperLoad.taperStage ? taperLoad.phase : ctx.effectivePhase || ctx.phase || "development";
  const objectif = ctx.objectifV1 || "nager_progresser";
  const capacity = ctx.capacity || null;
  const capScore = Number(capacity?.score);
  const capacityLow =
    capacity?.conservative === true || (Number.isFinite(capScore) && capScore < 0.55);

  const target = resolveRaceTarget(ctx, ctx);
  const weeks = taperLoad.weeksToComp ?? weeksToCompetition(target?.competitionDate || ctx.competitionDate, asOf);
  const horizon = taperLoad.horizonBand ?? horizonBandFromWeeks(weeks);

  const raceAnalysis = analyzeRaceWeek(
    {
      raceTarget: target || ctx.raceTarget,
      currentTimeSec: ctx.currentTimeSec,
      recentBest: ctx.recentBest || ctx.recentBests,
      recentBests: ctx.recentBests,
      splits: ctx.splits,
      pace100: ctx.pace100,
      allowT100Projection: ctx.allowT100Projection,
      feedbackHints: ctx.feedbackHints,
      validatedTestAsTarget: ctx.validatedTestAsTarget,
    },
    ctx.raceEvidence || {},
  );

  const limitingStroke = ctx.limitingStroke || ctx.weakStroke || null;
  const distance = target?.distance || Number(ctx.raceDistance) || null;

  let allowed = qualitiesForObjectif(objectif);
  if (objectif === "course_piscine" || (!allowed && distance)) {
    allowed = qualitiesForRaceDistance(distance || 200);
  }
  // Longues distances : exclure speed/Z4-like
  if (distance >= 400) {
    allowed = allowed.filter((q) => !["speed", "specific_speed", "speed_change"].includes(q));
  }

  /** @type {string} */
  let primary;
  /** @type {StrategyConfidence} */
  let confidence;
  let rationale;

  // Forçage tests / coach
  if (ctx.primaryQuality && PERFORMANCE_QUALITY_IDS.includes(ctx.primaryQuality)) {
    primary = ctx.primaryQuality;
    confidence = ctx.strategyConfidence || "high";
    rationale = ctx.strategyReason || `forced primaryQuality=${primary}`;
  } else if (limitingStroke && (ctx.strokeFocus === "4n" || target?.stroke === "4n")) {
    primary = "weak_stroke";
    confidence = "medium";
    rationale = `limiting stroke flagged: ${limitingStroke}`;
  } else if (raceAnalysis.active && raceAnalysis.qualityToDevelop) {
    const q = raceAnalysis.qualityToDevelop;
    primary = clampQualityToAllowed(q.quality, allowed);
    confidence = q.confidence;
    rationale = `from QualityToDevelop=${q.quality} → strategy primary=${primary} (${q.reason})`;

    // Gros gap + faible capacité → développement progressif (pas plus d'intensité)
    const gap = raceAnalysis.gap;
    if (gap?.status === "ok" && gap.gapPct >= 0.1 && capacityLow) {
      primary = clampQualityToAllowed("aerobic_capacity", allowed);
      confidence = "medium";
      rationale = `large gap +${gap.gapSec}s but low capacity → progressive aerobic (not more intensity)`;
    } else if (gap?.status === "ok" && gap.gapPct >= 0.1 && !capacityLow && distance && distance <= 200) {
      // bonne capacité → plus spécifique
      if (primary === "aerobic_capacity") {
        primary = clampQualityToAllowed(distance <= 100 ? "specific_speed" : "specific_endurance", allowed);
        rationale += `; large gap + good capacity → lean specific`;
      }
    }
  } else {
    // insufficient_data ou pas de cible — stratégie prudente selon phase / objectif / horizon
    confidence = "low";
    if (objectif === "eau_libre") {
      primary = horizon === "specific_dominant" || horizon === "pre_race" ? "open_water_specificity" : "aerobic_capacity";
      rationale = "no race chrono — prudent OW strategy from phase/horizon";
    } else if (objectif === "triathlon") {
      primary = horizon === "far" || phase === "base" ? "aerobic_capacity" : "economy";
      rationale = "no race chrono — prudent triathlon swim economy/aerobic";
    } else if (distance && distance >= 400) {
      primary = "aerobic_capacity";
      rationale = "no current time — long-distance prudent aerobic_capacity";
    } else if (distance && distance <= 100) {
      primary = phase === "peak" || horizon === "specific_dominant" ? "race_pace" : "technical_efficiency";
      rationale = "no current time — short-distance prudent (no invented paces)";
    } else {
      primary = "aerobic_capacity";
      rationale = "insufficient_data — prudent aerobic_capacity";
    }
  }

  // Horizon ajuste (sans taper complet)
  if (horizon === "far" && ["speed", "specific_speed"].includes(primary) && confidence !== "high") {
    primary = clampQualityToAllowed("threshold", allowed);
    rationale += `; horizon>8w softens speed→threshold`;
  }
  if (horizon === "build_specific" && primary === "aerobic_capacity") {
    const bump = clampQualityToAllowed(
      distance && distance <= 100 ? "race_pace" : "threshold",
      allowed,
    );
    if (bump !== primary) {
      rationale += `; horizon 4–8w adds specificity ${primary}→${bump}`;
      primary = bump;
    }
  }
  if (horizon === "specific_dominant" && !taperLoad.taperStage) {
    if (primary === "aerobic_capacity") {
      primary = clampQualityToAllowed("race_pace", allowed);
      rationale += `; horizon 2–4w → race_pace dominant`;
    }
  }

  // Taper réel (Étape G) : entretenir race pace, ne pas reconstruire
  if (taperLoad.taperStage) {
    if (taperLoad.taperStage === "s3") {
      primary = clampQualityToAllowed(
        distance && distance <= 100 ? "race_pace" : primary === "specific_speed" ? "race_pace" : "threshold",
        allowed,
      );
      if (["speed", "specific_speed", "weak_stroke"].includes(primary)) {
        primary = clampQualityToAllowed("race_pace", allowed);
      }
      rationale += `; taper S-3 — spécifique sans surcharge (${taperLoad.rationale})`;
    } else if (taperLoad.taperStage === "s2") {
      primary = clampQualityToAllowed("race_pace", allowed);
      rationale += `; taper S-2 — volume↓ touches race pace (${taperLoad.rationale})`;
    } else if (taperLoad.taperStage === "s1" || taperLoad.taperStage === "race_week") {
      primary = clampQualityToAllowed("race_pace", allowed);
      rationale += `; taper ${taperLoad.taperStage} — volume↓↓ intensité courte (${taperLoad.rationale})`;
    } else if (taperLoad.taperStage === "race_day") {
      primary = "race_pace";
      rationale += `; RACE DAY — pas d'entraînement volume`;
    }
    // Ne pas « corriger » une nage faible en dernière semaine
    if (limitingStroke && ["s1", "race_week", "race_day"].includes(taperLoad.taperStage)) {
      rationale += `; weak_stroke=${limitingStroke} entretenu seulement (pas de reconstruit)`;
    }
  } else if (horizon === "pre_race") {
    primary = clampQualityToAllowed("race_pace", allowed);
    rationale += `; horizon <2w → race_pace (taper load pending date precision)`;
  }

  // Phase sécurité (si phase explicite sans date)
  if (!taperLoad.taperStage && (phase === "taper" || phase === "competition" || phase === "race")) {
    primary = clampQualityToAllowed("race_pace", allowed);
    rationale += `; phase=${phase} keeps race_pace`;
  }
  if (phase === "test") {
    primary = "race_pace";
    rationale = `phase=test — measure, not overload (${rationale})`;
  }

  // Capacité bloque speed (hors taper court où on force déjà race_pace)
  if (capacityLow && ["speed", "specific_speed", "speed_change"].includes(primary)) {
    primary = clampQualityToAllowed("threshold", allowed);
    rationale += `; capacity blocks speed→threshold`;
  }

  const secondary =
    ctx.secondaryQuality && ctx.secondaryQuality !== primary
      ? ctx.secondaryQuality
      : taperLoad.taperStage
        ? secondaryFor(primary, phase, horizon, objectif) === primary
          ? "aerobic_capacity"
          : "technical_efficiency"
        : secondaryFor(primary, phase, horizon, objectif);

  /** @type {StrategyPriority} */
  let priority = "medium";
  if (taperLoad.taperStage || horizon === "pre_race") priority = "reduce";
  else if (raceAnalysis.active && raceAnalysis.gap?.status === "ok" && Math.abs(raceAnalysis.gap.gapPct) >= 0.08) {
    priority = capacityLow ? "medium" : "high";
  } else if (confidence === "high") priority = "high";
  else if (confidence === "low") priority = "low";

  const strategy = {
    phase,
    primaryQuality: primary,
    secondaryQuality: secondary === primary ? null : secondary,
    confidence,
    rationale,
    priority,
    horizonBand: horizon,
    weeksToComp: weeks,
    daysToComp: taperLoad.daysToComp,
    taperStage: taperLoad.taperStage,
    taperLoad,
    limitingStroke: limitingStroke || null,
    raceAnalysis,
  };

  strategy.devExplain = formatPerformanceStrategyExplain(strategy, target, raceAnalysis);
  return strategy;
}

export function formatPerformanceStrategyExplain(strategy, target, raceAnalysis) {
  const lines = [];
  lines.push(`PerformanceStrategy phase=${strategy.phase}`);
  if (target) {
    lines.push(
      `Race target: ${target.distance}m ${target.stroke} = ${formatRaceTime(target.targetTimeSec)}`,
    );
  } else {
    lines.push("Race target: none / incomplete");
  }
  if (raceAnalysis?.gap?.status === "ok") {
    lines.push(
      `Gap: ${raceAnalysis.gap.gapSec >= 0 ? "+" : ""}${raceAnalysis.gap.gapSec}s (${(raceAnalysis.gap.gapPct * 100).toFixed(1)}%)`,
    );
    if (raceAnalysis.qualityToDevelop) {
      lines.push(
        `QualityToDevelop: ${raceAnalysis.qualityToDevelop.quality} (${raceAnalysis.qualityToDevelop.confidence})`,
      );
    }
  } else {
    lines.push(`RaceGap: ${raceAnalysis?.gap?.status || "n/a"} — no invented diagnosis`);
  }
  lines.push(`Primary: ${strategy.primaryQuality}`);
  lines.push(`Secondary: ${strategy.secondaryQuality || "—"}`);
  lines.push(`Confidence: ${strategy.confidence} · Priority: ${strategy.priority}`);
  if (strategy.horizonBand) {
    lines.push(`Horizon: ${strategy.horizonBand} (${strategy.weeksToComp ?? "?"}w)`);
  }
  if (strategy.taperStage) {
    lines.push(`Taper: ${strategy.taperStage} · daysToComp=${strategy.daysToComp ?? "—"}`);
    if (strategy.taperLoad) {
      lines.push(
        `Load: vol×${strategy.taperLoad.volumeFactor} dens×${strategy.taperLoad.densityFactor} int×${strategy.taperLoad.intensityRetention} recup×${strategy.taperLoad.recoveryFactor}`,
      );
    }
  }
  if (strategy.limitingStroke) lines.push(`Limiting stroke: ${strategy.limitingStroke}`);
  lines.push(`Rationale: ${strategy.rationale}`);
  return lines.join("\n");
}
