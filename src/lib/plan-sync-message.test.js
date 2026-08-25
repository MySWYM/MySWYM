import assert from "node:assert/strict";
import { describePlanSyncChange, summarizePlans } from "./plan-sync-message.js";

const entry = (id, { done = 0, freq = 2 } = {}) => ({
  id,
  profile: { sessionsPerWeek: freq },
  plan: {
    weeks: [{
      sessions: Array.from({ length: Math.max(done, 1) }, (_, i) => ({
        completed: i < done,
      })),
    }],
  },
});

assert.equal(summarizePlans([entry("a", { done: 2 })]).progress > 0, true);

{
  const r = describePlanSyncChange({
    beforePlans: [entry("a", { done: 1 })],
    afterPlans: [entry("a", { done: 3 })],
  });
  assert.equal(r.reason, "progress_up");
  assert.match(r.message, /autre appareil/i);
}

{
  const r = describePlanSyncChange({
    beforePlans: [entry("a")],
    afterPlans: [entry("a"), entry("b")],
    beforeActiveId: "a",
    afterActiveId: "a",
  });
  assert.equal(r.reason, "plan_count");
  assert.match(r.message, /Nouveau plan/i);
}

{
  const r = describePlanSyncChange({
    beforePlans: [entry("a", { freq: 2 })],
    afterPlans: [entry("a", { freq: 3 })],
    beforeActiveId: "a",
    afterActiveId: "a",
  });
  assert.equal(r.reason, "frequency");
}

{
  const r = describePlanSyncChange({
    beforePlans: [entry("a"), entry("b")],
    afterPlans: [entry("a"), entry("b")],
    beforeActiveId: "a",
    afterActiveId: "b",
  });
  assert.equal(r.reason, "active_plan");
}

console.log("plan-sync-message PASS");
