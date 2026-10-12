import assert from "node:assert/strict";
import { ACCESS_STATUS } from "./access.js";
import {
  canStopTrial,
  formatTrialChargeDate,
  isLiveTrialAccess,
  stopTrialTarget,
  subscriptionPanelMode,
  trialSubscriptionHint,
} from "./trial-stop.js";

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

const futureEnd = new Date(Date.now() + 86_400_000).toISOString();
assert.equal(subscriptionPanelMode({ status: ACCESS_STATUS.ACTIVE }, true), "manage");
assert.equal(
  subscriptionPanelMode({ status: ACCESS_STATUS.CANCELED, subscriptionEndsAt: futureEnd }, true),
  "manage",
);
assert.equal(subscriptionPanelMode(live, true), "stop_trial");
assert.equal(subscriptionPanelMode({ ...live, cancelAtPeriodEnd: true }, true), "trial_stopped");
assert.equal(subscriptionPanelMode({ status: ACCESS_STATUS.EXPIRED }, false), "subscribe");
assert.equal(subscriptionPanelMode({ status: ACCESS_STATUS.TRIAL }, false), "subscribe");

const apple = { billingProvider: "apple" };
const stripe = { billingProvider: "stripe" };
assert.equal(stopTrialTarget(apple, { nativeIos: true }), "apple_settings");
assert.equal(stopTrialTarget(apple, { nativeIos: false }), "apple_toast");
assert.equal(stopTrialTarget(stripe, { nativeIos: true }), "stripe_portal");
assert.equal(stopTrialTarget(stripe, { nativeIos: false }), "stripe_portal");
assert.equal(stopTrialTarget({}, { nativeIos: true }), "stripe_portal");

assert.equal(
  trialSubscriptionHint(t, { ...live, trialEndsAt: null }, true, "fr"),
  "settings.trialChargePlain",
);
assert.equal(
  trialSubscriptionHint(t, { ...live, trialEndsAt: "pas-une-date" }, true, "fr"),
  "settings.trialChargePlain",
);

assert.equal(formatTrialChargeDate(live.trialEndsAt, "en"), "19 October");
assert.equal(formatTrialChargeDate(live.trialEndsAt, "ja"), "10月19日");

assert.equal(isLiveTrialAccess({ status: ACCESS_STATUS.TRIAL, hasPremiumAccess: true }), true);
assert.equal(isLiveTrialAccess({ status: ACCESS_STATUS.TRIAL, hasPremiumAccess: false }), false);
assert.equal(isLiveTrialAccess({ status: ACCESS_STATUS.ACTIVE, hasPremiumAccess: true }), false);
assert.equal(isLiveTrialAccess(null), false);
