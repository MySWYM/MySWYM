/**
 * Tests placeholders Sheet {D:} / {@:}, zones facile → sprint
 * Usage : node src/lib/natation-sheet/pace-placeholders.test.js
 */
import assert from "node:assert/strict";
import {
  canResolveSheetPace,
  computeDepartSeconds,
  formatSheetDepart,
  inferPaceIntentFromDepart,
  inferRepMetersFromLine,
  normalizePaceIntent,
  resolvePacePlaceholders,
  rewritePaceMarkersInLine,
  rewriteSessionPaceMarkers,
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
  // Sheet a déjà un repos → ne pas injecter un 2ᵉ « repos 30 s »
  const keepSheet = resolvePacePlaceholders("3 × 50 m crawl {D:endurance}, repos 20 s", {
    allowPace: false,
    pace100: 90,
  });
  assert.match(keepSheet, /repos 20 s/);
  assert.ok(!/repos 30 s/.test(keepSheet), keepSheet);
  assert.ok(!/\{D:/i.test(keepSheet));
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
      n: 62,
      phase: null,
      bande: "intermédiaire",
      total_m: 2000,
      echauffement: "200 m",
      bloc: "3 × 50 m crawl {D:endurance}, repos 20 s",
      rac: "100 m",
    },
    [],
    { levelBand: "debutant", nage: "crawl", pace100: 90, isPremium: true },
  );
  assert.match(filled.bloc, /repos 20 s/);
  assert.ok(!/repos 30 s/.test(filled.bloc), filled.bloc);
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

{
  const fromPace = 105; // ~1:45
  const toPace = 79; // ~1:19
  const line = resolvePacePlaceholders("8 × 100 m crawl, {D:endurance} {@:endurance}", {
    allowPace: true,
    pace100: fromPace,
  });
  const departSec = computeDepartSeconds(fromPace, "endurance", 100);
  assert.equal(inferPaceIntentFromDepart(fromPace, departSec, 100), "endurance");
  const rewritten = rewritePaceMarkersInLine(line, {
    fromPace100: fromPace,
    toPace100: toPace,
  });
  const expectedD = formatSheetDepart(computeDepartSeconds(toPace, "endurance", 100));
  assert.ok(rewritten.includes(expectedD), rewritten);
  assert.ok(!rewritten.includes(formatSheetDepart(departSec)) || expectedD === formatSheetDepart(departSec), rewritten);
  assert.match(rewritten, /@\d+:\d+-\d+:\d+/);
}

{
  const sess = rewriteSessionPaceMarkers(
    {
      details: ["- 8 × 100 m crawl " + formatSheetDepart(computeDepartSeconds(100, "seuil", 100))],
      completed: true,
    },
    { fromPace100: 100, toPace100: 80, isPremium: true, levelBand: "intermediaire" },
  );
  assert.equal(
    sess.details[0],
    "- 8 × 100 m crawl " + formatSheetDepart(computeDepartSeconds(100, "seuil", 100)),
    "séance validée intacte",
  );
}

console.log("pace-placeholders.test.js OK");
