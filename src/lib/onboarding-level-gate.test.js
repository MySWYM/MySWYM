/**
 * Usage : node src/lib/onboarding-level-gate.test.js
 */
import assert from "node:assert/strict";
import { isBeginnerBlockedForGoal, isBeginnerLevelId, isDebutantLevelId, isAvanceLevelId, impliedSwimStyleForLevel } from "./onboarding-level-gate.js";

assert.equal(isBeginnerBlockedForGoal("triathlon_xs"), false);
assert.equal(isBeginnerBlockedForGoal("triathlon_sprint"), false);
assert.equal(isBeginnerBlockedForGoal("triathlon_olympic"), true);
assert.equal(isBeginnerBlockedForGoal("triathlon_half"), true);
assert.equal(isBeginnerBlockedForGoal("triathlon_ironman"), true);
assert.equal(isBeginnerBlockedForGoal("open_water_short"), false);
assert.equal(isBeginnerBlockedForGoal("open_water_mid"), true);
assert.equal(isBeginnerBlockedForGoal("open_water_long"), true);
assert.equal(isBeginnerBlockedForGoal("open_water_5k"), true);
assert.equal(isBeginnerBlockedForGoal("open_water_25k"), true);
assert.equal(isBeginnerBlockedForGoal("progression"), false);

assert.equal(isBeginnerLevelId("régulier"), true);
assert.equal(isBeginnerLevelId("sportif"), false);

assert.equal(isDebutantLevelId("régulier"), true);
assert.equal(isDebutantLevelId("regulier"), true);
assert.equal(isDebutantLevelId("sportif"), false);
assert.equal(isDebutantLevelId("découverte"), false);

assert.equal(isAvanceLevelId("performance"), true);
assert.equal(isAvanceLevelId("advanced"), true);
assert.equal(isAvanceLevelId("sportif"), false);
assert.equal(impliedSwimStyleForLevel("régulier"), "crawl");
assert.equal(impliedSwimStyleForLevel("performance"), "4_nages");
assert.equal(impliedSwimStyleForLevel("sportif"), null);

console.log("ok");
