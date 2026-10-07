/**
 * Run: node --experimental-strip-types supabase/functions/_shared/apple-iap-catalog.test.ts
 */
import assert from "node:assert/strict";
import { assertAppleNotificationEnvironment } from "./apple-iap-catalog.ts";

assert.doesNotThrow(() => assertAppleNotificationEnvironment("Sandbox", "Sandbox"));
assert.doesNotThrow(() => assertAppleNotificationEnvironment("Production", "Production", "Production"));
assert.throws(
  () => assertAppleNotificationEnvironment("Sandbox", "Production"),
  /incohérent/,
);
assert.throws(
  () => assertAppleNotificationEnvironment("Sandbox", "Sandbox", "Production"),
  /inattendu/,
);
assert.throws(
  () => assertAppleNotificationEnvironment("Local", "Local"),
  /inattendu/,
);
console.log("apple-iap-catalog.test.ts OK");
