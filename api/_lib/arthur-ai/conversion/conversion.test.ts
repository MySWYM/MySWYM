/**
 * Tests Conversion Engine F2, décision + anti-spam (pas d’envoi Meta).
 * Run: npm run test:arthur:conversion
 */
import assert from "node:assert/strict";
import { decideFollowup, bumpOutOfQuietHours } from "./decide.js";
import { renderFollowupMessage } from "./templates.js";
import {
  isFollowupSendEnabled,
  resolveFollowupSendMode,
} from "./send.js";
import { FOLLOWUP_POLICY } from "./policy.js";

test("suppress premium", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "premium",
    score: 90,
  });
  assert.equal(d.action, "suppress");
  if (d.action === "suppress") assert.equal(d.suppress_reason, "premium");
});

test("suppress score too low", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "new",
    score: 10,
    score_band: "cold",
    hours_since_last_user_message: 100,
    hours_since_last_assistant_message: 100,
  });
  assert.equal(d.action, "suppress");
  if (d.action === "suppress") assert.equal(d.suppress_reason, "score_too_low");
});

test("suppress user active recently, no spam", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "qualified",
    score: 80,
    score_band: "hot",
    intent: "plan_request",
    hours_since_last_user_message: 2,
    hours_since_last_assistant_message: 100,
  });
  assert.equal(d.action, "suppress");
  if (d.action === "suppress") {
    assert.equal(d.suppress_reason, "user_active_recently");
  }
});

test("suppress max sent", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "qualified",
    score: 80,
    sent_count: FOLLOWUP_POLICY.maxSentPerLead,
    hours_since_last_user_message: 100,
    hours_since_last_assistant_message: 100,
  });
  assert.equal(d.action, "suppress");
  if (d.action === "suppress") assert.equal(d.suppress_reason, "max_sent_reached");
});

test("plan hot plan_request", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "qualified",
    score: 85,
    score_band: "hot",
    intent: "plan_request",
    goal: "triathlon",
    hours_since_last_user_message: 48,
    hours_since_last_assistant_message: 48,
  });
  assert.equal(d.action, "plan");
  if (d.action === "plan") {
    assert.equal(d.template_key, "plan_nudge");
    assert.ok(d.message_preview.includes("MySWYM"));
    assert.ok(d.scheduled_for);
  }
});

test("plan signup → premium template", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "signup",
    score: 60,
    hours_since_last_user_message: 80,
    hours_since_last_assistant_message: 80,
  });
  assert.equal(d.action, "plan");
  if (d.action === "plan") {
    assert.equal(d.template_key, "signup_to_premium");
  }
});

test("plan warm nurture", () => {
  const d = decideFollowup({
    external_user_id: "ig1",
    status: "new",
    score: 50,
    score_band: "warm",
    intent: "myswym_question",
    hours_since_last_user_message: 60,
    hours_since_last_assistant_message: 60,
  });
  assert.equal(d.action, "plan");
  if (d.action === "plan") assert.equal(d.template_key, "nurture_warm");
});

test("templates non vides", () => {
  for (const key of [
    "convert_hot",
    "nurture_warm",
    "reengage_cold",
    "signup_to_premium",
    "plan_nudge",
  ] as const) {
    const msg = renderFollowupMessage(key, { goal: "5km" });
    assert.ok(msg.length > 20);
  }
});

test("send gate blocked by default", () => {
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  delete process.env.ARTHUR_FOLLOWUPS_SEND_MOCK;
  assert.equal(isFollowupSendEnabled(), false);
  assert.equal(resolveFollowupSendMode(), "blocked");
});

test("send gate mock when enabled + mock flag", () => {
  process.env.ARTHUR_FOLLOWUPS_SEND = "1";
  process.env.ARTHUR_FOLLOWUPS_SEND_MOCK = "1";
  assert.equal(resolveFollowupSendMode(), "mock");
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  delete process.env.ARTHUR_FOLLOWUPS_SEND_MOCK;
});

test("quiet hours bump", () => {
  // 23h Paris ≈ 21 UTC
  const late = new Date("2026-08-09T21:30:00.000Z");
  const bumped = bumpOutOfQuietHours(late);
  assert.ok(bumped.getTime() > late.getTime() || bumped.getUTCHours() === 7);
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

console.log("arthur conversion F2 tests passed");
