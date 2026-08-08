/**
 * Étape I — Orchestration / Single Source of Truth.
 *
 * Une phase effective par semaine (weekStart → daysToComp).
 * Une application de charge finale (pas de doubles multiplicateurs).
 * Ne remplace pas les règles sportives — orchestre seulement.
 */

import { daysToCompetition, taperStageFromDays, resolveTaperLoad } from "./taper-load.js";
import { weeksToCompetition, horizonBandFromWeeks } from "./performance-strategy.js";

const WEEK_REF = {
  decouverte: 2800,
  regulier: 4000,
  sportif: 5200,
  performance: 6200,
};

/** Facteur phase quand PAS de taperStage date-driven */
const PHASE_FACTOR = {
  base: 1.0,
  development: 1.08,
  peak: 0.95,
  specifique: 0.95,
  specific: 0.95,
  taper: 0.65,
  competition: 0.45,
  race: 0.15,
  test: 0.85,
  bilan: 0.7,
};

/**
 * Début de semaine du plan (lundi local ou date plan + 7×index).
 */
export function weekStartDate(planStart, weekIndex = 0) {
  const base = planStart instanceof Date ? new Date(planStart) : new Date(planStart || Date.now());
  if (Number.isNaN(base.getTime())) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + weekIndex * 7);
    return d;
  }
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + weekIndex * 7);
  return base;
}

/**
 * Phase effective + taper stage pour UNE semaine, relative à weekStart (pas today seul).
 *
 * Mapping (réutilise seuils taper-load existants) :
 * - pas de date → phaseList
 * - days > 27 → development (ou phaseList si peak/test…)
 * - s3 (21–27) → peak/specific (charge s3, pas encore taper « affûtage »)
 * - s2/s1/race_week → taper
 * - race_day → race
 * - post_race → bilan
 */
export function resolveEffectiveWeekPhase({
  phaseListPhase = "development",
  competitionDate = null,
  weekStart = null,
  postRaceRecovery = false,
} = {}) {
  const asOf = weekStart || new Date();
  const days = daysToCompetition(competitionDate, asOf);
  const weeks = weeksToCompetition(competitionDate, asOf);
  const horizon = horizonBandFromWeeks(weeks);
  const taperStage = taperStageFromDays(days);

  let effectivePhase = phaseListPhase || "development";
  let source = "phase_list";

  if (postRaceRecovery || taperStage === "post_race") {
    effectivePhase = "bilan";
    source = "post_race";
  } else if (taperStage === "race_day") {
    effectivePhase = "race";
    source = "race_day";
  } else if (taperStage === "race_week" || taperStage === "s1" || taperStage === "s2") {
    effectivePhase = "taper";
    source = `taper_stage:${taperStage}`;
  } else if (taperStage === "s3") {
    // S-3 = encore spécifique / peak — charge via taperLoad s3, pas PHASE_MULT taper
    effectivePhase = "peak";
    source = "taper_stage:s3→peak";
  } else if (competitionDate && days != null && days > 27) {
    // Loin : respecter phaseList si fournie, sinon development
    if (phaseListPhase === "taper" || phaseListPhase === "competition") {
      effectivePhase = "development";
      source = "far_override_early_taper_label";
    } else {
      effectivePhase = phaseListPhase || "development";
      source = "far_phase_list";
    }
  } else if (!competitionDate) {
    effectivePhase = phaseListPhase || "development";
    source = "phase_list";
  }

  // competition phaseList sans date → race légère
  if (!competitionDate && phaseListPhase === "competition") {
    effectivePhase = "race";
    source = "phase_list_competition";
  }

  return {
    effectivePhase,
    effectiveTaperStage: taperStage,
    daysToComp: days,
    weeksToComp: weeks,
    horizonBand: horizon,
    phaseListPhase,
    source,
    weekStart: asOf instanceof Date ? asOf.toISOString().slice(0, 10) : String(asOf),
    competitionDate,
  };
}

/**
 * Charge finale unique.
 *
 * raw × capacity × adaptation × phaseOrTaper [× taste] [× deload]
 * = effectiveWeekVolume
 *
 * Règle : si taperStage avec volumeFactor < 1 → ce facteur EST le phase/taper
 * (pas PHASE_MULT.taper × taperFactor).
 */
export function resolveEffectiveWeekVolume({
  level = "regulier",
  capacityFactor = 1,
  /** weeklyAdaptation.volumeMul si décision moteur ; sinon null */
  adaptationMul = null,
  adaptationObserveOnly = false,
  /** legacy volumeAdj — utilisé SEULEMENT si adaptationMul == null */
  volumeAdjLegacy = 1,
  tasteVolumeMul = 1,
  effectivePhase = "development",
  taperVolumeFactor = 1,
  effectiveTaperStage = null,
  adaptiveDeload = false,
  prevWeekDistance = 0,
  weekIndex = 0,
  freq = 3,
  ambition = "full",
  leverHint = "volume",
} = {}) {
  const raw = WEEK_REF[level] ?? WEEK_REF.regulier;
  const capacityAdjusted = raw * Math.max(0.4, Number(capacityFactor) || 1);

  // Une seule molette d'adaptation
  let adaptFactor = 1;
  if (adaptationMul != null && Number.isFinite(Number(adaptationMul))) {
    adaptFactor = adaptationObserveOnly ? 1 : Number(adaptationMul);
  } else {
    adaptFactor = Math.min(1.3, Math.max(0.7, Number(volumeAdjLegacy) || 1));
  }

  const tasteFactor = Math.min(1.08, Math.max(0.92, Number(tasteVolumeMul) || 1));
  const adapted = capacityAdjusted * adaptFactor * tasteFactor;

  // Phase OU taper — jamais les deux en pile
  let phaseOrTaper = 1;
  const tf = Number(taperVolumeFactor);
  if (effectiveTaperStage && Number.isFinite(tf) && tf < 1) {
    phaseOrTaper = Math.max(0, tf);
  } else if (effectiveTaperStage === "race_day") {
    phaseOrTaper = 0;
  } else {
    phaseOrTaper = PHASE_FACTOR[effectivePhase] ?? 1;
  }

  let phaseAdjusted = adapted * phaseOrTaper;

  if (ambition === "finish") phaseAdjusted *= 0.9;
  if (ambition === "rebuild") phaseAdjusted *= 0.75;

  // Deload planifié / adaptatif — seulement hors taper date déjà réduit
  const plannedDeload = weekIndex > 0 && (weekIndex + 1) % 4 === 0;
  const inDateTaper = !!(effectiveTaperStage && ["s1", "s2", "s3", "race_week", "race_day"].includes(effectiveTaperStage));
  let typeSemaine = "normale";
  let lever = leverHint || "volume";

  if (effectivePhase === "race" || effectiveTaperStage === "race_day") {
    typeSemaine = "allegee";
    lever = "volume";
    phaseAdjusted = 0;
  } else if (effectivePhase === "taper" || effectivePhase === "bilan" || inDateTaper) {
    typeSemaine = "allegee";
    lever = "volume";
  } else if (effectivePhase === "test") {
    typeSemaine = "test";
    lever = "specificity";
  } else if (weekIndex === 0) {
    typeSemaine = "reference";
    lever = "volume";
  } else if ((plannedDeload || adaptiveDeload) && !inDateTaper) {
    typeSemaine = "allegee";
    lever = "volume";
    if (prevWeekDistance > 0) {
      phaseAdjusted = prevWeekDistance * 0.7;
    } else {
      phaseAdjusted *= 0.7;
    }
  }

  // Soft progression vs semaine précédente (hors race / hors deload déjà appliqué)
  if (prevWeekDistance > 0 && typeSemaine === "normale" && lever === "volume") {
    const cap = Math.floor((prevWeekDistance * 1.08) / 100) * 100;
    phaseAdjusted = Math.min(phaseAdjusted, Math.max(prevWeekDistance, cap));
  } else if (prevWeekDistance > 0 && (lever === "intensity" || lever === "density" || lever === "effort_duration" || lever === "specificity")) {
    phaseAdjusted = prevWeekDistance;
  }

  let effectiveWeekVolume = Math.max(0, Math.round(phaseAdjusted / 100) * 100);
  if (effectiveWeekVolume > 0) {
    effectiveWeekVolume = Math.max(800, effectiveWeekVolume);
  }

  const weights = Array.from({ length: Math.max(1, freq) }, (_, i) => (i === Math.min(1, freq - 1) ? 1.15 : 1));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const sessionTargets =
    effectiveWeekVolume <= 0
      ? Array.from({ length: freq }, () => 0)
      : weights.map((w) => Math.max(400, Math.round((effectiveWeekVolume * w) / sumW / 50) * 50));

  return {
    rawWeekVolume: raw,
    capacityAdjustedVolume: Math.round(capacityAdjusted),
    adaptedVolume: Math.round(adapted),
    phaseAdjustedVolume: Math.round(phaseAdjusted),
    effectiveWeekVolume,
    sessionTargets,
    typeSemaine,
    lever,
    factors: {
      capacityFactor,
      adaptFactor,
      tasteFactor,
      phaseOrTaper,
      adaptationSource: adaptationMul != null ? "weeklyAdaptation" : "volumeAdjLegacy",
    },
    trail: {
      raw,
      capacityAdjusted: Math.round(capacityAdjusted),
      adapted: Math.round(adapted),
      phaseAdjusted: Math.round(phaseAdjusted),
      effective: effectiveWeekVolume,
    },
  };
}

/**
 * Distance d'entraînement (jamais la course).
 */
export function trainingDistanceOfSession(session) {
  if (!session) return 0;
  if (session.isRaceDay || session.type === "RACE" || session.sessionIntent === "race") return 0;
  if (session.isRestDay || session.type === "REST" || session.sessionIntent === "repos") return 0;
  if (Number.isFinite(Number(session.trainingDistance))) return Math.max(0, Number(session.trainingDistance));
  if (Number.isFinite(Number(session.volumeFromSets))) return Math.max(0, Number(session.volumeFromSets));
  return parseInt(String(session.distance || "").replace(/\D/g, ""), 10) || 0;
}

export function sumTrainingDistance(sessions = []) {
  return sessions.reduce((a, s) => a + trainingDistanceOfSession(s), 0);
}

/**
 * Douleur → intention complète (pas seulement zone).
 */
export function applyPainSafetyToRoles(roles = []) {
  return roles.map((r) => {
    if (!r) return r;
    const intent = r.sessionIntent || r.intent || "";
    const hot =
      r.qualitySession ||
      r.zone === "Z3" ||
      r.zone === "Z4" ||
      ["seuil", "vitesse", "vo2", "allure_specifique", "course_piscine", "test"].includes(intent);
    if (!hot && r.zone !== "Z3" && r.zone !== "Z4") {
      return { ...r, zone: r.zone === "Z1" ? "Z1" : "Z2" };
    }
    return {
      ...r,
      sessionIntent: "recuperation",
      intent: "recuperation",
      family: "recuperation",
      zone: "Z1",
      qualitySession: false,
      isKeySession: false,
      racePaceTouches: false,
      painProtected: true,
    };
  });
}

/**
 * Taste APRÈS WeekRoles — préférences secondaires, garde-fous sportifs.
 */
export function biasWeekRolesForTaste(roles, hints, guards = {}) {
  if (!hints?.ready || !Array.isArray(roles)) return roles;
  const { taperBlocked = false, painProtection = false, preserveQuality = true } = guards;
  if (painProtection || taperBlocked) {
    // En taper / douleur : taste ne peut qu'adoucir encore, jamais pousser
    return roles.map((role) => {
      if (!role || !hints.softenIntensity) return role;
      if (role.qualitySession && preserveQuality) {
        return { ...role, zone: role.zone === "Z4" ? "Z3" : role.zone };
      }
      let zone = role.zone;
      if (zone === "Z4") zone = "Z3";
      else if (zone === "Z3") zone = "Z2";
      return { ...role, zone };
    });
  }

  let seenQuality = false;
  return roles.map((role) => {
    if (!role) return role;
    const isQuality = !!role.qualitySession;
    if (isQuality) seenQuality = true;

    let { sessionIntent, intent, zone, family } = role;
    const objectif = role.objectif;

    if (hints.softenIntensity) {
      if (zone === "Z4") zone = "Z3";
      else if (zone === "Z3" && !isQuality) zone = "Z2";
      if (!isQuality && (sessionIntent === "vitesse" || intent === "vitesse")) {
        sessionIntent = "aerobie";
        intent = "aerobie";
        family = "endurance";
      }
    } else if (hints.pushIntensity && !isQuality) {
      // Ne pas créer une 2e qualité ; léger bump zone sur aérobie seulement
      if (zone === "Z1" && (sessionIntent === "aerobie" || sessionIntent === "endurance")) zone = "Z2";
    }

    const vit = hints.typeWeights?.VITESSE ?? 0;
    if (vit < -0.4 && zone === "Z4" && !isQuality) zone = "Z3";
    const seu = hints.typeWeights?.SEUIL ?? 0;
    if (seu < -0.4 && zone === "Z3" && !isQuality) zone = "Z2";

    // Ne jamais retirer qualitySession de la séance clé
    if (isQuality && preserveQuality) {
      return { ...role, zone: zone === "Z4" && hints.softenIntensity ? "Z3" : role.zone || zone };
    }

    return {
      ...role,
      sessionIntent: sessionIntent || role.sessionIntent,
      intent: intent || role.intent,
      family: family || role.family,
      zone,
      objectif,
    };
  });
}

/**
 * engineWhy = vérité générée.
 */
export function formatEffectiveEngineWhy({
  objectifV1,
  effectivePhase,
  effectiveTaperStage,
  effectiveWeekVolume,
  primaryQuality,
  secondaryQuality,
  adaptation,
  capacity,
  raceTarget,
  volumeTrail,
  lever,
} = {}) {
  const parts = [
    `objectif=${objectifV1 || "—"}`,
    `effectivePhase=${effectivePhase || "—"}`,
    effectiveTaperStage ? `taperStage=${effectiveTaperStage}` : null,
    `effectiveWeekVolume=${effectiveWeekVolume ?? "—"}m`,
    lever ? `lever=${lever}` : null,
    primaryQuality ? `primary=${primaryQuality}` : null,
    secondaryQuality ? `secondary=${secondaryQuality}` : null,
    adaptation?.action ? `adapt=${adaptation.action}${adaptation.observeOnly ? "(obs)" : ""}` : null,
    capacity?.score != null ? `capacity=${Number(capacity.score).toFixed(2)}` : null,
    raceTarget?.distance ? `race=${raceTarget.distance}m` : null,
  ];
  if (volumeTrail) {
    parts.push(
      `volTrail=raw${volumeTrail.raw}→cap${volumeTrail.capacityAdjusted}→ad${volumeTrail.adapted}→ph${volumeTrail.phaseAdjusted}→eff${volumeTrail.effective}`,
    );
  }
  return parts.filter(Boolean).join(" · ");
}

/**
 * Contexte d'orchestration complet pour une semaine.
 */
export function buildWeekOrchestration({
  level,
  phaseListPhase,
  competitionDate,
  weekStart,
  weekIndex,
  freq,
  capacity,
  history = {},
  tasteVolumeMul = 1,
  ambition = "full",
  leverHint = "volume",
  prevWeekDistance = 0,
  adaptiveDeload = false,
  objectifV1 = null,
  raceTarget = null,
} = {}) {
  const postRace = !!(history.postRaceRecovery || history.weeklyAdaptation?.action === "RECOVER");
  const phaseInfo = resolveEffectiveWeekPhase({
    phaseListPhase,
    competitionDate,
    weekStart,
    postRaceRecovery: postRace,
  });

  const taperLoad =
    competitionDate || phaseInfo.effectiveTaperStage
      ? resolveTaperLoad(
          {
            competitionDate,
            raceTarget,
            phase: phaseInfo.effectivePhase,
            sessionsPerWeek: freq,
            freq,
            objectifV1,
          },
          weekStart,
        )
      : null;

  const adaptation = history.weeklyAdaptation || null;
  // Charge persistante = volumeAdj (App cumule déjà les muls H).
  // weeklyAdaptation pilote levier / deload / pain — pas un 2e × volumeMul.
  const volume = resolveEffectiveWeekVolume({
    level,
    capacityFactor: capacity?.volumeFactor ?? 1,
    adaptationMul: null,
    adaptationObserveOnly: true,
    volumeAdjLegacy: history.volumeAdj ?? 1,
    tasteVolumeMul: postRace || phaseInfo.effectivePhase === "taper" || phaseInfo.effectivePhase === "race"
      ? Math.min(1, tasteVolumeMul)
      : tasteVolumeMul,
    effectivePhase: phaseInfo.effectivePhase,
    taperVolumeFactor: taperLoad?.volumeFactor ?? 1,
    effectiveTaperStage: phaseInfo.effectiveTaperStage || taperLoad?.taperStage,
    adaptiveDeload:
      adaptiveDeload ||
      postRace ||
      adaptation?.action === "PROTECT" ||
      adaptation?.action === "RECOVER" ||
      adaptation?.action === "REDUCE",
    prevWeekDistance,
    weekIndex,
    freq,
    ambition,
    leverHint:
      adaptation?.primaryLever === "recovery"
        ? "volume"
        : adaptation?.primaryLever || leverHint,
  });

  return {
    ...phaseInfo,
    taperLoad: taperLoad?.taperStage ? taperLoad : phaseInfo.effectiveTaperStage ? taperLoad : null,
    volume,
    adaptation,
    capacity,
    volumeFinalized: true,
    taperAppliedUpstream: true,
    why: formatEffectiveEngineWhy({
      objectifV1,
      effectivePhase: phaseInfo.effectivePhase,
      effectiveTaperStage: phaseInfo.effectiveTaperStage || taperLoad?.taperStage,
      effectiveWeekVolume: volume.effectiveWeekVolume,
      primaryQuality: null,
      secondaryQuality: null,
      adaptation,
      capacity,
      raceTarget,
      volumeTrail: volume.trail,
      lever: volume.lever,
    }),
  };
}
