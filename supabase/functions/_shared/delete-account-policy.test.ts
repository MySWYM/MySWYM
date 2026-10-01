/**
 * Tests purs : blocage suppression de compte.
 * Run: node --experimental-strip-types supabase/functions/_shared/delete-account-policy.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluateDeleteGate,
  gateFromAppleAccess,
  isFlexCancelable,
  isPrepaidSubscription,
  paidAccessLooksLive,
} from "./delete-account-policy.ts";

const now = Date.parse("2026-09-14T12:00:00.000Z");
const startSec = Math.floor(now / 1000) - 30 * 86400;
const periodEnd = Math.floor(now / 1000) + 20 * 86400;

const commitSub = {
  id: "sub_commit",
  status: "active",
  start_date: startSec,
  current_period_end: periodEnd,
  metadata: {
    plan_tier: "monthly_commit",
    commitment_months: "12",
  },
  items: { data: [{ price: { id: "price_1TPjyPAS4mfgF2Twx3Zh4zrJ", recurring: { interval: "month" } } }] },
};

const flexSub = {
  id: "sub_flex",
  status: "active",
  start_date: startSec,
  current_period_end: periodEnd,
  metadata: { plan_tier: "monthly_flex" },
  items: { data: [{ price: { id: "price_1U3N2tAS4mfgF2TwyaI2hf22", recurring: { interval: "month" } } }] },
};

const annualSub = {
  id: "sub_annual",
  status: "active",
  start_date: startSec,
  current_period_end: periodEnd,
  metadata: { plan_tier: "annual" },
  items: { data: [{ price: { id: "price_1U7E38AS4mfgF2TwpJGYoMpE", recurring: { interval: "year" } } }] },
};

assert.equal(evaluateDeleteGate([], now).allowed, true);
assert.equal(evaluateDeleteGate([{ ...flexSub, status: "canceled" }], now).allowed, true);

const commitGate = evaluateDeleteGate([commitSub], now);
assert.equal(commitGate.allowed, true);
assert.deepEqual(commitGate.cancelIds, ["sub_commit"]);

const annualGate = evaluateDeleteGate([annualSub], now);
assert.equal(annualGate.allowed, true);
assert.deepEqual(annualGate.cancelIds, ["sub_annual"]);

const yearOnly = {
  id: "sub_year",
  status: "active",
  items: { data: [{ price: { id: "price_unknown_year", recurring: { interval: "year" } } }] },
};
assert.equal(isPrepaidSubscription(yearOnly), true);
assert.equal(evaluateDeleteGate([yearOnly], now).allowed, true);
assert.deepEqual(evaluateDeleteGate([yearOnly], now).cancelIds, ["sub_year"]);

const flexGate = evaluateDeleteGate([flexSub], now);
assert.equal(flexGate.allowed, true);
assert.deepEqual(flexGate.cancelIds, ["sub_flex"]);
assert.equal(flexGate.willCancelSubscription, true);

const mixed = evaluateDeleteGate([flexSub, commitSub], now);
assert.equal(mixed.allowed, true);
assert.deepEqual(mixed.cancelIds, ["sub_flex", "sub_commit"]);

const incomplete = {
  id: "sub_inc",
  status: "incomplete",
  items: { data: [{ price: { id: "price_1U3N2tAS4mfgF2TwyaI2hf22", recurring: { interval: "month" } } }] },
};
assert.equal(isFlexCancelable(incomplete, now), true);
assert.equal(evaluateDeleteGate([incomplete], now).allowed, true);

const unknownLive = {
  id: "sub_weird",
  status: "active",
  items: { data: [{ price: { id: "price_mystery" } }] },
};
assert.equal(evaluateDeleteGate([unknownLive], now).allowed, true);
assert.deepEqual(evaluateDeleteGate([unknownLive], now).cancelIds, ["sub_weird"]);

const expiredCommit = {
  ...commitSub,
  start_date: Math.floor(now / 1000) - 400 * 86400,
  metadata: { plan_tier: "monthly_commit", commitment_months: "12" },
};
const afterCommit = evaluateDeleteGate([expiredCommit], now);
assert.equal(afterCommit.allowed, true, "après 12 mois, le 4,99 se cancel comme un flex");
assert.deepEqual(afterCommit.cancelIds, ["sub_commit"]);

assert.equal(paidAccessLooksLive({ access_status: "trial" }, now), false);
assert.equal(paidAccessLooksLive({ access_status: "active" }, now), true);
assert.equal(
  paidAccessLooksLive({ access_status: "canceled", subscription_ends_at: "2026-10-01T00:00:00.000Z" }, now),
  true,
);
assert.equal(
  paidAccessLooksLive({ access_status: "canceled", subscription_ends_at: "2026-08-01T00:00:00.000Z" }, now),
  false,
);

const pausedCommit = { ...commitSub, status: "paused" };
assert.equal(evaluateDeleteGate([pausedCommit], now).allowed, true);
assert.deepEqual(evaluateDeleteGate([pausedCommit], now).cancelIds, ["sub_commit"]);

const appleGate = gateFromAppleAccess("2026-12-01T00:00:00.000Z");
assert.equal(appleGate.allowed, true);
assert.equal(appleGate.appleKeepsBilling, true);
assert.equal(appleGate.willCancelSubscription, false);
assert.equal(appleGate.endsAt, "2026-12-01T00:00:00.000Z");

console.log("delete-account-policy.test.ts OK");
