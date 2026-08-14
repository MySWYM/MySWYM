/**
 * Hard constraints pour le composeur (Étape J2).
 * Dérivées de taperLoad / pain / niveau — PAS un second moteur de taper.
 */

import { fourNagesCorpsShare } from "./session-specificity.js";
import { isFourNagesDeclared } from "./four-nages-mix.js";
import { maxContinuousForDecouverte } from "./decouverte-intents.js";
import { maxContinuousForRegulier } from "./regulier-intents.js";
import { maxContinuousForSportif } from "./sportif-intents.js";

export const FORBIDDEN_PAIN_INTENTS = Object.freeze([
  "threshold",
  "seuil",
  "speed",
  "vitesse",
  "vo2",
  "race_pace",
  "hard_specific",
  "allure_specifique",
  "course_piscine",
  "test",
]);

/**
 * Contraintes taper dérivées du taperLoad existant.
 * @returns {object|null}
 */
export function taperConstraintsFromLoad(taperLoad, ctx = {}) {
  if (!taperLoad?.taperStage || taperLoad.taperStage === "post_race") return null;
  const stage = taperLoad.taperStage;
  if (stage === "race_day") {
    return {
      taperStage: stage,
      maxVolume: 0,
      maxContinuous: 0,
      maxHardMeters: 0,
      maxZ3Meters: 0,
      maxZ4Meters: 0,
      maxHardBlocks: 0,
      minRecovery: 0,
      allowRacePaceTouch: false,
      maxRacePaceMeters: 0,
      forbidNewStimulus: true,
      forbidLongProgressive: true,
      forbidThresholdBlock: true,
    };
  }

  const vf = Number(taperLoad.volumeFactor) || 1;
  const ir = Number(taperLoad.intensityRetention) || 1;
  const df = Number(taperLoad.densityFactor) || 1;
  const sr = Number(taperLoad.specificityRetention) || 1;
  const rf = Number(taperLoad.recoveryFactor) || 1;
  const days = taperLoad.daysToComp;
  const raceDist = Number(ctx.raceDistance || ctx.raceTarget?.distance) || 200;
  const volumeTarget = Number(ctx.volumeTarget) || 0;

  // Plafonds absolus sportifs par stage (safety) — facteurs taperLoad affinent
  let absCap;
  if (stage === "race_week") {
    if (days != null && days <= 1) absCap = 500;
    else if (days != null && days <= 2) absCap = 750;
    else if (days != null && days <= 3) absCap = 1100;
    else if (days != null && days <= 4) absCap = 1400;
    else absCap = 1600;
  } else if (stage === "s1") {
    absCap = 1800;
  } else if (stage === "s2") {
    absCap = 2200;
  } else {
    // s3 : pas de plafond dur hors cible
    absCap = volumeTarget > 0 ? Math.round(volumeTarget * 1.12) : 3200;
  }

  // Cible déjà taperée en orchestration → on borne aussi à la cible / plafond stage
  let maxVolume = absCap;
  if (volumeTarget > 0) {
    maxVolume = Math.min(absCap, Math.round(volumeTarget * 1.08));
  }

  const hardBudget = Math.round(maxVolume * ir * df * 0.45);
  let maxZ3Meters;
  let maxZ4Meters;
  if (stage === "race_week") {
    // Touches courtes autorisées (ex. 4×50) — pas de gros seuil
    maxZ3Meters = Math.min(150, Math.max(100, Math.round(hardBudget * 0.5)));
    maxZ4Meters = Math.min(50, Math.round(maxZ3Meters * 0.2));
  } else if (stage === "s1") {
    maxZ3Meters = Math.min(250, Math.max(150, Math.round(hardBudget * 0.7)));
    maxZ4Meters = Math.min(80, Math.round(maxZ3Meters * 0.3));
  } else if (stage === "s2") {
    maxZ3Meters = Math.min(450, Math.max(200, hardBudget));
    maxZ4Meters = Math.min(150, Math.round(maxZ3Meters * 0.35));
  } else {
    maxZ3Meters = Math.min(900, Math.round(maxVolume * ir * 0.45));
    maxZ4Meters = Math.min(400, Math.round(maxZ3Meters * 0.5));
  }

  const allowRacePaceTouch = sr >= 0.55 && stage !== "race_day";
  let maxRacePaceMeters = 0;
  if (allowRacePaceTouch) {
    if (stage === "race_week") {
      maxRacePaceMeters = Math.min(200, Math.max(150, Math.round(raceDist <= 200 ? Math.min(200, raceDist) : raceDist * 0.25)));
    } else if (stage === "s1") {
      maxRacePaceMeters = Math.min(300, Math.round(raceDist * (raceDist <= 200 ? 1.5 : 0.5)));
    } else if (stage === "s2") {
      maxRacePaceMeters = Math.min(400, Math.round(raceDist * 2));
    } else {
      maxRacePaceMeters = Math.min(500, Math.round(maxZ3Meters * 0.6));
    }
    maxRacePaceMeters = Math.min(maxRacePaceMeters, maxZ3Meters);
  }

  return {
    taperStage: stage,
    daysToComp: days,
    maxVolume,
    maxContinuous: stage === "race_week" ? 150 : stage === "s1" ? 200 : stage === "s2" ? 300 : 400,
    maxHardMeters: maxZ3Meters + maxZ4Meters,
    maxZ3Meters,
    maxZ4Meters,
    maxHardBlocks: stage === "race_week" || stage === "s1" ? 1 : 2,
    minRecovery: Math.round(20 * rf),
    allowRacePaceTouch,
    maxRacePaceMeters,
    forbidNewStimulus: stage === "race_week" || stage === "s1",
    forbidLongProgressive: stage === "race_week" || stage === "s1" || stage === "s2",
    forbidThresholdBlock: stage === "race_week" || stage === "s1" || (stage === "s2" && ir < 0.7),
    forbidPyramidFiller: stage === "race_week" || stage === "s1" || stage === "s2",
    forbidComplexFormats: stage === "race_week" || stage === "s1",
    maxRepsPerSet: stage === "race_week" ? 8 : stage === "s1" ? 8 : stage === "s2" ? 10 : null,
    volumeFactor: vf,
    intensityRetention: ir,
    densityFactor: df,
    specificityRetention: sr,
    recoveryFactor: rf,
  };
}

/**
 * Part minimale 4N du corps selon niveau (validation + compose).
 */
export function minFourNageBodyShare(level, specificity = "stroke_focus") {
  if (level === "decouverte") return 0.12;
  if (level === "regulier") return 0.3;
  if (level === "sportif") {
    if (specificity === "race_specific") return 0.45;
    if (specificity === "goal_specific") return 0.4;
    return 0.4;
  }
  if (level === "performance") {
    if (specificity === "race_specific") return 0.5;
    return 0.4;
  }
  return 0.3;
}

/**
 * maxReps selon niveau / format.
 */
export function maxRepsForLevel(level, { unit = 50 } = {}) {
  if (level === "decouverte") return unit <= 25 ? 12 : 10;
  if (level === "regulier") return 12;
  // sportif / performance
  if (unit >= 200) return 8;
  if (unit >= 100) return 10;
  return 12;
}

/**
 * Résout l'ensemble des hard constraints pour un SessionBrief.
 */
export function resolveHardConstraints(brief = {}) {
  const level = brief.level || "regulier";
  const pain =
    !!(brief.painProtection || brief.hasPainConstraint || brief.capacity?.painProtection) ||
    brief.maxIntensityZone === "Z2" && !!(brief.painProtection || brief.hasPainConstraint);

  const painProtection = !!(
    brief.painProtection ||
    brief.hasPainConstraint ||
    brief.capacity?.painProtection
  );

  const taperLoad = brief.taperLoad || brief.performanceStrategy?.taperLoad || null;
  const taperConstraints = taperConstraintsFromLoad(taperLoad, {
    volumeTarget: brief.volumeTarget,
    raceDistance: brief.raceTarget?.distance || brief.raceDistance,
    raceTarget: brief.raceTarget,
  });

  let maxContinuous =
    Number(brief.maxContinuousDistance) ||
    Number(brief.capacity?.maxContinuousDistance) ||
    0;
  if (!maxContinuous) {
    if (level === "decouverte") maxContinuous = maxContinuousForDecouverte(brief);
    else if (level === "regulier") maxContinuous = maxContinuousForRegulier(brief);
    else maxContinuous = maxContinuousForSportif(brief, { stroke: "crawl" });
  }
  if (taperConstraints?.maxContinuous) {
    maxContinuous = Math.min(maxContinuous, taperConstraints.maxContinuous);
  }

  const strokeFocus = brief.strokeFocus || "mixte";
  const isFourN =
    strokeFocus === "4n" ||
    isFourNagesDeclared(brief) ||
    brief.objectif === "quatre_nages" ||
    brief.sessionIntent === "quatre_nages" ||
    /4.?nages|quatre.?nages/i.test(String(brief.objectif || ""));

  const specificity = brief.sessionSpecificity || "stroke_focus";
  const fourNShareHint = isFourN
    ? Math.max(fourNagesCorpsShare(specificity, "4n"), minFourNageBodyShare(level, specificity))
    : 0;

  let maxIntensity = brief.maxIntensityZone || (level === "decouverte" ? "Z2" : "Z4");
  let maxZ3Meters = taperConstraints?.maxZ3Meters ?? null;
  let maxZ4Meters = taperConstraints?.maxZ4Meters ?? null;
  let allowRacePaceTouch = taperConstraints ? !!taperConstraints.allowRacePaceTouch : true;
  let maxRacePaceMeters = taperConstraints?.maxRacePaceMeters ?? null;

  let maxReps = maxRepsForLevel(level);
  if (taperConstraints?.maxRepsPerSet) {
    maxReps = Math.min(maxReps, taperConstraints.maxRepsPerSet);
  }
  if (painProtection) {
    maxIntensity = "Z2";
    maxZ3Meters = 0;
    maxZ4Meters = 0;
    allowRacePaceTouch = false;
    maxRacePaceMeters = 0;
    // J3 : pain agit aussi sur la forme (pas de 12×100 monotones)
    maxReps = Math.min(maxReps, 8);
  } else if (level === "decouverte") {
    maxIntensity = "Z2";
    maxZ3Meters = 0;
    maxZ4Meters = 0;
  } else if (level === "regulier") {
    maxZ4Meters = 0;
  }

  let maxVolume =
    taperConstraints?.maxVolume != null
      ? taperConstraints.maxVolume
      : brief.volumeTarget
        ? Math.round(brief.volumeTarget * 1.12)
        : null;
  if (painProtection) {
    const painCap = level === "decouverte" ? 800 : level === "regulier" ? 1400 : level === "sportif" ? 1800 : 2000;
    maxVolume = maxVolume != null ? Math.min(maxVolume, painCap) : painCap;
  }

  return {
    level,
    painProtection,
    maxIntensity,
    forbiddenIntents: painProtection ? [...FORBIDDEN_PAIN_INTENTS] : [],
    maxContinuousDistance: maxContinuous,
    maxRepsPerSet: maxReps,
    maxSamePatternReps: maxReps,
    maxVolume,
    maxZ3Meters,
    maxZ4Meters,
    maxHardMeters: taperConstraints?.maxHardMeters ?? null,
    maxHardBlocks: taperConstraints?.maxHardBlocks ?? null,
    minRecoverySec: taperConstraints?.minRecovery ?? 15,
    allowRacePaceTouch,
    maxRacePaceMeters,
    taperConstraints,
    isFourN,
    minFourNageBodyShare: fourNShareHint,
    forbidNewStimulus: !!taperConstraints?.forbidNewStimulus,
    forbidLongProgressive: !!taperConstraints?.forbidLongProgressive || painProtection,
    forbidThresholdBlock: !!taperConstraints?.forbidThresholdBlock || painProtection,
    forbidPyramidFiller: !!taperConstraints?.forbidPyramidFiller || painProtection,
    forbidComplexFormats: !!taperConstraints?.forbidComplexFormats || painProtection,
    volumeToleranceHi: 1.12,
    volumeToleranceLo: 0.55,
    requirePositiveRestUnlessContinuous: true,
    requireIntentIntensity: !painProtection && level !== "decouverte",
  };
}

/**
 * Applique les contraintes au brief avant composition (clamp volume, strip intents).
 */
export function applyConstraintsToBrief(brief, constraints, attempt = 1) {
  const c = constraints || resolveHardConstraints(brief);
  let next = { ...brief, hardConstraints: c };

  next.painProtection = !!c.painProtection;
  next.hasPainConstraint = !!c.painProtection;
  if (c.painProtection) {
    next.maxIntensityZone = "Z2";
    next.racePaceTouches = false;
    next.qualitySession = false;
    if (c.forbiddenIntents.includes(String(next.sessionIntent || ""))) {
      next.sessionIntent = "recuperation";
      next.family = "recuperation";
    }
  }

  if (c.maxContinuousDistance) {
    next.maxContinuousDistance = c.maxContinuousDistance;
  }

  let vol = Number(next.volumeTarget) || 0;
  if (c.maxVolume != null && vol > c.maxVolume) {
    vol = c.maxVolume;
  }

  // Tentatives de recomposition : réduire cible / adoucir
  if (attempt === 2) {
    vol = Math.round(vol * 0.75);
    next.racePaceTouches = c.allowRacePaceTouch ? next.racePaceTouches : false;
    next.qualitySession = c.forbidThresholdBlock ? false : next.qualitySession;
    if (c.forbidThresholdBlock && ["seuil", "allure_specifique", "vitesse", "vo2"].includes(next.sessionIntent)) {
      next.sessionIntent = c.allowRacePaceTouch ? "allure_specifique" : "aerobie";
      next.qualitySession = false;
      next._qualityGateShortTouch = !!c.allowRacePaceTouch;
    }
    next._qualityGateAttempt = 2;
  } else if (attempt >= 3) {
    vol = Math.round(Math.min(vol, c.maxVolume || vol) * 0.55);
    next.racePaceTouches = false;
    next.qualitySession = false;
    next.sessionIntent = c.painProtection || c.taperConstraints?.taperStage === "race_week" ? "recuperation" : "aerobie";
    next.family = next.sessionIntent === "recuperation" ? "recuperation" : "endurance";
    next._qualityGateAttempt = 3;
    next._qualityGateForceSafe = true;
  } else {
    next._qualityGateAttempt = 1;
  }

  if (c.taperConstraints?.forbidThresholdBlock && ["seuil"].includes(next.sessionIntent) && !next._qualityGateShortTouch) {
    if (c.allowRacePaceTouch) {
      next.sessionIntent = "allure_specifique";
      next._qualityGateShortTouch = true;
    } else {
      next.sessionIntent = "aerobie";
      next.qualitySession = false;
    }
  }

  if (c.isFourN && (!next.strokeFocus || next.strokeFocus === "mixte")) {
    next.strokeFocus = "4n";
  }
  if (c.isFourN && c.minFourNageBodyShare > 0) {
    next._minFourNageBodyShare = c.minFourNageBodyShare;
  }

  next.volumeTarget = Math.max(
    next.level === "decouverte" ? 400 : 500,
    vol,
  );

  return next;
}
