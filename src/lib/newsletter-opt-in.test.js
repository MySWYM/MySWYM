/**
 * Usage: node src/lib/newsletter-opt-in.test.js
 */
import {
  isNewsletterOptedIn,
  stashPendingNewsletterOptIn,
  hasPendingNewsletterOptIn,
  readPendingNewsletterOptIn,
  clearPendingNewsletterOptIn,
  ensureNewsletterNudgeAnchorMs,
  nextNewsletterNudgeAtMs,
  clearNewsletterNudgeAnchor,
  NEWSLETTER_NUDGE_INTERVAL_MS,
} from "./newsletter-opt-in.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isNewsletterOptedIn(null) === false, "null");
assert(isNewsletterOptedIn({}) === false, "empty");
assert(isNewsletterOptedIn({ user_metadata: {} }) === false, "missing");
assert(isNewsletterOptedIn({ user_metadata: { newsletter_opt_in: false } }) === false, "false");
assert(isNewsletterOptedIn({ user_metadata: { newsletter_opt_in: true } }) === true, "true");
assert(isNewsletterOptedIn({ user_metadata: { newsletter_opt_in: "yes" } }) === false, "strict bool");

const mem = {
  data: {},
  setItem(k, v) { this.data[k] = String(v); },
  getItem(k) { return Object.hasOwn(this.data, k) ? this.data[k] : null; },
  removeItem(k) { delete this.data[k]; },
};
assert(hasPendingNewsletterOptIn(mem) === false, "no pending");
stashPendingNewsletterOptIn(true, mem);
assert(hasPendingNewsletterOptIn(mem) === true, "has pending true");
assert(readPendingNewsletterOptIn(mem) === true, "stash true");
stashPendingNewsletterOptIn(false, mem);
assert(hasPendingNewsletterOptIn(mem) === true, "has pending false");
assert(readPendingNewsletterOptIn(mem) === false, "stash false");
clearPendingNewsletterOptIn(mem);
assert(hasPendingNewsletterOptIn(mem) === false, "cleared pending");
assert(readPendingNewsletterOptIn(mem) === false, "cleared");

const local = {
  data: {},
  setItem(k, v) { this.data[k] = String(v); },
  getItem(k) { return Object.hasOwn(this.data, k) ? this.data[k] : null; },
  removeItem(k) { delete this.data[k]; },
};
const created = "2026-01-01T12:00:00.000Z";
const userOff = { id: "u1", created_at: created, user_metadata: { newsletter_opt_in: false } };
const userOn = { id: "u1", created_at: created, user_metadata: { newsletter_opt_in: true } };
const now = Date.parse("2026-01-05T12:00:00.000Z");
assert(
  ensureNewsletterNudgeAnchorMs(userOff, local, now) === Date.parse(created),
  "anchor = created_at",
);
assert(
  nextNewsletterNudgeAtMs(userOff, { store: local, nowMs: now })
    === Date.parse(created) + NEWSLETTER_NUDGE_INTERVAL_MS,
  "first nudge = created + 14d",
);
assert(nextNewsletterNudgeAtMs(userOn, { store: local, nowMs: now }) === null, "no nudge if opted in");
const late = Date.parse("2026-02-01T12:00:00.000Z");
const rolled = nextNewsletterNudgeAtMs(userOff, { store: local, nowMs: late });
assert(rolled > late + 60_000, "rolls forward after window");
clearNewsletterNudgeAnchor("u1", local);
assert(local.getItem("myswym_newsletter_nudge_u1") == null, "cleared nudge");

console.log("newsletter-opt-in.test.js OK");
