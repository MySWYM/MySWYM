/**
 * Tests Production Readiness Phase G.
 * Run: npm run test:arthur:production
 */
import assert from "node:assert/strict";
import {
  getArthurFeatureFlags,
  assertChannelEnabled,
} from "./flags.js";
import { getRateLimitConfig, rateBucketKey } from "./rate-limit.js";
import { getCostBudgetConfig } from "./cost-monitor.js";
import {
  buildOfflineResponse,
  hasOpenAiApiKey,
} from "./offline.js";
import { detectsHumanTakeoverRequest } from "./takeover.js";
import { isFollowupSendEnabled } from "../conversion/send.js";

test("flags defaults — followups send off + shadow on", () => {
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  delete process.env.ARTHUR_FLAG_ENABLED;
  delete process.env.ARTHUR_FLAG_SHADOW_INSTAGRAM;
  delete process.env.ARTHUR_INSTAGRAM_LIVE_SEND;
  const f = getArthurFeatureFlags();
  assert.equal(f.enabled, true);
  assert.equal(f.followups_send, false);
  assert.equal(f.shadow_instagram, true);
  assert.equal(f.instagram_live_send, false);
  assert.equal(isFollowupSendEnabled(), false);
});

test("flags can disable instagram", () => {
  process.env.ARTHUR_FLAG_INSTAGRAM = "0";
  const f = getArthurFeatureFlags();
  const r = assertChannelEnabled("instagram", f);
  assert.equal(r.ok, false);
  delete process.env.ARTHUR_FLAG_INSTAGRAM;
});

test("rate config positives", () => {
  const c = getRateLimitConfig();
  assert.ok(c.perHour >= 1);
  assert.ok(c.perDay >= 1);
});

test("rate bucket key", () => {
  assert.equal(
    rateBucketKey({ channel: "instagram", userId: null, externalUserId: "ig1" }),
    "instagram:ig1",
  );
});

test("cost budget config", () => {
  const c = getCostBudgetConfig();
  assert.ok(c.dayUsd > 0);
  assert.ok(c.softRatio > 0 && c.softRatio <= 1);
});

test("offline technique response", () => {
  const r = buildOfflineResponse("Comment améliorer mon crawl ?", {
    reason: "flag_offline",
    snippets: [
      {
        topic: "technique_crawl",
        title: "t",
        content: "Respire toutes les 3 coulées.",
      },
    ],
  });
  assert.ok(r.message.includes("coulées") || r.message.length > 20);
  assert.equal(r.extracted_data.offline, true);
});

test("offline rate limited message", () => {
  const r = buildOfflineResponse("salut", { reason: "rate_limited" });
  assert.ok(/break|moment/i.test(r.message));
});

test("detect human takeover keywords", () => {
  assert.equal(detectsHumanTakeoverRequest("Je veux parler à un humain"), true);
  assert.equal(detectsHumanTakeoverRequest("Je veux un remboursement"), true);
  assert.equal(detectsHumanTakeoverRequest("Problème de paiement"), true);
  assert.equal(detectsHumanTakeoverRequest("stop arthur"), true);
  assert.equal(detectsHumanTakeoverRequest("plan triathlon"), false);
  assert.equal(detectsHumanTakeoverRequest("Kebab ?"), false);
  assert.equal(detectsHumanTakeoverRequest("Quel est le prix de l’app ?"), false);
});

test("hasOpenAiApiKey boolean", () => {
  assert.equal(typeof hasOpenAiApiKey(), "boolean");
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

console.log("arthur production G tests passed");
