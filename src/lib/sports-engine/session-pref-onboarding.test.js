/**
 * Distance moyenne + wish onboarding.
 * Usage : node src/lib/sports-engine/session-pref-onboarding.test.js
 */
import {
  normalizeTargetSessionDistance,
  applyTargetSessionDistanceToTargets,
  SESSION_DISTANCE_PRESETS,
  resolveEffectiveWeekVolume,
  buildSportProfile,
  prepareWeekContext,
  buildSessionBrief,
  composeSession,
  parseTrainingWish,
  trainingWishToHints,
  biasRolesForTrainingWish,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
let n = 0;
function ok(cond, msg) {
  assert(cond, msg);
  n += 1;
}

ok(SESSION_DISTANCE_PRESETS.includes(2500), "preset 2500");
ok(normalizeTargetSessionDistance(2500, "sportif") === 2500, "norm 2500");
ok(normalizeTargetSessionDistance(9000, "decouverte") === 1500, "decouverte cap");
ok(normalizeTargetSessionDistance(null, "regulier") == null, "legacy null");

{
  const base = [2000, 2300, 2000];
  const a = applyTargetSessionDistanceToTargets(base, 2500, {
    level: "sportif",
    typeSemaine: "normale",
    effectivePhase: "development",
  });
  ok(a.applied, "applied");
  const mean = a.sessionTargets.reduce((x, y) => x + y, 0) / a.sessionTargets.length;
  ok(mean >= 2300 && mean <= 2800, `mean around 2500 got ${mean}`);
}

{
  const vol = resolveEffectiveWeekVolume({
    level: "sportif",
    freq: 3,
    targetSessionDistance: 2500,
    capacityFactor: 1,
    volumeAdjLegacy: 1,
    tasteVolumeMul: 1,
    effectivePhase: "development",
  });
  ok(vol.distancePrefApplied, "pref flag");
  const mean = vol.sessionTargets.reduce((a, b) => a + b, 0) / vol.sessionTargets.length;
  ok(mean >= 2200 && mean <= 2900, `engine mean ${mean}`);
}

{
  const vol = resolveEffectiveWeekVolume({
    level: "sportif",
    freq: 3,
    capacityFactor: 1,
  });
  ok(!vol.distancePrefApplied, "no pref legacy");
}

{
  const wish = parseTrainingWish("Je veux plus de crawl et des plaquettes, travailler mes virages");
  ok(wish.strokes.includes("crawl"), "crawl");
  ok(wish.equipment.includes("plaquettes"), "plaquettes");
  ok(wish.techFocus.includes("virages"), "virages");
  const hints = trainingWishToHints(wish, { equipmentOwned: ["plaquettes", "palmes"] });
  ok(hints.ready && hints.preferStroke === "crawl", "hint crawl");
  ok(hints.preferEquipment.includes("plaquettes"), "hint plaq owned");
  const denied = trainingWishToHints(wish, { equipmentOwned: ["palmes"] });
  ok(!denied.preferEquipment.includes("plaquettes"), "no plaq if missing");
  const fingers = parseTrainingWish("travailler l'appui avec des finger paddles");
  ok(fingers.equipment.includes("plaquettes_doigts"), "finger paddles wish");
  ok(!fingers.equipment.includes("plaquettes"), "finger paddles ≠ plaquettes");
}

{
  const roles = [
    { sessionIntent: "endurance", zone: "Z2", qualitySession: false },
    { sessionIntent: "endurance", zone: "Z2", qualitySession: true },
    { sessionIntent: "recuperation", zone: "Z1", qualitySession: false },
  ];
  const biased = biasRolesForTrainingWish(roles, trainingWishToHints("plus de seuil"));
  ok(biased[1].sessionIntent === "seuil" || biased[1].intensityTarget === "Z3", "seuil bias");
}

// Compose autour de 2500
{
  const sport = buildSportProfile({
    level: "sportif",
    goal: "course_piscine",
    category: "competition",
    equipment: ["palmes", "plaquettes"],
    pool: 25,
    sessionsPerWeek: 3,
    swimStyle: "crawl",
    preferredStroke: "crawl",
    targetSessionDistance: 2500,
    trainingWish: "utiliser des plaquettes et plus de crawl",
  });
  ok(sport.targetSessionDistance === 2500, "sport dist");
  ok(sport.trainingWishHints?.preferStroke === "crawl", "sport wish");
  const ctx = prepareWeekContext(
    {
      ...sport,
      level: "sportif",
      targetSessionDistance: 2500,
      trainingWish: "utiliser des plaquettes et plus de crawl",
      trainingWishMeta: sport.trainingWishMeta,
    },
    { phase: "development" },
    1,
    3,
    7000,
    { volumeAdj: 1, tasteVolumeMul: 1 },
  );
  const targets = ctx.volumePlan.sessionTargets;
  const mean = targets.reduce((a, b) => a + b, 0) / targets.length;
  ok(mean >= 2100 && mean <= 3000, `ctx mean ${mean} targets=${targets}`);

  const brief = buildSessionBrief({
    sport: ctx.sport,
    weekCtx: ctx,
    role: { family: "endurance", sessionIntent: "endurance", zone: "Z2", qualitySession: false },
    weekIndex: 1,
    sessionIndex: 0,
    durationTarget: 55,
    seed: "pref-2500",
  });
  ok(brief.volumeTarget >= 2000 && brief.volumeTarget <= 3200, `brief vol ${brief.volumeTarget}`);
  const r = composeSession(brief);
  ok(r.ok, `compose ${r.reason}`);
  const dist =
    r.session.trainingDistance ||
    parseInt(String(r.session.distance || "").replace(/\D/g, ""), 10) ||
    0;
  ok(dist >= 1600 && dist <= 3400, `session dist ${dist}`);
}

// Legacy sans distance
{
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    equipment: [],
    pool: 25,
    sessionsPerWeek: 3,
  });
  ok(sport.targetSessionDistance == null, "legacy null dist");
  ok(!sport.trainingWishHints?.ready, "no wish");
}

console.log(`session-pref-onboarding.test.js: ${n} assertions OK`);
