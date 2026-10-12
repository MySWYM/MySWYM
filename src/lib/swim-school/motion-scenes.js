/**
 * Mapping étape → Lottie école (public/school-motion/).
 * Chaque étape des 6 cours a sa scène dédiée (source : store/school-motion/, voir README).
 */

import { ANC_STEPS, ANC_TRACK_ID, ancStepIndex } from "./anc-track.js";
import { DOS_STEPS, DOS_TRACK_ID, dosStepIndex } from "./dos-track.js";
import { getTrackSteps } from "./catalog.js";

/** @type {Record<string, string>} */
const LOTTIE_BY_STEP = {
  // Crawl
  ANC1: "step-01-coulee.json",
  ANC2: "step-02-kick.json",
  ANC3: "step-03-inspire-devant.json",
  ANC4: "step-04-vrille-dos.json",
  ANC5: "step-05-deux-bras.json",
  ANC6: "step-06-un-bras-puis-autre.json",
  ANC7: "step-07-retour-sous-eau.json",
  ANC8: "step-08-retour-aerien.json",
  ANC9: "step-09-cycle-vrille-dos.json",
  ANC10: "step-10-dos-bras-opposes.json",
  ANC11: "step-11-rattrape-vrille-dos.json",
  ANC12: "step-12-rattrape-avant-cote.json",
  ANC13: "step-13-rattrape-arriere-cote.json",
  ANC14: "step-14-rattrape-avant-3-temps.json",
  ANC15: "step-15-rattrape-arriere-3-temps.json",
  ANC16: "step-16-opposition-arret.json",
  ANC17: "step-17-crawl-3-temps.json",
  ANC18: "step-18-cycles.json",
  // Dos
  DOS1: "dos-01-cote.json",
  DOS2: "dos-02-tete-immobile.json",
  DOS3: "dos-03-gainage.json",
  DOS4: "dos-04-battement.json",
  DOS5: "dos-05-deux-bras.json",
  DOS6: "dos-06-costal.json",
  DOS7: "dos-07-echange.json",
  DOS8: "dos-08-vers-complete.json",
  DOS9: "dos-09-prise-eau.json",
  DOS10: "dos-10-sync.json",
  DOS11: "dos-11-respiration.json",
  DOS12: "dos-12-qui-tient.json",
  // Virage culbute
  AVC1: "virage-01-deux-mains-dos.json",
  AVC2: "virage-02-une-main-ventre.json",
  AVC3: "virage-03-un-bras-air.json",
  AVC4: "virage-04-coulee-reprise.json",
  AVC5: "virage-05-roulade.json",
  AVC6: "virage-06-crawl-roulade.json",
  AVC7: "virage-07-pieds-au-mur.json",
  AVC8: "virage-08-crawl-pieds.json",
  AVC9: "virage-09-poussee-dos.json",
  AVC10: "virage-10-virage-complet.json",
  // Départ
  ADC1: "depart-01-chute.json",
  ADC2: "depart-02-desequilibre.json",
  ADC3: "depart-03-bras.json",
  ADC4: "depart-04-cerceau.json",
  ADC5: "depart-05-depart-reprise.json",
  ADC6: "depart-06-agrippe.json",
  ADC7: "depart-07-tete-relevee.json",
  ADC8: "depart-08-pieds-decales.json",
  ADC9: "depart-09-cerceau-reprise.json",
  ADC10: "depart-10-signal.json",
  // Papillon
  PAP1: "pap-01-deux-attitudes.json",
  PAP2: "pap-02-canard.json",
  PAP3: "pap-03-bras-planche.json",
  PAP4: "pap-04-un-bras.json",
  PAP5: "pap-05-apnee.json",
  PAP6: "pap-06-entree.json",
  PAP7: "pap-07-retour.json",
  PAP8: "pap-08-tete-bras.json",
  PAP9: "pap-09-inspirer.json",
  PAP10: "pap-10-qui-tient.json",
  // Brasse
  BRA1: "brasse-01-ciseau.json",
  BRA2: "brasse-02-fouette.json",
  BRA3: "brasse-03-prisonnier.json",
  BRA4: "brasse-04-deux-attitudes.json",
  BRA5: "brasse-05-bonnet.json",
  BRA6: "brasse-06-relance.json",
  BRA7: "brasse-07-prise-eau.json",
  BRA8: "brasse-08-corps-plat.json",
  BRA9: "brasse-09-inspirer.json",
  BRA10: "brasse-10-sans-trou.json",
};

/** @type {Record<string, string>} */
const LABEL_KEY_BY_STEP = {
  ANC1: "school.motion.glideLong",
  ANC2: "school.motion.glideKick",
  ANC3: "school.motion.breathFront",
  ANC4: "school.motion.breathBack",
  ANC5: "school.motion.armsSync",
  ANC6: "school.motion.armsAlt",
  ANC7: "school.motion.underRecover",
  ANC8: "school.motion.airRecover",
  ANC9: "school.motion.cycleBack",
  ANC10: "school.motion.oppBack",
  ANC11: "school.motion.catchFrontBack",
  ANC12: "school.motion.catchSide",
  ANC13: "school.motion.catchBackSide",
  ANC14: "school.motion.threeFront",
  ANC15: "school.motion.threeBack",
  ANC16: "school.motion.oppStop",
  ANC17: "school.motion.crawl",
  ANC18: "school.motion.fewerCycles",
  DOS1: "school.motion.dosSide",
  DOS2: "school.motion.dosHead",
  DOS3: "school.motion.dosCore",
  DOS4: "school.motion.dosKick",
  DOS5: "school.motion.dosTwoArms",
  DOS6: "school.motion.dosCostal",
  DOS7: "school.motion.dosSwap",
  DOS8: "school.motion.dosFull",
  DOS9: "school.motion.dosCatch",
  DOS10: "school.motion.dosSync",
  DOS11: "school.motion.dosBreath",
  DOS12: "school.motion.dosHold",
  AVC1: "school.motion.turnTwoHands",
  AVC2: "school.motion.turnOneHand",
  AVC3: "school.motion.turnArmAir",
  AVC4: "school.motion.turnGlideStroke",
  AVC5: "school.motion.turnRoll",
  AVC6: "school.motion.turnStopRoll",
  AVC7: "school.motion.turnFeetWall",
  AVC8: "school.motion.turnCrawlFeet",
  AVC9: "school.motion.turnPushBack",
  AVC10: "school.motion.turnFull",
  ADC1: "school.motion.startFall",
  ADC2: "school.motion.startPush",
  ADC3: "school.motion.startArms",
  ADC4: "school.motion.startHoop",
  ADC5: "school.motion.startFull",
  ADC6: "school.motion.startGrab",
  ADC7: "school.motion.startHead",
  ADC8: "school.motion.startTrack",
  ADC9: "school.motion.startHoopStroke",
  ADC10: "school.motion.startSignal",
  PAP1: "school.motion.flyAttitudes",
  PAP2: "school.motion.flyDuck",
  PAP3: "school.motion.flyBoardArms",
  PAP4: "school.motion.flyOneArm",
  PAP5: "school.motion.flyApnea",
  PAP6: "school.motion.flyEntry",
  PAP7: "school.motion.flyRecovery",
  PAP8: "school.motion.flyHeadArms",
  PAP9: "school.motion.flyBreath",
  PAP10: "school.motion.flyHold",
  BRA1: "school.motion.breastKick",
  BRA2: "school.motion.breastWhip",
  BRA3: "school.motion.breastPrisoner",
  BRA4: "school.motion.breastAttitudes",
  BRA5: "school.motion.breastCap",
  BRA6: "school.motion.breastRecovery",
  BRA7: "school.motion.breastCatch",
  BRA8: "school.motion.breastFlat",
  BRA9: "school.motion.breastBreath",
  BRA10: "school.motion.breastTiming",
};

const TUBA_STEPS = new Set(["ANC2", "ANC3", "ANC5", "ANC6", "ANC7", "ANC8"]);
const DOS_PALMES_FROM = 4;

/**
 * @typedef {{ id: "palmes" | "tuba", labelKey: string, hintKey: string }} SchoolGearChip
 */

export function getMotionScene(stepId) {
  const file = LOTTIE_BY_STEP[stepId];
  if (!file) return null;
  return {
    path: `/school-motion/${file}`,
    labelKey: LABEL_KEY_BY_STEP[stepId] || "school.motion.unavailable",
  };
}

export function schoolGearForStep(stepId) {
  /** @type {SchoolGearChip[]} */
  const chips = [];
  if (stepId.startsWith("DOS")) {
    if (dosStepIndex(stepId) + 1 >= DOS_PALMES_FROM) {
      chips.push({
        id: "palmes",
        labelKey: "school.gear.palmes",
        hintKey: "school.gear.palmesHint",
      });
    }
    return chips;
  }
  if (stepId.startsWith("PAP") || stepId.startsWith("BRA")) {
    // Pas de pull / plaquettes jeunes ; palmes OK en pap un bras / canards
    if (stepId.startsWith("PAP") && ["PAP2", "PAP4", "PAP5"].includes(stepId)) {
      chips.push({
        id: "palmes",
        labelKey: "school.gear.palmes",
        hintKey: "school.gear.palmesHint",
      });
    }
    return chips;
  }
  if (stepId.startsWith("ANC")) {
    if (ancStepIndex(stepId) + 1 >= 2) {
      chips.push({
        id: "palmes",
        labelKey: "school.gear.palmes",
        hintKey: "school.gear.palmesHint",
      });
    }
    if (TUBA_STEPS.has(stepId)) {
      chips.push({
        id: "tuba",
        labelKey: "school.gear.tuba",
        hintKey: "school.gear.tubaHint",
      });
    }
  }
  return chips;
}

/** @deprecated use schoolGearForStep */
export function schoolTipsForStep(stepId) {
  return schoolGearForStep(stepId).map((c) => c.id);
}

export function allMotionSceneIds() {
  return Object.keys(LOTTIE_BY_STEP);
}

export function assertMotionCoverage(trackId = ANC_TRACK_ID) {
  const steps = getTrackSteps(trackId);
  if (!steps.length) {
    if (trackId === ANC_TRACK_ID) return ANC_STEPS.every((s) => Boolean(LOTTIE_BY_STEP[s.id]));
    if (trackId === DOS_TRACK_ID) return DOS_STEPS.every((s) => Boolean(LOTTIE_BY_STEP[s.id]));
  }
  return steps.every((s) => Boolean(LOTTIE_BY_STEP[s.id]));
}
