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
  ratio,
  tally,
  topEntries,
} from "./nageurs-report.js";

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
      { user_id: "u1", status: "active" },
      { user_id: "u2", status: "trial" },
      { user_id: "u5", status: "canceled" },
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

console.log("arthur nageurs tests passed");
