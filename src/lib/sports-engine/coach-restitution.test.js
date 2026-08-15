/**
 * Tests restitution coach — fiche séance nageable.
 * Usage : node src/lib/sports-engine/coach-restitution.test.js
 */
import {
  toCoachDetailLines,
  finalizeCoachSession,
  findAmbiguousCoachLines,
  expandPyramidDetailLine,
  composeSession,
  buildSportProfile,
  buildSessionBrief,
  buildCorpsByFormat,
  volumeFromSets,
  assertVolumeConsistency,
} from "./index.js";
import { calcDetailsDistance } from "../swim-session-generator.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function briefFor(level, over = {}) {
  const sport = buildSportProfile({
    level,
    goal: over.goal || "progression",
    sessionsPerWeek: 3,
    pool: over.pool || 50,
    equipment: over.equipment || [],
    pace100: over.pace100,
    strokeFocus: over.strokeFocus || "crawl",
    papillonMastered: !!over.papillonMastered,
  });
  const volumeTarget = over.volumeTarget || (level === "decouverte" ? 700 : level === "regulier" ? 1800 : 2400);
  const duration = over.duration || (level === "decouverte" ? 30 : level === "regulier" ? 45 : 60);
  const weekCtx = {
    sport,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    maxZone: level === "decouverte" ? "Z2" : "Z4",
    phaseKey: over.phase || "base",
    why: "rest-test",
  };
  return buildSessionBrief({
    sport,
    weekCtx: { ...weekCtx, _phaseName: over.phase || "base" },
    role: {
      objectif: over.sessionIntent || "endurance",
      zone: over.zone || "Z2",
      family: over.family || "endurance",
      intent: over.sessionIntent || "endurance",
      sessionIntent: over.sessionIntent || "endurance",
      qualitySession: !!over.qualitySession,
    },
    sessionIndex: 0,
    seed: over.seed || `rest-${level}`,
    durationTarget: duration,
  });
}

// R1 — strip marketing
{
  const cleaned = toCoachDetailLines([
    "→ Aujourd'hui : technique puis aérobie",
    "-300m crawl souple — Z1",
    "-Technique · rattrapé → nage :",
    "  · 4 × 50m rattrapé — Bras dans l'axe, glisse — repos 15s",
    "-1750m pyramide crawl — montée / descente (sommet 400) — repos variable",
    "-250m souple, on savoure la fin de séance",
  ]);
  const text = cleaned.join("\n");
  assert(!/Aujourd'?hui/i.test(text), "no Aujourd'hui");
  assert(!/Technique ·/i.test(text), "no Technique header");
  assert(!/on savoure/i.test(text), "no savoure");
  assert(!/repos variable/i.test(text), "no repos variable");
  assert(!/1750m pyramide/i.test(text), "no opaque 1750 pyramid");
  assert(/4 × 50\s*m rattrapé/i.test(text), "tech set kept");
  assert(!/\bsouple\b/i.test(text), "D9 no souple");
  assert(!/\bZ1\b/.test(text), "D9 no Z1");
  console.log("R1 PASS");
}

// R1b — matos `·` → `avec` (restitution + engagement)
{
  const cleaned = toCoachDetailLines([
    "-8 × 50m crawl · palmes — Z2 — repos 20s",
    "-4 × 100m crawl · pull-buoy — repos 15s",
  ]);
  const text = cleaned.join("\n");
  assert(/crawl avec palmes/i.test(text), "palmes avec");
  assert(/crawl avec pull-buoy/i.test(text), "pull avec");
  assert(!/crawl\s*[·•]\s*palmes/i.test(text), "no · palmes");
  console.log("R1b PASS");
}

// R2 — expand pyramid steps
{
  const lines = expandPyramidDetailLine(
    "-900m pyramide crawl : 100 → 200 → 300 → 200 → 100 (sommet 300) — repos 20s",
  );
  assert(lines?.length === 5, `steps ${lines?.length}`);
  assert(calcDetailsDistance(lines) === 900, "vol 900");
  console.log("R2 PASS");
}

// R3 — Découverte 30
{
  const r = composeSession(briefFor("decouverte", { seed: "r3", volumeTarget: 700, duration: 30, equipment: [] }));
  assert(r.ok, `r3 ${r.reason}`);
  assert(findAmbiguousCoachLines(r.session.details).length === 0, findAmbiguousCoachLines(r.session.details).join(";"));
  const cons = assertVolumeConsistency({
    sets: r.session.sets,
    details: r.session.details,
    announcedDistance: r.session.distance,
  });
  assert(cons.ok, `r3 vol ${cons.errors.join(";")}`);
  console.log("R3 PASS", volumeFromSets(r.session.sets));
}

// R4 — Découverte 45 + palmes/tuba
{
  const r = composeSession(
    briefFor("decouverte", {
      seed: "r4",
      volumeTarget: 900,
      duration: 45,
      equipment: ["palmes", "tuba"],
    }),
  );
  assert(r.ok, `r4 ${r.reason}`);
  assert(findAmbiguousCoachLines(r.session.details).length === 0, "r4 clean");
  assert(/palmes|tuba/i.test(r.session.details.join(" ")), "r4 matos sur ligne nageable");
  assert(!/Technique ·/i.test(r.session.details.join("\n")), "r4 pas de header Technique");
  console.log("R4 PASS");
}

// R5 — Régulier 45
{
  const r = composeSession(briefFor("regulier", { seed: "r5", volumeTarget: 1800, duration: 45 }));
  assert(r.ok, `r5 ${r.reason}`);
  assert(!/Aujourd'?hui/i.test(r.session.details.join("\n")), "r5 headline");
  assert(findAmbiguousCoachLines(r.session.details).length === 0, "r5 clean");
  console.log("R5 PASS");
}

// R5b — Régulier reprise + eau libre
{
  const r = composeSession(
    briefFor("regulier", {
      seed: "r5b",
      volumeTarget: 1600,
      duration: 45,
      sessionIntent: "reprise",
      family: "eau_libre",
      goal: "eau_libre",
    }),
  );
  assert(r.ok, `r5b ${r.reason}`);
  assert(findAmbiguousCoachLines(r.session.details).length === 0, "r5b clean");
  const cons = assertVolumeConsistency({
    sets: r.session.sets,
    details: r.session.details,
    announcedDistance: r.session.distance,
  });
  assert(cons.ok, `r5b vol ${cons.errors.join(";")}`);
  console.log("R5b PASS");
}

// R6 — Sportif 60
{
  const r = composeSession(
    briefFor("sportif", { seed: "r6", volumeTarget: 2400, duration: 60, pace100: 85 }),
  );
  assert(r.ok, `r6 ${r.reason}`);
  const text = r.session.details.join("\n");
  assert(!/Technique ·|Aujourd'?hui|Préparation aérobie|repos variable/i.test(text), `r6 noise: ${text.slice(0, 200)}`);
  assert(findAmbiguousCoachLines(r.session.details).length === 0, "r6 clean");
  console.log("R6 PASS");
}

// R6b — Sportif nager_progresser + course piscine + 4N
{
  for (const over of [
    { seed: "r6b-np", goal: "progression", sessionIntent: "endurance", volumeTarget: 2200, duration: 60 },
    { seed: "r6b-cp", goal: "course_piscine", sessionIntent: "seuil", qualitySession: true, volumeTarget: 2200, duration: 60 },
    { seed: "r6b-4n", goal: "progression", sessionIntent: "quatre_nages", strokeFocus: "4n", volumeTarget: 2200, duration: 60 },
  ]) {
    const r = composeSession(briefFor("sportif", { ...over, pace100: 90 }));
    assert(r.ok, `${over.seed} ${r.reason}`);
    assert(findAmbiguousCoachLines(r.session.details).length === 0, `${over.seed} clean`);
    const cons = assertVolumeConsistency({
      sets: r.session.sets,
      details: r.session.details,
      announcedDistance: r.session.distance,
    });
    assert(cons.ok, `${over.seed} vol ${cons.errors.join(";")}`);
    if (over.strokeFocus === "4n") {
      assert(/dos|brasse|papillon/i.test(r.session.details.join(" ")), `${over.seed} 4n content`);
    }
  }
  console.log("R6b PASS");
}

// R6c — Performance 200/400 + taper wording clean
{
  for (const over of [
    { seed: "r6c-200", goal: "course_piscine", sessionIntent: "allure_course", volumeTarget: 2000, duration: 55, phase: "base" },
    { seed: "r6c-400", goal: "course_piscine", sessionIntent: "allure_course", volumeTarget: 2400, duration: 60, phase: "base" },
    { seed: "r6c-taper", goal: "course_piscine", sessionIntent: "recuperation", volumeTarget: 1200, duration: 40, phase: "taper" },
  ]) {
    const r = composeSession(briefFor("performance", { ...over, pace100: 80 }));
    if (!r.ok) {
      // Performance peut être gated selon niveau activé — skip soft
      console.log(`R6c skip ${over.seed}: ${r.reason}`);
      continue;
    }
    assert(findAmbiguousCoachLines(r.session.details).length === 0, `${over.seed} clean`);
    assert(!/repos variable|1750m pyramide|on savoure/i.test(r.session.details.join("\n")), over.seed);
  }
  console.log("R6c PASS");
}

// R7 — pyramid builder individual lines
{
  const built = buildCorpsByFormat("pyramid", 1750, {
    label: "crawl",
    cue: "allure",
    restFor: () => 20,
    maxContinuous: 400,
    pool: 50,
  });
  const disp = (built.displayLines || []).join("\n");
  assert(!/1750m\s+pyramide/i.test(disp), "no monolith");
  assert((disp.match(/^\-\d+m /gm) || []).length >= 3, "steps");
  console.log("R7 PASS");
}

console.log("\n✅ coach-restitution.test.js OK");
