/**
 * Soft paywall essai + freeze reopen — tests.
 * Usage: node src/lib/soft-paywall-rules.test.js
 */
import assert from "node:assert/strict";
import { ACCESS_STATUS } from "./access.js";
import {
  calendarDayKey,
  shouldOfferTrialSoftPaywall,
  shouldRepromptFreezeOnForeground,
  FREEZE_BG_MS,
} from "./soft-paywall-rules.js";

const trial = (days) => ({
  status: ACCESS_STATUS.TRIAL,
  trialDaysLeft: days,
  hasPremiumAccess: true,
});

assert.equal(
  shouldOfferTrialSoftPaywall({
    accessState: trial(6),
    trigger: "app_open",
    lastShownDayKey: "",
  }),
  false,
  "J-6: no app_open",
);
assert.equal(
  shouldOfferTrialSoftPaywall({
    accessState: trial(6),
    trigger: "value_action",
    lastShownDayKey: "",
  }),
  true,
  "J-6: value_action ok",
);
assert.equal(
  shouldOfferTrialSoftPaywall({
    accessState: trial(2),
    trigger: "app_open",
    lastShownDayKey: "",
  }),
  true,
  "J-2: app_open ok",
);
assert.equal(
  shouldOfferTrialSoftPaywall({
    accessState: trial(2),
    trigger: "app_open",
    lastShownDayKey: calendarDayKey(),
  }),
  false,
  "same day blocked",
);
assert.equal(
  shouldOfferTrialSoftPaywall({
    accessState: trial(2),
    isPremium: true,
    trigger: "app_open",
  }),
  false,
  "premium skip",
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
