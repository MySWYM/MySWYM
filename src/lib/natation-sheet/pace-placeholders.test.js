/**
 * Tests placeholders Sheet {D:} / {@:} — zones facile → sprint
 * Usage : node src/lib/natation-sheet/pace-placeholders.test.js
 */
import assert from "node:assert/strict";
import {
  canResolveSheetPace,
  computeDepartSeconds,
  formatSheetDepart,
  inferRepMetersFromLine,
  normalizePaceIntent,
  resolvePacePlaceholders,
} from "./pace-placeholders.js";
import { materializeSession } from "./parse.js";

assert.equal(normalizePaceIntent("endurance"), "endurance");
assert.equal(normalizePaceIntent("VO2"), "vo2");
assert.equal(normalizePaceIntent("vo2"), "vo2");
assert.equal(normalizePaceIntent("sprint"), "sprint");
assert.equal(normalizePaceIntent("moyen"), "endurance", "alias moyen");
assert.equal(normalizePaceIntent("rapide"), "seuil", "alias rapide");
assert.equal(normalizePaceIntent("souple"), "facile", "alias souple");
assert.equal(inferRepMetersFromLine("8 × 100 m crawl, {D:endurance}"), 100);
assert.equal(inferRepMetersFromLine("6 × 50 m crawl, {D:VO2}"), 50);

assert.equal(canResolveSheetPace({ levelBand: "debutant", isPremium: true, pace100: 90 }), false);
assert.equal(canResolveSheetPace({ levelBand: "intermediaire", isPremium: true, pace100: 90 }), true);

const dEnd = computeDepartSeconds(90, "endurance", 100);
const dVo2 = computeDepartSeconds(90, "vo2", 100);
const dSprint = computeDepartSeconds(90, "sprint", 100);
assert.ok(dEnd > 90 && dEnd < 160, `endurance D (${dEnd})`);
assert.ok(dVo2 < dEnd, "VO2 nage+marge < endurance en général");
assert.ok(dSprint > dVo2, "sprint a plus de récup → D souvent > VO2");
assert.match(formatSheetDepart(110), /^D1'/);

{
  const noPace = resolvePacePlaceholders("8 × 100 m crawl, {D:endurance}", {
    allowPace: false,
    pace100: 90,
  });
  assert.match(noPace, /repos 30 s/);
}

{
  const ok = resolvePacePlaceholders("8 × 100 m crawl, {D:endurance} {@:endurance}", {
    allowPace: true,
    pace100: 90,
  });
  assert.match(ok, /D\d+'/);
  assert.match(ok, /@\d+:\d+-\d+:\d+/);
}

{
  const vo2 = resolvePacePlaceholders("8 × 50 m crawl, {D:VO2} {@:VO2}", {
    allowPace: true,
    pace100: 90,
  });
  assert.match(vo2, /D\d+'/);
  assert.match(vo2, /@\d+:\d+/);
}

{
  const filled = materializeSession(
    {
      n: 1,
      phase: null,
      bande: "débutant",
      total_m: 800,
      echauffement: "200 m crawl",
      bloc: "8 × 100 m crawl, {D:endurance}",
      rac: "100 m",
    },
    [],
    { levelBand: "debutant", nage: "crawl", pace100: 90, isPremium: true },
  );
  assert.match(filled.bloc, /repos 30 s/);
}

{
  const filled = materializeSession(
    {
      n: 2,
      phase: null,
      bande: "intermédiaire",
      total_m: 800,
      echauffement: "200 m",
      bloc: "8 × 100 m crawl, {D:seuil} {@:seuil}",
      rac: "100 m",
    },
    [],
    { levelBand: "intermediaire", nage: "crawl", pace100: 90, isPremium: true },
  );
  assert.match(filled.bloc, /D\d+'/);
  assert.match(filled.bloc, /@\d+:\d+/);
}

console.log("pace-placeholders.test.js OK");
