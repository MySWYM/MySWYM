/**
 * Usage : node src/lib/sports-engine/race-event.test.js
 */
import assert from "node:assert/strict";
import {
  canonicalizeGoal,
  eventBandFromGoal,
  raceSwimMetersFromGoal,
  scaleMaxContinuousForRaceBand,
} from "./race-event.js";

assert.equal(canonicalizeGoal("open_water_25k"), "open_water_long");
assert.equal(canonicalizeGoal("open_water_5k"), "open_water_mid");
assert.equal(canonicalizeGoal("open_water_1k"), "open_water_short");
assert.equal(canonicalizeGoal("open_water_mid"), "open_water_mid");
assert.equal(canonicalizeGoal("triathlon_sprint"), "triathlon_sprint");

assert.equal(eventBandFromGoal("triathlon_xs"), "short");
assert.equal(eventBandFromGoal("triathlon_olympic"), "mid");
assert.equal(eventBandFromGoal("triathlon_ironman"), "long");
assert.equal(eventBandFromGoal("open_water_500"), "short");
assert.equal(eventBandFromGoal("open_water_2_5k"), "mid");
assert.equal(eventBandFromGoal("open_water_10k"), "long");

assert.equal(raceSwimMetersFromGoal("triathlon_xs"), 400);
assert.equal(raceSwimMetersFromGoal("triathlon_ironman"), 3800);
assert.equal(raceSwimMetersFromGoal("open_water_long"), 10000);

assert.equal(scaleMaxContinuousForRaceBand(400, { level: "sportif", raceBand: "short" }), 300);
assert.equal(scaleMaxContinuousForRaceBand(400, { level: "sportif", raceBand: "long" }), 500);
assert.equal(scaleMaxContinuousForRaceBand(50, { level: "decouverte", raceBand: "long" }), 50);
assert.equal(
  scaleMaxContinuousForRaceBand(400, { level: "sportif", raceBand: "long", sessionIntent: "reprise" }),
  400,
);
assert.equal(scaleMaxContinuousForRaceBand(400, { level: "sportif", goal: "open_water_long" }), 500);

import { buildSportProfile } from "./types.js";
const longOw = buildSportProfile({ goal: "open_water_25k", level: "sportif" });
assert.equal(longOw.goal, "open_water_long");
assert.equal(longOw.raceBand, "long");
assert.equal(longOw.raceSwimMeters, 10000);
assert.equal(longOw.objectifV1, "eau_libre");

console.log("ok");
