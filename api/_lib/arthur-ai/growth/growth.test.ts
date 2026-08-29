/**
 * Tests Growth Engine F1, scoring + bandes (pas de relances).
 * Run: npm run test:arthur:growth
 */
import assert from "node:assert/strict";
import { scoreLead, isPremiumAccess } from "./scoring.js";

test("scoreLead: cold lead minimal", () => {
  const r = scoreLead({ status: "new" });
  assert.equal(r.band, "cold");
  assert.ok(r.score >= 10 && r.score < 40);
  assert.ok(r.reasons.includes("base"));
});

test("scoreLead: hot with goal + reel + plan intent + signup", () => {
  const r = scoreLead({
    status: "signup",
    intent: "plan_request",
    goal: "triathlon",
    level: "intermediaire",
    frequency: 3,
    target_date: "2026-09-01",
    reel_id: "reel_1",
    campaign: "ow_summer",
    keyword: "PLAN",
    lead_temperature: "hot",
    message_count: 6,
    has_identity_link: true,
  });
  assert.equal(r.band, "hot");
  assert.ok(r.score >= 70);
  assert.ok(r.reasons.includes("has_reel"));
  assert.ok(r.reasons.some((x) => x.startsWith("keyword_")));
});

test("scoreLead: premium caps near top", () => {
  const r = scoreLead({
    status: "premium",
    has_premium: true,
    intent: "subscription",
    goal: "open_water",
    reel_id: "r",
    campaign: "c",
  });
  assert.equal(r.band, "hot");
  assert.ok(r.score <= 100);
  assert.ok(r.reasons.includes("premium"));
});

test("scoreLead: warm band mid range", () => {
  const r = scoreLead({
    status: "qualified",
    intent: "myswym_question",
    goal: "forme",
    level: "debutant",
  });
  assert.equal(r.band, "warm");
  assert.ok(r.score >= 40 && r.score < 70);
});

test("isPremiumAccess: active / trial / expired", () => {
  assert.equal(isPremiumAccess({ access_status: "active" }), true);
  assert.equal(
    isPremiumAccess({
      access_status: "trial",
      trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
    }),
    true,
  );
  assert.equal(
    isPremiumAccess({
      access_status: "trial",
      trial_ends_at: new Date(Date.now() - 86400000).toISOString(),
    }),
    false,
  );
  assert.equal(isPremiumAccess(null), false);
});

test("scoreLead: déterministe", () => {
  const input = {
    status: "qualified",
    intent: "goal",
    goal: "5km",
    reel_id: "x",
    keyword: "PLAN",
  };
  assert.deepEqual(scoreLead(input), scoreLead(input));
});

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

console.log("arthur growth F1 tests passed");
