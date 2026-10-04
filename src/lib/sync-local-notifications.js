/**
 * Rebuild + schedule local notifications from plan / access state.
 */
import { findNextSession } from "./plan-reveal.js";
import { computeStats } from "./plan-stats.js";
import { getAccessState } from "./access.js";
import { buildLocalNotificationPlan } from "./session-reminder.js";
import {
  getLocalNotificationPermission,
  rescheduleMySwymLocalNotifications,
} from "./native-local-notifications.js";
import { isNativeIos } from "./native-platform.js";
import { pushNotificationsWanted } from "./native-push.js";
import { readCheckoutAbandonedAt } from "./checkout-abandon-notif.js";
import {
  APP_STORE_REVIEW_MIN_SESSIONS,
  countFinishedSessions,
  hasAskedAppStoreReview,
} from "./app-store-review.js";
import { loveStoreAskAtMs } from "./love-review-funnel.js";
import { nextNewsletterNudgeAtMs } from "./newsletter-opt-in.js";

function lastCompletedIso(plan) {
  if (!plan) return null;
  if (Array.isArray(plan.history) && plan.history.length) {
    for (let i = plan.history.length - 1; i >= 0; i -= 1) {
      const s = plan.history[i];
      if (s?.completed && (s.completedAt || s.completed_at || s.at)) {
        return s.completedAt || s.completed_at || s.at;
      }
    }
  }
  const weeks = plan.weeks || [];
  for (let wi = weeks.length - 1; wi >= 0; wi -= 1) {
    const sessions = weeks[wi]?.sessions || [];
    for (let si = sessions.length - 1; si >= 0; si -= 1) {
      const s = sessions[si];
      if (s?.completed) return s.completedAt || s.completed_at || null;
    }
  }
  return null;
}

export async function syncLocalNotificationsFromState({ user, plan } = {}) {
  if (!isNativeIos() || !user?.id) return { scheduled: 0 };
  const perm = await getLocalNotificationPermission();
  const enabled = perm === "granted" && pushNotificationsWanted();
  const access = getAccessState(user);
  const next = findNextSession(plan);
  const stats = computeStats(plan);
  const finished = countFinishedSessions(plan);
  const planned = buildLocalNotificationPlan({
    enabled,
    hasPremiumAccess: access.hasPremiumAccess,
    accessStatus: access.status,
    trialEndsAt: access.trialEndsAt,
    trialDaysLeft: access.trialDaysLeft,
    hasPlan: Boolean(plan?.weeks?.length),
    nextResolved: !next || next.resolved === true,
    currentStreak: stats.currentStreak || stats.streak || 0,
    lastCompletedAt: lastCompletedIso(plan),
    checkoutAbandonedAt: access.hasPremiumAccess ? null : readCheckoutAbandonedAt(user.id),
    reviewEligible: finished >= APP_STORE_REVIEW_MIN_SESSIONS && !loveStoreAskAtMs(),
    reviewAlreadyAsked: hasAskedAppStoreReview(),
    loveStoreAskAtMs: loveStoreAskAtMs(),
    newsletterNudgeAtMs: nextNewsletterNudgeAtMs(user),
  });
  return rescheduleMySwymLocalNotifications(planned);
}
