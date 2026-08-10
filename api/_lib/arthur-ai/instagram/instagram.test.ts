/**
 * Tests Instagram / Meta Phase E (mock, pas de réseau Meta).
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.ARTHUR_AI_MOCK = "1";
process.env.INSTAGRAM_MOCK = "1";
delete process.env.INSTAGRAM_ACCESS_TOKEN;
delete process.env.META_APP_SECRET;
delete process.env.META_VERIFY_TOKEN;

const parseMod = await import("./parse-webhook.js");
const mockMod = await import("./mock.js");
const metaMod = await import("./meta-client.js");
const identityMod = await import("./identity.js");
const { executeArthurTool } = await import("../tools/index.js");
const { buildAuthContext, conversationBelongsToAuth } = await import("../security.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}
async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}

test("mock mode actif sans credentials", () => {
  assert.equal(mockMod.isInstagramMockMode(), true);
});

test("webhook challenge", () => {
  process.env.META_VERIFY_TOKEN = "tok";
  const ok = parseMod.verifyWebhookChallenge({
    "hub.mode": "subscribe",
    "hub.verify_token": "tok",
    "hub.challenge": "12345",
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.challenge, "12345");
  const bad = parseMod.verifyWebhookChallenge({
    "hub.mode": "subscribe",
    "hub.verify_token": "wrong",
    "hub.challenge": "1",
  });
  assert.equal(bad.ok, false);
  delete process.env.META_VERIFY_TOKEN;
});

test("parse DM + attribution reel/campaign", () => {
  const payload = mockMod.buildMockWebhookPayload({
    senderId: "ig_sender_abc",
    text: "PLAN je veux un programme",
    referral: {
      source: "ADS",
      campaign: "summer26",
      reel_id: "reel_999",
      ref: "campaign:summer26|reel:reel_999|source:ADS",
    },
  });
  const msgs = parseMod.parseInstagramWebhook(payload);
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].senderId, "ig_sender_abc");
  assert.equal(msgs[0].attribution.reel_id, "reel_999");
  assert.equal(msgs[0].attribution.campaign, "summer26");
  assert.equal(msgs[0].attribution.keyword, "PLAN");
  assert.equal(parseMod.detectKeyword("salut PLAN demain"), "PLAN");
});

test("ignore echo messages", () => {
  const payload = {
    object: "instagram",
    entry: [
      {
        messaging: [
          {
            sender: { id: "page" },
            recipient: { id: "user" },
            message: { mid: "1", text: "echo", is_echo: true },
          },
        ],
      },
    ],
  };
  const msgs = parseMod.parseInstagramWebhook(payload).filter((m) => !m.isEcho);
  assert.equal(msgs.length, 0);
});

test("signature Meta HMAC", () => {
  const prevMock = process.env.INSTAGRAM_MOCK;
  delete process.env.INSTAGRAM_MOCK;
  process.env.META_APP_SECRET = "secret";
  process.env.META_VERIFY_TOKEN = "v";
  process.env.INSTAGRAM_ACCESS_TOKEN = "token";
  assert.equal(mockMod.isInstagramMockMode(), false);

  const body = '{"object":"instagram"}';
  const sig =
    "sha256=" +
    createHmac("sha256", "secret").update(Buffer.from(body, "utf8")).digest("hex");
  assert.equal(parseMod.verifyMetaSignature(body, sig), true);
  assert.equal(
    parseMod.verifyMetaSignature(body, sig.replace("sha256=", "SHA256=")),
    true,
  );
  assert.equal(parseMod.verifyMetaSignature(body, "sha256=deadbeef"), false);

  process.env.INSTAGRAM_MOCK = prevMock || "1";
  delete process.env.META_APP_SECRET;
  delete process.env.INSTAGRAM_ACCESS_TOKEN;
  delete process.env.META_VERIFY_TOKEN;
});

await testAsync("send mock outbound", async () => {
  mockMod.clearMockOutbound();
  const r = await metaMod.sendInstagramTextMessage({
    recipientId: "ig_x",
    text: "Salut coach",
  });
  assert.equal(r.ok, true);
  assert.equal(r.mock, true);
  assert.equal(mockMod.getMockOutbound().length, 1);
});

await testAsync("identity — resolve only verified", async () => {
  const UID = "11111111-1111-4111-8111-111111111111";
  let status = "pending";
  const admin = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        maybeSingle: async () =>
          status === "verified"
            ? { data: { user_id: UID, status: "verified" }, error: null }
            : { data: { user_id: null, status: "pending" }, error: null },
        insert: async () => ({ error: null }),
        update() {
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  assert.equal(
    await identityMod.resolveVerifiedUserId(admin, "instagram", "ig_1"),
    null,
  );
  status = "verified";
  assert.equal(
    await identityMod.resolveVerifiedUserId(admin, "instagram", "ig_1"),
    UID,
  );
});

await testAsync("identity — refuse collision external==userId", async () => {
  const UID = "11111111-1111-4111-8111-111111111111";
  const admin = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        maybeSingle: async () => ({ data: null, error: null }),
        insert: async () => ({ error: null }),
        update() {
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  const r = await identityMod.verifyIdentityLink(admin, {
    provider: "instagram",
    externalUserId: UID,
    userId: UID,
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, "identity_collision");
});

test("IGSID ≠ userId dans auth", () => {
  const auth = buildAuthContext({
    userId: null,
    externalUserId: "17841400000000",
    channel: "instagram",
  });
  assert.equal(auth.userId, null);
  assert.equal(auth.externalUserId, "17841400000000");
});

test("conversation appartient à external même si user_id rattaché", () => {
  const ok = conversationBelongsToAuth(
    {
      user_id: "11111111-1111-4111-8111-111111111111",
      external_user_id: "ig_1",
    },
    {
      userId: "11111111-1111-4111-8111-111111111111",
      externalUserId: "ig_1",
      channel: "instagram",
    },
  );
  assert.equal(ok, true);
  const cross = conversationBelongsToAuth(
    {
      user_id: "22222222-2222-4222-8222-222222222222",
      external_user_id: "ig_1",
    },
    {
      userId: "11111111-1111-4111-8111-111111111111",
      externalUserId: "ig_1",
      channel: "instagram",
    },
  );
  assert.equal(cross, false);
});

await testAsync("Instagram — writes tools bloqués", async () => {
  const r = await executeArthurTool(
    "create_training_plan",
    { confirmed: true },
    {
      admin: { from() {} },
      auth: {
        userId: "11111111-1111-4111-8111-111111111111",
        externalUserId: "ig_1",
        channel: "instagram",
      },
      conversationId: "33333333-3333-4333-8333-333333333333",
    },
  );
  assert.equal(r.success, false);
  assert.equal(r.error, "instagram_writes_disabled");
});

console.log(`\n${passed} instagram tests passed`);
