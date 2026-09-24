/**
 * Planification notifs locales — tests.
 * Usage: node src/lib/session-reminder.test.js
 */
import {
  getSessionRemindersEnabled,
  shouldShowSessionReminderBanner,
  sessionReminderCopy,
  buildLocalNotificationPlan,
} from "./session-reminder.js";
import { ACCESS_STATUS } from "./access.js";
import { NOTIF_IDS } from "./native-local-notifications.js";

export function runSessionReminderSmoke() {
  const asserts = [];
  const ok = (cond, msg) => {
    if (!cond) throw new Error(msg);
    asserts.push(msg);
  };

  ok(shouldShowSessionReminderBanner({ enabled: true, hasPlan: true, nextResolved: false, hour: 12 }), "midday");
  ok(!shouldShowSessionReminderBanner({ enabled: false, hasPlan: true, nextResolved: false, hour: 12 }), "off");
  ok(!shouldShowSessionReminderBanner({ enabled: true, hasPlan: true, nextResolved: true, hour: 12 }), "done");
  ok(!shouldShowSessionReminderBanner({ enabled: true, hasPlan: true, nextResolved: false, hour: 3 }), "night");

  const copy = sessionReminderCopy({ sessionTitle: "Endurance", streak: 4 });
  ok(copy.body.includes("série"), "streak copy");
  ok(typeof getSessionRemindersEnabled === "function", "pref fn");

  const now = new Date("2026-09-23T12:00:00").getTime();
  const plan = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: true,
    accessStatus: ACCESS_STATUS.ACTIVE,
    hasPlan: true,
    nextResolved: false,
    currentStreak: 4,
    nowMs: now,
  });
  ok(plan.some((n) => n.id === NOTIF_IDS.SESSION), "session planned");
  ok(plan.some((n) => n.id === NOTIF_IDS.STREAK), "streak planned");

  const frozen = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: false,
    accessStatus: ACCESS_STATUS.EXPIRED,
    hasPlan: true,
    nextResolved: false,
    currentStreak: 5,
    nowMs: now,
  });
  ok(!frozen.some((n) => n.id === NOTIF_IDS.SESSION), "frozen no session");
  ok(!frozen.some((n) => n.id === NOTIF_IDS.STREAK), "frozen no streak");

  const trial = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: true,
    accessStatus: ACCESS_STATUS.TRIAL,
    trialEndsAt: "2026-09-25T12:00:00.000Z",
    trialDaysLeft: 2,
    hasPlan: true,
    nextResolved: true,
    nowMs: now,
  });
  ok(trial.some((n) => n.id === NOTIF_IDS.TRIAL_J1 || n.id === NOTIF_IDS.TRIAL_J2), "trial notifs");

  const off = buildLocalNotificationPlan({ enabled: false, hasPlan: true, nowMs: now });
  ok(off.length === 0, "disabled empty");

  console.log(`session-reminder.test.js OK (${asserts.length}+plan)`);
}

runSessionReminderSmoke();
