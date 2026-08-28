/**
 * Mix 4 nages : présence des quatre nages + pondération selon préférence.
 * Usage : node src/lib/sports-engine/four-nages-mix.test.js
 */
import {
  buildSportProfile,
  buildSessionBrief,
  composeSession,
  allocateStrokeMeters,
  fourNagesMix,
  measureStrokeVolume,
  mixWithinTolerance,
  normalizeStrokeFocus,
  isFourNagesDeclared,
  FOUR_STROKES,
  IM_ORDER,
  buildFourNagesImSets,
} from "./index.js";
import { calcDetailsDistance } from "../swim-session-generator.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

function brief4n({
  level = "régulier",
  preferredStroke = null,
  pool = 25,
  volumeTarget = 1800,
  duration = 45,
  seed = "4n-mix",
  sessionIntent = "endurance",
  forcedImFormat = null,
} = {}) {
  const sport = buildSportProfile({
    level,
    goal: "progression",
    category: "progression",
    pool,
    sessionsPerWeek: 3,
    swimStyle: "4_nages",
    preferredStroke,
  });
  sport.strokeFocus = "4n";
  sport.preferredStroke = preferredStroke;
  sport.swimStyle = "4_nages";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: volumeTarget * 3,
        sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: level === "découverte" || level === "decouverte" ? "Z2" : "Z3",
      phaseKey: "foncier",
      why: "test-4n",
      _phaseName: "base",
    },
    role: {
      objectif: "endurance",
      zone: "Z2",
      family: "endurance",
      intent: sessionIntent,
      sessionIntent,
    },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: duration,
    seed,
  });
  brief.strokeFocus = "4n";
  brief.preferredStroke = preferredStroke;
  brief.swimStyle = "4_nages";
  brief.sessionIntent = sessionIntent;
  if (forcedImFormat) brief.forcedImFormat = forcedImFormat;
  return brief;
}

function briefCrawlOnly({ pool = 25, volumeTarget = 1800, seed = "crawl-only" } = {}) {
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    pool,
    sessionsPerWeek: 3,
    swimStyle: "crawl",
    preferredStroke: "crawl",
  });
  sport.strokeFocus = "crawl";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: volumeTarget * 3,
        sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z3",
      phaseKey: "foncier",
      why: "test-crawl",
      _phaseName: "base",
    },
    role: {
      objectif: "endurance",
      zone: "Z2",
      family: "endurance",
      intent: "endurance",
      sessionIntent: "endurance",
    },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: 45,
    seed,
  });
  brief.strokeFocus = "crawl";
  brief.preferredStroke = "crawl";
  brief.swimStyle = "crawl";
  return brief;
}

console.log("4N0 allocate + normalize");
{
  const a25 = allocateStrokeMeters(1800, fourNagesMix(null), 25);
  assert(FOUR_STROKES.every((s) => a25[s] >= 25 && a25[s] % 25 === 0), "25m quantum");
  assert(Object.values(a25).reduce((x, y) => x + y, 0) === 1800, "somme 1800 / 25");
  const a50 = allocateStrokeMeters(1800, fourNagesMix("dos"), 50);
  assert(FOUR_STROKES.every((s) => a50[s] >= 50 && a50[s] % 50 === 0), "50m quantum");
  assert(a50.dos > a50.brasse && a50.crawl >= a50.dos, "dos pondéré, crawl majoritaire");
  assert(normalizeStrokeFocus({ swimStyle: "4_nages", preferredStroke: "brasse" }) === "4n", "style 4n");
  assert(isFourNagesDeclared({ level: "performance", swimStyle: "crawl" }), "avancé implique 4 nages");
  assert(!isFourNagesDeclared({ level: "régulier", swimStyle: "4_nages" }), "débutant refuse 4 nages");
  assert(!isFourNagesDeclared({ level: "sportif", swimStyle: "crawl" }), "intermédiaire crawl = crawl");
}

console.log("4N1 sans préférence — les 4 nages");
{
  const r = composeSession(brief4n({ preferredStroke: null, seed: "4n1", pool: 25 }));
  assert(r.ok, `4N1 ${r.reason}`);
  const m = measureStrokeVolume(r.session);
  assert(m.allPresent, `4N1 manquantes ${JSON.stringify(m.present)} \n${r.session.details.join("\n")}`);
  const mix = fourNagesMix(null);
  assert(m.pct.crawl + 1e-9 >= m.pct.dos, "crawl ≥ dos");
  assert(mixWithinTolerance(m, mix, { pool: 25, maxPctPoints: 0.12 }), `4N1 mix crawl=${pct(m.pct.crawl)} ${JSON.stringify(m.pct)}`);
  console.log(`   crawl ${pct(m.pct.crawl)} dos ${pct(m.pct.dos)} brasse ${pct(m.pct.brasse)} pap ${pct(m.pct.papillon)}`);
}

console.log("4N2 nage favorite ignorée (mix défaut)");
{
  const r = composeSession(brief4n({ preferredStroke: "crawl", seed: "4n2", pool: 25 }));
  assert(r.ok, `4N2 ${r.reason}`);
  const m = measureStrokeVolume(r.session);
  assert(m.allPresent, "4N2 quatre nages");
  const mix = fourNagesMix(null);
  assert(mixWithinTolerance(m, mix, { pool: 25, maxPctPoints: 0.12 }), `4N2 mix crawl=${pct(m.pct.crawl)}`);
  console.log(`   crawl ${pct(m.pct.crawl)} (défaut, pref ignorée)`);
}

console.log("4N3 nage favorite dos/brasse/papillon ignorée");
{
  for (const pref of ["dos", "brasse", "papillon"]) {
    const r = composeSession(brief4n({ preferredStroke: pref, seed: `4n3-${pref}`, pool: 25 }));
    assert(r.ok, `4N3 ${pref} ${r.reason}`);
    const m = measureStrokeVolume(r.session);
    assert(m.allPresent, `4N3 ${pref} présence`);
    assert(mixWithinTolerance(m, fourNagesMix(null), { pool: 25, maxPctPoints: 0.12 }), `4N3 ${pref} mix défaut`);
    console.log(`   ${pref} ignoré: crawl ${pct(m.pct.crawl)}`);
  }
}

console.log("4N4 bassin 25 et 50");
{
  for (const pool of [25, 50]) {
    const r = composeSession(brief4n({ preferredStroke: "dos", pool, seed: `4n4-${pool}`, volumeTarget: pool === 50 ? 2000 : 1800 }));
    assert(r.ok, `4N4 p${pool} ${r.reason}`);
    const m = measureStrokeVolume(r.session);
    assert(m.allPresent, `4N4 p${pool} présence`);
    const tagged = (r.session.sets || []).filter((s) => s.stroke);
    for (const s of tagged) {
      assert(s.distancePerRep % pool === 0 || s.distancePerRep % 25 === 0, `quantum ${s.distancePerRep} pool ${pool}`);
      if (pool === 50 && s.stroke === "papillon") {
        assert(s.distancePerRep === 50, "papillon 50m en bassin 50");
      }
    }
    assert(mixWithinTolerance(m, fourNagesMix(null), { pool, maxPctPoints: 0.15 }), `4N4 p${pool} mix`);
  }
}

console.log("4N5 aucune séance 4 nages sans une des 4 nages");
{
  const cases = [];
  for (const pref of [null, "crawl", "dos", "brasse", "papillon"]) {
    for (const pool of [25, 50]) {
      cases.push({ pref, pool, seed: `4n5-${pref || "none"}-${pool}` });
    }
  }
  for (const c of cases) {
    const r = composeSession(
      brief4n({ preferredStroke: c.pref, pool: c.pool, seed: c.seed, volumeTarget: c.pool === 50 ? 2000 : 1600 }),
    );
    assert(r.ok, `4N5 ${c.seed} ${r.reason}`);
    const m = measureStrokeVolume(r.session);
    assert(m.allPresent, `4N5 ${c.seed} ${JSON.stringify(m.present)}\n${r.session.details.join("\n")}`);
    const txt = r.session.details.join("\n");
    assert(/\bpapillon\b/i.test(txt), `4N5 ${c.seed} papillon texte`);
    assert(!/^[^]*\b4 nages\b[^]*$/i.test(txt) || /\bpapillon\b/i.test(txt), "pas seulement un intitulé 4 nages");
  }
}

console.log("4N6 hors 4 nages : comportement crawl conservé");
{
  const r = composeSession(briefCrawlOnly({ seed: "4n6", pool: 25 }));
  assert(r.ok, `4N6 ${r.reason}`);
  const m = measureStrokeVolume(r.session);
  assert(m.present.crawl, "4N6 crawl");
  assert(!m.allPresent, "4N6 ne force pas les 4 nages");
  const txt = r.session.details.join("\n");
  assert(!/\b\d+\s*×\s*\d+m papillon\b/i.test(txt), "4N6 pas de papillon imposé");
}

console.log("4N7 IM 100 — 25 pap / dos / brasse / crawl");
{
  const r = composeSession(brief4n({ seed: "4n7", pool: 25, forcedImFormat: "im_100" }));
  assert(r.ok, `4N7 ${r.reason}`);
  const txt = r.session.details.join("\n");
  assert(/100\s*m 4 nages enchaîné/i.test(txt), `4N7 ligne 100 IM\n${txt}`);
  assert(/25 papillon \/ 25 dos \/ 25 brasse \/ 25 crawl/i.test(txt), "4N7 ordre olympique");
  const imSet = (r.session.sets || []).find((s) => s.stroke === "im");
  assert(imSet, "4N7 set IM");
  assert(JSON.stringify(imSet.imSegments.map((x) => x.stroke)) === JSON.stringify([...IM_ORDER]), "ordre pap→dos→brasse→crawl");
  const m = measureStrokeVolume({ sets: [imSet] });
  assert(m.allPresent, "4N7 IM split 4 nages");
  FOUR_STROKES.forEach((s) => {
    assert(Math.abs(m.pct[s] - 0.25) < 0.01, `4N7 ${s} 25%`);
  });
  assert(calcDetailsDistance(r.session.details) > 0, "4N7 details parse");
  const imLine = r.session.details.find((l) => /4 nages enchaîné/i.test(l));
  const nx = imLine.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
  if (nx) {
    assert(calcDetailsDistance([imLine]) === Number(nx[1]) * Number(nx[2]), `4N7 pas de double compte ${imLine}`);
  }
}

console.log("4N8 IM 200 / 400 + fun");
{
  const r200 = composeSession(brief4n({ seed: "4n8-200", pool: 50, volumeTarget: 2000, forcedImFormat: "im_200" }));
  assert(r200.ok, `4N8 200 ${r200.reason}`);
  assert(/200\s*m 4 nages enchaîné/i.test(r200.session.details.join("\n")), "4N8 200 IM");
  assert(/50 papillon \/ 50 dos \/ 50 brasse \/ 50 crawl/i.test(r200.session.details.join("\n")), "4N8 50 par nage");

  const r400 = composeSession(
    brief4n({ level: "sportif", seed: "4n8-400", pool: 50, volumeTarget: 2400, duration: 60, forcedImFormat: "im_400" }),
  );
  assert(r400.ok, `4N8 400 ${r400.reason}\n${(r400.session?.details || []).join("\n")}`);
  assert(/400\s*m 4 nages enchaîné/i.test(r400.session.details.join("\n")), "4N8 400 IM");
  assert(/100 papillon \/ 100 dos \/ 100 brasse \/ 100 crawl/i.test(r400.session.details.join("\n")), "4N8 100 par nage");

  const rLegs = composeSession(
    brief4n({ level: "sportif", seed: "4n8-legs", pool: 25, volumeTarget: 2400, duration: 60, forcedImFormat: "im_400_legs" }),
  );
  assert(rLegs.ok, `4N8 legs ${rLegs.reason}`);
  assert(/25 nage complète \/ 25 jambes/i.test(rLegs.session.details.join("\n")), "4N8 25/25 jambes");

  const rDrill = composeSession(
    brief4n({ level: "sportif", seed: "4n8-drill", pool: 25, volumeTarget: 2400, duration: 60, forcedImFormat: "im_400_drill" }),
  );
  assert(rDrill.ok, `4N8 drill ${rDrill.reason}`);
  assert(/25 nage complète \/ 25 technique de la nage/i.test(rDrill.session.details.join("\n")), "4N8 technique de la nage");
}

console.log("4N9 8×50 — 12,5 m par nage");
{
  const r = composeSession(brief4n({ seed: "4n9", pool: 25, forcedImFormat: "im_50" }));
  assert(r.ok, `4N9 ${r.reason}`);
  const txt = r.session.details.join("\n");
  assert(/12,5 m papillon \/ 12,5 m dos \/ 12,5 m brasse \/ 12,5 m crawl/i.test(txt), `4N9 12,5\n${txt}`);
  assert(/changement au milieu du bassin/i.test(txt), "4N9 milieu");
  const imSet = (r.session.sets || []).find((s) => s.imFormat === "im_50");
  assert(imSet && imSet.reps >= 6 && imSet.distancePerRep === 50, "4N9 6–8×50");
}

console.log("4N10 builder IM + Découverte sans IM");
{
  const built = buildFourNagesImSets({
    brief: { level: "regulier", strokeFocus: "4n", forcedImFormat: "im_100" },
    budget: 400,
    pool: 25,
    maxSetContinuous: 200,
    maxStrokeContinuous: 100,
    restFor: () => 20,
  });
  assert(built.used >= 100 && built.formatId === "im_100", "builder 100");
  const d = buildFourNagesImSets({
    brief: { level: "decouverte", strokeFocus: "4n" },
    budget: 400,
    pool: 25,
    maxSetContinuous: 50,
    maxStrokeContinuous: 50,
  });
  assert(d.used === 0, "Découverte pas d'IM enchaîné");
  const crawl = composeSession(briefCrawlOnly({ seed: "4n10-c" }));
  assert(!/4 nages enchaîné|12,5 m papillon/i.test(crawl.session.details.join("\n")), "crawl sans IM");
}

console.log("✅ four-nages-mix.test.js OK");
