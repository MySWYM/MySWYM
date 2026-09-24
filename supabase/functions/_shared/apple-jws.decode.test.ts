/**
 * Run: npx tsx supabase/functions/_shared/apple-jws.decode.test.ts
 */
import assert from "node:assert/strict";
import { decodeJwsPayload } from "./apple-jws-decode.ts";

function b64url(obj: object) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

const jws = `${b64url({ alg: "ES256" })}.${b64url({
  bundleId: "app.myswym.ios",
  productId: "app.myswym.ios.premium.monthly",
  originalTransactionId: "1",
})}.sig`;

const payload = decodeJwsPayload(jws);
assert.equal(payload.bundleId, "app.myswym.ios");
assert.equal(payload.productId, "app.myswym.ios.premium.monthly");
assert.throws(() => decodeJwsPayload("not-a-jws"), /JWS Apple invalide/);
console.log("apple-jws.decode.test.ts OK");
