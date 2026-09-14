/**
 * Tests purs : blocage suppression de compte.
 * Run: node --experimental-strip-types supabase/functions/_shared/delete-account-policy.test.ts
 */
import assert from "node:assert/strict";
import {
  DELETE_BLOCK,
  evaluateDeleteGate,
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

const blockedCommit = evaluateDeleteGate([commitSub], now);
assert.equal(blockedCommit.allowed, false);
assert.equal(blockedCommit.code, "commitment");
assert.equal(blockedCommit.message, DELETE_BLOCK.commitment);

const blockedAnnual = evaluateDeleteGate([annualSub], now);
assert.equal(blockedAnnual.allowed, false);
assert.equal(blockedAnnual.code, "prepaid");
assert.equal(blockedAnnual.message, DELETE_BLOCK.prepaid);

const yearOnly = {
  id: "sub_year",
  status: "active",
  items: { data: [{ price: { id: "price_unknown_year", recurring: { interval: "year" } } }] },
};
assert.equal(isPrepaidSubscription(yearOnly), true);
assert.equal(evaluateDeleteGate([yearOnly], now).allowed, false);

const flexGate = evaluateDeleteGate([flexSub], now);
assert.equal(flexGate.allowed, true);
assert.deepEqual(flexGate.cancelIds, ["sub_flex"]);
assert.equal(flexGate.willCancelSubscription, true);

const mixed = evaluateDeleteGate([flexSub, commitSub], now);
assert.equal(mixed.allowed, false);
assert.equal(mixed.code, "commitment");

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
assert.equal(evaluateDeleteGate([unknownLive], now).allowed, false);
assert.equal(evaluateDeleteGate([unknownLive], now).code, "unverified");

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
assert.equal(evaluateDeleteGate([pausedCommit], now).allowed, false);

console.log("delete-account-policy.test.ts OK");
