/**
 * Tests purs (sans Stripe réseau) pour l’engagement 12 mois.
 * Run: node --experimental-strip-types supabase/functions/_shared/stripe-commitment.test.ts
 */
import assert from "node:assert/strict";
import {
  COMMITMENT_MONTHS,
  commitmentEndsAtMs,
  commitmentMetadataForCheckout,
  isCommitPriceId,
  isCommitSubscription,
  isCommitmentInForce,
} from "./stripe-commitment.ts";

assert.equal(COMMITMENT_MONTHS, 12);
assert.equal(isCommitPriceId("price_1TPjyPAS4mfgF2Twx3Zh4zrJ"), true);
assert.equal(isCommitPriceId("price_1U3N2tAS4mfgF2TwyaI2hf22"), false);

const startSec = Math.floor(Date.now() / 1000) - 30 * 86400;
const commitSub = {
  id: "sub_1",
  status: "active",
  start_date: startSec,
  cancel_at_period_end: false,
  metadata: {
    plan_tier: "monthly_commit",
    commitment_months: "12",
  },
  items: { data: [{ price: { id: "price_1TPjyPAS4mfgF2Twx3Zh4zrJ" } }] },
};

assert.equal(isCommitSubscription(commitSub), true);
assert.equal(isCommitmentInForce(commitSub), true);

const ends = commitmentEndsAtMs(commitSub);
assert.ok(ends != null && ends > Date.now(), "fin engagement dans le futur");

const expired = {
  ...commitSub,
  start_date: Math.floor(Date.now() / 1000) - 400 * 86400,
  metadata: { plan_tier: "monthly_commit", commitment_months: "12" },
};
assert.equal(isCommitmentInForce(expired), false, "après 12 mois → plus d’engagement");

const flex = {
  id: "sub_flex",
  status: "active",
  start_date: startSec,
  metadata: { plan_tier: "monthly_flex" },
  items: { data: [{ price: { id: "price_1U3N2tAS4mfgF2TwyaI2hf22" } }] },
};
assert.equal(isCommitmentInForce(flex), false);

const meta = commitmentMetadataForCheckout();
assert.equal(meta.plan_tier, "monthly_commit");
assert.equal(meta.commitment_months, "12");
assert.ok(Date.parse(meta.commitment_ends_at) > Date.now());

console.log("stripe-commitment.test.ts OK");
