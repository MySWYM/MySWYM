/**
 * Tests support in-app + Telegram opérateur.
 * Run: npm run test:support
 */
import assert from "node:assert/strict";
import {
  asMessageBody,
  extractTelegramMessage,
  formatOperatorNotify,
  isOperatorChat,
  isSupportKind,
  isTelegramUpdate,
  parseOperatorText,
  parseSupportCodeFromText,
  wantsHumanHandoff,
} from "./parse.js";

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

test("ignore non-telegram contact payloads", () => {
  assert.equal(isTelegramUpdate({ name: "A", email: "a@b.c", message: "hi" }), false);
  assert.equal(extractTelegramMessage({ foo: 1 }), null);
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
