/**
 * Tests messages adaptation coach.
 * Usage: node src/lib/adapt-message.test.js
 */
import { formatCoachAdaptLine, formatFeedbackToast } from "./adapt-message.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(formatCoachAdaptLine({ volumeAdj: 0.88 }).includes("allégé"), "alléger");
assert(formatCoachAdaptLine({ volumeAdj: 1.12 }).includes("relevé"), "relever");
assert(formatCoachAdaptLine({ volumeAdj: 1, _lastAdapt: "hold" }).includes("maintient"), "hold");
assert(formatCoachAdaptLine({ volumeAdj: 1 }) == null, "neutre");

assert(formatFeedbackToast({ isPremium: false, legacyRating: "hard" }).includes("Premium"), "free");
assert(formatFeedbackToast({ isPremium: true, plan: { volumeAdj: 0.9 } }).includes("allégé"), "premium");

console.log("adapt-message.test.js OK");
