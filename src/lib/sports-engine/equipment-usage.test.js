/**
 * Engagement matériel — resolveEquipmentUsage.
 * Usage : node src/lib/sports-engine/equipment-usage.test.js
 */
import {
  resolveEquipmentUsage,
  isEquipmentEngagementExempt,
  normalizeEquipmentList,
  pedagogicalTechEquipment,
  forbiddenTechEquipment,
  isBreathPatternLine,
} from "./equipment-usage.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
let n = 0;
function ok(cond, msg) {
  assert(cond, msg);
  n += 1;
}

ok(normalizeEquipmentList(["palmes", "pull-buoy"]).includes("palmes"), "palmes");
ok(normalizeEquipmentList(["pull-buoy"]).includes("pull"), "pull");
ok(normalizeEquipmentList(["élastique"]).includes("elastique"), "elastique");

ok(isEquipmentEngagementExempt({ sessionIntent: "recuperation" }), "recup exempt");
ok(isEquipmentEngagementExempt({ phase: "taper" }), "taper exempt");
ok(isEquipmentEngagementExempt({ sessionIntent: "race" }), "race exempt");
ok(!isEquipmentEngagementExempt({ sessionIntent: "endurance", phase: "base" }), "endurance not exempt");

{
  let engaged = 0;
  for (let i = 0; i < 30; i++) {
    const rng = () => (i * 0.37 + 0.11) % 1;
    const u = resolveEquipmentUsage(
      { equipment: ["palmes", "tuba", "pull"], sessionIntent: "endurance", phase: "base" },
      rng,
    );
    ok(u.usage !== "none", `eng ${i} usage`);
    ok(u.applied.length >= 1, `eng ${i} applied`);
    ok(u.engaged, `eng ${i} flag`);
    ok(u.techNote || u.corpsNote, `eng ${i} note`);
    engaged += 1;
  }
  ok(engaged === 30, "30/30 engagés");
}

{
  let none = 0;
  for (let i = 0; i < 40; i++) {
    const rng = () => ((i * 0.19) % 1);
    const u = resolveEquipmentUsage(
      { equipment: ["palmes"], sessionIntent: "recuperation", phase: "base" },
      rng,
    );
    if (u.usage === "none") none += 1;
  }
  ok(none >= 25, `récup majoritairement none (${none}/40)`);
}

{
  const u = resolveEquipmentUsage({ equipment: [], sessionIntent: "endurance" }, () => 0.1);
  ok(u.usage === "none" && u.applied.length === 0, "inventaire vide → none");
}

{
  // Jamais pull + palmes ensemble
  for (let i = 0; i < 50; i++) {
    const rng = () => (i * 0.13 + 0.07) % 1;
    const u = resolveEquipmentUsage(
      { equipment: ["palmes", "pull"], sessionIntent: "technique_endurance" },
      rng,
    );
    ok(!(u.applied.includes("pull") && u.applied.includes("palmes")), `no pull+palmes ${i}`);
  }
}

{
  // 3T/5T = respiration latérale → PAS de tuba frontal
  ok(pedagogicalTechEquipment("technique_respiration").length === 0, "respi: pas de matos préféré");
  ok(forbiddenTechEquipment("technique_respiration").includes("tuba"), "respi forbid tuba");
  ok(isBreathPatternLine("8×25m respiration 3T"), "3T is breath pattern");
  ok(isBreathPatternLine("4×50m 3T/5T alterné"), "3T/5T pattern");
  ok(!isBreathPatternLine("8×25m flèche + tuba frontal"), "flèche not breath pattern");

  for (let i = 0; i < 40; i++) {
    const rng = () => (i * 0.17 + 0.05) % 1;
    const u = resolveEquipmentUsage(
      {
        equipment: ["tuba", "palmes"],
        techFocus: "technique_respiration",
        sessionIntent: "endurance",
        phase: "base",
        level: "regulier",
      },
      rng,
    );
    ok(!u.techNote || !/tuba/i.test(u.techNote), `pas tuba en techNote respi ${i}: ${u.techNote}`);
    ok(!u.applied.includes("tuba") || u.corpsNote, `tuba jamais collé au 3T ${i}`);
  }

  // Seul tuba + focus respiration → skip engagement plutôt que forcer le tuba sur le 3T
  const onlyTuba = resolveEquipmentUsage(
    {
      equipment: ["tuba"],
      techFocus: "technique_respiration",
      sessionIntent: "endurance",
      phase: "base",
      level: "regulier",
    },
    () => 0.1,
  );
  ok(onlyTuba.applied.length === 0, "seul tuba respi → pas d'appliqué");
  ok(onlyTuba.engagementSkippedReason === "forbidden_for_focus", "skip reason");

  // Flèche / grand chien : tuba OK
  const fleche = resolveEquipmentUsage(
    {
      equipment: ["tuba", "palmes"],
      techFocus: "technique_fleche",
      sessionIntent: "endurance",
      phase: "base",
      level: "decouverte",
    },
    () => 0.1,
  );
  ok(fleche.applied.includes("tuba") || fleche.applied.includes("palmes"), "flèche utilise tuba/palmes");
}

console.log(`equipment-usage.test.js: ${n} assertions OK`);
