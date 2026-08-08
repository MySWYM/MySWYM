/**
 * Equipment onboarding → SportProfile → composer / quality gate.
 * Usage : node src/lib/sports-engine/equipment-onboarding.test.js
 */
import {
  buildSportProfile,
  buildSessionBrief,
  composeSession,
  rejectExerciseForBrief,
  normalizeProfileEquipment,
  EQUIPMENT_IDS,
  validateComposedSession,
} from "./index.js";
import { sessionFitsEquipment, detectEquipmentInDetails } from "./session-compose.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
let n = 0;
function ok(cond, msg) {
  assert(cond, msg);
  n += 1;
}

function briefFrom({
  level = "découverte",
  objectif = "nager_progresser",
  duration = 40,
  equipment,
  volumeTarget = 800,
  seed = "eq",
  pool = 25,
  phase = "base",
  sessionIntent,
} = {}) {
  const sport = buildSportProfile({
    level,
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "nager_progresser"
          ? "progression"
          : objectif === "course_piscine"
            ? "course_piscine"
            : objectif,
    category:
      objectif === "eau_libre"
        ? "open_water"
        : objectif === "course_piscine"
          ? "competition"
          : "progression",
    equipment,
    pool,
    sessionsPerWeek: 3,
    swimStyle: "crawl",
    preferredStroke: "crawl",
  });
  sport.objectifV1 = objectif;
  const weekCtx = {
    sport,
    capacity: sport.capacity,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    phase,
    weekIndex: 0,
    effectivePhase: phase,
  };
  return buildSessionBrief({
    sport,
    weekCtx,
    role: {
      family: "aisance",
      sessionIntent: sessionIntent || "aisance",
      intensityTarget: "Z2",
      keySession: false,
    },
    durationTarget: duration,
    volumeTarget,
    seed,
  });
}

// Structure
ok(EQUIPMENT_IDS.includes("elastique"), "elastique id");
ok(normalizeProfileEquipment(["fins", "pull-buoy"]).includes("palmes"), "alias fins→palmes");
ok(normalizeProfileEquipment(["pull-buoy"]).includes("pull"), "alias pull");
ok(normalizeProfileEquipment(null) === null, "null unknown");
ok(normalizeProfileEquipment([]).length === 0, "[] aucun");

{
  const unknown = buildSportProfile({ level: "régulier", goal: "eau_libre", equipment: null });
  ok(unknown.equipment == null && unknown.equipmentUnknown, "unknown flag");
  const none = buildSportProfile({ level: "découverte", goal: "progression", equipment: [] });
  ok(Array.isArray(none.equipment) && none.equipment.length === 0 && !none.equipmentUnknown, "[] known");
}

ok(sessionFitsEquipment(["200m crawl"], []), "no matos lines");
ok(!sessionFitsEquipment(["8×50 palmes"], []), "[] forbids palmes");
ok(sessionFitsEquipment(["8×50 palmes"], ["palmes"]), "palmes ok");
ok(!sessionFitsEquipment(["8×50 palmes"], ["tuba"]), "tuba-only forbids palmes");
ok(detectEquipmentInDetails(["planche battements"]).includes("planche"), "detect");

{
  const ex = { id: "x", requiredEquipment: ["palmes"], instructions: ["palmes"] };
  ok(rejectExerciseForBrief(ex, { ...briefFrom({ equipment: [] }), equipment: [] }).rejected, "reject missing");
  ok(!rejectExerciseForBrief(ex, { ...briefFrom({ equipment: ["palmes"] }), equipment: ["palmes"] }).rejected, "allow owned");
}

// D1
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: [], seed: "d1" }));
  ok(r.ok, `D1 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, []), "D1 fits");
  ok(!/palmes|tuba|pull|plaquette/i.test((r.session.details || []).join(" ")), "D1 no matos");
  ok((r.session.equipmentUsed || []).length === 0, "D1 used []");
}

// D2
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["palmes"], seed: "d2" }));
  ok(r.ok, `D2 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["palmes"]), "D2 fits");
}

// D3
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["palmes", "tuba"], seed: "d3" }));
  ok(r.ok, `D3 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["palmes", "tuba"]), "D3 fits");
}

// D4
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["tuba"], seed: "d4" }));
  ok(r.ok, `D4 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["tuba"]), "D4 fits");
  ok(!(r.session.equipmentRequired || []).includes("palmes"), "D4 no palmes required");
}

// Régulier / Sportif
for (const [level, equipment, objectif, seed] of [
  ["régulier", ["pull"], "eau_libre", "r-pull"],
  ["régulier", ["tuba"], "eau_libre", "r-tuba"],
  ["sportif", ["plaquettes"], "course_piscine", "s-plaq"],
  ["sportif", [], "course_piscine", "s-none"],
]) {
  const r = composeSession(briefFrom({
    level,
    equipment,
    objectif,
    seed,
    volumeTarget: 1600,
    duration: 55,
    sessionIntent: "endurance",
  }));
  ok(r.ok, `${seed} ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, equipment), `${seed} fits`);
}

// Perf taper / none
{
  const r = composeSession(briefFrom({
    level: "performance",
    equipment: ["palmes", "pull"],
    objectif: "course_piscine",
    phase: "taper",
    seed: "p-taper",
    volumeTarget: 1400,
    duration: 50,
  }));
  ok(r.ok, `p-taper ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["palmes", "pull"]), "p-taper fits");
}
{
  const r = composeSession(briefFrom({
    level: "performance",
    equipment: [],
    objectif: "course_piscine",
    seed: "p-none",
    volumeTarget: 1400,
    duration: 50,
  }));
  ok(r.ok, `p-none ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, []), "p-none fits");
}

// Négatif QG
{
  const brief = briefFrom({ level: "régulier", equipment: [], seed: "neg" });
  const fake = {
    details: ["10×50 palmes (Z2)"],
    distance: "500m",
    duration: 30,
    equipmentRequired: ["palmes"],
    equipmentUsed: ["palmes"],
    volumeFromSets: 500,
    trainingDistance: 500,
    type: "ENDURANCE",
    title: "Fake",
    intensity: "Z2",
  };
  const v = validateComposedSession(fake, brief);
  ok(!v.ok, "QG reject");
  ok((v.errors || []).some((e) => String(e).includes("material_missing")), "material_missing");
}

console.log(`equipment-onboarding.test.js: ${n} assertions OK`);
