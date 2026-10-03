import assert from "node:assert/strict";
import {
  clearSaveAccountSnooze,
  isSaveAccountSnoozed,
  releaseSaveAccountSnoozeOnResume,
  SAVE_ACCOUNT_RESUME_MS,
  SAVE_ACCOUNT_SNOOZE_MS,
  saveAccountSnoozeKey,
  snoozeSaveAccountPrompt,
} from "./save-account-prompt.js";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

store.clear();
assert.equal(isSaveAccountSnoozed("u1"), false, "fresh: not snoozed");
snoozeSaveAccountPrompt("u1", 60_000);
assert.equal(isSaveAccountSnoozed("u1"), true, "after snooze");
assert.equal(isSaveAccountSnoozed("u2"), false, "other user not snoozed");
clearSaveAccountSnooze("u1");
assert.equal(isSaveAccountSnoozed("u1"), false, "cleared");

assert.equal(saveAccountSnoozeKey("abc"), "myswym_save_account_snooze_until_abc");
assert.ok(SAVE_ACCOUNT_SNOOZE_MS <= 60 * 60 * 1000, "snooze at most 1h for frequent nudge");
assert.ok(SAVE_ACCOUNT_RESUME_MS >= 10 * 60 * 1000, "resume gap at least 10 min");

snoozeSaveAccountPrompt("u1", 60_000);
assert.equal(releaseSaveAccountSnoozeOnResume("u1", null), false, "no bg time");
assert.equal(isSaveAccountSnoozed("u1"), true, "still snoozed");
assert.equal(
  releaseSaveAccountSnoozeOnResume("u1", Date.now() - 5 * 60 * 1000),
  false,
  "short bg keeps snooze",
);
assert.equal(isSaveAccountSnoozed("u1"), true, "still snoozed after short bg");
assert.equal(
  releaseSaveAccountSnoozeOnResume("u1", Date.now() - SAVE_ACCOUNT_RESUME_MS - 1000),
  true,
  "long bg clears snooze",
);
assert.equal(isSaveAccountSnoozed("u1"), false, "cleared after long bg");

console.log("save-account-prompt.test.js: ok");
