import assert from "node:assert/strict";
import {
  extractSwimmerProfile,
  extractPlanObjective,
  mergeForGeneration,
  isSwimmerProfileComplete,
  missingSwimmerProfileFields,
  applyFirstPlanDefaults,
  defaultSessionDistanceForLevel,
  enforceSingleActivePlan,
  replaceActivePlan,
  resolveQuestionnaireMode,
  buildQuestionnaireDraft,
  hydrateSwimmerFromSources,
  computeAgeFromBirth,
  withDerivedAge,
  normalizeGender,
  ageBandLabel,
} from "./swimmer-profile.js";

{
  const src = {
    level: "sportif",
    pool: 25,
    sessionsPerWeek: 3,
    birthMonth: 3,
    birthYear: 1998,
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
  assert.equal(sw.birthMonth, 3);
  assert.equal(sw.birthYear, 1998);
  assert.equal(typeof sw.age, "number");
  assert.equal(extractSwimmerProfile({ gender: "Femme" }).gender, "femme");
  assert.equal(extractSwimmerProfile({ gender: "homme" }).gender, "homme");
  assert.equal(extractSwimmerProfile({ gender: "non-genré" }).gender, "");
  assert.equal(extractSwimmerProfile({ level: "sportif" }).gender, undefined);
  const obj = extractPlanObjective(src);
  assert.equal(obj.goal, "triathlon_olympic");
  assert.equal(obj.trainingFocus, "technique");
  assert.equal(obj.level, undefined);
}

{
  // Avant l'anniversaire (mois non encore atteint) → âge = année courante - année - 1
  assert.equal(computeAgeFromBirth(12, 2000, new Date("2026-06-15")), 25);
  // Après / pendant le mois de naissance → âge révolu
  assert.equal(computeAgeFromBirth(3, 2000, new Date("2026-03-15"), 20), 25);
  assert.equal(computeAgeFromBirth(3, 2000, new Date("2026-03-20"), 20), 26);
  assert.equal(computeAgeFromBirth(3, 2000, new Date("2026-02-28")), 25);
  assert.equal(computeAgeFromBirth(null, 2000), null);
  assert.equal(computeAgeFromBirth(3, null), null);
}

{
  const derived = withDerivedAge({ birthMonth: 1, birthYear: 1990 }, new Date("2026-08-15"));
  assert.equal(derived.age, 36);
  const legacy = withDerivedAge({ age: 28 }, new Date("2026-08-15"));
  assert.equal(legacy.age, 28);
}

{
  assert.equal(normalizeGender("Homme"), "homme");
  assert.equal(normalizeGender("woman"), "femme");
  assert.equal(normalizeGender("non-genré"), "");
  assert.equal(normalizeGender(""), "");
  assert.equal(ageBandLabel(22), "< 25");
  assert.equal(ageBandLabel(32), "25-34");
  assert.equal(ageBandLabel(48), "45-54");
  assert.equal(ageBandLabel(null), "inconnu");
}

{
  assert.equal(defaultSessionDistanceForLevel("découverte"), 1000);
  assert.equal(defaultSessionDistanceForLevel("sportif"), 2500);
  const short = applyFirstPlanDefaults({
    category: "progression",
    goal: "progression",
    level: "régulier",
    sessionsPerWeek: 3,
  });
  assert.equal(short.pool, 25);
  assert.deepEqual(short.equipment, []);
  assert.equal(short.swimStyle, "crawl");
  assert.equal(short.preferredStroke, "crawl");
  assert.equal(short.targetSessionDistance, 2000);
  assert.equal(short.injuryStatus, "aucune");
  assert.equal(isSwimmerProfileComplete(short), true);

  const keep = applyFirstPlanDefaults({
    level: "sportif",
    pool: 50,
    sessionsPerWeek: 4,
    equipment: ["palmes"],
    swimStyle: "4_nages",
    preferredStroke: "brasse",
    targetSessionDistance: 3000,
  });
  assert.equal(keep.pool, 50);
  assert.deepEqual(keep.equipment, ["palmes"]);
  assert.equal(keep.swimStyle, "4_nages");
  assert.equal(keep.preferredStroke, "brasse");
  assert.equal(keep.targetSessionDistance, 3000);

  const avancé = applyFirstPlanDefaults({
    level: "performance",
    pool: 25,
    sessionsPerWeek: 4,
    swimStyle: "crawl",
  });
  assert.equal(avancé.swimStyle, "4_nages");
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
  assert.equal(draft.birthMonth, "");
  assert.equal(draft.birthYear, "");
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
