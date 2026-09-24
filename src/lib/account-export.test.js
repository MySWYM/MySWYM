/**
 * Usage : node src/lib/account-export.test.js
 */
import assert from "node:assert/strict";
import {
  accountExportFilename,
  buildAccountExportPayload,
  hasEmailPasswordProvider,
} from "./account-export.js";

assert.equal(hasEmailPasswordProvider({ identities: [{ provider: "email" }] }), true);
assert.equal(hasEmailPasswordProvider({ identities: [{ provider: "apple" }] }), false);
assert.equal(
  hasEmailPasswordProvider({ identities: [{ provider: "apple" }, { provider: "email" }] }),
  true,
);
assert.equal(hasEmailPasswordProvider({ app_metadata: { provider: "email" } }), true);
assert.equal(hasEmailPasswordProvider({ app_metadata: { provider: "apple" } }), false);

const payload = buildAccountExportPayload({
  user: {
    email: "a@b.c",
    user_metadata: { firstname: "Arthur", lastname: "N", newsletter_opt_in: true, country: "FR" },
  },
  profile: {
    gender: "homme",
    country: "BE",
    pool: 25,
    equipment: ["palmes"],
    injuries: [{ zone: "shoulder", severity: "legere" }],
  },
}, new Date("2026-09-21T12:00:00.000Z"));

assert.equal(payload.email, "a@b.c");
assert.equal(payload.firstname, "Arthur");
assert.equal(payload.country, "BE");
assert.equal(payload.gender, "homme");
assert.equal(payload.newsletter, true);
assert.deepEqual(payload.equipment, ["palmes"]);
assert.equal(payload.injuries[0].zone, "shoulder");
assert.ok(!("weeks" in payload));
assert.equal(accountExportFilename(new Date("2026-09-21T12:00:00.000Z")), "myswym-donnees-20260921.json");

console.log("account-export.test.js ok");
