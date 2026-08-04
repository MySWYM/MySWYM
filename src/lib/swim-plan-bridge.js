/**
 * Pont MySWYM ↔ générateur Arthur + programmation COSD (Yann).
 * UI app inchangée — on ne fait que le contenu des séances / semaines.
 *
 * Voir docs/plan-methodology.md
 */
import {
  genererSemaineSessions,
  volumeMultFromProfileLevel,
  buildConfirmeArchetypeSession,
  usesConfirmeArchetypeBank,
} from "./swim-session-generator.js";
import { tasteToGeneratorHints, biasRolesForTaste } from "./user-taste.js";
import { pickArthurBankSession } from "./session-templates-store.js";

const DIPLOMA_GOALS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"]);

const PHASE_MAP = {
  base: "foncier",
  development: "developpement",
  peak: "specifique",
  taper: "affutage",
  competition: "affutage",
  bilan: "affutage",
  test: "developpement",
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
  const test = { objectif: "test", zone: "Z3" };

  const baseObj =
    profileObjectif === "eau_libre" ? ow
      : profileObjectif === "mixte" ? mixte
        : aeroZ2;

  // Semaine test : 1 chrono + le reste aéro (fraîcheur pour des temps propres)
  if (phaseName === "test") {
    if (n === 1) return [test];
    if (n === 2) return [aero, test];
    return [aero, test, ...(n > 3 ? [aeroZ2] : []), aero].slice(0, n);
  }

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
  if (role.objectif === "test") return "SEUIL";
  if (role.zone === "Z4" || role.objectif === "vitesse") return "VITESSE";
  if (role.zone === "Z3") return "SEUIL";
  if (role.objectif?.startsWith("technique_")) return "TECHNIQUE";
  if (role.objectif === "mixte") return "SEUIL";
  return "ENDURANCE";
}

function weekTypeForIndex(phaseName, weekIndex) {
  if (weekIndex === 0) return "reference";
  if (phaseName === "test") return "test";
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

function zoneLabel(details, role, beginnerFriendly = false) {
  let zone;
  if (role?.zone) {
    if (role.zone === "Z1") zone = "Z1";
    else if (role.zone === "Z2") zone = "Z1-Z2";
    else if (role.zone === "Z3") zone = "Z1-Z3";
    else if (role.zone === "Z4") zone = "Z1-Z4";
    else zone = role.zone;
  } else {
    const joined = details.join(" ");
    if (/Z4|rapide/i.test(joined)) zone = "Z1-Z4";
    else if (/Z3|soutenu|chrono|CSS/i.test(joined)) zone = "Z1-Z3";
    else if (/Z2|confortable/i.test(joined)) zone = "Z1-Z2";
    else zone = "Z1";
  }
  if (!beginnerFriendly) return zone;
  const cues = {
    Z1: "Facile — tu peux parler",
    "Z1-Z2": "Facile → confortable",
    "Z1-Z3": "Confortable → soutenu",
    "Z1-Z4": "Jusqu'à rapide",
  };
  return cues[zone] || zone;
}

/** Fréquence semaine compétition : 1 séance si ≤3×/sem, 2 si >3. */
export function competitionSessionCount(freq) {
  return (freq || 3) <= 3 ? 1 : 2;
}

const COMPETITION_TIP =
  "Dernière semaine avant l'événement : séances courtes, volume bas, juste quelques rappels de vitesse (12,5 m max). Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.";

/**
 * Séances ultra-légères J-7 → event : fraîcheur + touches vitesse ≤12,5 m.
 * Pas de volume, pas de seuil — activation neuromusculaire seulement.
 */
export function buildCompetitionSessions(pool, nbSeances, weekNumber, focusLabel, beginnerFriendly = false) {
  const n = Math.max(1, Math.min(2, nbSeances));
  const easy = beginnerFriendly ? "(facile)" : "(Z1)";
  const fast = beginnerFriendly ? "(rapide, frais)" : "(Z4 — touché court)";
  const repos = beginnerFriendly ? "repos 30s" : "R30''";

  const variants = [
    {
      details: [
        `-200m crawl souple ${easy}`,
        `-8×12,5m accélération ${fast} — ${repos} entre chaque`,
        `  · Départ poussée mur, 2–3 coups forts, laisse glisser — qualité absolue`,
        `-100m crawl très souple ${easy}`,
        `→ Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.`,
      ],
      distance: 400,
      duration: 25,
    },
    {
      details: [
        `-150m crawl / dos souple ${easy}`,
        `-6×12,5m accélération ${fast} — ${repos}`,
        `  · Juste le feeling de vitesse — tu t'arrêtes avant de fatiguer`,
        `-100m nage libre détendue ${easy}`,
        `→ Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.`,
      ],
      distance: 325,
      duration: 20,
    },
  ];

  return Array.from({ length: n }, (_, si) => {
    const v = variants[si % variants.length];
    // Arrondir distance affichée au multiple de 25 (12,5 × 2 = 25)
    const dist = Math.round(v.distance / 25) * 25;
    return {
      type: si === 0 && n > 1 ? "VITESSE" : "ENDURANCE",
      title: `${focusLabel} S${weekNumber}.${si + 1}`,
      intensity: beginnerFriendly ? "Facile + touches rapides" : "Z1 + touches Z4 (12,5 m)",
      details: v.details,
      distance: `${dist}m`,
      duration: v.duration,
      completed: false,
      skipped: null,
    };
  });
}

function toMySwymSession(res, role, weekNumber, sessionIndex, focusLabel, beginnerFriendly = false) {
  const details = sessionTextToDetails(res.text);
  const total = res.total;
  const isTest = role?.objectif === "test";
  return {
    type: mapRoleToType(role),
    title: isTest
      ? `Test progression S${weekNumber}.${sessionIndex + 1}`
      : `${focusLabel} S${weekNumber}.${sessionIndex + 1}`,
    intensity: zoneLabel(details, role, beginnerFriendly),
    details,
    distance: `${total}m`,
    duration: Math.max(40, Math.min(90, Math.round(total / 35))),
    completed: false,
    skipped: null,
    isTest: isTest || undefined,
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
  // Allures @mm:ss = Premium only — référence unique T100 (jamais T400)
  const ref100 = isPremium ? secToPaceStr(profile.pace100) : "";
  const ref400 = ""; // legacy arg générateur — ignoré
  // Wording simplifié : découverte OU clarté demandée via retours (« incompréhensible »)
  const tasteHints = tasteToGeneratorHints(profile.taste);
  const simplifyWording =
    profile.level === "découverte" || profile.level === "beginner" || tasteHints.forceSimplify;
  const beginnerFriendly = simplifyWording;
  // volumeAdj = feedback hebdo cumulé (easy/hard), plafonné dans adjustPlan — [0.70, 1.30]
  // + léger volumeMul goûts (±8 %) si retours tags trop long / trop court
  const feedbackAdj = Math.min(1.3, Math.max(0.7, Number(profile.volumeAdj) || 1));
  const volMult =
    volumeMultFromProfileLevel(profile.level, profile.category) * feedbackAdj * tasteHints.volumeMul;
  const pool = profile.pool === 25 ? 25 : 50;

  let prevWeekDistance = 0;
  // Banque confirmé (ex-OW_BASE_SESSIONS) : performance/advanced + eau libre / triathlon / progression
  const useConfirmeBank = usesConfirmeArchetypeBank(niveauKey, profilObj);
  const bankOpts = { isPremium: !!isPremium, pace100: profile.pace100 ?? null };
  // Level UI cohérent avec owVol (performance/advanced → volume plein)
  const bankLevel =
    profile.level === "advanced" || profile.level === "performance"
      ? profile.level
      : "performance";

  return phaseList.map((phase, wi) => {
    const phaseKey = PHASE_MAP[phase.phase] || "foncier";
    const wiInPhase = weekIndexInPhase(phaseList, wi);
    const focusLabel = phase.focus || PHASE_MAP[phase.phase] || "Séance";
    const typeSemaine = weekTypeForIndex(phase.phase, wi);
    const isCompetition = phase.phase === "competition";
    const weekFreq = isCompetition ? competitionSessionCount(freq) : freq;
    const roles = biasRolesForTaste(
      cosdRolesForWeek(phase.phase, wiInPhase, weekFreq, profilObj),
      tasteHints,
    );

    // Semaine compétition : séances dédiées (1 ou 2), ultra-courtes — pas la banque / générateur normal
    if (isCompetition) {
      const sessions = buildCompetitionSessions(pool, weekFreq, wi + 1, focusLabel, beginnerFriendly);
      prevWeekDistance = sessions.reduce((a, s) => a + (parseInt(s.distance, 10) || 0), 0);
      return {
        number: wi + 1,
        focus: focusLabel,
        tip: COMPETITION_TIP,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions,
      };
    }

    if (useConfirmeBank) {
      // Banque Supabase Arthur (gold coaché) si chargée — sinon OW_BASE_SESSIONS JS
      const sessions = Array.from({ length: weekFreq }, (_, si) => {
        const archeIdx = wi * 3 + si;
        const fromDb = pickArthurBankSession(profilObj, archeIdx);
        if (fromDb) return fromDb;
        return buildConfirmeArchetypeSession(archeIdx, pool, bankLevel, {
          ...bankOpts,
          tasteHints,
        });
      });
      prevWeekDistance = sessions.reduce((a, s) => a + (parseInt(s.distance, 10) || 0), 0);
      return {
        number: wi + 1,
        focus: focusLabel,
        tip: TIPS?.[phase.tipKey] ?? null,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions,
      };
    }

    const weekData = genererSemaineSessions(
      niveauKey,
      profilObj,
      phaseKey,
      weekFreq,
      wi + 1,
      ref100,
      ref400,
      typeSemaine,
      prevWeekDistance,
      roles,
      { volMult, simplifyWording, pool, tasteHints },
    );
    prevWeekDistance = weekData.totalDistance;

    return {
      number: wi + 1,
      focus: focusLabel,
      tip: TIPS?.[phase.tipKey] ?? null,
      feedback: null,
      isBilan: phase.isBilan ?? false,
      isTest: phase.isTest ?? false,
      sessions: weekData.sessions.map((s, si) =>
        toMySwymSession(s, roles[si], wi + 1, si, focusLabel, beginnerFriendly),
      ),
    };
  });
}

/**
 * Rotation des rôles pour le mode « Nager & Progresser » (boucle séance unique).
 * Premières séances (cursor < 3) forcées faciles — sensation « envie de revenir demain ».
 */
const LOOP_VARIANTS = [
  { id: "technique", focus: "Technique & sensations", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Respiration fluide", "Sensations de glisse"] },
  { id: "endurance", focus: "Endurance confortable", role: { objectif: "endurance", zone: "Z2" }, objectives: ["Allure régulière", "Respiration toutes les 3 tractions"] },
  { id: "jambes", focus: "Jambes & gainage", role: { objectif: "technique_jambes", zone: "Z1" }, objectives: ["Battements efficaces", "Gainage du bassin"] },
  { id: "respiration", focus: "Respiration bilatérale", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Respiration des deux côtés", "Rythme calme"] },
  { id: "vitesse", focus: "Touches de vitesse", role: { objectif: "vitesse", zone: "Z4" }, objectives: ["Accélérations courtes", "Récupération complète"] },
  { id: "pull", focus: "Pull & traction", role: { objectif: "endurance", zone: "Z2" }, objectives: ["Traction longue", "Sensations de bras"] },
  { id: "sensations", focus: "Sensations & fluidité", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Nage détendue", "Écoute du corps"] },
  { id: "mixte", focus: "Séance mixte", role: { objectif: "mixte", zone: "Z2" }, objectives: ["Variété d'allures", "Plaisir de nager"] },
  { id: "defi", focus: "Mini défi", role: { objectif: "endurance", zone: "Z3" }, objectives: ["Tenir l'effort", "Constante des temps"] },
  { id: "roulis", focus: "Roulis & alignement", role: { objectif: "technique_roulis", zone: "Z1" }, objectives: ["Rotation du corps", "Alignement tête-bassin"] },
];

const LOOP_EASY_VARIANTS = [
  { id: "easy_tech", focus: "Première séance — douce", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Prendre ses marques", "Nager sans forcer"] },
  { id: "easy_sens", focus: "Sensations faciles", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Respiration calme", "Plaisir dans l'eau"] },
  { id: "easy_tech2", focus: "Technique légère", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Éducatif simple", "Confiance"] },
];

/**
 * Génère une seule séance pour le mode boucle « Nager & Progresser ».
 * @param {object} profile
 * @param {number} cursor — index de variété (0 = 1ʳᵉ séance)
 * @param {boolean} isPremium
 * @returns {{ session: object, focus: string, week: object }}
 */
export function buildProgressionLoopSession(profile, cursor = 0, isPremium = false) {
  const c = Math.max(0, Number(cursor) || 0);
  const easyPhase = c < 3;
  const variant = easyPhase
    ? LOOP_EASY_VARIANTS[c % LOOP_EASY_VARIANTS.length]
    : LOOP_VARIANTS[(c - 3) % LOOP_VARIANTS.length];

  const niveauKey = mapNiveau(profile);
  const profilObj = mapObjectifProfil(profile);
  const ref100 = isPremium ? secToPaceStr(profile.pace100) : "";
  const tasteHints = tasteToGeneratorHints(profile.taste);
  const simplifyWording =
    profile.level === "découverte" || profile.level === "beginner" || tasteHints.forceSimplify || easyPhase;
  const beginnerFriendly = simplifyWording;
  const feedbackAdj = Math.min(1.3, Math.max(0.7, Number(profile.volumeAdj) || 1));
  // Premières séances : volume réduit pour rester motivant
  const easyVol = easyPhase ? 0.72 : 1;
  const volMult =
    volumeMultFromProfileLevel(profile.level, profile.category) * feedbackAdj * tasteHints.volumeMul * easyVol;
  const pool = profile.pool === 25 ? 25 : 50;
  const phaseKey = easyPhase ? "foncier" : (c % 5 === 0 ? "developpement" : "foncier");
  const typeSemaine = easyPhase ? "allegee" : "normale";
  const roles = biasRolesForTaste([variant.role], tasteHints);
  const role = roles[0] || variant.role;
  const focusLabel = variant.focus;
  const weekNum = c + 1;

  const useConfirmeBank = usesConfirmeArchetypeBank(niveauKey, profilObj) && !easyPhase;
  const bankOpts = { isPremium: !!isPremium, pace100: profile.pace100 ?? null };
  const bankLevel =
    profile.level === "advanced" || profile.level === "performance"
      ? profile.level
      : "performance";

  let session;
  if (useConfirmeBank) {
    const fromDb = pickArthurBankSession(profilObj, c);
    session = fromDb
      || buildConfirmeArchetypeSession(c, pool, bankLevel, { ...bankOpts, tasteHints });
    session = {
      ...session,
      completed: false,
      skipped: null,
      objectives: variant.objectives,
      loopVariant: variant.id,
    };
  } else {
    const weekData = genererSemaineSessions(
      niveauKey,
      profilObj,
      phaseKey,
      1,
      weekNum,
      ref100,
      "",
      typeSemaine,
      0,
      roles,
      { volMult, simplifyWording, pool, tasteHints },
    );
    const raw = weekData.sessions[0];
    session = {
      ...toMySwymSession(raw, role, weekNum, 0, focusLabel, beginnerFriendly),
      title: focusLabel,
      objectives: variant.objectives,
      loopVariant: variant.id,
    };
  }

  const week = {
    number: 1,
    focus: focusLabel,
    tip: null,
    feedback: null,
    isBilan: false,
    isTest: false,
    sessions: [session],
  };

  return { session, focus: focusLabel, week };
}

/** Clé ISO semaine (ex. 2026-W32) pour plafonner les générations gratuites. */
export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export { mapNiveau, mapObjectifProfil, cosdRolesForWeek, COMPETITION_TIP };
