/**
 * Pont MySWYM ↔ générateur Arthur + programmation COSD (Yann).
 * UI app inchangée — on ne fait que le contenu des séances / semaines.
 *
 * Voir docs/plan-methodology.md
 */
import { genererSemaineSessions } from "./swim-session-generator.js";

const DIPLOMA_GOALS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers"]);

const PHASE_MAP = {
  base: "foncier",
  development: "developpement",
  peak: "specifique",
  taper: "affutage",
  competition: "affutage",
  bilan: "affutage",
};

/**
 * Répartition polarisée COSD → rôles de séance dans la semaine.
 * Départ + technique + RAC restent aéro → haute intensité ≤ ~13 % du volume total.
 *
 * role: { objectif, zone } — objectif = pool CORPS_PHYSIO ou technique_*
 */
function cosdRolesForWeek(phaseName, weekIndexInPhase, nbSeances, profileObjectif) {
  const n = Math.max(1, nbSeances);
  const aero = { objectif: "endurance", zone: "Z1" };
  const aeroZ2 = { objectif: "endurance", zone: "Z2" };
  const seuil = { objectif: "endurance", zone: "Z3" };
  const vo2 = { objectif: "vitesse", zone: "Z3" };
  const vitesse = { objectif: "vitesse", zone: "Z4" };
  const mixte = { objectif: "mixte", zone: "Z2" };
  const ow = { objectif: "eau_libre", zone: "Z2" };

  const baseObj =
    profileObjectif === "eau_libre" ? ow
      : profileObjectif === "mixte" ? mixte
        : aeroZ2;

  // Reprise (100 % aéro) — premières semaines base
  if (phaseName === "base" && weekIndexInPhase < 2) {
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? aeroZ2 : aero));
  }

  // Base / volume : ~90 %+ aéro, une séance seuil ou Z2 soutenu
  if (phaseName === "base") {
    if (n === 1) return [aeroZ2];
    if (n === 2) return [aeroZ2, seuil];
    return [aero, aeroZ2, ...(n > 3 ? [mixte] : []), seuil].slice(0, n);
  }

  // Développement : aéro + 1 seuil (+ 1 VO2 si ≥ 4 séances)
  if (phaseName === "development") {
    if (n === 1) return [seuil];
    if (n === 2) return [aeroZ2, seuil];
    if (n === 3) return [aeroZ2, seuil, mixte];
    return [aero, aeroZ2, seuil, vo2].slice(0, n);
  }

  // Spécifique / peak : qualité, encore polarisé
  if (phaseName === "peak") {
    if (n === 1) return [vitesse];
    if (n === 2) return [seuil, vitesse];
    if (n === 3) return [aeroZ2, seuil, vitesse];
    return [aeroZ2, seuil, vo2, vitesse].slice(0, n);
  }

  // Affûtage / compétition : quasi 100 % aéro + petite touche
  if (phaseName === "taper" || phaseName === "competition" || phaseName === "bilan") {
    if (n === 1) return [aero];
    if (n === 2) return [aero, { objectif: "vitesse", zone: "Z4" }];
    return [aero, aeroZ2, vitesse].slice(0, n);
  }

  // Fallback : objectif profil
  return Array.from({ length: n }, () => baseObj);
}

function secToPaceStr(secs) {
  if (!secs) return "";
  return `${Math.floor(secs / 60)}:${Math.round(secs % 60).toString().padStart(2, "0")}`;
}

export function shouldUseCoachGenerator(goal) {
  return !DIPLOMA_GOALS.has(goal);
}

function mapNiveau(profile) {
  const { level, category } = profile;
  if (category === "triathlon" && (level === "performance" || level === "advanced")) return "triathlete";
  if (level === "découverte" || level === "beginner" || level === "régulier") return "debutant";
  if (level === "sportif" || level === "intermediate") return "intermediaire";
  if (level === "performance" || level === "advanced") return "confirme";
  return "intermediaire";
}

/** Objectif dominant du profil (oriente le pool de contenus, pas chaque séance) */
function mapObjectifProfil(profile) {
  const { goal, category } = profile;
  if (goal?.startsWith("open_water") || goal?.startsWith("eau_libre")) return "eau_libre";
  if (goal === "competition_maitre") return "mixte";
  if (category === "triathlon") return "mixte";
  if (goal === "perte_de_poids" || goal === "reprendre") return "mixte";
  return "endurance";
}

function mapRoleToType(role) {
  if (!role) return "ENDURANCE";
  if (role.zone === "Z4" || role.objectif === "vitesse") return "VITESSE";
  if (role.zone === "Z3") return "SEUIL";
  if (role.objectif?.startsWith("technique_")) return "TECHNIQUE";
  if (role.objectif === "mixte") return "SEUIL";
  return "ENDURANCE";
}

function weekTypeForIndex(phaseName, weekIndex) {
  if (weekIndex === 0) return "reference";
  if (phaseName === "taper" || phaseName === "competition" || phaseName === "bilan") return "allegee";
  // Transition COSD : décharge périodique (~toutes les 4 semaines)
  if (weekIndex > 0 && (weekIndex + 1) % 4 === 0) return "allegee";
  return "normale";
}

function sessionTextToDetails(text) {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  const details = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("·") || trimmed.startsWith("-")) details.push(trimmed);
    else if (raw.startsWith("  ") || raw.startsWith("\t")) details.push(`  ${trimmed}`);
    else details.push(trimmed.startsWith("-") ? trimmed : `-${trimmed}`);
  }
  return details;
}

function zoneLabel(details, role) {
  if (role?.zone) {
    if (role.zone === "Z1") return "Z1";
    if (role.zone === "Z2") return "Z1-Z2";
    if (role.zone === "Z3") return "Z1-Z3";
    if (role.zone === "Z4") return "Z1-Z4";
  }
  const joined = details.join(" ");
  if (/Z4/.test(joined)) return "Z1-Z4";
  if (/Z3/.test(joined)) return "Z1-Z3";
  if (/Z2/.test(joined)) return "Z1-Z2";
  return "Z1";
}

function toMySwymSession(res, role, weekNumber, sessionIndex, focusLabel) {
  const details = sessionTextToDetails(res.text);
  const total = res.total;
  return {
    type: mapRoleToType(role),
    title: `${focusLabel} S${weekNumber}.${sessionIndex + 1}`,
    intensity: zoneLabel(details, role),
    details,
    distance: `${total}m`,
    duration: Math.max(40, Math.min(90, Math.round(total / 35))),
    completed: false,
    skipped: null,
  };
}

/** Index de la semaine dans sa phase (0 = première semaine de ce phaseName) */
function weekIndexInPhase(phaseList, wi) {
  const name = phaseList[wi].phase;
  let idx = 0;
  for (let i = 0; i < wi; i++) {
    if (phaseList[i].phase === name) idx++;
  }
  return idx;
}

/**
 * Construit les semaines : format Arthur + rôles polarisés COSD.
 * BNSSA/BPJEPS : ne pas appeler.
 */
export function buildCoachPlanWeeks(profile, phaseList, isPremium, TIPS, freeFreqLimit = 2) {
  const freq = Math.min(
    isPremium ? (profile.sessionsPerWeek ?? 3) : Math.min(profile.sessionsPerWeek ?? freeFreqLimit, freeFreqLimit),
    5,
  );
  const niveauKey = mapNiveau(profile);
  const profilObj = mapObjectifProfil(profile);
  const ref100 = secToPaceStr(profile.pace100);
  const ref400 = secToPaceStr(profile.pace400);

  let prevWeekDistance = 0;

  return phaseList.map((phase, wi) => {
    const phaseKey = PHASE_MAP[phase.phase] || "foncier";
    const wiInPhase = weekIndexInPhase(phaseList, wi);
    const focusLabel = phase.focus || PHASE_MAP[phase.phase] || "Séance";
    const typeSemaine = weekTypeForIndex(phase.phase, wi);
    const roles = cosdRolesForWeek(phase.phase, wiInPhase, freq, profilObj);

    // Objectif passé au findBestBlockUnit : dominant du profil (volume)
    const weekData = genererSemaineSessions(
      niveauKey,
      profilObj,
      phaseKey,
      freq,
      wi + 1,
      ref100,
      ref400,
      typeSemaine,
      prevWeekDistance,
      roles,
    );
    prevWeekDistance = weekData.totalDistance;

    return {
      number: wi + 1,
      focus: focusLabel,
      tip: TIPS?.[phase.tipKey] ?? null,
      feedback: null,
      isBilan: phase.isBilan ?? false,
      sessions: weekData.sessions.map((s, si) =>
        toMySwymSession(s, roles[si], wi + 1, si, focusLabel),
      ),
    };
  });
}

export { mapNiveau, mapObjectifProfil, cosdRolesForWeek };
