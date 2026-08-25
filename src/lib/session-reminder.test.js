import { getSessionRemindersEnabled, shouldShowSessionReminderBanner, sessionReminderCopy } from "./session-reminder.js";

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

  console.log(`session-reminder.test.js OK (${asserts.length})`);
}

runSessionReminderSmoke();
