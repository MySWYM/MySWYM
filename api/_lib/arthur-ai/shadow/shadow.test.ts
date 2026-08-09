/**
 * Tests Shadow Mode H1 — classification + gates (pas d’envoi).
 * Run: npm run test:arthur:shadow
 */
import assert from "node:assert/strict";
import {
  isInstagramShadowMode,
  canLiveSendInstagram,
  classifyRecommendedAction,
} from "./mode.js";
import { isFollowupSendEnabled } from "../conversion/send.js";

test("shadow ON par défaut", () => {
  delete process.env.ARTHUR_FLAG_SHADOW_INSTAGRAM;
  delete process.env.ARTHUR_INSTAGRAM_LIVE_SEND;
  assert.equal(isInstagramShadowMode(), true);
  assert.equal(canLiveSendInstagram(), false);
});

test("live send exige double gate", () => {
  process.env.ARTHUR_FLAG_SHADOW_INSTAGRAM = "0";
  delete process.env.ARTHUR_INSTAGRAM_LIVE_SEND;
  assert.equal(isInstagramShadowMode(), false);
  assert.equal(canLiveSendInstagram(), false);

  process.env.ARTHUR_INSTAGRAM_LIVE_SEND = "1";
  assert.equal(canLiveSendInstagram(), true);

  // Remettre shadow (sécurité tests suivants)
  delete process.env.ARTHUR_FLAG_SHADOW_INSTAGRAM;
  delete process.env.ARTHUR_INSTAGRAM_LIVE_SEND;
});

test("followups send jamais activé par shadow", () => {
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  assert.equal(isFollowupSendEnabled(), false);
});

test("classify handoff", () => {
  assert.equal(
    classifyRecommendedAction({
      suggested_action: "handoff_human",
      intent: "support",
    }),
    "handoff_human",
  );
});

test("classify suggest_myswym", () => {
  assert.equal(
    classifyRecommendedAction({
      suggested_action: "suggest_myswym",
      intent: "plan_request",
      lead_temperature: "hot",
    }),
    "suggest_myswym",
  );
});

test("classify qualify cold goal", () => {
  assert.equal(
    classifyRecommendedAction({
      suggested_action: "continue",
      intent: "goal",
      lead_temperature: "cold",
    }),
    "qualify",
  );
});

test("classify ignore premium", () => {
  assert.equal(
    classifyRecommendedAction({
      lead_status: "premium",
      intent: "training",
    }),
    "ignore",
  );
});

test("classify default reply", () => {
  assert.equal(
    classifyRecommendedAction({
      suggested_action: "continue",
      intent: "technique",
      lead_temperature: "warm",
    }),
    "reply",
  );
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

console.log("arthur shadow H1 tests passed");
