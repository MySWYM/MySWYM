/**
 * Helpers push APNs — tests.
 * Usage: node src/lib/native-push.test.js
 */
import assert from "node:assert/strict";
import { buddyConnectionId } from "./buddy-connection-id.js";

assert.equal(buddyConnectionId(null), "");
assert.equal(buddyConnectionId(""), "");
assert.equal(buddyConnectionId("abc-123"), "abc-123");
assert.equal(buddyConnectionId({ id: "row-1" }), "row-1");
assert.equal(buddyConnectionId([{ id: "arr-1" }]), "arr-1");
assert.equal(buddyConnectionId({}), "");

console.log("native-push.test.js: ok");
