/**
 * Courbe de score Analyse.
 * Run: node src/analyse/score-color.test.js
 */
import assert from "node:assert/strict";
import {
  clamp01,
  periodCompletionRatio,
  scoreColor,
  SCORE_STOPS,
} from "./score-color.js";

assert.equal(clamp01(-1), 0);
assert.equal(clamp01(2), 1);
assert.equal(clamp01(0.4), 0.4);

assert.equal(scoreColor(0).toLowerCase(), SCORE_STOPS[0].hex.toLowerCase());
assert.equal(scoreColor(1).toLowerCase(), SCORE_STOPS[3].hex.toLowerCase());

const mid = scoreColor(0.5).toLowerCase();
assert.match(mid, /^#[0-9a-f]{6}$/);
assert.notEqual(mid, scoreColor(0).toLowerCase());
assert.notEqual(mid, scoreColor(1).toLowerCase());

assert.equal(
  periodCompletionRatio({ doneMeters: 2000, plannedMeters: 7600 }),
  2000 / 7600,
);
assert.equal(
  periodCompletionRatio({ doneMeters: 0, plannedMeters: 7600 }),
  0,
);
assert.equal(
  periodCompletionRatio({ doneMeters: 9000, plannedMeters: 7600 }),
  1,
);
assert.equal(
  periodCompletionRatio({
    doneMeters: 0,
    plannedMeters: 0,
    doneSessions: 1,
    plannedSessions: 3,
  }),
  1 / 3,
);

console.log("score-color PASS");
