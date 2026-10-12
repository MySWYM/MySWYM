/**
 * Fiche essai J-2 + freeze reopen — tests.
 * Usage: node src/lib/soft-paywall-rules.test.js
 */
import assert from "node:assert/strict";
import { ACCESS_STATUS } from "./access.js";
import {
  shouldOpenTrialStatusAtJ2,
  shouldRepromptFreezeOnForeground,
  FREEZE_BG_MS,
} from "./soft-paywall-rules.js";

const trial = (days, extra = {}) => ({
  status: ACCESS_STATUS.TRIAL,
  trialDaysLeft: days,
  hasPremiumAccess: true,
  cancelAtPeriodEnd: false,
  ...extra,
});

assert.equal(shouldOpenTrialStatusAtJ2({ accessState: trial(3) }), false, "J-3 : pas de fiche auto");
assert.equal(shouldOpenTrialStatusAtJ2({ accessState: trial(1) }), false, "J-1 : pas de fiche auto");
assert.equal(shouldOpenTrialStatusAtJ2({ accessState: trial(2) }), true, "J-2 : fiche une fois");
assert.equal(
  shouldOpenTrialStatusAtJ2({ accessState: trial(2), alreadyShown: true }),
  false,
  "déjà montrée pour cet essai",
);
assert.equal(
  shouldOpenTrialStatusAtJ2({ accessState: trial(2, { cancelAtPeriodEnd: true }) }),
  false,
  "essai résilié : pas de fiche",
);
assert.equal(
  shouldOpenTrialStatusAtJ2({ accessState: { status: ACCESS_STATUS.ACTIVE, trialDaysLeft: 2 } }),
  false,
  "abo payé : pas de fiche",
);

const now = Date.now();
assert.equal(
  shouldRepromptFreezeOnForeground({
    isFrozen: true,
    backgroundedAtMs: now - FREEZE_BG_MS - 1000,
    nowMs: now,
  }),
  true,
  "freeze after 30m",
);
assert.equal(
  shouldRepromptFreezeOnForeground({
    isFrozen: true,
    backgroundedAtMs: now - 60_000,
    nowMs: now,
  }),
  false,
  "freeze too soon",
);

console.log("soft-paywall-rules.test.js OK");
