/**
 * Tests WhatsNew vu / compte (sans appel réseau).
 * Usage : node src/lib/whats-new-seen.test.js
 */
import assert from "node:assert/strict";
import {
  WHATS_NEW_CAMPAIGN,
  WHATS_NEW_STORAGE_KEY,
  whatsNewStorageKey,
  normalizeWhatsNewSeenMap,
  hasSeenWhatsNew,
} from "./whats-new-seen.js";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

store.clear();
assert.equal(hasSeenWhatsNew(null), true, "sans user → pas de pop");
assert.equal(hasSeenWhatsNew({}), true);

const user = { id: "u1", user_metadata: {} };
assert.equal(hasSeenWhatsNew(user), false, "jamais vu");

store.set(whatsNewStorageKey("u1"), "1");
assert.equal(hasSeenWhatsNew(user), true, "cache local user");

store.clear();
store.set(WHATS_NEW_STORAGE_KEY, "1");
assert.equal(hasSeenWhatsNew(user), true, "legacy global");

store.clear();
const seenUser = {
  id: "u1",
  user_metadata: {
    whats_new_seen: { [WHATS_NEW_CAMPAIGN]: Date.now() },
  },
};
assert.equal(hasSeenWhatsNew(seenUser), true, "user_metadata");

assert.deepEqual(
  normalizeWhatsNewSeenMap({ [WHATS_NEW_CAMPAIGN]: 123, junk: "x" }),
  { [WHATS_NEW_CAMPAIGN]: 123 },
);

console.log("whats-new-seen.test.js OK");
