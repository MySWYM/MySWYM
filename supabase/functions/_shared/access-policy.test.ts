import assert from "node:assert/strict";
import {
  ACCESS_STATUS,
  buildTrialState,
  hasConsumedValidTrialWindow,
  hasEntitlement,
  resolveAccessWithoutStripeSub,
  shouldGrantCardlessTrial,
} from "./access-policy.ts";

const userId = "user-1";
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

{
  const granted = buildTrialState(userId, {
    trial_started_at: iso(now - 20 * 86400000),
    trial_ends_at: iso(now - 13 * 86400000),
    trial_used: true,
  });
  assert.equal(granted.access_status, ACCESS_STATUS.trial);
  assert.equal(granted.trial_used, true);
  const start = Date.parse(granted.trial_started_at);
  const end = Date.parse(granted.trial_ends_at);
  assert.ok(start >= now - 5000, "trial start is now, not a stale leftover");
  assert.ok(end - start >= 6.5 * 86400000, "grant is a fresh 7-day window");
  assert.ok(hasEntitlement(granted));
}

{
  assert.equal(shouldGrantCardlessTrial(null), true);
  assert.equal(shouldGrantCardlessTrial({ trial_used: false }), true);
}

{
  const consumed = {
    access_status: ACCESS_STATUS.expired,
    trial_used: true,
    trial_started_at: iso(now - 10 * 86400000),
    trial_ends_at: iso(now - 3 * 86400000),
  };
  assert.equal(hasConsumedValidTrialWindow(consumed), true);
  assert.equal(shouldGrantCardlessTrial(consumed, { userCreatedAt: iso(now - 30 * 86400000) }), false);
}

{
  const endedBeforeSignup = {
    access_status: ACCESS_STATUS.expired,
    trial_used: true,
    trial_started_at: iso(now - 20 * 86400000),
    trial_ends_at: iso(now - 13 * 86400000),
  };
  assert.equal(
    shouldGrantCardlessTrial(endedBeforeSignup, { userCreatedAt: iso(now - 60_000) }),
    true,
    "Stripe leftover that ended before this Auth user existed must re-grant",
  );
}

{
  const instantExpire = {
    access_status: ACCESS_STATUS.trial,
    trial_used: true,
    trial_started_at: iso(now),
    trial_ends_at: iso(now - 1000),
  };
  assert.equal(hasConsumedValidTrialWindow(instantExpire), false);
  assert.equal(shouldGrantCardlessTrial(instantExpire), true);
}

{
  const next = resolveAccessWithoutStripeSub(userId, null, null);
  assert.equal(next.access_status, ACCESS_STATUS.trial);
  assert.ok(hasEntitlement(next));
}

{
  const leftoverRow = {
    user_id: userId,
    access_status: ACCESS_STATUS.expired,
    trial_started_at: iso(now - 20 * 86400000),
    trial_ends_at: iso(now - 13 * 86400000),
    trial_used: true,
    subscription_started_at: null,
    subscription_ends_at: null,
    cancel_at_period_end: false,
    stripe_customer_id: "cus_old",
  };
  const recovered = resolveAccessWithoutStripeSub(userId, leftoverRow, "cus_old", {
    userCreatedAt: iso(now - 1000),
  });
  assert.equal(recovered.access_status, ACCESS_STATUS.trial);
  assert.ok(hasEntitlement(recovered));
  assert.equal(recovered.stripe_customer_id, "cus_old");
}

console.log("access-policy.test.ts OK");
