/**
 * Run: node --experimental-strip-types supabase/functions/_shared/cors.test.ts
 */
import assert from "node:assert/strict";
import { corsHeaders, FALLBACK_ORIGIN, isAllowedOrigin } from "./cors.ts";

assert.equal(isAllowedOrigin("https://www.myswym.app"), true);
assert.equal(isAllowedOrigin("https://myswym.app"), true);
assert.equal(isAllowedOrigin("https://staging.myswym.app"), true);
assert.equal(isAllowedOrigin("http://localhost:5173"), true);
assert.equal(isAllowedOrigin("http://127.0.0.1:4173"), true);

assert.equal(isAllowedOrigin("https://evil.example"), false);
assert.equal(isAllowedOrigin("https://myswym.app.evil.com"), false);
assert.equal(isAllowedOrigin("https://notmyswym.app"), false);
assert.equal(isAllowedOrigin("https://attacker.vercel.app"), false);
assert.equal(isAllowedOrigin("https://myswym-evil.vercel.app"), false);
assert.equal(isAllowedOrigin("http://www.myswym.app"), false);
assert.equal(isAllowedOrigin("https://localhost:5173"), false);
assert.equal(isAllowedOrigin("https://user:pass@www.myswym.app"), false);

assert.equal(isAllowedOrigin("https://preview.example", ["https://preview.example"]), true);
assert.equal(isAllowedOrigin("https://other.example", ["https://preview.example"]), false);

const allowed = corsHeaders("https://www.myswym.app");
assert.equal(allowed["Access-Control-Allow-Origin"], "https://www.myswym.app");
assert.equal(allowed.Vary, "Origin");

const rejected = corsHeaders("https://evil.example");
assert.equal(rejected["Access-Control-Allow-Origin"], FALLBACK_ORIGIN);

const missing = corsHeaders(null);
assert.equal(missing["Access-Control-Allow-Origin"], FALLBACK_ORIGIN);

console.log("cors.test.ts ok");
