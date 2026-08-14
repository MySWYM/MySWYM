/**
 * Cohérence mathématique des séances bassin.
 * Usage : node src/lib/sports-engine/session-coherence.test.js
 */
import {
  validateSessionCoherence,
  enforceSessionCoherence,
  sumDetailsMeters,
  lineSwimMeters,
  parseNxM,
  snapTotalTo00or50,
  fixLengthPatternLine,
  fixInternalDistanceRefs,
  replaceTimelessWarmCool,
  isTimelessWarmCool,
} from "./session-coherence.js";
import { finalizeCoachSession, composeSession, buildSportProfile, buildSessionBrief } from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function briefFor(level, over = {}) {
  const sport = buildSportProfile({
    level,
    goal: over.goal || "progression",
    sessionsPerWeek: 3,
    pool: over.pool || 25,
    equipment: over.equipment || [],
    pace100: over.pace100,
    strokeFocus: over.strokeFocus || "crawl",
    papillonMastered: !!over.papillonMastered,
  });
  const volumeTarget = over.volumeTarget || (level === "decouverte" ? 700 : level === "regulier" ? 1600 : 2200);
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
    why: "coherence-test",
  };
  return buildSessionBrief({
    sport,
    weekCtx: { ...weekCtx, _phaseName: over.phase || "base" },
    sessionIndex: 0,
    role: { family: "endurance", zone: "Z2", isKeySession: false },
    volumeTarget,
    durationTarget: over.duration || 45,
    seed: over.seed || `coh-${level}`,
  });
}

console.log("session-coherence tests…");

// --- Unit: pattern 4×150 vs 5×25 ---
{
  const bad = "4×150 m crawl : 3T / 5T / 7T / 5T / 3T par 25m";
  const v = validateSessionCoherence({
    details: [
      "300 m crawl/dos souple — Échauffement",
      bad,
      "150 m dos très souple — Retour au calme",
    ],
    distance: "1050m",
  });
  assert(!v.ok, "4×150 with 5×25 pattern must fail validation");
  assert(
    v.errors.some((e) => /séquence|125m|150m/i.test(e)),
    `expected pattern error, got: ${v.errors.join("; ")}`,
  );

  const fixedLine = fixLengthPatternLine(bad);
  const nxm = parseNxM(fixedLine);
  assert(nxm, "fixed line still has NxM");
  // Either rep dist adjusted to 125, or pattern extended to 6 tokens
  const tokens = (fixedLine.match(/\d+\s*T|crawl\s+libre/gi) || []).length;
  const unit = 25;
  const covered = tokens * unit;
  assert(
    nxm.dist === covered || /crawl libre/i.test(fixedLine) || nxm.dist === 125,
    `pattern must match rep after fix: ${fixedLine}`,
  );

  const enforced = enforceSessionCoherence({
    details: [
      "300 m crawl/dos souple — Échauffement",
      bad,
      "150 m dos très souple — Retour au calme",
    ],
    distance: "1050m",
  });
  assert(enforced.ok, `enforce must repair pattern: ${enforced.errors.join("; ")}`);
}

// --- Unit: 4×100 talking about 200 m ---
{
  const bad = "4×100 m crawl — Z2, même allure du premier au dernier 200 m";
  const v = validateSessionCoherence({
    details: [
      "200 m crawl souple — Échauffement",
      bad,
      "100 m dos — Retour au calme",
    ],
    distance: "700m",
  });
  assert(!v.ok, "internal ref 200m with 4×100 must fail");
  assert(
    v.errors.some((e) => /référence 200m|100m/i.test(e)),
    `expected ref error, got: ${v.errors.join("; ")}`,
  );

  const fixed = fixInternalDistanceRefs(bad);
  assert(/dernier 100\s*m/i.test(fixed), `ref must rewrite to 100m: ${fixed}`);
  assert(!/200\s*m/i.test(fixed), `200m must be gone: ${fixed}`);

  const enforced = enforceSessionCoherence({
    details: [
      "200 m crawl souple — Échauffement",
      bad,
      "100 m dos — Retour au calme",
    ],
    distance: "700m",
  });
  assert(enforced.ok, `enforce must rewrite refs: ${enforced.errors.join("; ")}`);
  assert(
    enforced.session.details.some((d) => /dernier 100\s*m/i.test(d)),
    "session details must contain dernier 100m",
  );
}

// --- Warm / cool must have meters ---
{
  assert(isTimelessWarmCool("Échauffement — 8 min"), "8 min warm is timeless");
  assert(isTimelessWarmCool("Retour au calme — 4 min"), "4 min cool is timeless");
  assert(!isTimelessWarmCool("300 m crawl/dos souple — Échauffement"), "meter warm ok");

  const v = validateSessionCoherence({
    details: ["Échauffement — 8 min", "4×100 m crawl — Z2", "Retour au calme — 4 min"],
    distance: "400m",
  });
  assert(!v.ok, "timeless warm/cool must fail");
  assert(v.errors.some((e) => /sans distance|minutes/i.test(e)), "must flag minutes blocks");

  const warm = replaceTimelessWarmCool("Échauffement — 8 min", { role: "warm" });
  const cool = replaceTimelessWarmCool("Retour au calme — 4 min", { role: "cool" });
  assert(/\d+\s*m/.test(warm) && /Échauffement/i.test(warm), `warm meters: ${warm}`);
  assert(/\d+\s*m/.test(cool) && /Retour/i.test(cool), `cool meters: ${cool}`);

  const enforced = enforceSessionCoherence({
    details: ["Échauffement — 8 min", "4×100 m crawl — Z2", "Retour au calme — 4 min"],
    distance: "400m",
  });
  assert(enforced.ok, `enforce warm/cool: ${enforced.errors.join("; ")}`);
  assert(
    enforced.session.details.every((d) => !isTimelessWarmCool(d)),
    "no timeless blocks after enforce",
  );
  assert(
    enforced.session.details.every((d) => lineSwimMeters(d) > 0 || !/échauff|retour/i.test(d)),
    "warm/cool lines have meters",
  );
}

// --- Total = sum, never ends 25/75 ---
{
  assert(snapTotalTo00or50(1025) === 1000 || snapTotalTo00or50(1025) === 1050, "snap 1025");
  assert(snapTotalTo00or50(1075) === 1050 || snapTotalTo00or50(1075) === 1100, "snap 1075");
  assert(snapTotalTo00or50(1100) === 1100, "keep 1100");
  assert(snapTotalTo00or50(1050) === 1050, "keep 1050");

  const badTotal = {
    details: [
      "300 m crawl souple — Échauffement",
      "4×100 m crawl — Z2",
      "125 m dos — Retour au calme",
    ],
    distance: "825m",
  };
  const sum = sumDetailsMeters(badTotal.details);
  assert(sum === 825, `sum should be 825 got ${sum}`);
  assert(sum % 100 === 25, "fixture ends with 25");

  const v = validateSessionCoherence(badTotal);
  assert(!v.ok, "total ending 25 must fail");
  assert(v.errors.some((e) => /finit par 25/i.test(e)), "must flag ending 25");

  const enforced = enforceSessionCoherence(badTotal);
  assert(enforced.ok, `enforce total: ${enforced.errors.join("; ")}`);
  const finalSum = sumDetailsMeters(enforced.session.details);
  const announced = parseInt(String(enforced.session.distance).replace(/\D/g, ""), 10);
  assert(finalSum === announced, `sum ${finalSum} === announced ${announced}`);
  assert(finalSum % 100 === 0 || finalSum % 100 === 50, `total ends 00/50 got ${finalSum}`);
}

// --- finalizeCoachSession wires coherence ---
{
  const out = finalizeCoachSession({
    details: [
      "Échauffement — 8 min",
      "4×150 m : 3T/5T/7T/5T/3T par 25m",
      "4×100 m crawl — même allure du premier au dernier 200 m",
      "Retour au calme — 4 min",
    ],
    distance: "1000m",
  });
  const check = validateSessionCoherence(out);
  assert(check.ok, `finalize must yield coherent session: ${check.errors.join("; ")}`);
}

// --- Three composed examples with block-by-block volume ---
const examples = [];
for (const [level, seed, pool] of [
  ["decouverte", "coh-ex-dec", 25],
  ["regulier", "coh-ex-reg", 25],
  ["sportif", "coh-ex-spo", 50],
]) {
  const r = composeSession(briefFor(level, { seed, pool, volumeTarget: level === "decouverte" ? 800 : level === "regulier" ? 1600 : 2400 }));
  assert(r.ok, `compose ${level}: ${r.reason || ""}`);
  const s = r.session;
  const check = validateSessionCoherence(s, { pool });
  assert(check.ok, `composed ${level} coherent: ${check.errors.join("; ")}`);
  const blocks = (s.details || []).map((line) => ({
    line,
    meters: lineSwimMeters(line),
  }));
  const sum = blocks.reduce((a, b) => a + b.meters, 0);
  const announced = parseInt(String(s.distance).replace(/\D/g, ""), 10);
  assert(sum === announced, `${level}: sum ${sum} !== ${announced}`);
  assert(sum % 100 === 0 || sum % 100 === 50, `${level}: bad ending ${sum}`);
  examples.push({ level, pool, announced, blocks, title: s.title });
}

console.log("\n=== 3 séances validées (volume bloc par bloc) ===\n");
for (const ex of examples) {
  console.log(`# ${ex.level} · ${ex.title} · bassin ${ex.pool}m · total ${ex.announced}m`);
  let running = 0;
  for (const b of ex.blocks) {
    if (!(b.meters > 0)) continue;
    running += b.meters;
    console.log(`  + ${String(b.meters).padStart(4)} m  ${b.line}`);
  }
  console.log(`  = ${running} m  (annoncé ${ex.announced}m)\n`);
}

console.log("OK session-coherence");
