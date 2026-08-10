/**
 * Tests Shadow H1 — conseiller conversationnel + ignore/handoff + multi-tours.
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
  buildConversationalReply,
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
import { matchBuiltinKnowledge } from "../knowledge/myswym-product.js";

test("shadow ON / live send off / followups off", () => {
  delete process.env.ARTHUR_FLAG_SHADOW_INSTAGRAM;
  delete process.env.ARTHUR_INSTAGRAM_LIVE_SEND;
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  assert.equal(isInstagramShadowMode(), true);
  assert.equal(canLiveSendInstagram(), false);
  assert.equal(isFollowupSendEnabled(), false);
});

test("comment fonctionne l’app → réponse produit, pas ignore", () => {
  const inbound = "Comment fonctionne l’application ?";
  assert.equal(isOffTopicDm(inbound), false);
  assert.equal(isLegitimateHandoffDm(inbound), false);

  const r = buildOfflineResponse(inbound, { reason: "openai_error" });
  assert.equal(r.suggested_action === "no_reply", false);
  assert.equal(r.suggested_action === "handoff_human", false);
  assert.ok(r.message.length > 40);
  assert.match(r.message, /MySWYM|plan|natation/i);
  assert.match(r.message, /\?/); // une question pour poursuivre
  assert.ok(["myswym_question", "subscription"].includes(r.intent));
});

test("progresser en crawl → conseil + question, pas handoff", () => {
  const inbound = "Je veux progresser en crawl ?";
  assert.equal(isOffTopicDm(inbound), false);
  assert.equal(isLegitimateHandoffDm(inbound), false);

  const r = buildOfflineResponse(inbound, { reason: "flag_offline" });
  assert.notEqual(r.suggested_action, "handoff_human");
  assert.notEqual(r.suggested_action, "no_reply");
  assert.match(r.message, /crawl|respiration|coulée/i);
  assert.match(r.message, /semaine|\?/);
  assert.equal(
    classifyRecommendedAction({
      suggested_action: r.suggested_action,
      intent: r.intent,
      lead_temperature: r.lead_temperature,
      message: r.message,
    }) === "handoff_human",
    false,
  );
});

test("triathlon 4 mois → qualification, pas handoff", () => {
  const inbound = "J’ai un triathlon dans 4 mois";
  assert.equal(isLegitimateHandoffDm(inbound), false);
  const r = buildOfflineResponse(inbound, { reason: "no_api_key" });
  assert.equal(r.intent, "goal");
  assert.notEqual(r.suggested_action, "handoff_human");
  assert.match(r.message, /triathlon|distance|niveau|semaine/i);
  assert.match(r.message, /\?/);
});

test("prix → tarif clair + /tarifs", () => {
  const inbound = "Quel est le prix ?";
  assert.equal(isPricingDm(inbound), true);
  const r = buildOfflineResponse(inbound, { reason: "openai_error" });
  assert.match(r.message, /4[,.]99/);
  assert.match(r.message, /tarifs/i);
  assert.notEqual(r.suggested_action, "handoff_human");
});

test("kebab → ignore, brouillon vide, pas handoff", () => {
  for (const inbound of ["kebab ?", "Je voudrais un kebab", "Kebab ?"]) {
    assert.equal(isOffTopicDm(inbound), true);
    const r = buildOfflineResponse(inbound, { reason: "openai_error" });
    assert.equal(r.suggested_action, "no_reply");
    assert.equal(r.message, "");
    assert.equal(isLegitimateHandoffDm(inbound), false);

    const poisoned = fallbackStructured(HUMAN_HANDOFF_CLIENT_MESSAGE);
    poisoned.suggested_action = "handoff_human";
    const cleaned = applyShadowReplyPolicy(poisoned, inbound);
    assert.equal(cleaned.suggested_action, "no_reply");
    assert.equal(cleaned.message, "");
  }
});

test("handoff légitime — texte exact", () => {
  assert.equal(isLegitimateHandoffDm("Je veux un remboursement"), true);
  assert.equal(isLegitimateHandoffDm("Je veux parler à un humain"), true);
  assert.equal(isLegitimateHandoffDm("Problème de paiement sur mon compte"), true);
  assert.equal(takeoverHoldMessage().message, HUMAN_HANDOFF_CLIENT_MESSAGE);

  const r = applyShadowReplyPolicy(
    fallbackStructured("brouillon"),
    "Je veux parler à quelqu’un de l’équipe",
  );
  assert.equal(r.message, HUMAN_HANDOFF_CLIENT_MESSAGE);
  assert.equal(r.suggested_action, "handoff_human");
});

test("builtin knowledge produit disponible runtime", () => {
  const snips = matchBuiltinKnowledge("Comment fonctionne l’application ?", "myswym_question", 2);
  assert.ok(snips.length >= 1);
  assert.ok(snips.some((s) => /plan|MySWYM|essai/i.test(s.content)));
});

test("conversation multi-tours crawl (≥3 échanges)", () => {
  const turns = [
    "Je veux progresser en crawl",
    "Je nage 2 fois par semaine",
    "Oui je veux un plan suivi",
  ];
  const replies: string[] = [];
  for (const t of turns) {
    const r = buildOfflineResponse(t, { reason: "openai_error" });
    assert.notEqual(r.suggested_action, "no_reply");
    assert.notEqual(r.suggested_action, "handoff_human");
    assert.ok(r.message.trim().length > 20, `empty reply for: ${t}`);
    replies.push(r.message);
  }
  assert.equal(replies.length, 3);
  assert.match(replies[0], /crawl|respiration|semaine/i);
  assert.ok(replies[1].length > 20);
  assert.match(replies[2], /plan|MySWYM|inscription|fréquence|objectif/i);
});

test("conversation multi-tours triathlon (≥3 échanges)", () => {
  const turns = [
    "J’ai un triathlon dans 4 mois",
    "C’est un M, je suis débutant en natation",
    "Je peux nager 2 fois par semaine",
  ];
  for (const t of turns) {
    const r = buildOfflineResponse(t, { reason: "flag_offline" });
    assert.notEqual(r.suggested_action, "handoff_human");
    assert.ok(r.message.length > 20);
  }
  const first = buildConversationalReply(turns[0]);
  assert.ok(first);
  assert.match(first!.message, /distance|niveau|\?/i);
});

test("conversation multi-tours découverte app (≥3 échanges)", () => {
  const turns = [
    "Comment fonctionne l’application ?",
    "Je veux surtout améliorer mon crawl",
    "Quel est le prix ?",
  ];
  const out = turns.map((t) => buildOfflineResponse(t, { reason: "no_api_key" }));
  assert.match(out[0].message, /MySWYM|plan/i);
  assert.notEqual(out[0].suggested_action, "no_reply");
  assert.match(out[1].message, /crawl|semaine/i);
  assert.match(out[2].message, /4[,.]99/);
  assert.ok(containsMyswymLink(out[2].message) || /tarifs/i.test(out[2].message));
});

test("conversation multi-tours abonnement (≥3 échanges)", () => {
  const turns = [
    "C’est combien l’abonnement ?",
    "Il y a un essai ?",
    "Et si j’annule pendant l’essai ?",
  ];
  for (const t of turns) {
    const r = buildOfflineResponse(t, { reason: "openai_error" });
    assert.notEqual(r.suggested_action, "handoff_human");
    assert.ok(r.message.length > 15);
  }
  assert.match(
    buildOfflineResponse(turns[0], { reason: "openai_error" }).message,
    /4[,.]99/,
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
