/**
 * Planification notifs locales — tests.
 * Usage: node src/lib/session-reminder.test.js
 */
import {
  getSessionRemindersEnabled,
  shouldShowSessionReminderBanner,
  sessionReminderCopy,
  buildLocalNotificationPlan,
  spaceOutNotifications,
  NOTIF_MIN_GAP_MS,
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
  ok(getSessionRemindersEnabled("u1") === true, "pref always on (iOS Settings)");

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

  const abandon = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: false,
    accessStatus: ACCESS_STATUS.EXPIRED,
    checkoutAbandonedAt: "2026-09-23T08:00:00.000Z",
    nowMs: now,
  });
  ok(abandon.some((n) => n.id === NOTIF_IDS.CHECKOUT_ABANDON), "checkout abandon");
  ok(abandon.every((n) => n.badge === 1), "badge on commercial");

  const inactive = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: true,
    accessStatus: ACCESS_STATUS.ACTIVE,
    hasPlan: true,
    nextResolved: true,
    lastCompletedAt: "2026-09-10T12:00:00.000Z",
    nowMs: now,
  });
  ok(inactive.some((n) => n.id === NOTIF_IDS.COMEBACK), "comeback j+3");
  ok(inactive.some((n) => n.id === NOTIF_IDS.COMEBACK_LONG), "comeback j+7");

  const review = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: true,
    accessStatus: ACCESS_STATUS.ACTIVE,
    reviewEligible: true,
    reviewAlreadyAsked: false,
    nowMs: now,
  });
  ok(review.some((n) => n.id === NOTIF_IDS.REVIEW_ASK), "review ask");
  ok(!buildLocalNotificationPlan({
    enabled: true,
    reviewEligible: true,
    reviewAlreadyAsked: true,
    nowMs: now,
  }).some((n) => n.id === NOTIF_IDS.REVIEW_ASK), "review already asked");

  const newsAt = now + 14 * 86400000;
  const news = buildLocalNotificationPlan({
    enabled: true,
    newsletterNudgeAtMs: newsAt,
    nowMs: now,
  });
  ok(news.some((n) => n.id === NOTIF_IDS.NEWSLETTER), "newsletter nudge");
  ok(!buildLocalNotificationPlan({
    enabled: true,
    newsletterNudgeAtMs: null,
    nowMs: now,
  }).some((n) => n.id === NOTIF_IDS.NEWSLETTER), "no newsletter when opted in");

  const off = buildLocalNotificationPlan({ enabled: false, hasPlan: true, nowMs: now });
  ok(off.length === 0, "disabled empty");

  // Capture Arthur 07/10 : « On reprend ensemble ? » + « Rappel séance » à 18:00 pile
  const lazy = buildLocalNotificationPlan({
    enabled: true,
    hasPremiumAccess: true,
    accessStatus: ACCESS_STATUS.ACTIVE,
    hasPlan: true,
    nextResolved: false,
    currentStreak: 5,
    lastCompletedAt: new Date(now - 4 * 86400000).toISOString(),
    reviewEligible: true,
    nowMs: now,
  });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const comeback = lazy.find((n) => n.id === NOTIF_IDS.COMEBACK);
  ok(comeback, "comeback planned");
  ok(!lazy.some((n) => (n.id === NOTIF_IDS.SESSION || n.id === NOTIF_IDS.STREAK) && sameDay(n.at, comeback.at)), "comeback replaces reminder + streak that day");
  for (let i = 1; i < lazy.length; i++) {
    ok(lazy[i].at - lazy[i - 1].at >= NOTIF_MIN_GAP_MS, `3 h gap ${lazy[i - 1].id} / ${lazy[i].id}`);
  }
  ok(lazy.every((n) => n.at.getHours() <= 21), "never after 21 h");

  const clash = spaceOutNotifications([
    { id: 1, at: new Date("2026-09-23T18:00:00"), extra: { kind: "session_reminder" } },
    { id: 2, at: new Date("2026-09-23T18:00:00"), extra: { kind: "review_ask" } },
  ]);
  ok(clash.length === 2 && clash[1].at.getHours() === 21 && clash[1].id === 2, "lower priority shifted +3 h");

  console.log(`session-reminder.test.js OK (${asserts.length}+plan)`);
}

runSessionReminderSmoke();
