/**
 * Usage: node src/lib/notification-prefs.test.js
 */
import assert from "node:assert/strict";
import {
  parseNotificationPrefs,
  localNotifAllowed,
  filterLocalNotificationsByPrefs,
  NOTIFICATION_PREFS_KEY,
} from "./notification-prefs.js";
import { NEWSLETTER_META_KEY } from "./newsletter-opt-in.js";

const asserts = [];
function ok(cond, msg) {
  assert.ok(cond, msg);
  asserts.push(msg);
}

{
  const p = parseNotificationPrefs(null);
  ok(p.push.session === true, "default session on");
  ok(p.email.news === false, "default email news off");
}

{
  const p = parseNotificationPrefs({ [NEWSLETTER_META_KEY]: true });
  ok(p.email.news === true, "newsletter meta seeds email.news");
}

{
  const p = parseNotificationPrefs({
    [NEWSLETTER_META_KEY]: true,
    [NOTIFICATION_PREFS_KEY]: { email: { news: false }, push: { buddy: false } },
  });
  ok(p.email.news === false, "explicit prefs win over newsletter meta");
  ok(p.push.buddy === false, "buddy off");
  ok(p.push.session === true, "session still default");
}

{
  const prefs = parseNotificationPrefs({
    [NOTIFICATION_PREFS_KEY]: { push: { session: false, streak: true } },
  });
  ok(!localNotifAllowed({ extra: { kind: "session_reminder" } }, prefs), "session filtered");
  ok(localNotifAllowed({ extra: { kind: "streak_protect" } }, prefs), "streak kept");
  ok(localNotifAllowed({ extra: { kind: "soft_premium" } }, prefs), "billing always");
  ok(localNotifAllowed({ extra: { kind: "checkout_abandon" } }, prefs), "checkout always");
}

{
  const prefs = parseNotificationPrefs({
    [NOTIFICATION_PREFS_KEY]: { push: { badges: false } },
  });
  const out = filterLocalNotificationsByPrefs(
    [
      { id: 1, extra: { kind: "badge" } },
      { id: 2, extra: { kind: "soft_premium" } },
    ],
    prefs,
  );
  ok(out.length === 1 && out[0].id === 2, "filter badges");
}

console.log(`notification-prefs.test.js OK (${asserts.length})`);
