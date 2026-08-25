import assert from "node:assert/strict";
import { getAccessState, ACCESS_STATUS, isAccessMetadataPending } from "./access.js";

function userWith(meta) {
  return { app_metadata: meta };
}

const nowSec = Math.floor(Date.now() / 1000);

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
  }));
  assert.equal(state.hasPremiumAccess, true);
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec - 60,
  }));
  assert.equal(state.hasPremiumAccess, false, "stale active after period end must lose premium");
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.CANCELED,
    subscription_end: nowSec + 86400,
    cancel_at_period_end: true,
  }));
  assert.equal(state.hasPremiumAccess, true, "canceled keeps access until period end");
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.CANCELED,
    subscription_end: nowSec - 10,
    cancel_at_period_end: true,
  }));
  assert.equal(state.hasPremiumAccess, false);
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.CANCELED,
    subscription_end: null,
  }));
  assert.equal(state.hasPremiumAccess, false, "canceled without end date = no premium");
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
  }));
  assert.equal(state.hasPremiumAccess, true);
}

{
  const state = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_ends_at: new Date(Date.now() - 1000).toISOString(),
  }));
  assert.equal(state.hasPremiumAccess, false);
}

{
  const state = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(state.hasPremiumAccess, false);
  assert.equal(state.canUseMultiPlan, false, "multi-plans retired — always false");
}

{
  const premium = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
  }));
  assert.equal(premium.canUseMultiPlan, false, "even premium: single active plan only");
}

{
  const state = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
    trial_used: true,
  }));
  assert.equal(state.hasPremiumAccess, false);
  assert.equal(state.isFrozen, true);
}

{
  const pendingExpiredUnused = isAccessMetadataPending(userWith({
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(pendingExpiredUnused, true, "expired without trial_used can still receive cardless trial");
}

{
  const missingWindow = isAccessMetadataPending(userWith({
    subscription_status: ACCESS_STATUS.EXPIRED,
    trial_used: true,
  }));
  assert.equal(missingWindow, true, "trial_used without trial_ends_at is not a consumed trial");
}

{
  const created = "2026-08-01T10:00:00.000Z";
  const consumed = isAccessMetadataPending({
    created_at: created,
    app_metadata: {
      subscription_status: ACCESS_STATUS.EXPIRED,
      trial_used: true,
      trial_started_at: created,
      trial_ends_at: "2026-08-08T10:00:00.000Z",
    },
  });
  assert.equal(consumed, false, "7-day window that started after signup is consumed");
}

{
  const leftover = isAccessMetadataPending({
    created_at: "2026-08-22T16:00:00.000Z",
    app_metadata: {
      subscription_status: ACCESS_STATUS.EXPIRED,
      trial_used: true,
      trial_started_at: "2026-08-01T10:00:00.000Z",
      trial_ends_at: "2026-08-08T10:00:00.000Z",
    },
  });
  assert.equal(leftover, true, "trial that ended before the account existed is not consumed");
}

{
  const trial = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
  }));
  assert.equal(trial.hasPremiumAccess, true);
  assert.equal(trial.canUseBuddies, false, "trial must not access buddy PII matching");
}

{
  const paying = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
  }));
  assert.equal(paying.canUseBuddies, true);
}

{
  const canceled = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.CANCELED,
    subscription_end: nowSec + 86400,
    cancel_at_period_end: true,
  }));
  assert.equal(canceled.canUseBuddies, true, "paid period remaining keeps buddies");
}

{
  const expired = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(expired.canUseBuddies, false);
}

console.log("access.test.js OK");
