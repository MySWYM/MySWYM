import assert from "node:assert/strict";
import {
  getAccessState,
  ACCESS_STATUS,
  isAccessMetadataPending,
  isLiveStripeBilling,
  shouldShowTrialFreeze,
  isFreshSignup,
  shouldAwaitCardlessTrial,
  hasUnlockedPremiumAccess,
  canAccessSessions,
  shouldShowTrialCountdown,
  trialDayIndex,
  resolveTrialCountdown,
} from "./access.js";

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
    subscription: "premium",
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_used: true,
  }));
  assert.equal(state.hasPremiumAccess, true, "trial sans trial_ends_at : ne pas geler");
  assert.equal(canAccessSessions(state, false), true, "séances ouvertes pendant essai");
  assert.equal(shouldShowTrialCountdown(state), true, "bandeau essai visible sans ends_at");
  assert.equal(trialDayIndex(state), 1, "jour 1/7 si 7j restants");
}

{
  const awaiting = getAccessState(userWith({
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(shouldShowTrialCountdown(awaiting), false, "expired sans accès : pas de pastille");
  assert.equal(
    shouldShowTrialCountdown(awaiting, { hasSessionAccess: true }),
    true,
    "séances ouvertes sans abo = pastille essai",
  );
  assert.equal(resolveTrialCountdown(awaiting, { hasSessionAccess: true })?.daysLeft, 7);
}

{
  const legacyPremiumTrial = getAccessState(userWith({
    subscription: "premium",
    trial_used: true,
    trial_ends_at: new Date(Date.now() + 4 * 86400000).toISOString(),
  }));
  assert.equal(legacyPremiumTrial.status, ACCESS_STATUS.TRIAL, "premium sans status + fin essai = trial");
  assert.equal(shouldShowTrialCountdown(legacyPremiumTrial), true);
  assert.equal(trialDayIndex(legacyPremiumTrial), 4);
}

{
  const expired = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
    trial_used: true,
    trial_ends_at: new Date(Date.now() - 86400000).toISOString(),
  }));
  assert.equal(canAccessSessions(expired, false), false, "après essai : pas de séances");
  assert.equal(canAccessSessions(expired, true), false, "gelé + trial_used : ignore flag stale");
}

{
  const state = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(state.hasPremiumAccess, false);
  assert.equal(state.canUseMultiPlan, false, "multi-plans retired, always false");
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
  const expiredUsedNoWindow = isAccessMetadataPending(userWith({
    subscription_status: ACCESS_STATUS.EXPIRED,
    trial_used: true,
  }));
  assert.equal(expiredUsedNoWindow, false, "EXPIRED + trial_used = gel, même sans trial_ends_at");
  assert.equal(
    canAccessSessions(getAccessState(userWith({
      subscription_status: ACCESS_STATUS.EXPIRED,
      trial_used: true,
    })), true),
    false,
    "flag stale ne doit pas rouvrir les séances gelées",
  );
}

{
  const trialMissingWindow = isAccessMetadataPending(userWith({
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_used: true,
  }));
  assert.equal(trialMissingWindow, false, "TRIAL sans ends_at a déjà hasPremiumAccess");
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
  assert.equal(trial.canManageSubscription, false, "essai : pas Modifier / Résilier");
}

{
  const paying = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
  }));
  assert.equal(paying.canUseBuddies, true);
  assert.equal(paying.canManageSubscription, true, "abo payant : gestion App Store / Stripe");
}

{
  const canceled = getAccessState(userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.CANCELED,
    subscription_end: nowSec + 86400,
    cancel_at_period_end: true,
  }));
  assert.equal(canceled.canUseBuddies, true, "paid period remaining keeps buddies");
  assert.equal(canceled.canManageSubscription, true, "période payée restante : encore gérable");
}

{
  const expired = getAccessState(userWith({
    subscription: "free",
    subscription_status: ACCESS_STATUS.EXPIRED,
  }));
  assert.equal(expired.canUseBuddies, false);
  assert.equal(expired.canManageSubscription, false);
}

{
  const fresh = {
    created_at: new Date().toISOString(),
    app_metadata: {
      subscription: "free",
      subscription_status: ACCESS_STATUS.EXPIRED,
      trial_used: true,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() - 1000).toISOString(),
    },
  };
  assert.equal(isFreshSignup(fresh), true);
  assert.equal(
    shouldShowTrialFreeze(fresh, { accessSynced: true }),
    false,
    "compte neuf : pas de freeze même si metadata stale expired",
  );
  // /inscription ne doit pas signOut un compte qui vient d’être créé.
  assert.equal(isFreshSignup({ created_at: new Date().toISOString() }), true, "signup just now stays logged in");
}

{
  const oldExpired = {
    created_at: "2026-01-01T10:00:00.000Z",
    app_metadata: {
      subscription: "free",
      subscription_status: ACCESS_STATUS.EXPIRED,
      trial_used: true,
      trial_started_at: "2026-01-01T10:00:00.000Z",
      trial_ends_at: "2026-01-08T10:00:00.000Z",
    },
  };
  assert.equal(isFreshSignup(oldExpired), false);
  assert.equal(shouldShowTrialFreeze(oldExpired, { accessSynced: false }), false, "attendre le sync");
  assert.equal(shouldShowTrialFreeze(oldExpired, { accessSynced: true }), true);
  assert.equal(shouldShowTrialFreeze(oldExpired, { accessSynced: true, generatingPlan: true }), false);
  assert.equal(shouldShowTrialFreeze(oldExpired, { accessSynced: true, revealActive: true }), false);
}

{
  const emptyMeta = { created_at: new Date().toISOString(), app_metadata: {} };
  assert.equal(isAccessMetadataPending(emptyMeta), true);
  assert.equal(shouldShowTrialFreeze(emptyMeta, { accessSynced: true }), false);
}

{
  const stripePaid = userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
    billing_provider: "stripe",
    stripe_customer_id: "cus_1",
  });
  assert.equal(isLiveStripeBilling(stripePaid), true);
}

{
  const stripeLegacy = userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
    stripe_customer_id: "cus_1",
  });
  assert.equal(isLiveStripeBilling(stripeLegacy), true, "customer id + paid access");
}

{
  const trial = userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.TRIAL,
    trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(isLiveStripeBilling(trial), false, "essai 7j peut passer à l’App Store");
}

{
  const applePaid = userWith({
    subscription: "premium",
    subscription_status: ACCESS_STATUS.ACTIVE,
    subscription_end: nowSec + 86400,
    billing_provider: "apple",
  });
  assert.equal(isLiveStripeBilling(applePaid), false);
}

{
  const anon = { id: "a1", is_anonymous: true, created_at: new Date().toISOString(), app_metadata: {} };
  assert.equal(isAccessMetadataPending(anon), true, "anonymous waits for trial sync like signup");
  assert.equal(isFreshSignup(anon), true, "anonymous gets fresh signup grace");
  assert.equal(
    shouldShowTrialFreeze(anon, { accessSynced: true }),
    false,
    "anonymous fresh signup no freeze yet",
  );
  assert.equal(shouldAwaitCardlessTrial(anon), true, "anonymous awaits 7j before lock");
  assert.equal(hasUnlockedPremiumAccess(anon), true, "anonymous unlocked while awaiting trial");
}

{
  const anonTrial = {
    id: "a2",
    is_anonymous: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    app_metadata: {
      subscription: "premium",
      subscription_status: ACCESS_STATUS.TRIAL,
      trial_used: true,
      trial_ends_at: new Date(Date.now() + 6 * 86400000).toISOString(),
    },
  };
  assert.equal(getAccessState(anonTrial).hasPremiumAccess, true, "anonymous on trial is premium");
  assert.equal(shouldShowTrialFreeze(anonTrial, { accessSynced: true }), false, "trial anon not frozen");
}

console.log("access.test.js OK");
