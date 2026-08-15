/**
 * Libellés séance : pas de jargon d'intensité, pas de blocs technique vagues.
 * Usage : node src/lib/sports-engine/session-labels.test.js
 */
import {
  sanitizeSessionDetailLine,
  prettifySessionDetailLine,
  sanitizeSessionDetails,
  isVagueVolumeThemeTitle,
  hasEducatifOrConcreteSwim,
  containsForbiddenIntensityCode,
  assertDisplayLabelsClean,
  fallbackNamedSwimLine,
  humanizeArthurDisplayTerms,
} from "./session-labels.js";
import { toCoachDetailLines, composeSession, buildSportProfile, buildSessionBrief } from "./index.js";
import { genererSeanceDeSemaine } from "../swim-session-generator.js";
import { buildTechniqueFromBank } from "./technique-from-bank.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function noForbiddenIntensity(text, ctx) {
  assert(!containsForbiddenIntensityCode(text), `${ctx} intensité interdite: ${text}`);
  assert(!/@2(?!\d|:)/.test(text), `${ctx} @2: ${text}`);
  assert(!/@3(?!\d|:)/.test(text), `${ctx} @3: ${text}`);
  assert(!/facile\s@/i.test(text), `${ctx} facile @: ${text}`);
}

console.log("L1 strip (facile @2) + matos");
{
  const out = prettifySessionDetailLine("150m crawl palmes + tuba (facile @2)");
  noForbiddenIntensity(out, "L1");
  assert(/150\s*m/i.test(out), "espace avant m");
  assert(/crawl/i.test(out), "crawl");
  assert(/palmes/i.test(out) && /tuba/i.test(out), "matos");
  assert(/avec/i.test(out), "avec palmes");
  assert(!/\+/.test(out), "pas de +");
}

console.log("L2 thèmes génériques détectés");
{
  assert(isVagueVolumeThemeTitle("600m respiration"), "600m respiration");
  assert(isVagueVolumeThemeTitle("6x50 technique"), "6x50 technique");
  assert(isVagueVolumeThemeTitle("-300m roulis :"), "300m roulis");
  assert(isVagueVolumeThemeTitle("400m appuis"), "400m appuis");
  assert(!isVagueVolumeThemeTitle("6×50 m : 25 m crawl rattrapé + 25 m crawl souple"), "compound ok");
  assert(!isVagueVolumeThemeTitle("4×50 m crawl facile, respiration sur le côté habituel"), "fallback ok");
}

console.log("L3 rewrite vague → éducatif ou nage nommée");
{
  const respiration = sanitizeSessionDetailLine("-600m respiration");
  noForbiddenIntensity(respiration, "L3a");
  assert(hasEducatifOrConcreteSwim(respiration), `éducatif ou nage: ${respiration}`);
  assert(!isVagueVolumeThemeTitle(respiration), `plus vague: ${respiration}`);

  const roulis = prettifySessionDetailLine("6x50 roulis");
  assert(/battement|côté|souple|crawl/i.test(roulis), `roulis explicite: ${roulis}`);
  assert(hasEducatifOrConcreteSwim(roulis), "roulis named");

  const fb = fallbackNamedSwimLine("6x50 technique");
  assert(/crawl facile/i.test(fb) && /respiration sur le côté habituel/i.test(fb), `fallback: ${fb}`);
}

console.log("L4 header vague + enfants → on garde l'éducatif");
{
  const cleaned = toCoachDetailLines([
    "-600m respiration :",
    "  · 6x50m : 25m crawl rattrapé + 25m crawl souple R15''",
    "  · 4x50m crawl facile",
  ]);
  const text = cleaned.join("\n");
  noForbiddenIntensity(text, "L4");
  assert(!isVagueVolumeThemeTitle(cleaned[0]), `header: ${cleaned[0]}`);
  assert(cleaned.some((l) => hasEducatifOrConcreteSwim(l)), "consigne concrète");
  assert(/rattrap|expir|battement|crawl facile/i.test(text), `éducatif dans ${text}`);
}

console.log("L5 allure structurée conservée");
{
  const keep = "12×50 m — départ toutes les 1 min, confortable entre 44 et 47 s";
  const out = prettifySessionDetailLine(keep);
  assert(/12\s*×\s*50\s*m/.test(out), `reps ${out}`);
  assert(/départ toutes les 1 min/i.test(out), `départ ${out}`);
  assert(/confortable entre 44 et 47 s/i.test(out), `allure ${out}`);
  noForbiddenIntensity(out, "L5");
}

console.log("L6 (facile @pace) → mots, Premium (Z2 @mm:ss) conservé");
{
  const beginner = prettifySessionDetailLine("-12x50 — départ toutes les 1 min (facile @00:44-00:47)");
  noForbiddenIntensity(beginner, "L6a");
  assert(/entre 44 et 47 s/i.test(beginner), `pace words: ${beginner}`);

  const premium = prettifySessionDetailLine("-12 × 50 m crawl — (Z2 @0:44-0:47) — repos 20s");
  assert(/@0:44-0:47/.test(premium), `premium pace kept: ${premium}`);
  noForbiddenIntensity(premium, "L6b");
}

function briefFor(level, over = {}) {
  const sport = buildSportProfile({
    level,
    goal: over.goal || "progression",
    sessionsPerWeek: 3,
    pool: over.pool || 50,
    equipment: over.equipment || ["palmes", "tuba"],
    pace100: over.pace100,
    strokeFocus: over.strokeFocus || "crawl",
  });
  const volumeTarget = over.volumeTarget || (level === "decouverte" ? 700 : level === "regulier" ? 1800 : 2400);
  return buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: volumeTarget * 3,
        sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: level === "decouverte" ? "Z2" : "Z4",
      phaseKey: "base",
      why: "label-test",
      _phaseName: "base",
    },
    role: {
      objectif: over.sessionIntent || "endurance",
      zone: over.zone || "Z2",
      family: over.family || "endurance",
      intent: over.sessionIntent || "endurance",
      sessionIntent: over.sessionIntent || "endurance",
    },
    sessionIndex: over.sessionIndex || 1,
    weekIndex: 0,
    seed: over.seed || `labels-${level}`,
    durationTarget: over.duration || 45,
  });
}

console.log("L7 composeur : titres propres");
{
  for (const level of ["decouverte", "regulier", "sportif"]) {
    const r = composeSession(briefFor(level, { seed: `lab-${level}` }));
    assert(r.ok, `${level} compose ${r.reason}`);
    const check = assertDisplayLabelsClean(r.session.details);
    assert(check.ok, `${level} ${check.bad.join(" | ")}`);
    const text = (r.session.details || []).join("\n");
    noForbiddenIntensity(text, `L7 ${level}`);
    const techLines = (r.session.details || []).filter((l) =>
      /technique|respir|roulis|appuis|rattrap|flèche|chien|battement|expir|côté|3T|5T|bilatéral|godille|un bras/i.test(l),
    );
    assert(techLines.length > 0, `${level} a un bloc technique`);
    for (const line of techLines) {
      assert(!isVagueVolumeThemeTitle(line), `${level} vague: ${line}`);
      assert(hasEducatifOrConcreteSwim(line), `${level} sans éducatif: ${line}`);
    }
  }
}

console.log("L8 générateur coach : pas de 600m respiration");
{
  const res = genererSeanceDeSemaine("debutant", "endurance", "foncier", 1, 2, "technique_fleche", null, null, 50, "Z1", "normale", 0.55, true, 1);
  const lines = String(res.text || "").split("\n");
  const check = assertDisplayLabelsClean(lines);
  assert(check.ok, `gen ${check.bad.join(" | ")}`);
  noForbiddenIntensity(res.text, "L8");
  assert(!/^\s*-?\s*\d+\s*m\s+respiration\s*:?\s*$/im.test(res.text), `pas de titre respiration: ${res.text}`);
  assert(/rattrap|3T|5T|expir|flèche|chien|battement|crawl facile|côté/i.test(res.text), `éducatif nommé:\n${res.text}`);
}

console.log("L9 banque technique : apply concret");
{
  const built = buildTechniqueFromBank({
    techEx: {
      id: "technique_catchup_0",
      focusKey: "technique_catchup",
      name: "Rattrapé",
      instructions: ["· 8x25m rattrapé (bras dans l'axe des épaules) R15''"],
    },
    targetVol: 400,
    pool: 50,
    swimLabel: "crawl",
    applyCue: "nage appliquée",
  });
  const text = built.lines.join("\n");
  assert(built.usedBank, "bank");
  noForbiddenIntensity(text, "L9");
  assert(!/nage appliquée/i.test(text), `pas de nage appliquée vague:\n${text}`);
  assert(built.lines.every((l) => hasEducatifOrConcreteSwim(l)), `chaque ligne concrète:\n${text}`);
}

console.log("L10 sanitizeSessionDetails idempotent + @2 RPE");
{
  const once = sanitizeSessionDetails(["-150m crawl palmes + tuba (facile @2)", "-6x50 technique"]);
  const twice = sanitizeSessionDetails(once);
  assert(once.join("|") === twice.join("|"), "idempotent");
  for (const line of once) noForbiddenIntensity(line, "L10");
}

console.log("L11 D9 — jamais souple ni Z1 à l'affichage");
{
  const samples = [
    "-400m crawl souple (Z1)",
    "-200m au choix — Z1",
    "-200m souple — Z1",
    "-6 × 25 m : flèche + crawl souple — échauffement",
    "première moitié Z1/Z2 souple",
  ];
  for (const raw of samples) {
    const out = sanitizeSessionDetailLine(raw);
    assert(!/\bsouple\b/i.test(out), `souple restant: ${raw} → ${out}`);
    assert(!/\bZ1\b/.test(out), `Z1 restant: ${raw} → ${out}`);
  }
  const hum = humanizeArthurDisplayTerms("-200m dos très facile — Z1");
  assert(/retour au calme|facile/i.test(hum), `fin Z1: ${hum}`);
  assert(!/\bZ1\b/.test(hum), hum);
  const clean = assertDisplayLabelsClean(samples.map((s) => sanitizeSessionDetailLine(s)));
  assert(clean.ok, clean.bad.join("; "));
}

console.log("✅ session-labels tests passed");
