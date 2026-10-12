import assert from "node:assert/strict";
import { splitGlossaryText, SCHOOL_GLOSSARY } from "./glossary.js";
import { chaptersForTrack, stepNumberFromId } from "./chapters.js";
import { SCHOOL_COURSES } from "./catalog.js";

const parts = splitGlossaryText("Le rattrapé puis l’opposition, respiration 3 temps.");
assert.equal(parts.some((p) => p.termKey === "rattrapé"), true);
assert.equal(parts.some((p) => p.termKey === "opposition"), true);
assert.ok(SCHOOL_GLOSSARY["échange"].body.length > 20);

for (const course of SCHOOL_COURSES) {
  const chapters = chaptersForTrack(course.trackId);
  const covered = new Set(chapters.flatMap((c) => c.stepIds));
  assert.equal(covered.size, course.steps.length, `chapters ${course.id}`);
  for (const step of course.steps) {
    assert.equal(covered.has(step.id), true, `${course.id} ${step.id}`);
  }
  assert.equal(stepNumberFromId(course.steps[0].id, course.trackId), 1);
}

console.log("glossary/chapters ok");
