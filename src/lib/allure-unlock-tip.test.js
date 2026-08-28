/**
 * Usage : node src/lib/allure-unlock-tip.test.js
 */
import assert from "node:assert/strict";
import {
  shouldShowAllureUnlockTip,
} from "./allure-unlock-tip.js";

assert.equal(
  shouldShowAllureUnlockTip({}, { dismissed: false, hasSwum: false, hasPlan: true }),
  false,
  "pas avant 1re séance",
);
assert.equal(
  shouldShowAllureUnlockTip({}, { dismissed: false, hasSwum: true, hasPlan: false }),
  false,
  "pas sans plan",
);
assert.equal(
  shouldShowAllureUnlockTip({}, { dismissed: true, hasSwum: true, hasPlan: true }),
  false,
  "déjà vu",
);
assert.equal(
  shouldShowAllureUnlockTip({}, { dismissed: false, hasSwum: true, hasPlan: true }),
  true,
  "après 1re séance + plan",
);

console.log("allure-unlock-tip.test.js OK");
