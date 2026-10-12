import assert from "node:assert/strict";
import { ACCESS_STATUS } from "./access.js";
import { canStopTrial, formatTrialChargeDate, trialSubscriptionHint } from "./trial-stop.js";

const t = (key, vars) => (vars?.date ? `${key}:${vars.date}` : key);

const live = {
  status: ACCESS_STATUS.TRIAL,
  trialEndsAt: "2026-10-19T10:00:00.000Z",
  cancelAtPeriodEnd: false,
};

assert.equal(canStopTrial(live, true), true);
assert.equal(canStopTrial({ ...live, cancelAtPeriodEnd: true }, true), false);
assert.equal(canStopTrial(live, false), false);
assert.equal(canStopTrial({ status: ACCESS_STATUS.ACTIVE }, true), false);

assert.equal(
  trialSubscriptionHint(t, live, true, "fr"),
  `settings.trialCharge:${formatTrialChargeDate(live.trialEndsAt, "fr")}`,
);
assert.equal(
  trialSubscriptionHint(t, { ...live, cancelAtPeriodEnd: true }, true, "fr"),
  "settings.trialStopped",
);
assert.equal(trialSubscriptionHint(t, live, false, "fr"), null);
assert.match(formatTrialChargeDate(live.trialEndsAt, "fr"), /19/);
