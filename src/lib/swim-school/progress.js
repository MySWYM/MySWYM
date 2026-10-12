/**
 * Progression école : profil, pas le plan.
 * 1 « Oui » = étape validée. Multi-tracks.
 */

import {
  ANC_GATE_STEP_ID,
  ANC_STEPS,
  ANC_TRACK_ID,
  SCHOOL_PROGRESS_VERSION,
  YES_NEEDED,
} from "./anc-track.js";
import { DOS_STEPS, DOS_TRACK_ID } from "./dos-track.js";
import {
  getSchoolCourse,
  getTrackStep,
  getTrackSteps,
  nextTrackStepId,
  VIRAGE_TRACK_ID,
  DEPART_TRACK_ID,
  PAP_TRACK_ID,
  BRASSE_TRACK_ID,
} from "./catalog.js";
import { isBeginnerLevelId, isDecouverteLevelId } from "../onboarding-level-gate.js";
import { isFourNagesDeclared } from "../sports-engine/four-nages-mix.js";

/** Aligné sur `hidesFourNagesChoice` (sans importer le catalog JSX). */
const DIPLOMA_GOAL_IDS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"]);

function profileCanChooseFourNages(profile = {}) {
  if (isBeginnerLevelId(profile.level)) return false;
  const cat = String(profile.category || "");
  const goal = String(profile.goal || "");
  if (cat === "diplome" || DIPLOMA_GOAL_IDS.has(goal)) return false;
  return true;
}

/** Crawl + dos + virage + départ (parcours Débutant / Découverte). */
export const SCHOOL_FOUNDATION_TRACK_IDS = Object.freeze([
  ANC_TRACK_ID,
  DOS_TRACK_ID,
  VIRAGE_TRACK_ID,
  DEPART_TRACK_ID,
]);

/** Les 6 cours école. */
export const SCHOOL_ALL_TRACK_IDS = Object.freeze([
  ...SCHOOL_FOUNDATION_TRACK_IDS,
  PAP_TRACK_ID,
  BRASSE_TRACK_ID,
]);

export { SCHOOL_PROGRESS_VERSION, YES_NEEDED };

export function emptySchoolProgress() {
  return { version: SCHOOL_PROGRESS_VERSION, tracks: {} };
}

export function normalizeSchoolProgress(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const tracksIn = src.tracks && typeof src.tracks === "object" ? src.tracks : {};
  const tracks = {};
  for (const [id, track] of Object.entries(tracksIn)) {
    if (!track || typeof track !== "object") continue;
    const stepsIn = track.steps && typeof track.steps === "object" ? track.steps : {};
    const steps = {};
    for (const [stepId, step] of Object.entries(stepsIn)) {
      if (!step || typeof step !== "object") continue;
      const yesDates = Array.isArray(step.yesDates)
        ? step.yesDates.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
        : [];
      steps[stepId] = {
        yesDates: [...new Set(yesDates)].sort(),
        lastResult: ["yes", "almost", "notyet"].includes(step.lastResult) ? step.lastResult : null,
        easier: step.easier === true,
      };
    }
    tracks[id] = { steps };
  }
  return { version: SCHOOL_PROGRESS_VERSION, tracks };
}

function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function uniqueYesDays(stepState) {
  return Array.isArray(stepState?.yesDates) ? stepState.yesDates.length : 0;
}

export function isStepDone(progress, trackId, stepId) {
  const n = uniqueYesDays(normalizeSchoolProgress(progress).tracks[trackId]?.steps?.[stepId]);
  return n >= YES_NEEDED;
}

export function isTrackPrereqMet(progress, trackId, stepId) {
  const step = getTrackStep(trackId, stepId);
  if (!step) return false;
  if (!step.prereq) return true;
  return isStepDone(progress, trackId, step.prereq);
}

/** @deprecated use isTrackPrereqMet(progress, ANC_TRACK_ID, stepId) */
export function isAncPrereqMet(progress, stepId) {
  return isTrackPrereqMet(progress, ANC_TRACK_ID, stepId);
}

export function currentTrackStepId(progress, trackId) {
  const steps = getTrackSteps(trackId);
  const p = normalizeSchoolProgress(progress);
  for (const step of steps) {
    if (!isStepDone(p, trackId, step.id)) return step.id;
  }
  return steps.length ? steps[steps.length - 1].id : null;
}

export function currentAncStepId(progress) {
  return currentTrackStepId(progress, ANC_TRACK_ID);
}

export function isAncCrawlUnlocked(progress) {
  return isStepDone(progress, ANC_TRACK_ID, ANC_GATE_STEP_ID);
}

export function isTrackComplete(progress, trackId) {
  const steps = getTrackSteps(trackId);
  if (!steps.length) return false;
  return steps.every((s) => isStepDone(progress, trackId, s.id));
}

/**
 * Découverte : crawl → dos → virage → départ.
 * Pap / brasse : Intermédiaire+ seulement, débloqués si crawl + dos terminés.
 * Autres niveaux (hors pap/brasse) : cours visibles ouverts.
 */
export function isSchoolCourseUnlocked(courseId, profile = {}) {
  const course = getSchoolCourse(courseId);
  if (!course) return false;
  const progress = profile.schoolProgress;
  const dec = isDecouverteLevelId(profile.level);
  const beginner = isBeginnerLevelId(profile.level);

  if (course.id === "crawl") return true;

  if (course.requiresIntermediate) {
    if (beginner) return false;
    return isTrackComplete(progress, ANC_TRACK_ID) && isTrackComplete(progress, DOS_TRACK_ID);
  }

  if (!dec) return true;

  if (course.id === "dos") return isAncCrawlUnlocked(progress);
  if (course.id === "virage") return isTrackComplete(progress, DOS_TRACK_ID);
  if (course.id === "depart") return isTrackComplete(progress, VIRAGE_TRACK_ID);
  return false;
}

export function areFoundationSchoolsComplete(progress) {
  return SCHOOL_FOUNDATION_TRACK_IDS.every((trackId) => isTrackComplete(progress, trackId));
}

export function areAllSchoolsComplete(progress) {
  return SCHOOL_ALL_TRACK_IDS.every((trackId) => isTrackComplete(progress, trackId));
}

/**
 * Offre après validation d’une étape (à la place du Bravo).
 * @returns {{ kind: "intermediate" | "four_nages" } | null}
 */
export function resolveSchoolUpgradeOffer(profile = {}, progress = profile.schoolProgress) {
  if (isBeginnerLevelId(profile.level)) {
    if (!areFoundationSchoolsComplete(progress)) return null;
    return { kind: "intermediate" };
  }
  if (!profileCanChooseFourNages(profile)) return null;
  if (isFourNagesDeclared(profile)) return null;
  if (!areAllSchoolsComplete(progress)) return null;
  return { kind: "four_nages" };
}

export function isDecouverteSchoolBlocking(profile = {}) {
  if (!isDecouverteLevelId(profile.level)) return false;
  return !isAncCrawlUnlocked(profile.schoolProgress);
}

export function trackDoneCount(progress, trackId) {
  const p = normalizeSchoolProgress(progress);
  return getTrackSteps(trackId).filter((s) => isStepDone(p, trackId, s.id)).length;
}

export function ancDoneCount(progress) {
  return trackDoneCount(progress, ANC_TRACK_ID);
}

export function dosDoneCount(progress) {
  return trackDoneCount(progress, DOS_TRACK_ID);
}

/**
 * @param {"yes"|"almost"|"notyet"} result
 */
export function applySchoolResult(progress, trackId, stepId, result, now = new Date()) {
  if (!["yes", "almost", "notyet"].includes(result)) {
    return normalizeSchoolProgress(progress);
  }
  const p = normalizeSchoolProgress(progress);
  if (!getTrackStep(trackId, stepId)) return p;
  if (!isTrackPrereqMet(p, trackId, stepId)) return p;

  const track = p.tracks[trackId] || { steps: {} };
  const prev = track.steps[stepId] || { yesDates: [], lastResult: null, easier: false };
  const day = todayIso(now);
  let yesDates = [...prev.yesDates];

  if (result === "yes" && !yesDates.includes(day)) {
    yesDates.push(day);
    yesDates.sort();
  }

  track.steps[stepId] = {
    yesDates,
    lastResult: result,
    easier: result === "notyet" ? true : prev.easier,
  };
  p.tracks[trackId] = track;
  return p;
}

export function schoolStepView(progress, trackId, stepId) {
  const step = getTrackStep(trackId, stepId);
  if (!step) return null;
  const p = normalizeSchoolProgress(progress);
  const state = p.tracks[trackId]?.steps?.[stepId] || { yesDates: [], lastResult: null, easier: false };
  const done = uniqueYesDays(state) >= YES_NEEDED;
  const unlocked = isTrackPrereqMet(p, trackId, stepId);
  const steps = getTrackSteps(trackId);
  const idx = steps.findIndex((s) => s.id === stepId);
  return {
    ...step,
    trackId,
    unlocked,
    done,
    yesCount: uniqueYesDays(state),
    yesNeeded: YES_NEEDED,
    easier: state.easier === true && !done,
    nextId: nextTrackStepId(trackId, stepId),
    stepNumber: idx < 0 ? null : idx + 1,
  };
}

export function schoolAncStepView(progress, stepId) {
  return schoolStepView(progress, ANC_TRACK_ID, stepId);
}

export {
  ANC_STEPS,
  ANC_TRACK_ID,
  DOS_STEPS,
  DOS_TRACK_ID,
  VIRAGE_TRACK_ID,
  DEPART_TRACK_ID,
};
