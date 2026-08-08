/**
 * Rôles hebdo Performance depuis PerformanceStrategy.
 * Une seule qualité dominante (B) ; secondaire complémentaire (A ou C).
 * Étape G : taper / race week via taper-load.
 */

import { OBJECTIF_V1 } from "./types.js";
import { resolvePerformanceStrategy } from "./performance-strategy.js";
import { taperWeekRoleIntents, buildRaceDaySession, buildRestDaySession } from "./taper-load.js";

function baseRole(partial) {
  return {
    objectif: "endurance",
    zone: "Z2",
    family: "endurance",
    intent: "endurance",
    sessionIntent: "endurance",
    sessionSpecificity: "general",
    qualitySession: false,
    isKeySession: false,
    racePaceTouches: false,
    ...partial,
  };
}

function mapPrimaryToB(primary, ctx = {}) {
  const phase = ctx.phase || "development";
  switch (primary) {
    case "speed":
    case "specific_speed":
    case "speed_change":
      return baseRole({
        sessionIntent: "vitesse",
        intent: "vitesse",
        family: "vitesse",
        zone: "Z4",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "race_specific",
      });
    case "threshold":
      return baseRole({
        sessionIntent: "seuil",
        intent: "seuil",
        family: "seuil",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "race_specific",
      });
    case "specific_endurance":
      return baseRole({
        sessionIntent: phase === "peak" || phase === "specifique" ? "allure_specifique" : "seuil",
        intent: phase === "peak" || phase === "specifique" ? "allure_specifique" : "seuil",
        family: "seuil",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "race_specific",
      });
    case "race_pace":
    case "pacing":
      return baseRole({
        sessionIntent: "allure_specifique",
        intent: "allure_specifique",
        family: "seuil",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "race_specific",
      });
    case "weak_stroke":
      return baseRole({
        sessionIntent: "quatre_nages",
        intent: "quatre_nages",
        family: "technique",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "stroke_focus",
        limitingStroke: ctx.limitingStroke || null,
      });
    case "sighting":
    case "open_water_specificity":
      return baseRole({
        sessionIntent: "eau_libre",
        intent: "eau_libre",
        family: "eau_libre",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "goal_specific",
      });
    case "economy":
      return baseRole({
        sessionIntent: "triathlon",
        intent: "triathlon",
        family: "specifique",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "goal_specific",
      });
    case "technical_efficiency":
      return baseRole({
        sessionIntent: "technique_endurance",
        intent: "technique_endurance",
        family: "technique",
        zone: "Z2",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "stroke_focus",
      });
    case "aerobic_capacity":
    default:
      return baseRole({
        sessionIntent: "seuil",
        intent: "seuil",
        family: "seuil",
        zone: "Z3",
        qualitySession: true,
        isKeySession: true,
        sessionSpecificity: "general",
      });
  }
}

function mapSecondaryToA(secondary, objectif, ctx = {}) {
  switch (secondary) {
    case "technical_efficiency":
    case "weak_stroke": {
      const use4n = !!(ctx.limitingStroke || ctx.strokeFocus === "4n");
      return baseRole({
        sessionIntent: use4n ? "quatre_nages" : "technique_endurance",
        intent: use4n ? "quatre_nages" : "technique_endurance",
        family: "technique",
        sessionSpecificity: "stroke_focus",
        limitingStroke: ctx.limitingStroke || null,
      });
    }
    case "sighting":
    case "open_water_specificity":
      return baseRole({
        sessionIntent: "eau_libre",
        intent: "eau_libre",
        family: "eau_libre",
        sessionSpecificity: "goal_specific",
      });
    case "economy":
      return baseRole({
        sessionIntent: "triathlon",
        intent: "triathlon",
        family: "specifique",
        sessionSpecificity: "goal_specific",
      });
    case "aerobic_capacity":
    default:
      if (objectif === OBJECTIF_V1.EAU_LIBRE) {
        return baseRole({
          sessionIntent: "eau_libre",
          intent: "eau_libre",
          family: "eau_libre",
          sessionSpecificity: "goal_specific",
        });
      }
      if (objectif === OBJECTIF_V1.TRIATHLON) {
        return baseRole({
          sessionIntent: "triathlon",
          intent: "triathlon",
          family: "specifique",
          sessionSpecificity: "goal_specific",
        });
      }
      if (ctx.strokeFocus === "4n") {
        return baseRole({
          sessionIntent: "quatre_nages",
          intent: "quatre_nages",
          family: "technique",
          sessionSpecificity: "stroke_focus",
        });
      }
      return baseRole({
        sessionIntent: "aerobie",
        intent: "aerobie",
        family: "endurance",
      });
  }
}

function mapSecondaryToC(secondary, primary, objectif, phase, ctx = {}) {
  if (primary === "speed" || primary === "specific_speed" || primary === "threshold" || primary === "specific_endurance") {
    return baseRole({
      sessionIntent:
        objectif === OBJECTIF_V1.EAU_LIBRE
          ? "eau_libre"
          : objectif === OBJECTIF_V1.TRIATHLON
            ? "triathlon"
            : phase === "peak" && objectif === OBJECTIF_V1.COURSE_PISCINE
              ? "course_piscine"
              : "endurance",
      intent: "endurance",
      family: objectif === OBJECTIF_V1.EAU_LIBRE ? "eau_libre" : "endurance",
      sessionSpecificity:
        objectif === OBJECTIF_V1.COURSE_PISCINE || objectif === OBJECTIF_V1.EAU_LIBRE
          ? "race_specific"
          : "general",
      racePaceTouches: true,
      zone: "Z2",
    });
  }
  if (secondary === "race_pace" || secondary === "pacing") {
    return baseRole({
      sessionIntent: "endurance",
      racePaceTouches: true,
      sessionSpecificity: "race_specific",
      zone: "Z2",
    });
  }
  if (objectif === OBJECTIF_V1.EAU_LIBRE) {
    return baseRole({
      sessionIntent: "eau_libre",
      family: "eau_libre",
      sessionSpecificity: "goal_specific",
      racePaceTouches: secondary === "speed_change",
    });
  }
  if (ctx.strokeFocus === "4n" || primary === "weak_stroke") {
    return baseRole({
      sessionIntent: "quatre_nages",
      family: "technique",
      sessionSpecificity: "race_specific",
      racePaceTouches: true,
    });
  }
  return baseRole({
    sessionIntent: "endurance",
    racePaceTouches: true,
    sessionSpecificity: "race_specific",
  });
}

function roleFromTaperPartial(partial) {
  if (!partial) return null;
  return baseRole({
    sessionIntent: partial.sessionIntent,
    intent: partial.sessionIntent,
    family: partial.family || "endurance",
    zone: partial.zone || (partial.qualitySession ? "Z3" : "Z2"),
    qualitySession: !!partial.qualitySession,
    isKeySession: !!partial.qualitySession,
    sessionSpecificity: partial.sessionSpecificity || "general",
    racePaceTouches: !!partial.racePaceTouches,
    taperShortQuality: !!partial.taperShortQuality,
    taperActivation: !!partial.taperActivation,
    taperRestPreferred: !!partial.taperRestPreferred,
    optional: !!partial.optional,
    isRaceDay: !!partial.isRaceDay,
    isRestDay: !!partial.isRestDay || partial.sessionIntent === "repos",
    taperLabel: partial.label || null,
  });
}

/**
 * Performance N×/sem depuis PerformanceStrategy (+ taper si date course).
 */
export function performanceWeekRoles(n, ctx = {}) {
  const obj = ctx.objectifV1 || OBJECTIF_V1.NAGER_PROGRESSER;
  const resume = ctx.resumeMode || obj === OBJECTIF_V1.REPRENDRE;
  const strategy = resolvePerformanceStrategy({
    ...ctx,
    asOf: ctx.asOf || ctx.weekStart || ctx.now,
    weekStart: ctx.weekStart || ctx.asOf,
    effectivePhase: ctx.effectivePhase || ctx.phase,
  });
  const phase = ctx.effectivePhase || strategy.phase || ctx.phase || "development";
  const isTestWeek = phase === "test" || ctx.typeSemaine === "test";
  const count = Math.max(1, n);

  // Race day : une seule « séance » course ; autres slots = repos (pas d'entraînement)
  if (strategy.taperStage === "race_day" && !resume) {
    const raceRole = baseRole({
      sessionIntent: "race",
      intent: "race",
      family: "race",
      isRaceDay: true,
      qualitySession: false,
      zone: "Z1",
    });
    const out = Array.from({ length: count }, (_, i) =>
      i === 0
        ? {
            ...raceRole,
            performancePrimary: strategy.primaryQuality,
            performanceSecondary: strategy.secondaryQuality,
          }
        : baseRole({
            sessionIntent: "repos",
            family: "recuperation",
            zone: "Z1",
            optional: true,
            taperRestPreferred: true,
            isRestDay: true,
          }),
    );
    attachMeta(out, strategy);
    return out;
  }

  let A;
  let B;
  let C;
  let extras = [];

  if (strategy.taperLoad?.taperStage && !resume && !isTestWeek) {
    const taperRoles = taperWeekRoleIntents(strategy.taperLoad, {
      ...ctx,
      sessionsPerWeek: count,
      raceTarget: ctx.raceTarget,
      objectifV1: obj,
    });
    if (taperRoles.sessions?.length) {
      const mapped = taperRoles.sessions.map(roleFromTaperPartial).filter(Boolean);
      A = mapped[0];
      B = mapped[1] || baseRole({ sessionIntent: "recuperation", family: "recuperation", zone: "Z1" });
      C = mapped[2] || baseRole({ sessionIntent: "recuperation", family: "recuperation", zone: "Z1" });
      extras = mapped.slice(3);
    } else {
      A = roleFromTaperPartial(taperRoles.A);
      B = roleFromTaperPartial(taperRoles.B);
      C = roleFromTaperPartial(taperRoles.C);
    }
  } else {
    A = mapSecondaryToA(strategy.secondaryQuality || "aerobic_capacity", obj, ctx);
    B = mapPrimaryToB(strategy.primaryQuality, { ...ctx, phase, limitingStroke: strategy.limitingStroke });
    C = mapSecondaryToC(strategy.secondaryQuality, strategy.primaryQuality, obj, phase, ctx);

    if (strategy.horizonBand === "pre_race" && !strategy.taperStage) {
      C = baseRole({
        sessionIntent: "recuperation",
        family: "recuperation",
        zone: "Z1",
        racePaceTouches: true,
      });
      if (B.sessionIntent === "vitesse") {
        B = mapPrimaryToB("race_pace", { phase });
      }
    }
  }

  if (resume) {
    A = baseRole({ sessionIntent: "reprise" });
    B = baseRole({ sessionIntent: "reprise", isKeySession: true });
    C = baseRole({ sessionIntent: "aerobie" });
  } else if (isTestWeek) {
    B = baseRole({
      sessionIntent: "test",
      intent: "test",
      family: "test",
      zone: "Z3",
      qualitySession: true,
      isKeySession: true,
    });
  }

  const templates = [A, B, C, ...extras].filter(Boolean);
  while (templates.length < count) {
    templates.push(baseRole({ sessionIntent: "recuperation", family: "recuperation", zone: "Z1" }));
  }

  const roles = Array.from({ length: count }, (_, i) => ({
    ...templates[i % templates.length],
    performancePrimary: strategy.primaryQuality,
    performanceSecondary: strategy.secondaryQuality,
    taperStage: strategy.taperStage || null,
    taperLoad: strategy.taperLoad || null,
  }));

  let seenQuality = false;
  const out = roles.map((r) => {
    if (r.qualitySession) {
      if (seenQuality) {
        return {
          ...r,
          qualitySession: false,
          sessionIntent: strategy.taperStage ? "recuperation" : "aerobie",
          intent: strategy.taperStage ? "recuperation" : "aerobie",
          zone: "Z1",
          family: strategy.taperStage ? "recuperation" : "endurance",
        };
      }
      seenQuality = true;
    }
    return r;
  });

  attachMeta(out, strategy);
  return out;
}

function attachMeta(out, strategy) {
  Object.defineProperty(out, "performanceStrategy", {
    value: strategy,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(out, "raceAnalysis", {
    value: strategy.raceAnalysis || null,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(out, "taperLoad", {
    value: strategy.taperLoad || null,
    enumerable: false,
    configurable: true,
  });
  for (const r of out) {
    r.performanceDevExplain = strategy.devExplain;
    r.qualityToDevelop = strategy.raceAnalysis?.qualityToDevelop?.quality || null;
    r.performanceStrategy = strategy;
  }
}

export { buildRaceDaySession, buildRestDaySession };
