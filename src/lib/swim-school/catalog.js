/**
 * Catalogue des cours école (Accueil rail + navigation).
 * Ordre rail Découverte : crawl, dos, virage, départ.
 * Pap / brasse : invisibles en Débutant / Découverte (Intermédiaire+).
 */

import { ANC_STEPS, ANC_TRACK_ID } from "./anc-track.js";
import { DOS_STEPS, DOS_TRACK_ID } from "./dos-track.js";
import { VIRAGE_STEPS, VIRAGE_TRACK_ID } from "./virage-track.js";
import { DEPART_STEPS, DEPART_TRACK_ID } from "./depart-track.js";
import { PAP_STEPS, PAP_TRACK_ID } from "./pap-track.js";
import { BRASSE_STEPS, BRASSE_TRACK_ID } from "./brasse-track.js";
import { isBeginnerLevelId } from "../onboarding-level-gate.js";
import { nextIdIn, prevIdIn, stepById } from "./track-utils.js";

/**
 * @typedef {{
 *   id: string,
 *   trackId: string,
 *   titleKey: string,
 *   leadKey: string,
 *   leadDecouverteKey?: string,
 *   lockedLeadKey?: string,
 *   lockedCtaKey?: string,
 *   lockedBodyKey?: string,
 *   cardStepId?: string,
 *   heroSrc?: string,
 *   steps: import("./anc-track.js").SchoolStep[],
 *   requiresIntermediate?: boolean,
 * }} SchoolCourse
 */

/** @type {SchoolCourse[]} */
export const SCHOOL_COURSES = [
  {
    id: "crawl",
    trackId: ANC_TRACK_ID,
    titleKey: "school.crawl",
    leadKey: "school.homeLead",
    leadDecouverteKey: "school.homeLeadDecouverte",
    cardStepId: "ANC17",
    heroSrc: "/school-hero-crawl.webp",
    steps: ANC_STEPS,
  },
  {
    id: "dos",
    trackId: DOS_TRACK_ID,
    titleKey: "school.dos",
    leadKey: "school.dosHomeLead",
    leadDecouverteKey: "school.dosHomeLeadDecouverte",
    lockedLeadKey: "school.dosHomeLeadLocked",
    lockedCtaKey: "school.dosHomeCtaLocked",
    lockedBodyKey: "school.dosLocked",
    cardStepId: "DOS12",
    heroSrc: "/school-hero-dos.webp",
    steps: DOS_STEPS,
  },
  {
    id: "virage",
    trackId: VIRAGE_TRACK_ID,
    titleKey: "school.virage",
    leadKey: "school.virageHomeLead",
    lockedLeadKey: "school.virageHomeLeadLocked",
    lockedCtaKey: "school.virageHomeCtaLocked",
    lockedBodyKey: "school.virageLocked",
    heroSrc: "/school-hero-virage.webp",
    steps: VIRAGE_STEPS,
  },
  {
    id: "depart",
    trackId: DEPART_TRACK_ID,
    titleKey: "school.depart",
    leadKey: "school.departHomeLead",
    lockedLeadKey: "school.departHomeLeadLocked",
    lockedCtaKey: "school.departHomeCtaLocked",
    lockedBodyKey: "school.departLocked",
    heroSrc: "/school-hero-depart.webp",
    steps: DEPART_STEPS,
  },
  {
    id: "pap",
    trackId: PAP_TRACK_ID,
    titleKey: "school.pap",
    leadKey: "school.papHomeLead",
    lockedLeadKey: "school.papHomeLeadLocked",
    lockedCtaKey: "school.papHomeCtaLocked",
    lockedBodyKey: "school.papLocked",
    cardStepId: "PAP10",
    heroSrc: "/school-hero-pap.webp",
    requiresIntermediate: true,
    steps: PAP_STEPS,
  },
  {
    id: "brasse",
    trackId: BRASSE_TRACK_ID,
    titleKey: "school.brasse",
    leadKey: "school.brasseHomeLead",
    lockedLeadKey: "school.brasseHomeLeadLocked",
    lockedCtaKey: "school.brasseHomeCtaLocked",
    lockedBodyKey: "school.brasseLocked",
    cardStepId: "BRA10",
    heroSrc: "/school-hero-brasse.webp",
    requiresIntermediate: true,
    steps: BRASSE_STEPS,
  },
];

export function getSchoolCourse(courseId) {
  return SCHOOL_COURSES.find((c) => c.id === courseId) || null;
}

export function getSchoolCourseByTrack(trackId) {
  return SCHOOL_COURSES.find((c) => c.trackId === trackId) || null;
}

export function getTrackSteps(trackId) {
  return getSchoolCourseByTrack(trackId)?.steps || [];
}

export function getTrackStep(trackId, stepId) {
  return stepById(getTrackSteps(trackId), stepId);
}

export function nextTrackStepId(trackId, stepId) {
  return nextIdIn(getTrackSteps(trackId), stepId);
}

export function prevTrackStepId(trackId, stepId) {
  return prevIdIn(getTrackSteps(trackId), stepId);
}

/**
 * Cours visibles sur l’Accueil.
 * Pap / brasse hors liste en Débutant / Découverte (ouverts Intermédiaire+).
 */
export function visibleSchoolCourses(profile = {}) {
  return SCHOOL_COURSES.filter((course) => {
    if (course.requiresIntermediate) {
      return !isBeginnerLevelId(profile.level);
    }
    return true;
  });
}

export {
  ANC_TRACK_ID,
  DOS_TRACK_ID,
  VIRAGE_TRACK_ID,
  DEPART_TRACK_ID,
  PAP_TRACK_ID,
  BRASSE_TRACK_ID,
};
