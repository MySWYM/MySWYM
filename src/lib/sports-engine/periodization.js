/**
 * Périodisation + ambition vs deadline.
 */
import { OBJECTIF_V1 } from "./types.js";

/**
 * Ajuste le nombre de semaines / ambition si le délai est trop court.
 * @returns {{ weeks: number, ambition: 'full'|'finish'|'rebuild', note: string|null }}
 */
export function resolvePlanHorizon(sportProfile, requestedWeeks) {
  const weeks = Math.max(4, Math.min(52, Number(requestedWeeks) || 8));
  const level = sportProfile.level;
  const obj = sportProfile.objectifV1;

  // Découverte + objectif distance ambitieux + peu de semaines
  if (level === "decouverte" && weeks <= 4 && (obj === OBJECTIF_V1.EAU_LIBRE || obj === OBJECTIF_V1.COURSE_PISCINE)) {
    return {
      weeks,
      ambition: "finish",
      note: "Délai court : priorité = terminer la distance dans de bonnes conditions, pas une prépa performance.",
    };
  }

  if (sportProfile.capacity?.resumeMode) {
    return {
      weeks,
      ambition: "rebuild",
      note: "Reprise après interruption : charge reconstruite progressivement.",
    };
  }

  if (weeks < 6 && (obj === OBJECTIF_V1.TRIATHLON || obj === OBJECTIF_V1.COURSE_PISCINE) && level !== "performance") {
    return {
      weeks,
      ambition: "finish",
      note: "Horizon court : focus spécifique allégé, pas de montée de volume agressive.",
    };
  }

  return { weeks, ambition: "full", note: null };
}

/** Phase plan → clé générateur historique */
export const PHASE_TO_GENERATOR = {
  base: "foncier",
  development: "developpement",
  peak: "specifique",
  taper: "affutage",
  competition: "affutage",
  bilan: "affutage",
  test: "developpement",
};

export function mapPhaseToGenerator(phase) {
  return PHASE_TO_GENERATOR[phase] || "foncier";
}
