import assert from "node:assert/strict";
import { shouldShowProfileNudge } from "./profile-nudge.js";

assert.equal(shouldShowProfileNudge(null), true);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: [] }), true);
assert.equal(shouldShowProfileNudge({ pool: 25 }), true);
assert.equal(shouldShowProfileNudge({ pool: 50, equipment: [] }), false);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: ["palmes"] }), false);
assert.equal(shouldShowProfileNudge({ pool: 25, equipment: [] }, { dismissed: true }), false);

console.log("profile-nudge.test.js OK");
