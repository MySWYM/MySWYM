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
  hasPullPalmesConflict,
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
  ok(!/palmes|tuba|pull|plaquette|planche/i.test((r.session.details || []).join(" ")), "D1 no matos");
  ok((r.session.equipmentUsed || []).length === 0, "D1 used []");
}

// D2
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["palmes"], seed: "d2" }));
  ok(r.ok, `D2 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["palmes"]), "D2 fits");
  ok(/palmes/i.test((r.session.details || []).join(" ")), "D2 palmes visible");
  ok((r.session.equipmentUsed || []).includes("palmes"), "D2 used palmes");
}

// D3
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["palmes", "tuba"], seed: "d3" }));
  ok(r.ok, `D3 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["palmes", "tuba"]), "D3 fits");
  ok(/palmes|tuba/i.test((r.session.details || []).join(" ")), "D3 matos visible");
}

// Découverte : inventaire multi (combo hors anciens presets exclusifs)
{
  const owned = ["palmes", "tuba", "planche"];
  const sport = buildSportProfile({ level: "découverte", goal: "progression", equipment: owned });
  ok(owned.every((id) => sport.equipment.includes(id)), "découverte keeps several items");
  const r = composeSession(briefFrom({ level: "découverte", equipment: owned, seed: "d-multi" }));
  ok(r.ok, `d-multi ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, owned), "d-multi fits");
}

// D4
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["tuba"], seed: "d4" }));
  ok(r.ok, `D4 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["tuba"]), "D4 fits");
  ok(/tuba/i.test((r.session.details || []).join(" ")), "D4 tuba visible");
  ok(!(r.session.equipmentRequired || []).includes("palmes"), "D4 no palmes required");
}

// D5 planche
{
  const r = composeSession(briefFrom({ level: "découverte", equipment: ["planche"], seed: "d5" }));
  ok(r.ok, `D5 ${r.reason || ""}`);
  ok(sessionFitsEquipment(r.session.details, ["planche"]), "D5 fits");
  ok(/planche/i.test((r.session.details || []).join(" ")), "D5 planche visible");
  ok((r.session.equipmentUsed || []).includes("planche"), "D5 used planche");
}

// Engagement Régulier / Sportif
{
  const r = composeSession(briefFrom({
    level: "régulier",
    equipment: ["pull"],
    objectif: "eau_libre",
    seed: "r-pull-eng",
    volumeTarget: 1600,
    duration: 55,
    sessionIntent: "endurance",
  }));
  ok(r.ok, `r-pull-eng ${r.reason || ""}`);
  ok((r.session.equipmentUsed || []).length > 0, "r-pull engaged");
  ok(/pull/i.test((r.session.details || []).join(" ")), "r-pull visible");
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

// Inventaire : posséder pull + palmes OK ; les combiner sur la même ligne, non
{
  const owned = ["palmes", "pull"];
  const sport = buildSportProfile({ level: "régulier", goal: "progression", equipment: owned });
  ok(owned.every((id) => sport.equipment.includes(id)), "inventory may own both");
  ok(!hasPullPalmesConflict(["8×50 palmes", "4×100 pull-buoy"]), "OK across different lines");
  ok(hasPullPalmesConflict(["8×50 crawl avec pull-buoy et palmes"]), "conflict on same line");
  ok(sessionFitsEquipment(["8×50 palmes", "4×100 pull-buoy"], owned), "session allows combo across lines");
  ok(!sessionFitsEquipment(["8×50 crawl avec pull et palmes"], owned), "session rejects same-line combo");
  const r = composeSession(briefFrom({
    level: "régulier",
    equipment: owned,
    objectif: "nager_progresser",
    seed: "own-both",
    volumeTarget: 1600,
    duration: 55,
    sessionIntent: "endurance",
  }));
  ok(r.ok, `own-both ${r.reason || ""}`);
  ok(!hasPullPalmesConflict(r.session.details || []), "compose never mixes pull+palmes on one line");
  const fakeSameLine = {
    details: ["8×50 crawl avec pull-buoy et palmes (Z2)"],
    distance: "400m",
    duration: 40,
    equipmentRequired: ["palmes", "pull"],
    equipmentUsed: ["palmes", "pull"],
    volumeFromSets: 400,
    trainingDistance: 400,
    type: "ENDURANCE",
    title: "Fake same line",
    intensity: "Z2",
  };
  const vSame = validateComposedSession(fakeSameLine, briefFrom({ level: "régulier", equipment: owned, seed: "qg-same" }));
  ok(!vSame.ok, "QG reject pull+palmes same exercise");
  ok((vSame.errors || []).some((e) => String(e).includes("pull + palmes")), "QG names conflict");
  const fakeAcross = {
    details: ["8×50 palmes (Z2)", "4×100 pull-buoy (Z2)"],
    distance: "900m",
    duration: 40,
    equipmentRequired: ["palmes", "pull"],
    equipmentUsed: ["palmes", "pull"],
    volumeFromSets: 900,
    trainingDistance: 900,
    type: "ENDURANCE",
    title: "Fake across",
    intensity: "Z2",
  };
  const vAcross = validateComposedSession(fakeAcross, briefFrom({ level: "régulier", equipment: owned, seed: "qg-across" }));
  ok(vAcross.ok || !(vAcross.errors || []).some((e) => String(e).includes("pull + palmes")), "QG allows across lines");
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
