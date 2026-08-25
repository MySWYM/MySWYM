import assert from "node:assert/strict";
import { humanizeBuddyOtpError } from "./buddy-otp-messages.js";

assert.match(humanizeBuddyOtpError("Failed to fetch"), /Réseau/i);
assert.match(humanizeBuddyOtpError("TimeoutError"), /trop de temps|instant/i);
assert.match(humanizeBuddyOtpError("429 too many"), /Trop de tentatives/i);
assert.match(humanizeBuddyOtpError("code invalide"), /Code incorrect/i);
assert.equal(humanizeBuddyOtpError("Code expiré."), "Code expiré. Renvoie un nouveau code.");
assert.ok(humanizeBuddyOtpError("").length > 5);

console.log("buddy-otp-humanize PASS");
