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
  assert.equal(p.uiOrdinal, 6, "séance n°6 = 6e validation, pas la ligne Sheet");
  assert.equal(p.refCode, "01-42");
  assert.match(p.shortLabel, /01 Nager deb crawl · ligne n°42/);
  assert.match(p.supportLine, /séance n°6/);
  assert.match(p.supportLine, /réf\. 01-42/);
  assert.ok(!/UI n°/.test(p.supportLine));
  assert.ok(!/Sheet «/.test(p.supportLine));
  assert.ok(!/bande:/.test(p.supportLine));
  assert.ok(!/nage:/.test(p.supportLine));
  assert.match(p.supportLine, /1500m/);
  assert.match(p.supportLine, /éducatif: flèche/);
  assert.match(p.supportLine, /niveau: débutant/);
  assert.ok(!/niveau: régulier/.test(p.supportLine));
  assert.match(p.supportLine, /4nages: non/);
  assert.match(p.supportLine, /matos: palmes,tuba/);
}

{
  // 4 nages : famille Sheet ou swimStyle
  const four = buildSessionProvenance(
    {
      composedBy: "natation-sheet",
      sheetMeta: { familyId: "03 Nager 4 nages", n: 8, bande: "intermédiaire", total_m: 1800 },
    },
    { profile: { ...profile, level: "sportif", swimStyle: "4_nages" } },
  );
  assert.match(four.supportLine, /réf\. 03-8/);
  assert.match(four.supportLine, /niveau: intermédiaire/);
  assert.match(four.supportLine, /4nages: oui/);
}

{
  // Profil régulier sans bande Sheet → niveau débutant
  const mapped = buildSessionProvenance(
    { composedBy: "session-composer", distance: "1200m" },
    { profile: { level: "régulier", swimStyle: "crawl" } },
  );
  assert.match(mapped.supportLine, /niveau: débutant/);
  assert.match(mapped.supportLine, /4nages: non/);
}

{
  // Fallback composeur : pas de fausse ligne Sheet
  const session = { composedBy: "session-composer", distance: "1800m" };
  const p = buildSessionProvenance(session, { loopOrdinal: 0, profile });
  assert.equal(p.isSheet, false);
  assert.equal(p.familyId, null);
  assert.equal(p.sheetN, null);
  assert.match(p.shortLabel, /Composeur/);
  assert.match(p.supportLine, /réf\. C-1800 \(pas de ligne Sheet\)/);
  assert.match(p.supportLine, /séance n°1/);
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
