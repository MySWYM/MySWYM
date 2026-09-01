/**
 * Tests rapport Nageurs (admin produit).
 * Run: npm run test:arthur:nageurs
 */
import assert from "node:assert/strict";
import {
  buildNageursReport,
  clampDays,
  cancelReasonFromProperties,
  hoursBetween,
  medianNumber,
  classifyAdaptation,
  sessionLabel,
  paidChurnD30,
  weeklyVolumeBuckets,
  ratio,
  tally,
  trialToPaidD7,
  topEntries,
} from "./nageurs-report.js";
import {
  ageBandLabel,
  buildProductInsights,
  feedbackCategoryFr,
  genderLabelFr,
  generatorVersionOf,
  normalizeGender,
  resolveProfileAge,
  resolveProfileGender,
  retentionCohorts,
} from "./nageurs-helpers.js";
import {
  canonicalizeEmail,
  isInternalTestEmail,
} from "./internal-test-accounts.js";

function test(name: string, fn: () => void | Promise<void>) {
  const out = fn();
  return Promise.resolve(out)
    .then(() => console.log(`ok - ${name}`))
    .catch((err) => {
      console.error(`not ok - ${name}`);
      throw err;
    });
}

function fakeAdmin(tables: Record<string, Record<string, unknown>[]>) {
  return {
    from(table: string) {
      const rows = tables[table] || [];
      const preds: Array<(r: Record<string, unknown>) => boolean> = [];
      const api: any = {
        select() {
          return api;
        },
        gte(col: string, val: string) {
          preds.push((r) => String(r[col] || "") >= val);
          return api;
        },
        in(col: string, vals: string[]) {
          preds.push((r) => vals.includes(String(r[col] || "")));
          return api;
        },
        eq(col, val) {
          preds.push((r) => String(r[col] ?? "") === String(val));
          return api;
        },
        or() {
          return api;
        },
        range(from: number, to: number) {
          const filtered = rows.filter((r) => preds.every((p) => p(r)));
          return Promise.resolve({
            data: filtered.slice(from, to + 1),
            error: null,
          });
        },
      };
      return api;
    },
  };
}

await test("clampDays buckets", () => {
  assert.equal(clampDays(3), 7);
  assert.equal(clampDays(30), 30);
  assert.equal(clampDays(80), 90);
  assert.equal(clampDays("x"), 30);
  assert.equal(clampDays(0), 0);
  assert.equal(clampDays("all"), 0);
});

await test("gender / age slices helpers", () => {
  assert.equal(normalizeGender("Femme"), "femme");
  assert.equal(normalizeGender("non-genré"), "");
  assert.equal(genderLabelFr("homme"), "Homme");
  assert.equal(ageBandLabel(32), "25-34");
  assert.equal(resolveProfileGender({ extra: { gender: "femme" } }), "femme");
  assert.equal(resolveProfileAge({ extra: { age: 41 } }), 41);
});

await test("medianNumber / ratio / tally", () => {
  assert.equal(medianNumber([10, 30, 20]), 20);
  assert.equal(medianNumber([2, 8]), 5);
  assert.equal(medianNumber([]), null);
  assert.equal(ratio(1, 4), 0.25);
  assert.equal(ratio(1, 0), null);
  const m = new Map<string, number>();
  tally(m, "a");
  tally(m, "a");
  tally(m, "b");
  assert.deepEqual(topEntries(m), [
    { type: "a", count: 2 },
    { type: "b", count: 1 },
  ]);
});

await test("hoursBetween and cancel reason", () => {
  assert.equal(hoursBetween("2026-08-01T00:00:00.000Z", "2026-08-02T00:00:00.000Z"), 24);
  assert.equal(cancelReasonFromProperties({ reason: "trop dur" }), "trop dur");
  assert.equal(cancelReasonFromProperties(null), "non précisé");
});

await test("buildNageursReport aggregates funnel, engine, money", async () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  const admin = fakeAdmin({
    conversion_events: [
      {
        user_id: "u1",
        event_name: "signup_completed",
        created_at: "2026-08-10T00:00:00.000Z",
      },
      {
        user_id: "u1",
        event_name: "plan_generated",
        created_at: "2026-08-10T01:00:00.000Z",
      },
      {
        user_id: "u1",
        event_name: "first_session_completed",
        created_at: "2026-08-11T00:00:00.000Z",
      },
      {
        user_id: "u1",
        event_name: "second_session_completed",
        created_at: "2026-08-12T00:00:00.000Z",
      },
      {
        user_id: "u2",
        event_name: "signup_completed",
        created_at: "2026-08-10T00:00:00.000Z",
      },
      {
        user_id: "u2",
        event_name: "checkout_started",
        created_at: "2026-08-10T02:00:00.000Z",
      },
      {
        user_id: "u3",
        event_name: "cancel_survey",
        created_at: "2026-08-15T00:00:00.000Z",
        properties: { reason: "pas le temps" },
      },
    ],
    planned_sessions: [
      {
        user_id: "u1",
        status: "completed",
        completed_at: "2026-08-18T00:00:00.000Z",
        created_at: "2026-08-17T00:00:00.000Z",
        session_type: "endurance",
      },
      {
        user_id: "u1",
        status: "skipped",
        created_at: "2026-08-16T00:00:00.000Z",
        session_type: "speed",
      },
    ],
    session_feedback: [
      {
        user_id: "u1",
        rating: "too_hard",
        pain: false,
        session_type: "css",
        created_at: "2026-08-18T00:00:00.000Z",
      },
      {
        user_id: "u1",
        rating: "too_hard",
        pain: true,
        session_type: "css",
        created_at: "2026-08-19T00:00:00.000Z",
      },
      {
        user_id: "u4",
        rating: "too_easy",
        pain: false,
        session_type: "recovery",
        created_at: "2026-08-19T00:00:00.000Z",
      },
    ],
    user_access_state: [
      { user_id: "u1", access_status: "active" },
      { user_id: "u2", access_status: "trial" },
      { user_id: "u5", access_status: "canceled" },
    ],
  });

  const report = await buildNageursReport(admin as any, { days: 30, now });
  assert.equal(report.activation.signups, 2);
  assert.equal(report.activation.plans, 1);
  assert.equal(report.activation.first_session, 1);
  assert.equal(report.activation.second_session, 1);
  assert.equal(report.activation.median_hours_to_first, 24);
  assert.equal(report.usage.sessions_skipped, 1);
  assert.equal(report.usage.sessions_done, 1);
  assert.equal(report.engine.too_hard, 2);
  assert.equal(report.engine.too_easy, 1);
  assert.equal(report.engine.pain, 1);
  assert.equal(report.engine.hard_by_type[0].type, "css");
  assert.equal(report.money.active, 1);
  assert.equal(report.money.trial, 1);
  assert.equal(report.money.paying_or_trial_no_session, 1);
  assert.equal(report.money.cancel_reasons[0].reason, "pas le temps");
  assert.ok(report.usage.swimmers_7d >= 1);
});

await test("sessionLabel / classifyAdaptation / weekly buckets / cohorts", () => {
  assert.equal(sessionLabel({ session_type: "css" }), "css");
  assert.equal(sessionLabel({ session_payload: { title: "10x100" } }), "10x100");
  assert.equal(classifyAdaptation({ action: "REDUCE", volume_mul: 1 }), "lowered");
  assert.equal(classifyAdaptation({ action: "PROTECT" }), "lowered");
  assert.equal(classifyAdaptation({ action: "PROGRESS" }), "raised");
  assert.equal(classifyAdaptation({ action: "HOLD" }), "hold");
  assert.equal(classifyAdaptation({ volume_mul: 1 }), "hold");
  const buckets = weeklyVolumeBuckets(
    [
      { user_id: "a", status: "completed", completed_at: "2026-08-18T00:00:00.000Z", created_at: "2026-08-17T00:00:00.000Z" },
      { user_id: "a", status: "skipped", created_at: "2026-08-16T00:00:00.000Z" },
      { user_id: "b", status: "planned", created_at: "2026-08-19T00:00:00.000Z" },
    ],
    "2026-08-13T12:00:00.000Z",
  );
  assert.equal(buckets.users, 2);
  assert.equal(buckets.one, 1);
  assert.equal(buckets.zero, 1);
  const now = new Date("2026-08-20T12:00:00.000Z");
  const d7 = trialToPaidD7(
    [
      { trial_started_at: "2026-08-01T00:00:00.000Z", subscription_started_at: "2026-08-05T00:00:00.000Z", status: "active" },
      { trial_started_at: "2026-08-01T00:00:00.000Z", status: "expired" },
      { trial_started_at: "2026-08-18T00:00:00.000Z", status: "trial" },
    ],
    now,
  );
  assert.equal(d7.eligible, 2);
  assert.equal(d7.converted, 1);
  const d30 = paidChurnD30(
    [
      { subscription_started_at: "2026-07-01T00:00:00.000Z", status: "canceled" },
      { subscription_started_at: "2026-07-01T00:00:00.000Z", status: "active" },
      { subscription_started_at: "2026-08-15T00:00:00.000Z", status: "active" },
    ],
    now,
  );
  assert.equal(d30.eligible, 2);
  assert.equal(d30.churned, 1);
});

await test("buildNageursReport P0 dropoff, engine slices, weekly, cohorts", async () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  const admin = fakeAdmin({
    conversion_events: [
      { user_id: "u1", event_name: "signup_started", created_at: "2026-08-10T00:00:00.000Z" },
      { user_id: "u1", event_name: "signup_completed", created_at: "2026-08-10T00:10:00.000Z" },
      { user_id: "u1", event_name: "plan_generated", created_at: "2026-08-10T01:00:00.000Z" },
      { user_id: "u1", event_name: "first_session_completed", created_at: "2026-08-11T00:00:00.000Z" },
      { user_id: "u1", event_name: "paywall_shown", created_at: "2026-08-10T02:00:00.000Z" },
      { user_id: "u1", event_name: "checkout_started", created_at: "2026-08-10T02:05:00.000Z" },
      { user_id: "u1", event_name: "trial_started", created_at: "2026-08-10T02:10:00.000Z" },
      { user_id: "u2", event_name: "signup_started", created_at: "2026-08-10T00:00:00.000Z" },
      { user_id: "u2", event_name: "paywall_shown", created_at: "2026-08-10T03:00:00.000Z" },
      { user_id: "u2", event_name: "checkout_abandoned", created_at: "2026-08-10T03:30:00.000Z" },
    ],
    planned_sessions: [
      {
        user_id: "u1",
        status: "completed",
        completed_at: "2026-08-18T00:00:00.000Z",
        created_at: "2026-08-17T00:00:00.000Z",
        session_type: "endurance",
        week_index: 2,
      },
      {
        user_id: "u1",
        status: "skipped",
        created_at: "2026-08-16T00:00:00.000Z",
        session_type: "speed",
        session_payload: { title: "8x50" },
      },
      {
        user_id: "u2",
        status: "planned",
        created_at: "2026-08-19T00:00:00.000Z",
        session_type: "technique",
      },
    ],
    session_feedback: [
      {
        user_id: "u1",
        rating: "too_hard",
        pain: false,
        session_type: "css",
        session_title: "pyramide",
        week_number: 2,
        created_at: "2026-08-18T00:00:00.000Z",
      },
      {
        user_id: "u1",
        rating: "ok",
        session_type: "endurance",
        session_title: "200s souples",
        week_number: 1,
        created_at: "2026-08-19T00:00:00.000Z",
      },
    ],
    sport_profiles: [
      { user_id: "u1", level: "sportif", objective: "5km", age: 32, gender: "femme" },
      { user_id: "u2", level: "régulier", objective: "forme", extra: { gender: "homme", age: 41 } },
    ],
    weekly_adaptations: [
      { user_id: "u1", action: "REDUCE", volume_mul: 0.9, created_at: "2026-08-19T00:00:00.000Z" },
      { user_id: "u1", action: "PROGRESS", volume_mul: 1.06, created_at: "2026-08-12T00:00:00.000Z" },
    ],
    user_access_state: [
      {
        user_id: "u1",
        status: "active",
        trial_started_at: "2026-08-01T00:00:00.000Z",
        subscription_started_at: "2026-08-05T00:00:00.000Z",
      },
      {
        user_id: "u2",
        status: "expired",
        trial_started_at: "2026-08-01T00:00:00.000Z",
      },
      {
        user_id: "u3",
        status: "canceled",
        subscription_started_at: "2026-07-01T00:00:00.000Z",
      },
    ],
  });

  const report = await buildNageursReport(admin as any, { days: 30, now });
  assert.equal(report.dropoff.signup_started, 2);
  assert.equal(report.dropoff.abandoned, 1);
  assert.ok(report.dropoff.plan_to_first != null);
  assert.equal(report.usage.weekly.users, 2);
  assert.equal(report.usage.weekly.one, 1);
  assert.equal(report.usage.weekly.zero, 1);
  assert.equal(report.engine.hard_by_level[0].type, "Intermédiaire");
  assert.equal(report.engine.hard_by_goal[0].type, "5 km");
  assert.equal(report.engine.hard_by_week[0].type, "S2");
  assert.equal(report.engine.top_skipped[0].type, "8x50");
  assert.equal(report.engine.top_liked[0].type, "200s souples");
  assert.equal(report.engine.adaptations.lowered, 1);
  assert.equal(report.engine.adaptations.raised, 1);
  assert.equal(report.money.d7.eligible, 2);
  assert.equal(report.money.d7.converted, 1);
  assert.equal(report.money.d30_churn.eligible, 1);
  assert.equal(report.money.d30_churn.churned, 1);
  assert.equal(report.slices.by_gender.find((x) => x.type === "Femme")?.count, 1);
  assert.equal(report.slices.by_gender.find((x) => x.type === "Homme")?.count, 1);
  assert.equal(report.slices.by_age.find((x) => x.type === "25-34")?.count, 1);
  assert.equal(report.slices.by_age.find((x) => x.type === "35-44")?.count, 1);
  assert.equal(report.slices.by_level[0].type, "Intermédiaire");
  assert.equal(report.engine.feedback_categories[0].type, "Trop difficile");
  assert.ok(Array.isArray(report.insights));
  assert.ok(Array.isArray(report.cohorts));
  assert.equal(typeof report.usage.swimmers_1d, "number");
  const generatedStep = report.funnel.find((s) => s.key === "generated");
  assert.equal(generatedStep?.value, 2);
});

await test("labels, cohorts, insights", () => {
  assert.equal(feedbackCategoryFr("too_hard"), "Trop difficile");
  assert.equal(feedbackCategoryFr("ok"), "Adaptée");
  assert.equal(generatorVersionOf({ generator_version: "1.9" }), "1.9");
  assert.equal(generatorVersionOf({ session_payload: { generator_version: "1.8" } }), "1.8");
  assert.equal(generatorVersionOf({}), "inconnue");
  const now = new Date("2026-08-20T12:00:00.000Z");
  const cohorts = retentionCohorts(
    new Map([
      ["a", "2026-08-03T00:00:00.000Z"],
      ["b", "2026-08-04T00:00:00.000Z"],
    ]),
    [
      { user_id: "a", completed_at: "2026-08-05T00:00:00.000Z" },
      { user_id: "b", completed_at: "2026-08-12T00:00:00.000Z" },
    ],
    now,
  );
  assert.equal(cohorts.length, 1);
  assert.equal(cohorts[0].size, 2);
  assert.equal(cohorts[0].rates[0], 0.5);
  const insights = buildProductInsights({
    allTime: false,
    completion: 0.4,
    prevCompletion: 0.5,
    tooHardRate: 0.4,
    prevTooHardRate: 0.2,
    payingNoSession: 3,
    byObjective: [
      { type: "Eau libre", pct_actifs: 0.8, nageurs: 20 },
      { type: "Forme", pct_actifs: 0.4, nageurs: 20 },
    ],
  });
  assert.ok(insights.some((t) => t.includes("complétion")));
  assert.ok(insights.some((t) => t.includes("sans séance")));
});

await test("internal test emails and +aliases", () => {
  assert.equal(canonicalizeEmail("Arthur.No+test3@Outlook.fr"), "arthur.no@outlook.fr");
  assert.equal(isInternalTestEmail("arthur.no@outlook.fr"), true);
  assert.equal(isInternalTestEmail("arthur.no+foo@outlook.fr"), true);
  assert.equal(isInternalTestEmail("j.wiackowska+dev@outlook.fr"), true);
  assert.equal(isInternalTestEmail("admin@myswym.app"), true);
  assert.equal(isInternalTestEmail("quelquun@outlook.fr"), false);
});

await test("buildNageursReport drops internal test accounts from aggregates", async () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  const admin = fakeAdmin({
    admin_user_directory: [
      { user_id: "u-test", email: "arthur.no+staging@outlook.fr" },
      { user_id: "u1", email: "marie@example.com" },
    ],
    conversion_events: [
      { user_id: "u1", event_name: "signup_completed", created_at: "2026-08-10T00:00:00.000Z" },
      { user_id: "u-test", event_name: "signup_completed", created_at: "2026-08-10T00:00:00.000Z" },
    ],
    planned_sessions: [],
    session_feedback: [],
    user_access_state: [
      { user_id: "u1", access_status: "active" },
      { user_id: "u-test", access_status: "active" },
    ],
    sport_profiles: [
      { user_id: "u1", level: "sportif", objective: "forme" },
      { user_id: "u-test", level: "sportif", objective: "forme" },
    ],
  });
  const report = await buildNageursReport(admin as any, { days: 30, now });
  assert.equal(report.activation.signups, 1);
  assert.equal(report.money.active, 1);
  assert.equal(report.slices.by_level[0].count, 1);
  assert.ok(report.notes.some((n) => /compte\(s\) de test exclus/i.test(n)));
});

console.log("arthur nageurs tests passed");
