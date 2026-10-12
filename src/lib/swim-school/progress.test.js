import assert from "node:assert/strict";
import { ANC_STEPS, YES_NEEDED } from "./anc-track.js";
import { DOS_STEPS } from "./dos-track.js";
import { VIRAGE_STEPS } from "./virage-track.js";
import { DEPART_STEPS } from "./depart-track.js";
import { PAP_STEPS } from "./pap-track.js";
import { BRASSE_STEPS } from "./brasse-track.js";
import { SCHOOL_COURSES, visibleSchoolCourses } from "./catalog.js";
import {
  applySchoolResult,
  ancDoneCount,
  currentAncStepId,
  currentTrackStepId,
  dosDoneCount,
  emptySchoolProgress,
  isAncCrawlUnlocked,
  isAncPrereqMet,
  isDecouverteSchoolBlocking,
  isSchoolCourseUnlocked,
  isStepDone,
  isTrackComplete,
  normalizeSchoolProgress,
  schoolStepView,
} from "./progress.js";

assert.equal(YES_NEEDED, 1, "1 Oui suffit");
assert.equal(SCHOOL_COURSES.length, 6, "6 cours");
assert.equal(ANC_STEPS.length, 18);
assert.equal(DOS_STEPS.length, 12);
assert.equal(VIRAGE_STEPS.length, 10);
assert.equal(DEPART_STEPS.length, 10);
assert.equal(PAP_STEPS.length, 10);
assert.equal(BRASSE_STEPS.length, 10);

const allSteps = [
  ...ANC_STEPS,
  ...DOS_STEPS,
  ...VIRAGE_STEPS,
  ...DEPART_STEPS,
  ...PAP_STEPS,
  ...BRASSE_STEPS,
];
for (const step of allSteps) {
  assert.ok(step.cue && step.bonSi && step.pasEncore, `fields ${step.id}`);
  assert.equal(
    /ANC\d+|DOS\d+|AVC\d+|ADC\d+|PAP\d+|BRA\d+/i.test(
      [step.title, step.cue, step.objectif, step.bonSi, step.pasEncore, step.avoid, step.dosage].join(" "),
    ),
    false,
    `no tech id in copy ${step.id}`,
  );
}
assert.equal(new Set(allSteps.map((s) => s.id)).size, allSteps.length, "unique step ids");

const empty = emptySchoolProgress();
assert.equal(currentAncStepId(empty), "ANC1");
assert.equal(currentTrackStepId(empty, "dos"), "DOS1");
assert.equal(currentTrackStepId(empty, "virage"), "AVC1");
assert.equal(currentTrackStepId(empty, "depart"), "ADC1");
assert.equal(isAncPrereqMet(empty, "ANC1"), true);
assert.equal(isAncCrawlUnlocked(empty), false);
assert.equal(isDecouverteSchoolBlocking({ level: "decouverte" }), true);

assert.equal(isSchoolCourseUnlocked("crawl", { level: "decouverte" }), true);
assert.equal(isSchoolCourseUnlocked("dos", { level: "decouverte" }), false);
assert.equal(isSchoolCourseUnlocked("virage", { level: "decouverte" }), false);
assert.equal(isSchoolCourseUnlocked("depart", { level: "decouverte" }), false);
assert.equal(isSchoolCourseUnlocked("pap", { level: "decouverte" }), false);
assert.equal(isSchoolCourseUnlocked("brasse", { level: "decouverte" }), false);
assert.equal(isSchoolCourseUnlocked("pap", { level: "regulier" }), true);
assert.equal(isSchoolCourseUnlocked("dos", { level: "regulier" }), true);

assert.equal(visibleSchoolCourses({ level: "decouverte" }).map((c) => c.id).join(","), "crawl,dos,virage,depart");
assert.equal(visibleSchoolCourses({ level: "regulier" }).length, 6);

let p = empty;
const day1 = new Date("2026-10-10T10:00:00");
p = applySchoolResult(p, "anc", "ANC1", "yes", day1);
assert.equal(isStepDone(p, "anc", "ANC1"), true);
p = applySchoolResult(p, "virage", "AVC1", "yes", day1);
assert.equal(isStepDone(p, "virage", "AVC1"), true);
p = applySchoolResult(p, "pap", "PAP1", "yes", day1);
assert.equal(schoolStepView(p, "pap", "PAP2")?.unlocked, true);

const dirty = normalizeSchoolProgress({
  version: 9,
  tracks: { anc: { steps: { ANC1: { yesDates: ["nope", "2026-10-10"], lastResult: "maybe" } } } },
});
assert.deepEqual(dirty.tracks.anc.steps.ANC1.yesDates, ["2026-10-10"]);

let crawl = emptySchoolProgress();
for (const step of ANC_STEPS) {
  if (step.id === "ANC18") break;
  crawl = applySchoolResult(crawl, "anc", step.id, "yes", day1);
}
assert.equal(isAncCrawlUnlocked(crawl), true);
assert.equal(ancDoneCount(crawl), 17);
assert.equal(isSchoolCourseUnlocked("dos", { level: "decouverte", schoolProgress: crawl }), true);
assert.equal(isSchoolCourseUnlocked("virage", { level: "decouverte", schoolProgress: crawl }), false);

let afterDos = crawl;
for (const step of DOS_STEPS) {
  afterDos = applySchoolResult(afterDos, "dos", step.id, "yes", day1);
}
assert.equal(isTrackComplete(afterDos, "dos"), true);
assert.equal(dosDoneCount(afterDos), 12);
assert.equal(isSchoolCourseUnlocked("virage", { level: "decouverte", schoolProgress: afterDos }), true);
assert.equal(isSchoolCourseUnlocked("depart", { level: "decouverte", schoolProgress: afterDos }), false);

let afterVirage = afterDos;
for (const step of VIRAGE_STEPS) {
  afterVirage = applySchoolResult(afterVirage, "virage", step.id, "yes", day1);
}
assert.equal(isSchoolCourseUnlocked("depart", { level: "decouverte", schoolProgress: afterVirage }), true);

console.log("ok");
