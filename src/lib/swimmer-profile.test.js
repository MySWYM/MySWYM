import assert from "node:assert/strict";
import {
  extractSwimmerProfile,
  extractPlanObjective,
  mergeForGeneration,
  isSwimmerProfileComplete,
  missingSwimmerProfileFields,
  enforceSingleActivePlan,
  replaceActivePlan,
  resolveQuestionnaireMode,
  buildQuestionnaireDraft,
  hydrateSwimmerFromSources,
} from "./swimmer-profile.js";

{
  const src = {
    level: "sportif",
    pool: 25,
    sessionsPerWeek: 3,
    age: 28,
    goal: "triathlon_olympic",
    category: "triathlon",
    eventDate: "2026-09-01",
    equipment: ["palmes", "unknown"],
    swimStyle: "crawl",
    preferredStroke: "crawl",
    trainingFocus: "technique",
  };
  const sw = extractSwimmerProfile(src);
  assert.equal(sw.level, "sportif");
  assert.deepEqual(sw.equipment, ["palmes"]);
  assert.equal(sw.goal, undefined);
  const obj = extractPlanObjective(src);
  assert.equal(obj.goal, "triathlon_olympic");
  assert.equal(obj.trainingFocus, "technique");
  assert.equal(obj.level, undefined);
}

{
  const incomplete = { level: "régulier", pool: 50 };
  assert.equal(isSwimmerProfileComplete(incomplete), false);
  assert.ok(missingSwimmerProfileFields(incomplete).includes("sessionsPerWeek"));
  assert.ok(missingSwimmerProfileFields(incomplete).includes("equipment"));
}

{
  const complete = {
    level: "sportif",
    pool: 50,
    sessionsPerWeek: 3,
    swimStyle: "crawl",
    preferredStroke: "dos",
    equipment: [],
  };
  assert.equal(isSwimmerProfileComplete(complete), true);
  assert.equal(resolveQuestionnaireMode(complete), "goal");
  assert.equal(resolveQuestionnaireMode({}), "full");
}

{
  const gen = mergeForGeneration(
    { level: "sportif", pool: 25, sessionsPerWeek: 3, equipment: ["pull"], swimStyle: "crawl", preferredStroke: "crawl" },
    { category: "progression", goal: "progression", trainingFocus: "endurance" },
  );
  assert.equal(gen.goal, "progression");
  assert.equal(gen.level, "sportif");
  assert.equal(gen.trainingFocus, "endurance");
  assert.deepEqual(gen.equipment, ["pull"]);
}

{
  const plans = [
    { id: "plan_1", profile: { goal: "a" }, plan: {} },
    { id: "plan_2", profile: { goal: "b" }, plan: {} },
  ];
  const r = enforceSingleActivePlan(plans, "plan_2", []);
  assert.equal(r.plans.length, 1);
  assert.equal(r.activeId, "plan_2");
  assert.equal(r.history.length, 1);
  assert.equal(r.history[0].id, "plan_1");
}

{
  const r = replaceActivePlan(
    [{ id: "old", profile: {}, plan: {} }],
    [],
    { id: "new", profile: { goal: "x" }, plan: {} },
    "old",
  );
  assert.equal(r.plans.length, 1);
  assert.equal(r.activeId, "new");
  assert.equal(r.history[0].id, "old");
  assert.equal(r.history[0].archiveReason, "replaced");
}

{
  const draft = buildQuestionnaireDraft(
    { level: "sportif", pool: 25, sessionsPerWeek: 2, equipment: ["tuba"], swimStyle: "4_nages", preferredStroke: "brasse" },
    {},
  );
  assert.equal(draft.level, "sportif");
  assert.equal(draft.category, "");
  assert.deepEqual(draft.equipment, ["tuba"]);
}

{
  const h = hydrateSwimmerFromSources({
    sportRowFields: { level: "découverte", pool: 25, sessionsPerWeek: 2, equipment: ["planche"], swimStyle: "crawl", preferredStroke: "crawl" },
    planProfile: { level: "sportif", goal: "tri" },
  });
  assert.equal(h.level, "sportif");
  assert.deepEqual(h.equipment, ["planche"]);
}

console.log("swimmer-profile.test.js PASS");
