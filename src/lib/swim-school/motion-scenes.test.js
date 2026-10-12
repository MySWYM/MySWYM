import assert from "node:assert/strict";
import { SCHOOL_COURSES } from "./catalog.js";
import {
  assertMotionCoverage,
  getMotionScene,
  schoolGearForStep,
} from "./motion-scenes.js";
import { ANC_STEPS } from "./anc-track.js";

for (const course of SCHOOL_COURSES) {
  assert.equal(assertMotionCoverage(course.trackId), true, `motion ${course.id}`);
  for (const step of course.steps) {
    const scene = getMotionScene(step.id);
    assert.ok(scene, step.id);
    assert.ok(scene.path.startsWith("/school-motion/"), step.id);
  }
}

assert.deepEqual(schoolGearForStep("ANC1"), []);
assert.equal(schoolGearForStep("ANC2").map((g) => g.id).join(","), "palmes,tuba");
assert.deepEqual(schoolGearForStep("DOS1"), []);
assert.equal(schoolGearForStep("DOS4").map((g) => g.id).join(","), "palmes");

const g7 = ANC_STEPS.find((s) => s.id === "ANC7");
assert.match(g7.title, /retour sous l/i);

console.log("motion-scenes ok");
