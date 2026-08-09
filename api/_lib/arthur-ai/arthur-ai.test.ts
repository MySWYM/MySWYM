/**
 * Tests Arthur AI Phase D — tools + façade moteur.
 * Run: npm run test:arthur
 */
import assert from "node:assert/strict";

process.env.ARTHUR_AI_MOCK = "1";

const {
  inferIntentHeuristic,
  parseArthurStructuredOutput,
  normalizeExtractedData,
  fallbackStructured,
} = await import("./intent.js");
const {
  mockStructuredFromUserPayload,
  callArthurOpenAI,
  estimateCostUsd,
} = await import("./openai.js");
const {
  buildAuthContext,
  assertProcessInput,
  conversationBelongsToAuth,
  isUuid,
} = await import("./security.js");
const { FALLBACK_ARTHUR_PROMPT } = await import("./prompt.js");
const { getUserProfile } = await import("./tools/get-user-profile.js");
const { getSubscriptionStatus } = await import("./tools/get-subscription-status.js");
const { createTrainingPlan } = await import("./tools/create-training-plan.js");
const { updateUserProfile } = await import("./tools/update-user-profile.js");
const { createCheckout } = await import("./tools/create-checkout.js");
const { executeArthurTool } = await import("./tools/index.js");
const {
  generateArthurPlan,
  mergePreservingProgress,
  shouldPreserveWeek,
  buildPlanPhases,
  computePlanTotalWeeks,
} = await import("../../../src/lib/sports-engine/server-adapter/index.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`fail - ${name}`);
    throw err;
  }
}
async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`fail - ${name}`);
    throw err;
  }
}

const UID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

// ── Phase C regressions ──────────────────────────────────────────
test("intent technique — Je veux améliorer mon crawl", () => {
  assert.equal(inferIntentHeuristic("Je veux améliorer mon crawl"), "technique");
  assert.equal(mockStructuredFromUserPayload("Je veux améliorer mon crawl").intent, "technique");
});

test("goal extrait — triathlon 12 semaines", () => {
  const msg = "Je prépare un triathlon dans 12 semaines";
  assert.equal(inferIntentHeuristic(msg), "goal");
  const mock = mockStructuredFromUserPayload(msg);
  assert.equal(mock.extracted_data.goal, "triathlon");
  assert.ok(mock.extracted_data.target_date);
});

test("sécurité — Instagram ID ≠ userId", () => {
  const auth = buildAuthContext({
    userId: null,
    externalUserId: "ig_psid_12345",
    channel: "instagram",
  });
  assert.equal(auth.userId, null);
  assert.equal(isUuid("ig_psid_12345"), false);
  assert.equal(
    conversationBelongsToAuth(
      { user_id: OTHER, external_user_id: null },
      { userId: UID, externalUserId: null, channel: "web" },
    ),
    false,
  );
});

test("web exige userId MySWYM", () => {
  assert.equal(
    assertProcessInput({ channel: "web", message: "Hello", externalUserId: "ig_only" }).ok,
    false,
  );
});

test("parse structured + fallback", () => {
  const ok = parseArthurStructuredOutput(
    JSON.stringify({
      message: "Conseil",
      intent: "technique",
      lead_temperature: "warm",
      extracted_data: {
        goal: null,
        level: "sportif",
        frequency: 3,
        target_date: null,
        distance: null,
        pace: null,
        equipment: [],
        injury: null,
        needs_plan: false,
        needs_human: false,
      },
      suggested_action: "continue",
    }),
  );
  assert.equal(ok.intent, "technique");
  assert.equal(fallbackStructured("x").message, "x");
  assert.equal(normalizeExtractedData({ frequency: "3" }).frequency, 3);
});

await testAsync("OpenAI mock mode", async () => {
  const res = await callArthurOpenAI({
    systemPrompt: FALLBACK_ARTHUR_PROMPT,
    userPayload: JSON.stringify({ current_message: "Je veux améliorer mon crawl" }),
    auth: { userId: UID, externalUserId: null, channel: "web" },
  });
  assert.equal(res.mock, true);
  assert.equal(res.structured.intent, "technique");
});

test("estimateCostUsd", () => {
  assert.ok(estimateCostUsd("gpt-4.1-mini", 1000, 500) > 0);
});

await testAsync("get_user_profile filtré", async () => {
  let seen = null;
  const admin = {
    from() {
      return {
        select() {
          return this;
        },
        eq(c, v) {
          seen = v;
          return this;
        },
        maybeSingle: async () =>
          seen === UID
            ? {
                data: {
                  level: "sportif",
                  objective: "triathlon_olympic",
                  frequency: 3,
                  session_duration: 60,
                  equipment: [],
                  pool_length: 25,
                  preferred_stroke: "crawl",
                  race_target: null,
                  injury_status: null,
                  pace100: 90,
                  readiness_profile: null,
                  updated_at: "2026-08-09",
                },
                error: null,
              }
            : { data: null, error: null },
      };
    },
  };
  assert.equal((await getUserProfile(admin, UID)).level, "sportif");
  assert.deepEqual(await getUserProfile(admin, OTHER), {});
  assert.deepEqual(await getUserProfile(admin, "ig_x"), {});
});

await testAsync("subscription anonymous", async () => {
  const s = await getSubscriptionStatus({ from() {} }, null);
  assert.equal(s.status, "anonymous");
});

test("prompt fallback", () => {
  assert.ok(FALLBACK_ARTHUR_PROMPT.includes("create_training_plan"));
  assert.ok(!FALLBACK_ARTHUR_PROMPT.toLowerCase().includes("je suis une ia"));
});

// ── Phase D — façade moteur ──────────────────────────────────────
await testAsync("generateArthurPlan utilise buildCoachPlanWeeks", async () => {
  const res = await generateArthurPlan({
    profile: {
      goal: "triathlon_olympic",
      category: "triathlon",
      level: "sportif",
      sessionsPerWeek: 3,
      pool: 25,
      equipment: [],
      eventDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 12 * 7);
        return d.toISOString().slice(0, 10);
      })(),
    },
    weeks: 8,
    isPremium: true,
  });
  assert.equal(res.success, true);
  assert.ok(res.plan.weeks.length >= 8);
  assert.ok(res.plan.weeks[0].sessions?.length >= 1);
  assert.equal(res.plan.version, 42);
  assert.equal(res.plan.source, "arthur_ai");
});

test("phases alignées App (8 semaines)", () => {
  const phases = buildPlanPhases(8);
  assert.equal(phases.length, 8);
  assert.equal(phases[phases.length - 1].phase, "competition");
  assert.equal(computePlanTotalWeeks({ goal: "reprendre" }), 6);
});

test("preserve progress", () => {
  const oldW = [
    {
      number: 1,
      sessions: [{ completed: true, title: "S1" }],
    },
    { number: 2, sessions: [{ completed: false }] },
  ];
  const newW = [
    { number: 1, sessions: [{ completed: false, title: "NEW" }] },
    { number: 2, sessions: [{ completed: false, title: "NEW2" }] },
  ];
  assert.equal(shouldPreserveWeek(oldW[0]), true);
  const merged = mergePreservingProgress(oldW, newW);
  assert.equal(merged[0].sessions[0].title, "S1");
  assert.equal(merged[1].sessions[0].title, "NEW2");
});

await testAsync("diplôme refusé par façade", async () => {
  const res = await generateArthurPlan({
    profile: { goal: "bnssa", level: "sportif", sessionsPerWeek: 3, pool: 25 },
  });
  assert.equal(res.success, false);
  assert.equal(res.error, "unsupported_goal");
});

// ── create_training_plan ─────────────────────────────────────────
function mockAdminForPlan({ hasPlan = false, premium = true } = {}) {
  const store = {
    plans_json: hasPlan
      ? [
          {
            id: "plan_old",
            profile: {
              goal: "triathlon_olympic",
              level: "sportif",
              sessionsPerWeek: 3,
              pool: 25,
            },
            plan: {
              weeks: [
                { number: 1, sessions: [{ completed: true, title: "done" }] },
                { number: 2, sessions: [{ completed: false }] },
              ],
              volumeAdj: 1,
            },
          },
        ]
      : [],
    active_plan_id: hasPlan ? "plan_old" : null,
  };

  const chain = {
    select() {
      return chain;
    },
    eq() {
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return chain;
    },
    in() {
      return chain;
    },
    is() {
      return chain;
    },
    maybeSingle: async () => {
      // resolved per-table below via closure override
      return { data: null, error: null };
    },
    single: async () => ({ data: { id: "x" }, error: null }),
    upsert: async (row) => {
      if (chain._table === "user_plans") {
        store.plans_json = row.plans_json;
        store.active_plan_id = row.active_plan_id;
      }
      return { data: null, error: null };
    },
    insert() {
      return {
        select() {
          return {
            maybeSingle: async () => ({ data: { id: "evt" }, error: null }),
          };
        },
      };
    },
    update() {
      return {
        eq() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    select() {
                      return {
                        maybeSingle: async () => ({ data: { id: "x" }, error: null }),
                      };
                    },
                  };
                },
                select() {
                  return {
                    maybeSingle: async () => ({ data: { id: "x" }, error: null }),
                  };
                },
              };
            },
          };
        },
      };
    },
    _table: "",
  };

  return {
    from(table) {
      const api = {
        ...chain,
        _table: table,
        maybeSingle: async () => {
          if (table === "user_access_state") {
            return {
              data: premium
                ? {
                    access_status: "active",
                    trial_ends_at: null,
                    trial_used: true,
                    subscription_ends_at: null,
                    cancel_at_period_end: false,
                    updated_at: new Date().toISOString(),
                  }
                : null,
              error: null,
            };
          }
          if (table === "user_plans") {
            return {
              data: {
                plans_json: store.plans_json,
                active_plan_id: store.active_plan_id,
                updated_at: new Date().toISOString(),
                profile: store.plans_json[0]?.profile || null,
              },
              error: null,
            };
          }
          if (table === "sport_profiles") {
            return {
              data: {
                level: "sportif",
                objective: "triathlon_olympic",
                frequency: 3,
                session_duration: 60,
                equipment: [],
                pool_length: 25,
                preferred_stroke: null,
                race_target: null,
                injury_status: null,
                pace100: null,
                readiness_profile: null,
                extra: {},
                updated_at: new Date().toISOString(),
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
        upsert: async (row) => {
          if (table === "user_plans") {
            store.plans_json = row.plans_json;
            store.active_plan_id = row.active_plan_id;
          }
          return { data: null, error: null };
        },
        insert() {
          return {
            select() {
              return {
                maybeSingle: async () => ({ data: { id: "evt" }, error: null }),
              };
            },
          };
        },
        update() {
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
        select() {
          return api;
        },
        eq() {
          return api;
        },
        order() {
          return api;
        },
        limit() {
          return api;
        },
      };
      return api;
    },
  };
}

await testAsync("plan — non authentifié refusé", async () => {
  const r = await createTrainingPlan(mockAdminForPlan(), { userId: null }, { confirmed: true });
  assert.equal(r.success, false);
  assert.equal(r.error, "unauthenticated");
});

await testAsync("plan — mauvais userId refusé", async () => {
  const r = await createTrainingPlan(mockAdminForPlan(), { userId: "ig_not_uuid" }, {
    confirmed: true,
  });
  assert.equal(r.success, false);
});

await testAsync("plan — confirmation obligatoire", async () => {
  const r = await createTrainingPlan(mockAdminForPlan(), { userId: UID }, {
    confirmed: false,
  });
  assert.equal(r.success, false);
  assert.equal(r.requires_confirmation, true);
  assert.equal(r.reason, "confirmation_required");
});

await testAsync("plan — actif existant protégé", async () => {
  const r = await createTrainingPlan(mockAdminForPlan({ hasPlan: true }), { userId: UID }, {
    confirmed: true,
    replace_existing: false,
  });
  assert.equal(r.success, false);
  assert.equal(r.reason, "active_plan_exists");
});

await testAsync("plan — création sans plan actif", async () => {
  const r = await createTrainingPlan(mockAdminForPlan({ hasPlan: false }), { userId: UID }, {
    confirmed: true,
    weeks: 8,
    goal: "triathlon_olympic",
    frequency: 3,
  });
  assert.equal(r.success, true);
  assert.ok(r.data.plan_id);
  assert.ok(r.data.weeks_created >= 8);
});

await testAsync("plan — premium requis", async () => {
  const r = await createTrainingPlan(mockAdminForPlan({ premium: false }), { userId: UID }, {
    confirmed: true,
  });
  assert.equal(r.success, false);
  assert.equal(r.error, "premium_required");
});

// ── update_user_profile ──────────────────────────────────────────
function mockAdminProfile() {
  return {
    from(table) {
      const api = {
        select() {
          return api;
        },
        eq() {
          return api;
        },
        maybeSingle: async () => ({ data: { extra: {} }, error: null }),
        upsert: async () => ({ error: null }),
        update() {
          return { eq: async () => ({ error: null }) };
        },
        insert() {
          return {
            select() {
              return {
                maybeSingle: async () => ({ data: { id: "evt" }, error: null }),
              };
            },
          };
        },
      };
      return api;
    },
  };
}

await testAsync("profil — champ autorisé", async () => {
  const r = await updateUserProfile(mockAdminProfile(), { userId: UID }, {
    fields: { frequency: 4, level: "sportif" },
  });
  assert.equal(r.success, true);
  assert.equal(r.data.updated.frequency, 4);
});

await testAsync("profil — champ interdit", async () => {
  const r = await updateUserProfile(mockAdminProfile(), { userId: UID }, {
    fields: { email: "x@y.com" },
  });
  assert.equal(r.success, false);
  assert.equal(r.error, "forbidden_field");
});

await testAsync("profil — mauvais type", async () => {
  const r = await updateUserProfile(mockAdminProfile(), { userId: UID }, {
    fields: { frequency: 99 },
  });
  assert.equal(r.success, false);
});

await testAsync("profil — autre user / non auth", async () => {
  const r = await updateUserProfile(mockAdminProfile(), { userId: null }, {
    fields: { level: "sportif" },
  });
  assert.equal(r.success, false);
});

// ── checkout ─────────────────────────────────────────────────────
await testAsync("checkout — non auth refusé", async () => {
  const r = await createCheckout(mockAdminProfile(), { userId: null }, { plan: "monthly" });
  assert.equal(r.success, false);
  assert.equal(r.error, "unauthenticated");
});

await testAsync("checkout — sans token user refusé", async () => {
  const r = await createCheckout(mockAdminProfile(), { userId: UID }, { plan: "monthly" });
  assert.equal(r.success, false);
  assert.equal(r.error, "missing_user_token");
});

await testAsync("checkout — pas de secret Stripe dans le tool", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("./tools/create-checkout.ts", import.meta.url), "utf8"),
  );
  assert.ok(!/process\.env\.STRIPE_SECRET/.test(src));
  assert.ok(src.includes("functions/v1/create-checkout"));
});

// ── tool loop mock ───────────────────────────────────────────────
await testAsync("tool loop — executeArthurTool ignore userId modèle", async () => {
  const admin = mockAdminForPlan({ hasPlan: false });
  const result = await executeArthurTool(
    "create_training_plan",
    { confirmed: false, userId: OTHER },
    {
      admin,
      auth: { userId: UID, externalUserId: null, channel: "web" },
      conversationId: "33333333-3333-4333-8333-333333333333",
    },
  );
  assert.equal(result.success, false);
  assert.equal(result.reason, "confirmation_required");
});

await testAsync("tool loop mock — oui génère plan", async () => {
  const admin = mockAdminForPlan({ hasPlan: false });
  const res = await callArthurOpenAI({
    systemPrompt: FALLBACK_ARTHUR_PROMPT,
    userPayload: JSON.stringify({
      current_message: "Oui, génère le plan sur 8 semaines",
    }),
    auth: { userId: UID, externalUserId: null, channel: "web" },
    toolCtx: {
      admin,
      auth: { userId: UID, externalUserId: null, channel: "web" },
      conversationId: "33333333-3333-4333-8333-333333333333",
    },
  });
  assert.equal(res.mock, true);
  assert.ok(res.toolCalls.some((t) => t.name === "create_training_plan"));
  assert.ok(res.structured.message.toLowerCase().includes("plan") || res.toolCalls[0].result.success);
});

console.log(`\n${passed} tests passed`);
