/**
 * Usage: node src/lib/app-store-review.test.js
 */
import assert from "node:assert/strict";
import {
  countFinishedSessions,
  shouldRequestAppStoreReview,
} from "./app-store-review.js";

const base = {
  isNative: true,
  alreadyAsked: false,
  completedCount: 3,
  rating: "ok",
  hasPain: false,
};

assert.equal(shouldRequestAppStoreReview(base), true);
assert.equal(shouldRequestAppStoreReview({ ...base, completedCount: 2 }), false);
assert.equal(shouldRequestAppStoreReview({ ...base, completedCount: 8 }), true);
assert.equal(shouldRequestAppStoreReview({ ...base, isNative: false }), false);
assert.equal(shouldRequestAppStoreReview({ ...base, alreadyAsked: true }), false);
assert.equal(shouldRequestAppStoreReview({ ...base, rating: "too_hard" }), false);
assert.equal(shouldRequestAppStoreReview({ ...base, rating: "hard" }), false);
assert.equal(shouldRequestAppStoreReview({ ...base, rating: "too_easy" }), true);
assert.equal(shouldRequestAppStoreReview({ ...base, rating: null }), true);
assert.equal(shouldRequestAppStoreReview({ ...base, hasPain: true }), false);

assert.equal(countFinishedSessions({
  weeks: [{ sessions: [{ completed: true }, { completed: false }] }],
}), 1);
assert.equal(countFinishedSessions({
  isSessionLoop: true,
  weeks: [{ sessions: [{ completed: true }] }],
  history: [{ completed: true }, { completed: false }, { completed: true }],
}), 3);

console.log("app-store-review.test.js: ok");
