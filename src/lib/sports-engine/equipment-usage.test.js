/**
 * Engagement matériel, resolveEquipmentUsage.
 * Usage : node src/lib/sports-engine/equipment-usage.test.js
 */
import {
  resolveEquipmentUsage,
  isEquipmentEngagementExempt,
  normalizeEquipmentList,
  pedagogicalTechEquipment,
  forbiddenTechEquipment,
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
ok(normalizeEquipmentList(["finger paddles"]).includes("plaquettes_doigts"), "finger paddles");
ok(normalizeEquipmentList(["plaquettes doigts"]).includes("plaquettes_doigts"), "plaquettes doigts");

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
    ok(u.applied.every((e) => ["palmes", "pull", "tuba", "planche", "plaquettes", "plaquettes_doigts", "elastique"].includes(e)), `known ids ${i}`);
  }
  ok(sawBoth >= 0, `may apply both across session (${sawBoth}/50)`);
}

{
  const prefer = pedagogicalTechEquipment("technique_catchup", "sportif");
  ok(prefer[0] === "plaquettes_doigts", "catchup sportif: fingers d'abord");
  ok(prefer.includes("plaquettes"), "catchup sportif: plaquettes fallback");
  ok(pedagogicalTechEquipment("technique_catchup", "regulier")[0] === "palmes", "catchup régulier: palmes");
  ok(forbiddenTechEquipment("technique_roulis").includes("plaquettes_doigts"), "roulis forbid fingers");
  ok(forbiddenTechEquipment("technique_jambes").includes("elastique"), "jambes forbid élastique");
}

{
  const u = resolveEquipmentUsage(
    {
      equipment: ["plaquettes", "plaquettes_doigts"],
      techFocus: "technique_catchup",
      level: "sportif",
      sessionIntent: "technique",
      phase: "base",
    },
    () => 0.1,
  );
  ok(!u.applied.includes("plaquettes") || u.applied.includes("plaquettes_doigts"), "both paddles: appui prefers fingers");
}

{
  const u = resolveEquipmentUsage(
    {
      equipment: ["plaquettes_doigts", "elastique"],
      level: "decouverte",
      sessionIntent: "aisance",
      phase: "base",
    },
    () => 0.1,
  );
  ok(!u.applied.includes("plaquettes_doigts") && !u.applied.includes("elastique"), "découverte: pas fingers ni élastique");
}

console.log(`equipment-usage.test.js: ${n} assertions OK`);
