/**
 * Engagement matériel — resolveEquipmentUsage.
 * Usage : node src/lib/sports-engine/equipment-usage.test.js
 */
import {
  resolveEquipmentUsage,
  isEquipmentEngagementExempt,
  normalizeEquipmentList,
  pedagogicalTechEquipment,
  hasBreathingBeat,
  hasBeatTubaConflict,
  stripTubaFromBeatLine,
  filterMatosNoteForLabel,
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

ok(hasBreathingBeat("8×50 respiration 3T"), "3T");
ok(hasBreathingBeat("6×50 bilatéral 5T"), "5T");
ok(hasBreathingBeat("4×50 7 temps"), "7 temps");
ok(hasBreathingBeat("(3T/5T/7T/9T par 50m)"), "suite beats");
ok(!hasBreathingBeat("200m crawl avec tuba frontal"), "pas beat");
ok(hasBeatTubaConflict(["8×50 respiration 3T avec tuba frontal"]), "conflict line");
ok(!hasBeatTubaConflict(["8×50 respiration 3T", "200m crawl avec tuba frontal"]), "ok séparés");
ok(
  !/\btuba\b/i.test(stripTubaFromBeatLine("8×50 respiration 3T avec tuba frontal")),
  "strip tuba",
);
ok(filterMatosNoteForLabel("respiration 3T", "tuba frontal") === "", "filter note");
ok(
  pedagogicalTechEquipment("technique_respiration").length === 0,
  "respiration: pas de tuba pédagogique",
);
ok(pedagogicalTechEquipment("technique_croisement").includes("tuba"), "croisement: tuba OK");

console.log(`equipment-usage.test.js: ${n} assertions OK`);
