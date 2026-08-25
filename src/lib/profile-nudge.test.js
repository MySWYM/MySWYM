import assert from "node:assert/strict";
import { shouldShowProfileNudge } from "./profile-nudge.js";

assert.equal(shouldShowProfileNudge(null, { hasSwum: true }), true);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: [] }, { hasSwum: false }), false);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: [] }, { hasSwum: true }), true);
assert.equal(shouldShowProfileNudge({ pool: 25 }, { hasSwum: true }), true);
assert.equal(shouldShowProfileNudge({ pool: 50, equipment: [] }, { hasSwum: true }), false);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: ["palmes"] }, { hasSwum: true }), false);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: [] }, { dismissed: true, hasSwum: true }), false);

console.log("profile-nudge.test.js OK");
