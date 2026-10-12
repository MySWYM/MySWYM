/**
 * Blocs thème par parcours (UI nageur).
 */

import { ANC_STEPS, ANC_TRACK_ID } from "./anc-track.js";
import { DOS_STEPS, DOS_TRACK_ID } from "./dos-track.js";
import { VIRAGE_STEPS, VIRAGE_TRACK_ID } from "./virage-track.js";
import { DEPART_STEPS, DEPART_TRACK_ID } from "./depart-track.js";
import { PAP_STEPS, PAP_TRACK_ID } from "./pap-track.js";
import { BRASSE_STEPS, BRASSE_TRACK_ID } from "./brasse-track.js";
import { getTrackSteps } from "./catalog.js";

/** @typedef {{ id: string, titleKey: string, stepIds: string[] }} SchoolChapter */

/** @type {SchoolChapter[]} */
export const ANC_CHAPTERS = [
  { id: "glide", titleKey: "school.chapter.glide", stepIds: ["ANC1", "ANC2"] },
  { id: "breathe", titleKey: "school.chapter.breathe", stepIds: ["ANC3", "ANC4"] },
  { id: "arms", titleKey: "school.chapter.arms", stepIds: ["ANC5", "ANC6", "ANC7", "ANC8", "ANC9", "ANC10"] },
  { id: "crawl", titleKey: "school.chapter.crawl", stepIds: ["ANC11", "ANC12", "ANC13", "ANC14", "ANC15", "ANC16", "ANC17", "ANC18"] },
];

/** @type {SchoolChapter[]} */
export const DOS_CHAPTERS = [
  { id: "dos-pose", titleKey: "school.chapter.dosPose", stepIds: ["DOS1", "DOS2", "DOS3", "DOS4"] },
  { id: "dos-arms", titleKey: "school.chapter.dosArms", stepIds: ["DOS5", "DOS6", "DOS7", "DOS8"] },
  { id: "dos-nage", titleKey: "school.chapter.dosNage", stepIds: ["DOS9", "DOS10", "DOS11", "DOS12"] },
];

/** @type {SchoolChapter[]} */
export const VIRAGE_CHAPTERS = [
  { id: "virage-base", titleKey: "school.chapter.virageBase", stepIds: ["AVC1", "AVC2", "AVC3", "AVC4"] },
  { id: "virage-roulade", titleKey: "school.chapter.virageRoulade", stepIds: ["AVC5", "AVC6", "AVC7"] },
  { id: "virage-complet", titleKey: "school.chapter.virageComplet", stepIds: ["AVC8", "AVC9", "AVC10"] },
];

/** @type {SchoolChapter[]} */
export const DEPART_CHAPTERS = [
  { id: "depart-chute", titleKey: "school.chapter.departChute", stepIds: ["ADC1", "ADC2", "ADC3", "ADC4"] },
  { id: "depart-entier", titleKey: "school.chapter.departEntier", stepIds: ["ADC5", "ADC6", "ADC7"] },
  { id: "depart-signal", titleKey: "school.chapter.departSignal", stepIds: ["ADC8", "ADC9", "ADC10"] },
];

/** @type {SchoolChapter[]} */
export const PAP_CHAPTERS = [
  { id: "pap-base", titleKey: "school.chapter.papBase", stepIds: ["PAP1", "PAP2", "PAP3", "PAP4"] },
  { id: "pap-nage", titleKey: "school.chapter.papNage", stepIds: ["PAP5", "PAP6", "PAP7", "PAP8"] },
  { id: "pap-inspire", titleKey: "school.chapter.papInspire", stepIds: ["PAP9", "PAP10"] },
];

/** @type {SchoolChapter[]} */
export const BRASSE_CHAPTERS = [
  { id: "brasse-ciseau", titleKey: "school.chapter.brasseCiseau", stepIds: ["BRA1", "BRA2", "BRA3"] },
  { id: "brasse-lien", titleKey: "school.chapter.brasseLien", stepIds: ["BRA4", "BRA5", "BRA6", "BRA7"] },
  { id: "brasse-nage", titleKey: "school.chapter.brasseNage", stepIds: ["BRA8", "BRA9", "BRA10"] },
];

const CHAPTERS_BY_TRACK = {
  [ANC_TRACK_ID]: ANC_CHAPTERS,
  [DOS_TRACK_ID]: DOS_CHAPTERS,
  [VIRAGE_TRACK_ID]: VIRAGE_CHAPTERS,
  [DEPART_TRACK_ID]: DEPART_CHAPTERS,
  [PAP_TRACK_ID]: PAP_CHAPTERS,
  [BRASSE_TRACK_ID]: BRASSE_CHAPTERS,
};

const STEPS_BY_TRACK = {
  [ANC_TRACK_ID]: ANC_STEPS,
  [DOS_TRACK_ID]: DOS_STEPS,
  [VIRAGE_TRACK_ID]: VIRAGE_STEPS,
  [DEPART_TRACK_ID]: DEPART_STEPS,
  [PAP_TRACK_ID]: PAP_STEPS,
  [BRASSE_TRACK_ID]: BRASSE_STEPS,
};

export function chaptersForTrack(trackId) {
  return CHAPTERS_BY_TRACK[trackId] || ANC_CHAPTERS;
}

export function chapterForStepId(stepId, trackId = ANC_TRACK_ID) {
  return chaptersForTrack(trackId).find((c) => c.stepIds.includes(stepId)) || null;
}

export function stepNumberFromId(stepId, trackId = ANC_TRACK_ID) {
  const steps = STEPS_BY_TRACK[trackId] || getTrackSteps(trackId);
  const i = steps.findIndex((s) => s.id === stepId);
  return i < 0 ? null : i + 1;
}
