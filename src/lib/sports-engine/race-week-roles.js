/**
 * Applique QualityToDevelop aux rôles Sportif course_piscine.
 * Ordre de décision : sécurité → phase → capacité → objectif → quality → stroke → matos → format.
 * Ne remplace jamais phase test / reprise / taper de façon dangereuse.
 */

/**
 * @param {object} params
 * @param {object} params.A
 * @param {object} params.B
 * @param {object} params.C
 * @param {import('./race-quality.js').QualityToDevelop} params.qualityToDevelop
 * @param {string} params.phase
 * @param {boolean} params.resume
 * @param {object} [params.capacity]
 * @param {boolean} [params.isTestWeek]
 */
export function applyQualityToCourseRoles({
  A,
  B,
  C,
  qualityToDevelop,
  phase,
  resume,
  capacity = null,
  isTestWeek = false,
}) {
  if (!qualityToDevelop?.quality) return { A, B, C, applied: false };
  // 1. Sécurité / contraintes
  if (resume || isTestWeek) return { A, B, C, applied: false };

  const q = qualityToDevelop.quality;
  const capScore = Number(capacity?.score);
  const capacityBlocksSpeed =
    Number.isFinite(capScore) && capScore < 0.55 || capacity?.conservative === true;

  let nextA = { ...A };
  let nextB = { ...B };
  let nextC = { ...C };
  let applied = true;

  // 2. Phase : taper → qualité douce (allure), pas de vitesse lourde
  if (phase === "taper") {
    nextB = {
      ...nextB,
      sessionIntent: "allure_specifique",
      intent: "allure_specifique",
      family: "seuil",
      zone: "Z3",
      qualitySession: true,
      sessionSpecificity: "race_specific",
    };
    nextC = {
      ...nextC,
      sessionIntent: "recuperation",
      intent: "recuperation",
      family: "recuperation",
      zone: "Z1",
      racePaceTouches: q === "race_pace" || q === "pacing",
      qualitySession: false,
    };
    return { A: nextA, B: nextB, C: nextC, applied: true, note: "phase_taper_overrides_speed" };
  }

  const setB = (intent, extras = {}) => {
    const zone = intent === "vitesse" || intent === "vo2" ? "Z4" : "Z3";
    const family = intent === "vitesse" || intent === "vo2" ? "vitesse" : intent === "allure_specifique" ? "seuil" : "seuil";
    nextB = {
      ...nextB,
      sessionIntent: intent,
      intent,
      family,
      zone,
      qualitySession: true,
      sessionSpecificity: "race_specific",
      ...extras,
    };
  };

  const setCEnduranceTouches = (hotPeak = false) => {
    const peakHot = hotPeak && (phase === "peak" || phase === "specifique");
    nextC = {
      ...nextC,
      sessionIntent: peakHot ? "course_piscine" : "endurance",
      intent: peakHot ? "course_piscine" : "endurance",
      family: peakHot ? "specifique" : "endurance",
      zone: "Z2",
      sessionSpecificity: "race_specific",
      qualitySession: false,
      racePaceTouches: true,
    };
  };

  switch (q) {
    case "threshold":
      setB("seuil");
      setCEnduranceTouches(false);
      break;

    case "specific_endurance":
      // B spécifique + C endurance/allure
      setB(phase === "peak" || phase === "specifique" ? "allure_specifique" : "seuil");
      setCEnduranceTouches(true);
      break;

    case "specific_speed":
    case "speed":
      // Capacité limite la vitesse
      if (capacityBlocksSpeed) {
        setB("seuil");
        setCEnduranceTouches(false);
        applied = true;
        return {
          A: nextA,
          B: nextB,
          C: nextC,
          applied,
          note: "capacity_blocks_speed→seuil",
        };
      }
      // Base : vitesse autorisée mais C reste contrôlé (touches, pas double Z3)
      if (phase === "base") {
        setB(qualityToDevelop.confidence === "high" ? "vitesse" : "seuil");
      } else {
        setB("vitesse");
      }
      setCEnduranceTouches(false);
      break;

    case "race_pace":
    case "pacing":
      setB("allure_specifique");
      setCEnduranceTouches(phase === "peak");
      break;

    case "technical_efficiency":
      nextA = {
        ...nextA,
        sessionIntent: "technique_endurance",
        intent: "technique_endurance",
        family: "technique",
        sessionSpecificity: "stroke_focus",
      };
      setB("seuil");
      setCEnduranceTouches(false);
      break;

    case "aerobic_capacity":
      nextA = {
        ...nextA,
        sessionIntent: "aerobie",
        intent: "aerobie",
        family: "endurance",
      };
      // Une qualité douce : seuil si medium+, sinon garder défaut phase déjà posé
      if (qualityToDevelop.confidence !== "low") {
        setB("seuil");
      }
      setCEnduranceTouches(false);
      break;

    default:
      applied = false;
      break;
  }

  return { A: nextA, B: nextB, C: nextC, applied };
}

/**
 * Ordre de décision documenté (référence).
 */
export const RACE_DECISION_PRIORITY = Object.freeze([
  "safety_constraints",
  "phase",
  "capacity",
  "objective",
  "qualityToDevelop",
  "strokeFocus",
  "equipment",
  "format_preference",
]);
