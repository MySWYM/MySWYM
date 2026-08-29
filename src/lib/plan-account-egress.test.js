/**
 * Egress user_plans, meta d'abord, pas de blob si le cache local est à jour.
 * Usage : node src/lib/plan-account-egress.test.js
 */
import assert from "node:assert/strict";
import {
  PLANS_AUTOSAVE_DEBOUNCE_MS,
  REMOTE_NEWER_EPSILON_MS,
  PLAN_VISIBILITY_SYNC_MIN_MS,
  USER_PLANS_META_SELECT,
  USER_PLANS_BLOB_SELECT,
  shouldFetchRemotePlanBlob,
  parseUserPlansBlob,
  userPlansUpsertRow,
  plansPersistFingerprint,
  loadRemotePlansIfNewer,
} from "./plan-account-egress.js";

function ok(cond, msg) {
  assert.ok(cond, msg);
}

ok(PLANS_AUTOSAVE_DEBOUNCE_MS >= 2500, "debounce ≥ 2.5s");
ok(REMOTE_NEWER_EPSILON_MS >= 1000, "epsilon ≥ 1s");
ok(PLAN_VISIBILITY_SYNC_MIN_MS >= 30_000, "visibility throttle ≥ 30s");
ok(USER_PLANS_META_SELECT.includes("updated_at"), "meta has updated_at");
ok(!USER_PLANS_META_SELECT.includes("plans_json"), "meta has no JSON");
ok(USER_PLANS_BLOB_SELECT.includes("plans_json"), "blob has plans_json");
ok(!USER_PLANS_BLOB_SELECT.includes("profile"), "blob skips legacy profile");
ok(!USER_PLANS_BLOB_SELECT.includes("plan,"), "blob skips legacy plan");

ok(shouldFetchRemotePlanBlob(0, 100) === true, "no cache → fetch");
ok(shouldFetchRemotePlanBlob(200, 100) === false, "local newer → skip");
ok(shouldFetchRemotePlanBlob(200, 200) === false, "tie → skip");
ok(shouldFetchRemotePlanBlob(100, 200, 0) === true, "remote newer (eps 0) → fetch");
ok(shouldFetchRemotePlanBlob(100, 100 + 500, 3000) === false, "remote within epsilon → skip");
ok(shouldFetchRemotePlanBlob(100, 100 + 4000, 3000) === true, "remote beyond epsilon → fetch");

{
  const a = plansPersistFingerprint([{ id: "p1", plan: { v: 1 } }], "p1", [{ id: "h1" }]);
  const b = plansPersistFingerprint([{ id: "p1", plan: { v: 1 } }], "p1", [{ id: "h1" }]);
  const c = plansPersistFingerprint([{ id: "p1", plan: { v: 2 } }], "p1", [{ id: "h1" }]);
  ok(a === b && a !== c, "fingerprint stable / sensitive");
}

{
  const parsed = parseUserPlansBlob({
    plans_json: [{ id: "p1" }],
    active_plan_id: "p1",
    plan_history: [{ id: "old" }],
    updated_at: "2026-08-22T00:00:00.000Z",
  });
  ok(parsed.plans[0].id === "p1", "parse plans");
  ok(parsed.active === "p1", "parse active");
  ok(parsed.history[0].id === "old", "parse history");
  ok(parsed.updatedAt === Date.parse("2026-08-22T00:00:00.000Z"), "parse ts");
}

{
  const empty = parseUserPlansBlob(null);
  ok(empty.plans.length === 0 && empty.active === null, "parse null");
}

{
  const row = userPlansUpsertRow({
    userId: "u1",
    plans: [{ id: "p1", plan: { weeks: [1, 2, 3] } }],
    activePlanId: "p1",
    history: [],
    updatedAt: "2026-08-26T00:00:00.000Z",
  });
  ok(row.plans_json.length === 1, "upsert keeps plans_json");
  ok(row.plan === null && row.profile === null, "upsert clears legacy blob");
  ok(!Object.prototype.hasOwnProperty.call(row, "weeks"), "no extra weeks field");
}

function mockClient({ meta, blob, metaError = null, blobError = null }) {
  const calls = [];
  return {
    calls,
    from(table) {
      return {
        select(cols) {
          calls.push(cols);
          return {
            eq() {
              return {
                maybeSingle: async () => {
                  if (cols === USER_PLANS_META_SELECT) return { data: meta, error: metaError };
                  return { data: blob, error: blobError };
                },
              };
            },
          };
        },
      };
    },
  };
}

{
  const local = Date.parse("2026-08-26T12:00:00.000Z");
  const client = mockClient({
    meta: { updated_at: "2026-08-26T11:00:00.000Z", active_plan_id: "p1" },
    blob: { plans_json: [{ id: "SHOULD_NOT_LOAD" }] },
  });
  const out = await loadRemotePlansIfNewer(client, "u1", local);
  ok(out.skipped === true && out.fetchedBlob === false, "skip blob when local is newer");
  ok(client.calls.length === 1 && client.calls[0] === USER_PLANS_META_SELECT, "only meta select");
}

{
  const local = Date.parse("2026-08-26T10:00:00.000Z");
  const blob = {
    plans_json: [{ id: "p2" }],
    active_plan_id: "p2",
    plan_history: [],
    updated_at: "2026-08-26T12:00:00.000Z",
  };
  const client = mockClient({
    meta: { updated_at: blob.updated_at, active_plan_id: "p2" },
    blob,
  });
  const out = await loadRemotePlansIfNewer(client, "u1", local);
  ok(out.skipped === false && out.fetchedBlob === true, "fetch blob when remote newer");
  ok(out.data?.plans_json[0].id === "p2", "blob payload");
  ok(client.calls.length === 2, "meta then blob");
}

{
  const client = mockClient({ meta: null });
  const out = await loadRemotePlansIfNewer(client, "u1", 0);
  ok(out.fetchedBlob === true, "no cache + no row still attempts blob");
}

{
  // Horloge serveur 1s après upsert client → ne doit PAS re-télécharger le blob
  const local = Date.parse("2026-08-26T12:00:00.000Z");
  const remoteIso = new Date(local + 1000).toISOString();
  const client = mockClient({
    meta: { updated_at: remoteIso, active_plan_id: "p1" },
    blob: { plans_json: [{ id: "NOPE" }] },
  });
  const out = await loadRemotePlansIfNewer(client, "u1", local);
  ok(out.skipped === true && out.fetchedBlob === false, "epsilon skips near-tie remote");
  ok(client.calls.length === 1, "epsilon: meta only");
}

console.log("plan-account-egress PASS");
