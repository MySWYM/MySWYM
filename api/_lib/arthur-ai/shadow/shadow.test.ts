/**
 * Tests Shadow Mode H1 — classification + politique DM + gates (pas d’envoi).
 * Run: npm run test:arthur:shadow
 */
import assert from "node:assert/strict";
import {
  isInstagramShadowMode,
  canLiveSendInstagram,
  classifyRecommendedAction,
} from "./mode.js";
import {
  applyShadowReplyPolicy,
  containsMyswymLink,
  isOffTopicDm,
  isPricingDm,
  isLegitimateHandoffDm,
  HUMAN_HANDOFF_CLIENT_MESSAGE,
} from "./reply-policy.js";
import { buildOfflineResponse } from "../production/offline.js";
import { takeoverHoldMessage } from "../production/takeover.js";
import { isFollowupSendEnabled } from "../conversion/send.js";
import { fallbackStructured } from "../intent.js";

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

test("kebab → ignore/no_reply, brouillon vide, jamais handoff", () => {
  for (const inbound of ["Je voudrais un kebab", "Kebab ?", "kebab ?"]) {
    assert.equal(isOffTopicDm(inbound), true);
    assert.equal(isLegitimateHandoffDm(inbound), false);

    const offline = buildOfflineResponse(inbound, { reason: "openai_error" });
    assert.equal(offline.intent, "other");
    assert.equal(offline.suggested_action, "no_reply");
    assert.equal(offline.message, "");
    assert.equal(containsMyswymLink(offline.message), false);

    // LLM qui force un handoff générique → écrasé
    const poisoned = fallbackStructured(
      "Je te passe un humain. Arthur se met en pause — contact@myswym.app",
    );
    poisoned.intent = "support";
    poisoned.suggested_action = "handoff_human";
    poisoned.lead_temperature = "warm";
    const cleaned = applyShadowReplyPolicy(poisoned, inbound);
    assert.equal(cleaned.suggested_action, "no_reply");
    assert.equal(cleaned.message, "");
    assert.equal(cleaned.intent, "other");
    assert.equal(
      classifyRecommendedAction({
        suggested_action: cleaned.suggested_action,
        intent: cleaned.intent,
        lead_temperature: cleaned.lead_temperature,
        message: cleaned.message,
      }),
      "ignore",
    );
  }
});

test("handoff_human — texte client exact uniquement si légitime", () => {
  assert.equal(isLegitimateHandoffDm("Je veux parler à un humain"), true);
  assert.equal(isLegitimateHandoffDm("Problème de paiement sur mon compte"), true);
  assert.equal(isLegitimateHandoffDm("Je veux un remboursement"), true);
  assert.equal(isLegitimateHandoffDm("J’ai une blessure au genou"), true);
  assert.equal(isLegitimateHandoffDm("plan triathlon"), false);
  assert.equal(isLegitimateHandoffDm("Kebab ?"), false);

  const hold = takeoverHoldMessage();
  assert.equal(hold.message, HUMAN_HANDOFF_CLIENT_MESSAGE);
  assert.equal(hold.suggested_action, "handoff_human");
  assert.equal(/Arthur se met en pause|Je te passe un humain/i.test(hold.message), false);

  const cleaned = applyShadowReplyPolicy(
    fallbackStructured("brouillon LLM"),
    "Je veux parler à quelqu’un de l’équipe",
  );
  assert.equal(cleaned.suggested_action, "handoff_human");
  assert.equal(cleaned.message, HUMAN_HANDOFF_CLIENT_MESSAGE);
  assert.equal(
    classifyRecommendedAction({
      suggested_action: cleaned.suggested_action,
      intent: cleaned.intent,
      message: cleaned.message,
    }),
    "handoff_human",
  );
});

test("prix app → réponse tarifaire directe", () => {
  const inbound = "Quel est le prix de l’app ?";
  assert.equal(isPricingDm(inbound), true);
  assert.equal(isLegitimateHandoffDm(inbound), false);

  const offline = buildOfflineResponse(inbound, { reason: "flag_offline" });
  assert.equal(offline.intent, "subscription");
  assert.match(offline.message, /4[,.]99/);
  assert.match(offline.message, /39[,.]99|\/tarifs/i);
  assert.equal(offline.suggested_action, "continue");
});

test("progresser en crawl → conseil utile", () => {
  const inbound = "Je veux progresser en crawl";
  assert.equal(isOffTopicDm(inbound), false);

  const offline = buildOfflineResponse(inbound, { reason: "openai_error" });
  assert.ok(["technique", "swimming_question", "training"].includes(offline.intent));
  assert.match(offline.message, /crawl|respiration|coulée|semaine/i);
  assert.equal(containsMyswymLink(offline.message), false);
  assert.notEqual(offline.suggested_action, "no_reply");
  assert.notEqual(offline.suggested_action, "handoff_human");
});

test("triathlon 3 mois → qualification adaptée", () => {
  const inbound = "J’ai un triathlon dans 3 mois";
  assert.equal(isOffTopicDm(inbound), false);

  const offline = buildOfflineResponse(inbound, { reason: "no_api_key" });
  assert.equal(offline.intent, "goal");
  assert.match(offline.message, /triathlon|semaine|bassin|eau libre/i);
  assert.equal(offline.suggested_action, "qualify_frequency");
  assert.equal(
    classifyRecommendedAction({
      suggested_action: offline.suggested_action,
      intent: offline.intent,
      lead_temperature: offline.lead_temperature,
      message: offline.message,
    }),
    "qualify",
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
