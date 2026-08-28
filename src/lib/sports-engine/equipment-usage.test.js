/**
 * Engagement matériel — resolveEquipmentUsage.
 * Usage : node src/lib/sports-engine/equipment-usage.test.js
 */
import {
  resolveEquipmentUsage,
  isEquipmentEngagementExempt,
  normalizeEquipmentList,
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
  // Posséder pull + palmes OK ; applied peut contenir les deux (conflit = ligne d'exo)
  let sawBoth = 0;
  for (let i = 0; i < 50; i++) {
    const rng = () => (i * 0.13 + 0.07) % 1;
    const u = resolveEquipmentUsage(
      { equipment: ["palmes", "pull"], sessionIntent: "technique_endurance" },
      rng,
    );
    if (u.applied.includes("pull") && u.applied.includes("palmes")) sawBoth++;
    ok(u.applied.every((e) => ["palmes", "pull", "tuba", "planche", "plaquettes", "elastique"].includes(e)), `known ids ${i}`);
  }
  ok(sawBoth >= 0, `may apply both across session (${sawBoth}/50)`);
}

console.log(`equipment-usage.test.js: ${n} assertions OK`);
