/**
 * Tests support in-app + Telegram opérateur.
 * Run: npm run test:support
 */
import assert from "node:assert/strict";
import {
  asMessageBody,
  extractTelegramMessage,
  formatLandingContactNotify,
  formatOperatorClosed,
  formatOperatorNotify,
  isLandingContactNotify,
  isOperatorChat,
  isSupportKind,
  isTelegramUpdate,
  parseOperatorText,
  parseSupportCodeFromText,
  wantsHumanHandoff,
} from "./parse.js";
import { isSupportRequest } from "./http.js";
import { attachLastMessages } from "./preview.js";
import { hashBucketPart, windowStartIso } from "./rate-limit.js";

test("http module loads (ESM exports)", () => {
  assert.equal(typeof isSupportRequest, "function");
});

test("conversation history keeps last message per thread", () => {
  const previews = attachLastMessages(
    [
      { id: "a", updated_at: "2026-08-24T10:00:00Z" },
      { id: "b", updated_at: "2026-08-23T10:00:00Z" },
    ],
    [
      { conversation_id: "a", id: "m1", role: "user", body: "premier", created_at: "2026-08-24T09:00:00Z" },
      { conversation_id: "a", id: "m2", role: "agent", body: "réponse Arthur", created_at: "2026-08-24T09:05:00Z" },
      { conversation_id: "b", id: "m3", role: "user", body: "ancien fil", created_at: "2026-08-23T09:00:00Z" },
    ],
  );
  assert.equal(previews[0].last_body, "réponse Arthur");
  assert.equal(previews[0].last_role, "agent");
  assert.equal(previews[1].last_body, "ancien fil");
});

test("kind + message limits", () => {
  assert.equal(isSupportKind("app-support"), true);
  assert.equal(isSupportKind("support"), true);
  assert.equal(isSupportKind("contact"), false);
  assert.equal(asMessageBody(""), null);
  assert.equal(asMessageBody("  hello  "), "hello");
  assert.equal(asMessageBody("x".repeat(2001)), null);
});

test("handoff keywords", () => {
  assert.equal(wantsHumanHandoff("Je veux parler à l’équipe"), true);
  assert.equal(wantsHumanHandoff("C'est quoi Z2 ?"), false);
});

test("operator commands", () => {
  assert.deepEqual(parseOperatorText("/close"), { type: "close", shortCode: undefined });
  assert.deepEqual(parseOperatorText("/close a1b2c3d4"), { type: "close", shortCode: "a1b2c3d4" });
  assert.deepEqual(parseOperatorText("/help"), { type: "ignore" });
  assert.equal(parseOperatorText("Tu peux relancer l’onboarding").type, "reply");
});

test("telegram update extract + reply-to code", () => {
  const body = {
    update_id: 42,
    message: {
      message_id: 9,
      chat: { id: 111 },
      from: { id: 111 },
      text: "Ok j’arrive",
      reply_to_message: {
        message_id: 8,
        text: "💬 Support · ab12cd34\nMarie · marie@test.com",
      },
    },
  };
  assert.equal(isTelegramUpdate(body), true);
  const inbound = extractTelegramMessage(body);
  assert.ok(inbound);
  assert.equal(inbound.chatId, 111);
  assert.equal(inbound.replyToMessageId, 8);
  assert.equal(parseSupportCodeFromText(inbound.replyToText), "ab12cd34");
  assert.equal(isOperatorChat(111, "111"), true);
  assert.equal(isOperatorChat(111, "999"), false);
  assert.equal(isOperatorChat(111, ""), false);
});

test("leading-zero short code and quote reply", () => {
  const text = formatOperatorNotify({
    shortCode: "082866fb",
    displayName: "Lison",
    email: "lison@test.com",
    body: "Salut",
    isNew: true,
  });
  assert.equal(parseSupportCodeFromText(text), "082866fb");

  const quoted = extractTelegramMessage({
    update_id: 7,
    message: {
      message_id: 20,
      chat: { id: 111 },
      from: { id: 111 },
      text: "Hello",
      quote: { text: "Salut" },
      reply_parameters: { message_id: 19, quote: { text: "Salut" } },
      reply_to_message: {
        message_id: 19,
        text,
      },
    },
  });
  assert.ok(quoted);
  assert.equal(quoted.text, "Hello");
  assert.equal(quoted.replyToMessageId, 19);
  assert.equal(parseSupportCodeFromText(quoted.replyToText), "082866fb");
});

test("business_message and reply_parameters without reply_to_message", () => {
  const inbound = extractTelegramMessage({
    update_id: 8,
    business_message: {
      message_id: 21,
      chat: { id: 111 },
      from: { id: 111 },
      text: "Tu as besoin d’aide ?",
      reply_parameters: { message_id: 19 },
    },
  });
  assert.ok(inbound);
  assert.equal(inbound.replyToMessageId, 19);
  assert.equal(inbound.text, "Tu as besoin d’aide ?");
});

test("notify format is replyable", () => {
  const text = formatOperatorNotify({
    shortCode: "deadbeef",
    displayName: "Marie",
    email: "marie@myswym.app",
    body: "Mon plan ne s’affiche plus",
    isNew: true,
  });
  assert.match(text, /Support · deadbeef/);
  assert.match(text, /Marie · marie@myswym.app/);
  assert.match(text, /nouvelle conversation/);
  assert.match(text, /\/close/);
  assert.equal(parseSupportCodeFromText(text), "deadbeef");
});

test("user close notifies operator", () => {
  const text = formatOperatorClosed({
    shortCode: "deadbeef",
    displayName: "Marie",
    email: "marie@myswym.app",
  });
  assert.match(text, /Support · deadbeef/);
  assert.match(text, /Marie · marie@myswym.app/);
  assert.match(text, /clôturé/);
  assert.equal(parseSupportCodeFromText(text), "deadbeef");
});

test("landing contact notify is email-only, not a support thread", () => {
  const text = formatLandingContactNotify({
    name: "Marie",
    email: "marie@test.com",
    subject: "Partenariat",
    body: "On peut discuter ?",
  });
  assert.match(text, /Contact landing/);
  assert.match(text, /Marie · marie@test.com/);
  assert.match(text, /Objet : Partenariat/);
  assert.match(text, /On peut discuter \?/);
  assert.match(text, /Réponds par e-mail à marie@test.com/);
  assert.equal(isLandingContactNotify(text), true);
  assert.equal(parseSupportCodeFromText(text), null);
  assert.equal(isLandingContactNotify("💬 Support · deadbeef\nMarie"), false);
});

test("ignore non-telegram contact payloads", () => {
  assert.equal(isTelegramUpdate({ name: "A", email: "a@b.c", message: "hi" }), false);
  assert.equal(extractTelegramMessage({ foo: 1 }), null);
});

test("rate-limit windows are stable buckets", () => {
  const t0 = Date.UTC(2026, 7, 24, 12, 0, 0);
  assert.equal(windowStartIso(600, t0), windowStartIso(600, t0 + 599_999));
  assert.notEqual(windowStartIso(600, t0), windowStartIso(600, t0 + 600_000));
  assert.equal(hashBucketPart("a@b.c").length, 16);
  assert.equal(hashBucketPart("a@b.c"), hashBucketPart("a@b.c"));
  assert.notEqual(hashBucketPart("a@b.c"), hashBucketPart("c@b.a"));
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

console.log("support tests passed");
