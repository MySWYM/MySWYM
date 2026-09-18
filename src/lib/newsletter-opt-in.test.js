/**
 * Usage: node src/lib/newsletter-opt-in.test.js
 */
import {
  isNewsletterOptedIn,
  stashPendingNewsletterOptIn,
  hasPendingNewsletterOptIn,
  readPendingNewsletterOptIn,
  clearPendingNewsletterOptIn,
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

console.log("newsletter-opt-in.test.js OK");
