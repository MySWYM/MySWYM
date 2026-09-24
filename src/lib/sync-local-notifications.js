/**
 * Rebuild + schedule local notifications from plan / access state.
 */
import { findNextSession } from "./plan-reveal.js";
import { computeStats } from "./plan-stats.js";
import { getAccessState } from "./access.js";
import {
  buildLocalNotificationPlan,
  getSessionRemindersEnabled,
} from "./session-reminder.js";
import { rescheduleMySwymLocalNotifications } from "./native-local-notifications.js";
import { isNativeIos } from "./native-platform.js";

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
  const enabled = getSessionRemindersEnabled(user.id);
  const access = getAccessState(user);
  const next = findNextSession(plan);
  const stats = computeStats(plan);
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
  });
  return rescheduleMySwymLocalNotifications(planned);
}
