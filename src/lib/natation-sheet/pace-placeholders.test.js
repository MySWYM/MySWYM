/**
 * Tests placeholders Sheet {D:} / {@:}
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

assert.equal(normalizePaceIntent("moyen"), "moyen");
assert.equal(normalizePaceIntent("rapide"), "vite");
assert.equal(normalizePaceIntent("triathlon"), "course");
assert.equal(normalizePaceIntent("Z2"), "moyen");
assert.equal(inferRepMetersFromLine("8 × 100 m crawl moyen, {D:moyen}"), 100);
assert.equal(inferRepMetersFromLine("6 × 50 m crawl vite, {D:vite}"), 50);

assert.equal(canResolveSheetPace({ levelBand: "debutant", isPremium: true, pace100: 90 }), false);
assert.equal(canResolveSheetPace({ levelBand: "intermediaire", isPremium: false, pace100: 90 }), false);
assert.equal(canResolveSheetPace({ levelBand: "intermediaire", isPremium: true, pace100: 90 }), true);

const dSec = computeDepartSeconds(90, "moyen", 100);
assert.ok(dSec > 90 && dSec < 160, `D moyen ~ swim+rest (${dSec})`);
assert.match(formatSheetDepart(110), /^D1'/);

{
  const noPace = resolvePacePlaceholders("8 × 100 m crawl moyen, {D:moyen}", {
    allowPace: false,
    pace100: 90,
  });
  assert.match(noPace, /repos 30 s/);
  assert.ok(!/\{D:/.test(noPace));
}

{
  const withAt = resolvePacePlaceholders("8 × 100 m crawl moyen, {D:moyen} {@:moyen}", {
    allowPace: false,
    pace100: 90,
  });
  assert.match(withAt, /repos 30 s/);
  assert.ok(!/@\d/.test(withAt), "pas d’allure sans allowPace");
}

{
  const ok = resolvePacePlaceholders("8 × 100 m crawl moyen, {D:moyen} {@:moyen}", {
    allowPace: true,
    pace100: 90,
  });
  assert.match(ok, /D\d+'/);
  assert.match(ok, /@\d+:\d+-\d+:\d+/);
  assert.ok(!/\{[D@]:/.test(ok));
}

{
  const filled = materializeSession(
    {
      n: 1,
      phase: null,
      bande: "intermédiaire",
      total_m: 800,
      echauffement: "200 m crawl souple",
      bloc: "8 × 100 m crawl moyen, {D:moyen}",
      rac: "100 m souple",
    },
    [],
    { levelBand: "debutant", nage: "crawl", pace100: 90, isPremium: true },
  );
  assert.match(filled.bloc, /repos 30 s/, "débutant → jamais D perso");
  assert.ok(!/D\d+'/.test(filled.bloc));
}

{
  const filled = materializeSession(
    {
      n: 2,
      phase: null,
      bande: "intermédiaire",
      total_m: 800,
      echauffement: "200 m crawl",
      bloc: "8 × 100 m crawl moyen, {D:moyen} {@:moyen}",
      rac: "100 m",
    },
    [],
    { levelBand: "intermediaire", nage: "crawl", pace100: 90, isPremium: true },
  );
  assert.match(filled.bloc, /D\d+'/);
  assert.match(filled.bloc, /@\d+:\d+/);
}

console.log("pace-placeholders.test.js OK");
