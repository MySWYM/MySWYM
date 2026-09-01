/**
 * Tests listes fermées blessures (multi-zones + miroir, sans branchement moteur).
 * Usage : node src/lib/health-data.test.js
 */
import assert from "node:assert/strict";
import {
  normalizeInjuries,
  injuryMirrorsFromList,
  resolveInjuryFields,
  toggleInjuryZone,
  setInjurySeverity,
  clearInjuries,
  formatInjurySummary,
  DEFAULT_INJURY_SEVERITY,
} from "./health-data.js";
import { extractSwimmerProfile, hydrateSwimmerFromSources } from "./swimmer-profile.js";
import { sportProfileToRow, rowToSportProfileFields } from "./sports-persistence/index.js";
import { buildSportProfile } from "./sports-engine/types.js";

{
  const list = normalizeInjuries([
    { zone: "shoulder", severity: "moderate" },
    { zone: "knee" },
    { zone: "shoulder", severity: "significant" },
    { zone: "nope", severity: "mild" },
  ]);
  assert.deepEqual(list, [
    { zone: "shoulder", severity: "moderate" },
    { zone: "knee", severity: DEFAULT_INJURY_SEVERITY },
  ]);
}

{
  const mirrors = injuryMirrorsFromList([
    { zone: "knee", severity: "mild" },
    { zone: "shoulder", severity: "significant" },
  ]);
  assert.equal(mirrors.injuryStatus, "oui");
  assert.equal(mirrors.injuryZone, "shoulder");
  assert.equal(mirrors.injurySeverity, "significant");
  assert.equal(mirrors.injuries.length, 2);
}

{
  assert.deepEqual(resolveInjuryFields({ pool: 25 }), {});
  assert.deepEqual(resolveInjuryFields({ injuryStatus: "oui" }), {});
  const none = resolveInjuryFields({ injuryStatus: "aucune", injuryZone: "knee" });
  assert.equal(none.injuryStatus, "aucune");
  assert.equal(none.injuries.length, 0);
  assert.equal(none.injuryZone, null);
}

{
  const legacy = resolveInjuryFields({
    injuryStatus: "oui",
    injuryZone: "elbow",
    injurySeverity: "moderate",
  });
  assert.deepEqual(legacy.injuries, [{ zone: "elbow", severity: "moderate" }]);
  assert.equal(legacy.injuryZone, "elbow");
}

{
  const added = toggleInjuryZone([], "back");
  assert.equal(added.injuryStatus, "oui");
  assert.deepEqual(added.injuries, [{ zone: "back", severity: DEFAULT_INJURY_SEVERITY }]);
  const two = toggleInjuryZone(added.injuries, "knee");
  assert.equal(two.injuries.length, 2);
  const removed = toggleInjuryZone(two.injuries, "back");
  assert.deepEqual(removed.injuries, [{ zone: "knee", severity: DEFAULT_INJURY_SEVERITY }]);
  assert.equal(removed.injuryStatus, "oui");
}

{
  const sev = setInjurySeverity(
    [{ zone: "hip", severity: "mild" }],
    "hip",
    "significant",
  );
  assert.equal(sev.injurySeverity, "significant");
  assert.equal(sev.injuries[0].severity, "significant");
}

{
  assert.equal(formatInjurySummary({ injuryStatus: "aucune" }), "Aucune");
  const summary = formatInjurySummary({
    injuries: [
      { zone: "shoulder", severity: "moderate" },
      { zone: "knee", severity: "mild" },
    ],
  });
  assert.equal(summary, "Épaule : modérée · Genou : légère");
}

{
  const cleared = extractSwimmerProfile(clearInjuries());
  assert.equal(cleared.injuryStatus, "aucune");
  assert.deepEqual(cleared.injuries, []);
}

{
  const partialOui = extractSwimmerProfile({ injuryStatus: "oui" });
  assert.equal(partialOui.injuryStatus, "oui");
  assert.equal(partialOui.injuries, undefined);
}

{
  const row = sportProfileToRow("u1", {
    level: "sportif",
    sessionsPerWeek: 3,
    pool: 25,
    injuries: [
      { zone: "shoulder", severity: "moderate" },
      { zone: "ankle", severity: "mild" },
    ],
  });
  assert.equal(row.injury_status, "oui");
  assert.equal(row.injury_zone, "shoulder");
  assert.equal(row.injury_severity, "moderate");
  assert.equal(row.extra.injuries.length, 2);
  const fields = rowToSportProfileFields(row);
  assert.equal(fields.injuries.length, 2);
  assert.equal(fields.injuryZone, "shoulder");
}

{
  const legacyRow = sportProfileToRow("u2", {
    injuryStatus: "oui",
    injuryZone: "wrist",
    injurySeverity: "mild",
  });
  assert.deepEqual(legacyRow.extra.injuries, [{ zone: "wrist", severity: "mild" }]);
  const fields = rowToSportProfileFields({
    injury_status: "oui",
    injury_zone: "wrist",
    injury_severity: "mild",
    extra: {},
  });
  assert.deepEqual(fields.injuries, [{ zone: "wrist", severity: "mild" }]);
}

{
  const untouched = rowToSportProfileFields({
    injury_status: null,
    extra: { injuries: [] },
  });
  assert.equal(untouched.injuryStatus, null);
  assert.notEqual(untouched.injuryStatus, "aucune");
}

{
  const hydrated = hydrateSwimmerFromSources({
    sportRowFields: {
      injuries: [
        { zone: "neck", severity: "mild" },
        { zone: "back", severity: "moderate" },
      ],
      injuryStatus: "oui",
    },
    planProfile: { injuryStatus: "oui", injuryZone: "knee", injurySeverity: "mild" },
  });
  assert.equal(hydrated.injuries.length, 2);
  assert.ok(hydrated.injuries.some((i) => i.zone === "neck"));
}

{
  const cleared = hydrateSwimmerFromSources({
    sportRowFields: { injuryStatus: "aucune", injuries: [] },
    planProfile: { injuryStatus: "oui", injuryZone: "knee", injurySeverity: "mild" },
  });
  assert.equal(cleared.injuryStatus, "aucune");
  assert.deepEqual(cleared.injuries, []);
}

{
  const sport = buildSportProfile({
    level: "sportif",
    goal: "progression",
    sessionsPerWeek: 3,
    pool: 25,
    injuryStatus: "oui",
    injuries: [
      { zone: "shoulder", severity: "significant" },
      { zone: "knee", severity: "mild" },
    ],
  });
  assert.equal(sport.injuryStatus, "oui");
  assert.equal(sport.hasPainConstraint, true);
  assert.equal("injuries" in sport, false);
}

console.log("health-data.test.js PASS");
