/**
 * Tests provenance séance (support Telegram).
 * Usage : node src/lib/session-provenance.test.js
 */
import assert from "node:assert/strict";
import { buildSessionProvenance, formatSessionSupportRef } from "./session-provenance.js";

const profile = {
  level: "régulier",
  swimStyle: "crawl",
  pool: 25,
  goal: "progression",
  equipment: ["palmes", "tuba"],
};

{
  // Séance Sheet : onglet + ligne retrouvables
  const session = {
    composedBy: "natation-sheet",
    distance: "1500m",
    trainingDistance: 1500,
    sheetMeta: {
      familyId: "01 Nager deb crawl",
      n: 42,
      phase: null,
      bande: "débutant",
      educatif: "flèche",
      total_m: 1500,
    },
  };
  const p = buildSessionProvenance(session, { loopOrdinal: 5, profile, planId: "plan_1" });
  assert.equal(p.isSheet, true);
  assert.equal(p.familyId, "01 Nager deb crawl");
  assert.equal(p.sheetN, 42);
  assert.equal(p.uiOrdinal, 6, "UI n°6 = 6e validation, pas la ligne Sheet");
  assert.equal(p.refCode, "01-42");
  assert.match(p.shortLabel, /01 Nager deb crawl · ligne n°42/);
  assert.match(p.supportLine, /UI n°6/);
  assert.match(p.supportLine, /Sheet «01 Nager deb crawl» ligne n°42/);
  assert.match(p.supportLine, /1500m/);
  assert.match(p.supportLine, /éducatif: flèche/);
  assert.match(p.supportLine, /matos: palmes,tuba/);
}

{
  // Fallback composeur : pas de fausse ligne Sheet
  const session = { composedBy: "session-composer", distance: "1800m" };
  const p = buildSessionProvenance(session, { loopOrdinal: 0, profile });
  assert.equal(p.isSheet, false);
  assert.equal(p.familyId, null);
  assert.equal(p.sheetN, null);
  assert.match(p.shortLabel, /Composeur/);
  assert.match(p.supportLine, /pas de ligne Sheet/);
  assert.ok(!/Sheet «/.test(p.supportLine));
}

{
  // Matos vide explicite ≠ matos inconnu
  const none = buildSessionProvenance(
    { composedBy: "session-composer" },
    { profile: { ...profile, equipment: [] } },
  );
  assert.match(none.supportLine, /matos: aucun/);
  const unknown = buildSessionProvenance(
    { composedBy: "session-composer" },
    { profile: { ...profile, equipment: null } },
  );
  assert.ok(!/matos:/.test(unknown.supportLine));
}

{
  assert.equal(buildSessionProvenance(null), null);
  assert.equal(formatSessionSupportRef(null), "");
}

console.log("session-provenance.test.js PASS");
