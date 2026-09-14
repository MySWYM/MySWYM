/**
 * Tests WhatsNew vu / compte (sans appel réseau).
 * Usage : node src/lib/whats-new-seen.test.js
 */
import assert from "node:assert/strict";
import {
  WHATS_NEW_CAMPAIGN,
  WHATS_NEW_STORAGE_KEY,
  WHATS_NEW_ELIGIBLE_BEFORE,
  whatsNewStorageKey,
  normalizeWhatsNewSeenMap,
  hasSeenWhatsNew,
  isWhatsNewEligibleAccount,
  shouldShowWhatsNew,
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

{
  const cutoff = Date.parse(WHATS_NEW_ELIGIBLE_BEFORE);
  const oldUser = { id: "old", created_at: new Date(cutoff - 86400000).toISOString(), user_metadata: {} };
  const newUser = { id: "new", created_at: new Date(cutoff + 86400000).toISOString(), user_metadata: {} };
  assert.equal(isWhatsNewEligibleAccount(oldUser), true, "compte d’avant le 1er sept.");
  assert.equal(shouldShowWhatsNew(oldUser), true, "vieux compte jamais vu → pop");
  assert.equal(isWhatsNewEligibleAccount(newUser), false, "compte post-maj");
  assert.equal(shouldShowWhatsNew(newUser), false, "compte neuf : pas de pop ni 2e chargement");
  assert.equal(shouldShowWhatsNew({ id: "old", created_at: oldUser.created_at, user_metadata: { whats_new_seen: { [WHATS_NEW_CAMPAIGN]: 1 } } }), false, "déjà vu");
}

assert.deepEqual(
  normalizeWhatsNewSeenMap({ [WHATS_NEW_CAMPAIGN]: 123, junk: "x" }),
  { [WHATS_NEW_CAMPAIGN]: 123 },
);

console.log("whats-new-seen.test.js OK");
