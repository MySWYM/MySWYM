/**
 * Pont MySWYM ↔ générateur Arthur + programmation COSD (Yann) + moteur sportif V1.
 * UI app inchangée — on ne fait que le contenu des séances / semaines.
 *
 * Voir docs/plan-methodology.md et docs/sports-engine-v1.md
 */
import {
  genererSemaineSessions,
  volumeMultFromProfileLevel,
  buildConfirmeArchetypeSession,
  usesConfirmeArchetypeBank,
} from "./swim-session-generator.js";
import { tasteToGeneratorHints, biasRolesForTaste } from "./user-taste.js";
import { pickArthurBankSession } from "./session-templates-store.js";
import {
  buildSportProfile,
  prepareWeekContext,
  enrichWeekRoles,
  decouverteWeekRoles,
  regulierWeekRoles,
  sportifWeekRoles,
  performanceWeekRoles,
  displayIntensity,
  mapGoalToObjectifV1,
  objectifV1ToProfilObj,
  buildSessionBrief,
  composeSession,
  isComposerEnabledForLevel,
  logComposerFallback,
  arthurFitsTaper,
  buildRaceDaySession,
  buildRestDaySession,
  applyPainSafetyToRoles,
  biasWeekRolesForTaste,
  sumTrainingDistance,
  formatEffectiveEngineWhy,
  validateArthurCandidate,
  resolveHardConstraints,
  scaleSessionLinesToVolume,
} from "./sports-engine/index.js";
import { eventBandFromGoal } from "./sports-engine/race-event.js";
import {
  isNatationSheetCatalogueEnabled,
  composeFromNatationSheet,
} from "./natation-sheet/client.js";
import { sheetFamilyIdFromProfile, isEventFamilyId } from "./natation-sheet/parse.js";
import {
  applySheetWeekSessionCap,
  resolveSheetWeekRole,
} from "./natation-sheet/sheet-week-role.js";
import { biasRolesForTrainingWish, trainingWishToHints } from "./sports-engine/training-wish.js";
import {
  normalizeTargetSessionDistance,
  sessionDistancePhaseScale,
} from "./sports-engine/session-distance-pref.js";
import { sessionTemplatesReady } from "./session-templates-store.js";
import { isSessionResolved } from "./plan-progress-merge.js";

const DIPLOMA_GOALS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"]);

/**
 * Boucle « une séance à la fois » (pas d'accès à la semaine complète).
 * Couvre Nager & Progresser, triathlon, eau libre et prépa diplôme —
 * pour éviter l'impression de séances qui se répètent quand on voit toute la semaine.
 * Bien-être / reprise / compétition maître restent en plan multi-semaines.
 */
export function usesSessionLoop(profile = {}) {
  const goal = profile.goal || "";
  const category = profile.category || "";
  if (goal === "reprendre" || goal === "perte_de_poids") return false;
  if (goal === "competition_maitre" || goal === "course_piscine") return false;
  if (goal === "progression" || goal.startsWith("prog_") || category === "progression") return true;
  if (category === "triathlon" || goal.startsWith("triathlon")) return true;
  if (
    category === "eau_libre" ||
    category === "open_water" ||
    goal.startsWith("open_water") ||
    goal.startsWith("eau_libre")
  ) {
    return true;
  }
  if (DIPLOMA_GOALS.has(goal) || category === "diplome") return true;
  return false;
}

function loopFamilyFromProfile(profile = {}) {
  const goal = profile.goal || "";
  const category = profile.category || "";
  if (DIPLOMA_GOALS.has(goal) || category === "diplome") return "diplome";
  if (category === "triathlon" || goal.startsWith("triathlon")) return "triathlon";
  if (
    category === "eau_libre" ||
    category === "open_water" ||
    goal.startsWith("open_water") ||
    goal.startsWith("eau_libre")
  ) {
    return "eau_libre";
  }
  return "progression";
}

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
  // Moteur V1 : mapping canonique
  const v1 = mapGoalToObjectifV1(profile);
  if (v1 !== "autre" && v1 !== "diplome") return objectifV1ToProfilObj(v1);
  const { goal, category } = profile;
  if (goal?.startsWith("open_water") || goal?.startsWith("eau_libre")) return "eau_libre";
  if (goal === "competition_maitre" || goal === "course_piscine") return "mixte";
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

function zoneLabel(details, role, beginnerFriendly = false, uiLevel = null) {
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
  if (uiLevel || beginnerFriendly) {
    return displayIntensity(zone, uiLevel || (beginnerFriendly ? "decouverte" : "sportif"), beginnerFriendly);
  }
  return zone;
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
      distance: 400, // 200 + 100 + 100
      duration: 25,
    },
    {
      details: [
        `-200m crawl / dos souple ${easy}`,
        `-8×12,5m accélération ${fast} — ${repos}`,
        `  · Juste le feeling de vitesse — tu t'arrêtes avant de fatiguer`,
        `-100m nage libre détendue ${easy}`,
        `→ Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.`,
      ],
      distance: 400,
      duration: 20,
    },
  ];

  return Array.from({ length: n }, (_, si) => {
    const v = variants[si % variants.length];
    // Toujours multiple de 50 (annonce XX00 / XX50)
    const dist = Math.max(50, Math.round(v.distance / 50) * 50);
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

function toMySwymSession(res, role, weekNumber, sessionIndex, focusLabel, beginnerFriendly = false, uiLevel = null) {
  const details = sessionTextToDetails(res.text);
  const total = res.total;
  const isTest = role?.objectif === "test";
  return {
    type: mapRoleToType(role),
    title: isTest
      ? `Test progression S${weekNumber}.${sessionIndex + 1}`
      : `${focusLabel} S${weekNumber}.${sessionIndex + 1}`,
    intensity: zoneLabel(details, role, beginnerFriendly, uiLevel),
    details,
    distance: `${total}m`,
    duration: Math.max(40, Math.min(90, Math.round(total / 35))),
    completed: false,
    skipped: null,
    isTest: isTest || undefined,
    family: role?.family,
    isKeySession: role?.isKeySession || undefined,
    engineWhy: role?.engineWhy,
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
 * Construit les semaines : format Arthur + rôles polarisés COSD + moteur sportif V1.
 * BNSSA/BPJEPS : ne pas appeler.
 */
export function buildCoachPlanWeeks(profile, phaseList, isPremium, TIPS, freeFreqLimit = 2) {
  const freq = Math.min(
    isPremium ? (profile.sessionsPerWeek ?? 3) : Math.min(profile.sessionsPerWeek ?? freeFreqLimit, freeFreqLimit),
    5,
  );
  const niveauKey = mapNiveau(profile);
  const profilObj = mapObjectifProfil(profile);
  const sport = buildSportProfile(profile);
  const ref100 = isPremium ? secToPaceStr(profile.pace100) : "";
  const ref400 = "";
  const tasteHints = tasteToGeneratorHints(profile.taste);
  const simplifyWording =
    profile.level === "découverte" ||
    profile.level === "beginner" ||
    profile.level === "débutant" ||
    profile.level === "debutant" ||
    tasteHints.forceSimplify;
  const beginnerFriendly = simplifyWording;
  const pool = profile.pool === 25 ? 25 : 50;

  let prevWeekDistance = 0;
  const useConfirmeBank = usesConfirmeArchetypeBank(niveauKey, profilObj);
  const bankOpts = { isPremium: !!isPremium, pace100: profile.pace100 ?? null };
  const bankLevel =
    profile.level === "advanced" || profile.level === "performance"
      ? profile.level
      : "performance";

  // Étape I : history H complète (pas seulement hardStreak)
  const hist = profile._engineHistory || {};
  const planStartDate = profile.planStartDate || hist.planStartDate || new Date();
  const historyBase = {
    requestedWeeks: phaseList.length,
    planStartDate,
    completedSessions: Number(hist.completedSessions) || 0,
    hardStreak: Number(hist.hardStreak) || 0,
    unfinishedRecent: Number(hist.unfinishedRecent) || 0,
    daysSinceLast: hist.daysSinceLast,
    easyStreak: Number(hist.easyStreak) || 0,
    finishedRate: hist.finishedRate,
    maxContinuousDistance: hist.maxContinuousDistance,
    level: sport.level,
    weeklyAdaptation: hist.weeklyAdaptation || profile._weeklyAdaptation || null,
    postRaceRecovery: !!(hist.postRaceRecovery || profile.postRaceRecovery),
    painProtection: !!(hist.painProtection || sport.hasPainConstraint),
    capacityDimensions: hist.capacityDimensions || hist.capacityUpdate?.dimensions || null,
    capacityUpdate: hist.capacityUpdate || null,
    trend: hist.trend || null,
    // volumeAdj = legacy compat ; si weeklyAdaptation présent, orchestration ignore le double
    volumeAdj: Number(profile.volumeAdj) || 1,
    tasteVolumeMul: tasteHints.volumeMul || 1,
  };

  return phaseList.map((phase, wi) => {
    const wiInPhase = weekIndexInPhase(phaseList, wi);
    const focusLabel = phase.focus || PHASE_MAP[phase.phase] || "Séance";
    const isCompetition = phase.phase === "competition";
    const weekFreq = isCompetition ? competitionSessionCount(freq) : freq;

    const weekCtx = prepareWeekContext(profile, phase, wi, weekFreq, prevWeekDistance, historyBase);
    const effectivePhase = weekCtx.effectivePhase || phase.phase;
    const typeSemaine = weekCtx.volumePlan.typeSemaine;
    const phaseKey = PHASE_MAP[effectivePhase] || weekCtx.phaseKey || "foncier";

    // WeekRoles d'abord (règles sportives), taste ensuite (préférence)
    let roles;
    if (sport.level === "decouverte") {
      roles = decouverteWeekRoles(weekFreq);
    } else if (sport.level === "regulier") {
      roles = regulierWeekRoles(weekFreq, {
        objectifV1: sport.objectifV1,
        strokeFocus: sport.strokeFocus,
        resumeMode: !!weekCtx.capacity?.resumeMode || sport.objectifV1 === "reprendre",
        hasPainConstraint: sport.hasPainConstraint || historyBase.painProtection,
        weekIndex: wi,
      });
    } else if (sport.level === "sportif") {
      roles = sportifWeekRoles(weekFreq, {
        objectifV1: sport.objectifV1,
        strokeFocus: sport.strokeFocus,
        resumeMode: !!weekCtx.capacity?.resumeMode || sport.objectifV1 === "reprendre",
        hasPainConstraint: sport.hasPainConstraint || historyBase.painProtection,
        weekIndex: wi,
        phase: effectivePhase,
        typeSemaine: weekCtx.volumePlan.typeSemaine,
        raceTarget: sport.raceTarget || null,
        recentBest: sport.recentBest || null,
        splits: sport.raceSplits || null,
        pace100: sport.pace100 || null,
        capacity: weekCtx.capacity || sport.capacity || null,
      });
    } else if (sport.level === "performance") {
      roles = performanceWeekRoles(weekFreq, {
        objectifV1: sport.objectifV1,
        strokeFocus: sport.strokeFocus,
        resumeMode: !!weekCtx.capacity?.resumeMode || sport.objectifV1 === "reprendre",
        hasPainConstraint: sport.hasPainConstraint || historyBase.painProtection,
        weekIndex: wi,
        phase: effectivePhase,
        effectivePhase,
        asOf: weekCtx.weekStart,
        weekStart: weekCtx.weekStart,
        typeSemaine: weekCtx.volumePlan.typeSemaine,
        raceTarget: sport.raceTarget || null,
        competitionDate: sport.raceTarget?.competitionDate || profile.competitionDate || null,
        currentTimeSec: profile.currentRaceTimeSec || null,
        recentBest: sport.recentBest || null,
        splits: sport.raceSplits || null,
        pace100: sport.pace100 || null,
        capacity: weekCtx.capacity || sport.capacity || null,
        limitingStroke: profile.limitingStroke || profile.weakStroke || null,
        primaryQuality: profile.primaryQuality || null,
        secondaryQuality: profile.secondaryQuality || null,
        sessionsPerWeek: weekFreq,
        freq: weekFreq,
        taperLoad: weekCtx.taperLoad || null,
      });
      // Ne PAS re-multiplier taper sur weekTarget (déjà dans effectiveWeekVolume)
      if (weekCtx.taperLoad && !roles.taperLoad) {
        Object.defineProperty(roles, "taperLoad", { value: weekCtx.taperLoad, enumerable: false });
      }
    } else {
      roles = enrichWeekRoles(
        Array.from({ length: weekFreq }, () => ({ zone: "Z2", family: "endurance" })),
        {
          phase: effectivePhase,
          level: sport.level,
          objectifV1: sport.objectifV1,
          hasPainConstraint: sport.hasPainConstraint,
        },
      );
    }

    // Taste après WeekRoles (garde-fous)
    roles = biasWeekRolesForTaste(roles, tasteHints, {
      taperBlocked: effectivePhase === "taper" || effectivePhase === "race" || !!weekCtx.effectiveTaperStage,
      painProtection: !!(sport.hasPainConstraint || historyBase.painProtection),
      preserveQuality: true,
    });

    // Soft wish onboarding (jamais hard override)
    const wishHints =
      sport.trainingWishHints ||
      trainingWishToHints(sport.trainingWishMeta || profile.trainingWish, {
        equipmentOwned: sport.equipment,
      });
    roles = biasRolesForTrainingWish(roles, wishHints);

    // Douleur : intention complète
    if (sport.hasPainConstraint || historyBase.painProtection || weekCtx.maxZone === "Z2") {
      if (sport.hasPainConstraint || historyBase.painProtection) {
        roles = applyPainSafetyToRoles(roles);
      } else {
        roles = roles.map((r) => {
          if (r.zone === "Z3" || r.zone === "Z4") return { ...r, zone: "Z2", family: "endurance", intent: "endurance" };
          return r;
        });
      }
    }

    const strategy = roles.performanceStrategy || null;
    const engineWhy = formatEffectiveEngineWhy({
      objectifV1: sport.objectifV1,
      effectivePhase,
      effectiveTaperStage: weekCtx.effectiveTaperStage || weekCtx.taperLoad?.taperStage,
      effectiveWeekVolume: weekCtx.volumePlan.weekTarget,
      primaryQuality: strategy?.primaryQuality || roles[0]?.performancePrimary,
      secondaryQuality: strategy?.secondaryQuality || roles[0]?.performanceSecondary,
      adaptation: weekCtx.adaptation || historyBase.weeklyAdaptation,
      capacity: weekCtx.capacity,
      raceTarget: sport.raceTarget,
      volumeTrail: weekCtx.volumePlan.trail,
      lever: weekCtx.volumePlan.lever,
    });
    weekCtx.why = engineWhy;

    // J3 : aussi si phase effective = race (date-driven), pas seulement label phaseList
    if ((isCompetition || effectivePhase === "race") && effectivePhase === "race") {
      // Prefer race-day representation when date-driven race
      const sessions = Array.from({ length: weekFreq }, (_, si) => {
        if (si === 0 && sport.level === "performance") {
          return buildRaceDaySession({
            raceTarget: sport.raceTarget,
            strokeFocus: sport.strokeFocus,
          });
        }
        return buildRestDaySession({ taperRestPreferred: true, taperStage: "race_day" });
      });
      // Soft fallback for non-perf competition weeks
      if (sport.level !== "performance") {
        const comps = buildCompetitionSessions(pool, weekFreq, wi + 1, focusLabel, beginnerFriendly);
        prevWeekDistance = sumTrainingDistance(comps);
        return {
          number: wi + 1,
          focus: focusLabel,
          tip: COMPETITION_TIP,
          feedback: null,
          isBilan: phase.isBilan ?? false,
          isTest: phase.isTest ?? false,
          sessions: comps,
          engineWhy,
          effectivePhase,
          progressionLever: weekCtx.volumePlan.lever,
          volumeTrail: weekCtx.volumePlan.trail,
        };
      }
      prevWeekDistance = sumTrainingDistance(sessions);
      return {
        number: wi + 1,
        focus: focusLabel,
        tip: COMPETITION_TIP,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions,
        engineWhy,
        effectivePhase,
        effectiveTaperStage: weekCtx.effectiveTaperStage,
        taperLoad: weekCtx.taperLoad,
        performanceStrategy: strategy,
        progressionLever: weekCtx.volumePlan.lever,
        volumeTrail: weekCtx.volumePlan.trail,
      };
    }

    if (isCompetition && sport.level !== "performance") {
      const sessions = buildCompetitionSessions(pool, weekFreq, wi + 1, focusLabel, beginnerFriendly);
      prevWeekDistance = sumTrainingDistance(sessions);
      return {
        number: wi + 1,
        focus: focusLabel,
        tip: COMPETITION_TIP,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions,
        engineWhy,
        effectivePhase,
        progressionLever: weekCtx.volumePlan.lever,
        volumeTrail: weekCtx.volumePlan.trail,
      };
    }

    if (useConfirmeBank && sport.level !== "performance") {
      const sessionTargets = weekCtx.volumePlan.sessionTargets;
      const sessions = Array.from({ length: weekFreq }, (_, si) => {
        const archeIdx = wi * 3 + si;
        const role = roles[si] || roles[0];
        const volumeTarget = sessionTargets[si] || Math.round(weekCtx.volumePlan.weekTarget / weekFreq);
        const fromDb = pickArthurBankSession(profilObj, archeIdx, {
          volumeTarget,
          phase: effectivePhase,
          family: role?.family,
          equipment: sport.equipment,
          scaleVolume: true,
        });
        if (fromDb) {
          return {
            ...fromDb,
            family: role?.family,
            isKeySession: role?.isKeySession,
            engineWhy: fromDb.engineWhy || engineWhy,
            trainingDistance:
              fromDb.trainingDistance ??
              (parseInt(String(fromDb.distance || "").replace(/\D/g, ""), 10) || 0),
            intensity:
              beginnerFriendly || sport.level === "decouverte" || sport.level === "regulier"
                ? displayIntensity(fromDb.intensity, sport.level, beginnerFriendly)
                : fromDb.intensity,
          };
        }
        return buildConfirmeArchetypeSession(archeIdx, pool, bankLevel, {
          ...bankOpts,
          tasteHints,
        });
      });
      prevWeekDistance = sumTrainingDistance(sessions);
      return {
        number: wi + 1,
        focus: focusLabel,
        tip: TIPS?.[phase.tipKey] ?? null,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions,
        engineWhy,
        effectivePhase,
        progressionLever: weekCtx.volumePlan.lever,
        volumeTrail: weekCtx.volumePlan.trail,
      };
    }

    // Legacy fallback : même charge finale (pas de re-stack volumeAdj×taste)
    const refWeek = { debutant: 3600, intermediaire: 4800, confirme: 6000, triathlete: 6600 }[niveauKey] || 4800;
    const engineVolMult =
      weekCtx.volumePlan.weekTarget > 0
        ? weekCtx.volumePlan.weekTarget / Math.max(1, refWeek)
        : 0.15;

    if (isComposerEnabledForLevel(sport.level)) {
      const composedSessions = [];
      let composerOk = true;
      let fallbackMeta = null;
      sport.isPremium = !!isPremium;
      if (Number(profile.pace100) > 0) sport.pace100 = Number(profile.pace100);

      for (let si = 0; si < weekFreq; si++) {
        const role = roles[si] || roles[0] || {};
        const durationTarget =
          profile.sessionMinutes ||
          profile.durationMinutes ||
          (sport.level === "performance" ? 70 : sport.level === "sportif" ? 60 : sport.level === "regulier" ? 45 : 30);
        const volumeTarget =
          weekCtx.volumePlan.sessionTargets[si] ||
          Math.round(weekCtx.volumePlan.weekTarget / weekFreq);

        let session = null;

        if (sport.level === "performance" && (role.isRaceDay || role.sessionIntent === "race")) {
          session = buildRaceDaySession({
            raceTarget: roles.performanceStrategy?.raceAnalysis?.target || sport.raceTarget,
            raceDistance: sport.raceDistance,
            strokeFocus: sport.strokeFocus,
          });
        } else if (
          sport.level === "performance" &&
          (role.isRestDay || role.sessionIntent === "repos" || (role.taperRestPreferred && role.optional))
        ) {
          session = buildRestDaySession({
            taperActivation: !!role.taperActivation,
            taperRestPreferred: !!role.taperRestPreferred,
            taperStage: role.taperLoad?.taperStage || weekCtx.effectiveTaperStage,
          });
        }

        const arthurEligible =
          !session &&
          (sport.level === "sportif" || sport.level === "performance") &&
          sessionTemplatesReady() &&
          (sport.objectifV1 === "eau_libre" || sport.objectifV1 === "triathlon") &&
          (role.qualitySession ||
            role.sessionSpecificity === "goal_specific" ||
            role.sessionSpecificity === "race_specific" ||
            role.sessionIntent === "eau_libre" ||
            role.sessionIntent === "triathlon");
        if (arthurEligible) {
          const arthurObj = sport.objectifV1 === "triathlon" ? "mixte" : "eau_libre";
          const taperLoad = role.taperLoad || weekCtx.taperLoad || roles.taperLoad;
          const fromDb = pickArthurBankSession(arthurObj, wi * 3 + si, {
            volumeTarget,
            phase: roles.performanceStrategy?.phase || effectivePhase,
            family: role.family,
            equipment: sport.equipment,
            scaleVolume: true,
          });
          if (
            fromDb?.details?.length &&
            (!taperLoad?.taperStage || arthurFitsTaper(fromDb, taperLoad, volumeTarget))
          ) {
            const td =
              fromDb.volumeFromDetails ||
              parseInt(String(fromDb.distance || "").replace(/\D/g, ""), 10) ||
              0;
            const arthurCandidate = {
              ...fromDb,
              family: role.family,
              isKeySession: role.isKeySession,
              qualitySession: !!role.qualitySession,
              engineWhy: fromDb.engineWhy || engineWhy,
              performanceDevExplain: role.performanceDevExplain || null,
              trainingDistance: td,
              composedBy: "arthur-bank",
              composerWhy: {
                source: "arthur",
                intent: role.sessionIntent,
                level: sport.level,
                scaleRatio: fromDb.scaleRatio,
                scaleLever: fromDb.scaleLever,
                volumeFromDetails: fromDb.volumeFromDetails,
                performancePrimary: role.performancePrimary || null,
                taperStage: taperLoad?.taperStage || null,
                seed: `arthur|${fromDb.templateSlug || "t"}|w${wi}|s${si}`,
              },
            };
            // Étape J2 — Arthur passe le même quality gate que le composeur
            const arthurBrief = {
              level: sport.level,
              objectif: sport.objectifV1,
              volumeTarget,
              taperLoad,
              painProtection: !!(sport.hasPainConstraint || historyBase.painProtection),
              hasPainConstraint: !!sport.hasPainConstraint,
              maxIntensityZone: weekCtx.maxZone,
              strokeFocus: sport.strokeFocus,
              sessionIntent: role.sessionIntent,
              raceTarget: sport.raceTarget,
              equipment: sport.equipment,
            };
            const hc = resolveHardConstraints(arthurBrief);
            const gate = validateArthurCandidate(arthurCandidate, { ...arthurBrief, hardConstraints: hc }, hc);
            if (gate.valid) {
              session = {
                ...arthurCandidate,
                qualityGate: {
                  source: "arthur",
                  constraintsChecked: gate.constraintsChecked,
                },
              };
            }
            // sinon : fallback composeur ci-dessous
          }
        }

        if (!session) {
          const roleWithStrategy = {
            ...role,
            performanceStrategy: roles.performanceStrategy || null,
            taperLoad: role.taperLoad || weekCtx.taperLoad || null,
          };
          const brief = buildSessionBrief({
            sport,
            weekCtx: {
              ...weekCtx,
              _phaseName: effectivePhase,
              taperLoad: weekCtx.taperLoad,
              volumeFinalized: true,
              taperAppliedUpstream: true,
            },
            role: roleWithStrategy,
            weekIndex: wi,
            sessionIndex: si,
            durationTarget,
            seed: `${sport.level}|${sport.objectifV1}|${effectivePhase}|w${wi}|s${si}|${volumeTarget}|${role.sessionIntent || ""}`,
          });
          const result = composeSession(brief);
          if (!result.ok) {
            composerOk = false;
            fallbackMeta = logComposerFallback(result.reason, {
              level: sport.level,
              weekIndex: wi,
              sessionIndex: si,
              seed: brief.seed,
            });
            break;
          }
          session = {
            ...result.session,
            title: result.session.title || `${focusLabel} S${wi + 1}.${si + 1}`,
            engineWhy: result.session.engineWhy || engineWhy,
            performanceDevExplain: role.performanceDevExplain || null,
            trainingDistance:
              result.session.trainingDistance ??
              result.session.volumeFromSets ??
              0,
          };
        }
        composedSessions.push(session);
      }
      if (composerOk && composedSessions.length === weekFreq) {
        prevWeekDistance = sumTrainingDistance(composedSessions);
        return {
          number: wi + 1,
          focus: focusLabel,
          tip: TIPS?.[phase.tipKey] ?? (weekCtx.horizon.note || null),
          feedback: null,
          isBilan: phase.isBilan ?? false,
          isTest: phase.isTest ?? false,
          sessions: composedSessions,
          engineWhy,
          effectivePhase,
          effectiveTaperStage: weekCtx.effectiveTaperStage,
          daysToComp: weekCtx.daysToComp,
          raceAnalysis: roles.raceAnalysis || null,
          performanceStrategy: roles.performanceStrategy || null,
          taperLoad: weekCtx.taperLoad || roles.taperLoad || null,
          progressionLever: weekCtx.volumePlan.lever,
          volumeTrail: weekCtx.volumePlan.trail,
          composedBy: composedSessions.some((s) => s.composedBy === "arthur-bank")
            ? "session-composer+arthur"
            : "session-composer",
        };
      }
      if (!fallbackMeta) {
        fallbackMeta = logComposerFallback("composeur incomplet", {
          level: sport.level,
          weekIndex: wi,
        });
      }
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
      { volMult: engineVolMult, simplifyWording, pool, tasteHints },
    );
    const legacySessions = weekData.sessions.map((s, si) => {
      const mapped = toMySwymSession(
        s,
        { ...roles[si], engineWhy },
        wi + 1,
        si,
        focusLabel,
        beginnerFriendly,
        sport.level,
      );
      return {
        ...mapped,
        trainingDistance: parseInt(String(mapped.distance || "").replace(/\D/g, ""), 10) || 0,
      };
    });
    prevWeekDistance = sumTrainingDistance(legacySessions);

    return {
      number: wi + 1,
      focus: focusLabel,
      tip: TIPS?.[phase.tipKey] ?? (weekCtx.horizon.note || null),
      feedback: null,
      isBilan: phase.isBilan ?? false,
      isTest: phase.isTest ?? false,
      sessions: legacySessions,
      engineWhy,
      effectivePhase,
      effectiveTaperStage: weekCtx.effectiveTaperStage,
      progressionLever: weekCtx.volumePlan.lever,
      volumeTrail: weekCtx.volumePlan.trail,
      ...(isComposerEnabledForLevel(sport.level)
        ? { composedBy: "legacy-generator", composerFallback: true }
        : {}),
    };
  });
}

/**
 * Rotation des rôles pour le mode boucle séance unique.
 * Premières séances (cursor < 3) forcées faciles — sensation « envie de revenir demain ».
 * Variantes par famille d'objectif pour que triathlon / eau libre / diplôme restent spécifiques.
 */
const LOOP_VARIANTS_BY_FAMILY = {
  progression: [
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
  ],
  triathlon: [
    { id: "tri_aero", focus: "Endurance triathlon", role: { objectif: "mixte", zone: "Z2" }, objectives: ["Allure régulière", "Respiration stable"] },
    { id: "tri_sight", focus: "Sighting & trajectoire", role: { objectif: "eau_libre", zone: "Z2" }, objectives: ["Repères fréquents", "Ligne droite"] },
    { id: "tri_tech", focus: "Technique crawl efficace", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Traction longue", "Économie d'énergie"] },
    { id: "tri_seuil", focus: "Allure compétition", role: { objectif: "mixte", zone: "Z3" }, objectives: ["Régularité des temps", "Tenir l'effort"] },
    { id: "tri_start", focus: "Départ & premiers mètres", role: { objectif: "vitesse", zone: "Z4" }, objectives: ["Accélération courte", "Retour à l'allure course"] },
    { id: "tri_jambes", focus: "Jambes économes", role: { objectif: "technique_jambes", zone: "Z1" }, objectives: ["Battements utiles", "Préserver les jambes pour le vélo"] },
    { id: "tri_ow", focus: "Simulation eau libre", role: { objectif: "eau_libre", zone: "Z2" }, objectives: ["Sighting", "Nage sans ligne"] },
    { id: "tri_mix", focus: "Séance mixte course", role: { objectif: "mixte", zone: "Z2" }, objectives: ["Variété d'allures", "Gestion d'effort"] },
  ],
  eau_libre: [
    { id: "ow_sight", focus: "Sighting & orientation", role: { objectif: "eau_libre", zone: "Z2" }, objectives: ["Repères toutes les 6–8 tractions", "Trajectoire"] },
    { id: "ow_aero", focus: "Endurance eau libre", role: { objectif: "eau_libre", zone: "Z2" }, objectives: ["Volume confortable", "Respiration calme"] },
    { id: "ow_tech", focus: "Crawl efficace", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Glisse", "Respiration bilatérale"] },
    { id: "ow_seuil", focus: "Allure course", role: { objectif: "eau_libre", zone: "Z3" }, objectives: ["Régularité", "Tenir sans s'écrouler"] },
    { id: "ow_draft", focus: "Nage groupée", role: { objectif: "mixte", zone: "Z2" }, objectives: ["Suivre un rythme", "Contact / écart"] },
    { id: "ow_vitesse", focus: "Touches vitesse", role: { objectif: "vitesse", zone: "Z4" }, objectives: ["Accélérations", "Récup complète"] },
    { id: "ow_jambes", focus: "Jambes & alignement", role: { objectif: "technique_jambes", zone: "Z1" }, objectives: ["Gainage", "Battements stables"] },
    { id: "ow_long", focus: "Bloc long continu", role: { objectif: "eau_libre", zone: "Z2" }, objectives: ["Continuité", "Gestion d'effort"] },
  ],
};

/** Après la phase facile : ordre des variantes selon la bande d'épreuve (short / mid / long). */
const LOOP_VARIANT_ORDER_BY_BAND = {
  eau_libre: {
    short: ["ow_sight", "ow_seuil", "ow_vitesse", "ow_tech", "ow_aero", "ow_jambes"],
    mid: ["ow_aero", "ow_sight", "ow_seuil", "ow_long", "ow_tech", "ow_draft", "ow_jambes"],
    long: ["ow_long", "ow_aero", "ow_tech", "ow_jambes", "ow_sight"],
  },
  triathlon: {
    short: ["tri_start", "tri_seuil", "tri_tech", "tri_sight", "tri_jambes", "tri_aero"],
    mid: ["tri_aero", "tri_seuil", "tri_sight", "tri_tech", "tri_ow", "tri_jambes", "tri_mix"],
    long: ["tri_aero", "tri_ow", "tri_jambes", "tri_tech", "tri_seuil", "tri_sight"],
  },
};

function loopVariantsForEvent(family, goal) {
  const all = LOOP_VARIANTS_BY_FAMILY[family] || LOOP_VARIANTS_BY_FAMILY.progression;
  const order = LOOP_VARIANT_ORDER_BY_BAND[family]?.[eventBandFromGoal(goal)];
  if (!order) return all;
  const byId = Object.fromEntries(all.map((v) => [v.id, v]));
  return order.map((id) => byId[id]).filter(Boolean);
}

const LOOP_EASY_BY_FAMILY = {
  progression: [
    { id: "easy_tech", focus: "Première séance — douce", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Prendre ses marques", "Nager sans forcer"] },
    { id: "easy_sens", focus: "Sensations faciles", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Respiration calme", "Plaisir dans l'eau"] },
    { id: "easy_tech2", focus: "Technique légère", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Éducatif simple", "Confiance"] },
  ],
  triathlon: [
    { id: "tri_easy1", focus: "Première séance triathlon — douce", role: { objectif: "mixte", zone: "Z1" }, objectives: ["Prendre ses marques", "Nager sans forcer"] },
    { id: "tri_easy2", focus: "Sensations course", role: { objectif: "endurance", zone: "Z1" }, objectives: ["Respiration calme", "Glisse"] },
    { id: "tri_easy3", focus: "Technique légère", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Éducatif simple", "Confiance"] },
  ],
  eau_libre: [
    { id: "ow_easy1", focus: "Première séance eau libre — douce", role: { objectif: "eau_libre", zone: "Z1" }, objectives: ["Prendre ses marques", "Nager sans forcer"] },
    { id: "ow_easy2", focus: "Sighting facile", role: { objectif: "eau_libre", zone: "Z1" }, objectives: ["Repères calmes", "Plaisir"] },
    { id: "ow_easy3", focus: "Technique légère", role: { objectif: "technique_respiration", zone: "Z1" }, objectives: ["Éducatif simple", "Confiance"] },
  ],
};

/** Séances diplôme (BNSSA / BPJEPS / pompiers / CAEPMNS) — une variante à la fois. */
function buildDiplomaLoopSessionPayload(profile, cursor, easyPhase) {
  const pool = profile.pool === 25 ? 25 : 50;
  const goal = profile.goal || "bnssa";
  const c = Math.max(0, Number(cursor) || 0);
  const P = pool;
  const volScale = easyPhase ? 0.75 : 1;

  const bnssaVariants = [
    {
      id: "simu_100",
      focus: "Simulation parcours 100 m",
      type: "BNSSA",
      intensity: "Apnée & remorquage — qualité de parcours",
      objectives: ["Tracé fond propre", "Remorquage stable"],
      details: (n) => [
        `Échauffement : ${Math.round(200 * n / 50) * 50}m NL progressif + ${P * 2}m battements`,
        `Apnée dynamique : ${Math.max(3, Math.round(6 * n))}×15m immersion complète — R2' — sans appui`,
        `Simulation 100m : 25m NL → 15m apnée → virage → 15m apnée → 25m remorquage — R3'`,
        `Remorquage : ${Math.max(2, Math.round(4 * n))}×${P}m — R1'30" — position dorsale, visage hors de l'eau`,
        `Retour au calme : ${P * 4}m dos lent`,
      ],
    },
    {
      id: "palmes_250",
      focus: "Prépa 250 m palmes & plongée",
      type: "BNSSA",
      intensity: "Endurance équipée + apnée",
      objectives: ["Virages équipés", "Plongée canard"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL + ${P * 2}m battements`,
        `${Math.max(3, Math.round(6 * n))}×${2 * P}m palmes + masque + tuba — R20" — touche le mur à chaque virage`,
        `Plongée canard : 6× plongée → fond → saisie mannequin → remontée — R2'`,
        `Remorquage : ${Math.max(2, Math.round(4 * n))}×${P}m position dorsale — R1'30"`,
        `Retour au calme : ${P * 4}m dos lent`,
      ],
    },
    {
      id: "apnee_fatigue",
      focus: "Endurance & apnée sous fatigue",
      type: "BNSSA",
      intensity: "Tenir les apnées après l'effort",
      objectives: ["Apnée après fatigue", "Remorquage propre"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL progressif + ${P * 2}m battements`,
        `${Math.max(3, Math.round(5 * n))}×${2 * P}m NL — R20" — endurance de base`,
        `Apnée dynamique : ${Math.max(3, Math.round(6 * n))}×15m — R2' — immersion complète`,
        `${Math.max(2, Math.round(4 * n))}×${P}m remorquage — R1'30" — position dorsale`,
        `Retour au calme : ${P * 4}m dos lent`,
      ],
    },
    {
      id: "volume_equipe",
      focus: "Palmes + tuba — volume équipé",
      type: "BNSSA",
      intensity: "Endurance masque/tuba + apnées courtes",
      objectives: ["Respiration tuba", "Virages propres"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL + ${P * 2}m palmes souples`,
        `${Math.max(3, Math.round(6 * n))}×${2 * P}m palmes + masque + tuba — R15"`,
        `Apnée : ${Math.max(3, Math.round(5 * n))}×15m — R1'30" — après fatigue équipée`,
        `${Math.max(2, Math.round(3 * n))}×${P}m remorquage dorsale — R1'`,
        `Retour au calme : ${P * 4}m dos sans matériel`,
      ],
    },
    {
      id: "ench_exam",
      focus: "Enchaînement exam",
      type: "BNSSA",
      intensity: "Simulation complète sous fatigue",
      objectives: ["Enchaînement fluide", "Gestion de l'effort"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL + ${P * 2}m battements`,
        `${Math.max(2, Math.round(4 * n))}×${2 * P}m palmes + tuba — R20"`,
        `Bloc exam : 50m palmes → 15m apnée → ${P}m remorquage — ×${Math.max(2, Math.round(4 * n))} — R2'30"`,
        `Apnée isolée : ${Math.max(3, Math.round(4 * n))}×15m — R2'`,
        `Retour au calme : ${P * 4}m dos lent`,
      ],
    },
  ];

  const bpjepsVariants = [
    {
      id: "bp_400",
      focus: "Spécifique 400 m NL",
      type: "SEUIL",
      intensity: "Régularité des 100 — objectif < 7'40\"",
      objectives: ["Splits réguliers", "Allure examen"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL progressif + ${P * 2}m éducatif respiration`,
        `${Math.max(3, Math.round(4 * n))}×100m NL — R30" — même temps à chaque 100`,
        `2×200m NL — R45" — allure 400 m examen`,
        `${Math.max(2, Math.round(3 * n))}×50m NL — R20" — un peu plus vite, récup complète`,
        `Retour au calme : ${P * 4}m dos / brasse souple`,
      ],
    },
    {
      id: "bp_im",
      focus: "100 m 4 nages",
      type: "TECHNIQUE",
      intensity: "Enchaînement pap → dos → brasse → crawl",
      objectives: ["Transitions propres", "Objectif < 1'50\""],
      details: (n) => [
        `Échauffement : ${P * 4}m 4 nages souple`,
        `${Math.max(4, Math.round(6 * n))}×25m nage complète (alterne les 4) — R20"`,
        `${Math.max(2, Math.round(3 * n))}×100m 4 nages — R1' — ordre olympique`,
        `${Math.max(2, Math.round(3 * n))}×50m (25 brasse + 25 crawl) — R30"`,
        `Retour au calme : ${P * 4}m choix libre`,
      ],
    },
    {
      id: "bp_aero",
      focus: "Volume NL régulier",
      type: "ENDURANCE",
      intensity: "Base aérobie pour le 400 m",
      objectives: ["Continuité", "Respiration stable"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL + ${P * 2}m battements`,
        `${Math.max(4, Math.round(8 * n))}×${2 * P}m NL — R20" — allure confortable`,
        `${Math.max(2, Math.round(3 * n))}×100m NL — R25" — un cran au-dessus`,
        `Retour au calme : ${P * 4}m dos lent`,
      ],
    },
    {
      id: "bp_seuil",
      focus: "Fractionné 400 m",
      type: "SEUIL",
      intensity: "Effort soutenu, temps constants",
      objectives: ["Constante des temps", "Récup courte maîtrisée"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL progressif`,
        `8×50m NL — R15" — allure 400 m`,
        `${Math.max(2, Math.round(3 * n))}×150m NL — R40" — tenir l'allure`,
        `4×25m NL rapide — R30" — récup complète`,
        `Retour au calme : ${P * 4}m souple`,
      ],
    },
  ];

  const pompierVariants = [
    {
      id: "pomp_400",
      focus: "400 m NL tests",
      type: "SEUIL",
      intensity: "Endurance vitesse — tests pompiers",
      objectives: ["Tenir 400 m", "Allure régulière"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL + ${P * 2}m battements`,
        `${Math.max(3, Math.round(4 * n))}×100m NL — R30" — splits réguliers`,
        `1×400m NL continu — chronomètre, allure cible`,
        `${Math.max(2, Math.round(3 * n))}×50m NL — R25"`,
        `Retour au calme : ${P * 4}m dos`,
      ],
    },
    {
      id: "pomp_sauv",
      focus: "50 m sauvetage",
      type: "BNSSA",
      intensity: "Vitesse + remorquage court",
      objectives: ["Départ explosif", "Remorquage contrôlé"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL progressif`,
        `${Math.max(4, Math.round(6 * n))}×${P}m NL rapide — R40" — récup quasi complète`,
        `${Math.max(3, Math.round(5 * n))}×${P}m remorquage — R1' — position dorsale`,
        `Simu 50m : nage → saisie → remorquage — ×${Math.max(2, Math.round(3 * n))} — R2'`,
        `Retour au calme : ${P * 4}m souple`,
      ],
    },
    {
      id: "pomp_mix",
      focus: "NL + sauvetage mixte",
      type: "BNSSA",
      intensity: "Enchaînement effort → sauvetage",
      objectives: ["Gérer la fatigue", "Qualité du remorquage"],
      details: (n) => [
        `Échauffement : ${P * 4}m NL`,
        `${Math.max(3, Math.round(5 * n))}×${2 * P}m NL — R20"`,
        `Apnée : ${Math.max(3, Math.round(4 * n))}×15m — R1'30"`,
        `${Math.max(2, Math.round(4 * n))}×${P}m remorquage — R1'`,
        `Retour au calme : ${P * 4}m dos`,
      ],
    },
  ];

  let pool_variants = bnssaVariants;
  if (goal === "bpjeps_aan") pool_variants = bpjepsVariants;
  else if (goal === "tests_pompiers") pool_variants = pompierVariants;
  else if (goal === "caepmns") pool_variants = [...bnssaVariants.slice(0, 3), ...pompierVariants.slice(0, 2)];

  const easyDiploma = [
    {
      id: "dip_easy1",
      focus: "Première séance prépa — douce",
      type: "ENDURANCE",
      intensity: "Prise de marques",
      objectives: ["Nager sans forcer", "Confiance"],
      details: () => [
        `Échauffement : ${P * 4}m NL très souple`,
        `${Math.max(4, Math.round(6 * volScale))}×${P}m NL — R20" — confortable`,
        `${P * 2}m battements avec planche — respirations calmes`,
        `Retour au calme : ${P * 2}m dos lent`,
      ],
    },
    {
      id: "dip_easy2",
      focus: "Sensations & matériel",
      type: "TECHNIQUE",
      intensity: "Découverte douce",
      objectives: ["Matériel à l'aise", "Respiration"],
      details: () => [
        `Échauffement : ${P * 4}m NL`,
        `${Math.max(3, Math.round(4 * volScale))}×${2 * P}m NL — R25"`,
        `${P * 2}m palmes souples (si tu en as) ou battements`,
        `Retour au calme : ${P * 2}m choix libre`,
      ],
    },
    {
      id: "dip_easy3",
      focus: "Base endurance légère",
      type: "ENDURANCE",
      intensity: "Volume facile",
      objectives: ["Continuité", "Plaisir"],
      details: () => [
        `Échauffement : ${P * 2}m NL + ${P * 2}m dos`,
        `${Math.max(4, Math.round(8 * volScale))}×${P}m NL — R15" — tu peux parler`,
        `Retour au calme : ${P * 4}m souple`,
      ],
    },
  ];

  const variant = easyPhase
    ? easyDiploma[c % easyDiploma.length]
    : pool_variants[(c - 3) % pool_variants.length];

  const details = variant.details(volScale);
  let dist = 0;
  for (const line of details) {
    const m = line.match(/(\d+)\s*×\s*(\d+)\s*m/i);
    if (m) dist += parseInt(m[1], 10) * parseInt(m[2], 10);
    else {
      const single = line.match(/(\d+)\s*m/i);
      if (single) dist += parseInt(single[1], 10);
    }
  }
  dist = Math.round(dist / 25) * 25 || 800;

  return {
    variant,
    session: {
      type: variant.type,
      title: variant.focus,
      intensity: variant.intensity,
      details,
      distance: `${dist}m`,
      duration: Math.max(35, Math.min(90, Math.round(dist / 35))),
      completed: false,
      skipped: null,
      objectives: variant.objectives,
      loopVariant: variant.id,
      trainingDistance: dist,
    },
  };
}

/**
 * Titre nageur du mode boucle : Séance n°1, n°2…
 * `ordinalIndex` = nb de séances déjà validées/archivées (0 → n°1).
 * Indépendant de `sessionCursor` (variété / régénération).
 */
export function formatLoopSessionTitle(ordinalIndex = 0) {
  return `Séance n°${Math.max(0, Number(ordinalIndex) || 0) + 1}`;
}

/** Titre dans la semaine courante (Séance 1, 2, 3…) — pas le compteur global. */
export function formatLoopWeekSessionTitle(indexInWeek = 0) {
  return `Séance ${Math.max(0, Number(indexInWeek) || 0) + 1}`;
}

/** Nb de séances validées (base 0 pour la séance courante non encore archivée). */
export function loopSessionOrdinalIndex(plan) {
  if (!plan?.isSessionLoop) return 0;
  return Array.isArray(plan.history) ? plan.history.length : 0;
}

/** Force le titre affiché (plans déjà stockés avec un focus marketing). */
export function withLoopSessionTitle(session, ordinalIndex = 0) {
  if (!session) return session;
  const title = formatLoopSessionTitle(ordinalIndex);
  return session.title === title ? session : { ...session, title };
}

/**
 * Séance courante d’un plan boucle = première non résolue (ou la dernière si tout est fait).
 */
export function loopDisplaySession(plan) {
  if (!plan?.isSessionLoop) return plan?.weeks?.[0]?.sessions?.[0] || null;
  const sessions = plan?.weeks?.[0]?.sessions || [];
  if (!sessions.length) return null;
  const histLen = loopSessionOrdinalIndex(plan);
  const openIdx = sessions.findIndex((s) => !isSessionResolved(s));
  const si = openIdx >= 0 ? openIdx : sessions.length - 1;
  const ordinalIndex = openIdx >= 0 ? histLen + openIdx : Math.max(0, histLen - 1);
  return withLoopSessionTitle(sessions[si], ordinalIndex);
}

/**
 * Nb de séances à générer pour la semaine courante de boucle.
 * Cap Sheet S0 (course) = 2 via applySheetWeekSessionCap.
 */
export function effectiveLoopSessionsPerWeek(profile = {}, opts = {}) {
  const spw = Math.max(1, Math.min(5, Number(profile.sessionsPerWeek) || 3));
  const family = sheetFamilyIdFromProfile(profile);
  if (!isEventFamilyId(family) && !String(profile.goal || "").startsWith("triathlon")) {
    return spw;
  }
  const role = resolveSheetWeekRole({
    eventDate: profile.eventDate || null,
    planStart: opts.planStart || profile.planStartedAt || profile.createdAt || null,
    weekIndex: opts.weekIndex,
    now: opts.now,
  });
  return applySheetWeekSessionCap(role, spw);
}

/**
 * Génère une semaine boucle de N séances (N = sessionsPerWeek, plafonné S0).
 * @returns {Promise<{ week: object, sessions: object[], sheetError?: boolean, sheetErrorMessage?: string }>}
 */
export async function buildProgressionLoopWeek(profile, cursor = 0, isPremium = false, opts = {}) {
  const baseOrdinal = Math.max(0, Number(opts.ordinalIndex != null ? opts.ordinalIndex : 0) || 0);
  const weekIndex =
    opts.weekIndex != null
      ? opts.weekIndex
      : Math.floor(baseOrdinal / Math.max(1, Number(profile.sessionsPerWeek) || 3));
  const n = Math.max(
    1,
    Number(opts.sessionCount) ||
      effectiveLoopSessionsPerWeek(profile, {
        planStart: opts.planStart,
        weekIndex,
        now: opts.now,
      }),
  );

  const sessions = [];
  let sheetError = false;
  let sheetErrorMessage = null;
  let lastEducatif = opts.currentEducatif || null;
  let lastSheetN = opts.currentSheetN;
  const seedHistory = Array.isArray(opts.history) ? [...opts.history] : [];

  for (let i = 0; i < n; i++) {
    const { session, sheetError: err, sheetErrorMessage: msg } = await buildProgressionLoopSession(
      profile,
      Math.max(0, Number(cursor) || 0) + i,
      isPremium,
      {
        ordinalIndex: baseOrdinal + i,
        history: [...seedHistory, ...sessions],
        currentSheetN: lastSheetN,
        currentEducatif: lastEducatif,
        planStart: opts.planStart,
        weekIndex,
      },
    );
    if (err || !session) {
      sheetError = true;
      sheetErrorMessage = msg || "Catalogue Google Sheet indisponible";
      if (i === 0) {
        return {
          week: {
            number: weekIndex + 1,
            focus: `Semaine ${weekIndex + 1}`,
            tip: null,
            feedback: null,
            isBilan: false,
            isTest: false,
            sessions: [],
          },
          sessions: [],
          sheetError: true,
          sheetErrorMessage,
        };
      }
      break;
    }
    sessions.push(session);
    lastSheetN = session?.sheetMeta?.n ?? lastSheetN;
    lastEducatif =
      session?.sheetMeta?.educatif || session?.sheetEducatif?.name || lastEducatif;
  }

  // Affichage semaine : Séance 1 / 2 / 3 (le n° global va dans l’historique à l’archivage)
  for (let i = 0; i < sessions.length; i++) {
    sessions[i] = { ...sessions[i], title: formatLoopWeekSessionTitle(i) };
  }

  const role = resolveSheetWeekRole({
    eventDate: profile.eventDate || null,
    planStart: opts.planStart || profile.planStartedAt || profile.createdAt || null,
    weekIndex,
    now: opts.now,
  });
  const focus =
    role?.isRaceWeek
      ? "Semaine de course"
      : role?.phase === "test"
        ? "Semaine test"
        : role?.phase === "deload"
          ? "Semaine allégée"
          : `Semaine ${weekIndex + 1}`;

  const week = {
    number: weekIndex + 1,
    focus,
    tip: role?.banner || null,
    feedback: null,
    isBilan: false,
    isTest: role?.phase === "test",
    phase: role?.phase || null,
    sheetWeekRole: role || null,
    sessions,
  };

  return { week, sessions, sheetError: false, sheetErrorMessage: null };
}

/**
 * Complète weeks[0].sessions jusqu’à N sans toucher aux séances déjà présentes.
 * @returns {Promise<object|null>} plan mis à jour, ou null si rien à faire / erreur totale
 */
export async function expandLoopWeekSessions(plan, profile, isPremium = false, opts = {}) {
  if (!plan?.isSessionLoop || !profile) return null;
  const existing = Array.isArray(plan.weeks?.[0]?.sessions) ? [...plan.weeks[0].sessions] : [];
  const history = Array.isArray(plan.history) ? plan.history : [];
  const weekIndex = Math.floor(history.length / Math.max(1, Number(profile.sessionsPerWeek) || 3));
  const n = effectiveLoopSessionsPerWeek(profile, {
    planStart: opts.planStart || plan.startDate,
    weekIndex,
    now: opts.now,
  });
  if (existing.length >= n) return null;

  const cursor0 = Math.max(plan.sessionCursor ?? 0, history.length);
  const need = n - existing.length;
  const add = [];
  let lastEducatif =
    existing[existing.length - 1]?.sheetMeta?.educatif ||
    existing[existing.length - 1]?.sheetEducatif?.name ||
    null;
  let lastSheetN = existing[existing.length - 1]?.sheetMeta?.n;

  for (let i = 0; i < need; i++) {
    const ordinalIndex = history.length + existing.length + i;
    const { session, sheetError } = await buildProgressionLoopSession(
      { ...profile, taste: plan.taste || profile.taste, volumeAdj: plan.volumeAdj },
      cursor0 + existing.length + i,
      isPremium,
      {
        ordinalIndex,
        history: [...history, ...existing, ...add],
        currentSheetN: lastSheetN,
        currentEducatif: lastEducatif,
        planStart: plan.startDate,
        weekIndex,
      },
    );
    if (sheetError || !session) break;
    add.push(session);
    lastSheetN = session?.sheetMeta?.n ?? lastSheetN;
    lastEducatif =
      session?.sheetMeta?.educatif || session?.sheetEducatif?.name || lastEducatif;
  }
  if (!add.length) return null;

  const role = resolveSheetWeekRole({
    eventDate: profile.eventDate || null,
    planStart: plan.startDate,
    weekIndex,
  });
  const week0 = plan.weeks[0] || {};
  const merged = [...existing, ...add].map((s, i) => ({
    ...s,
    title: formatLoopWeekSessionTitle(i),
  }));
  return {
    ...plan,
    sessionCursor: cursor0 + existing.length + add.length - 1,
    weeks: [{
      ...week0,
      number: week0.number || weekIndex + 1,
      focus:
        week0.focus && existing.length > 0
          ? week0.focus
          : role?.isRaceWeek
            ? "Semaine de course"
            : role?.phase === "test"
              ? "Semaine test"
              : role?.phase === "deload"
                ? "Semaine allégée"
                : `Semaine ${weekIndex + 1}`,
      tip: week0.tip || role?.banner || null,
      sheetWeekRole: week0.sheetWeekRole || role || null,
      phase: week0.phase || role?.phase || null,
      sessions: merged,
    }],
  };
}

/**
 * Génère une seule séance pour le mode boucle (Nager & Progresser, triathlon, eau libre, diplôme).
 * Familles Sheet soft (Nager 01–03, XS/Sprint 04–06) : await catalogue, **pas** de fallback composeur silencieux.
 * @param {object} profile
 * @param {number} cursor — index de variété / seed (peut bouger sans validation)
 * @param {boolean} isPremium
 * @param {{ ordinalIndex?: number, history?: object[], currentSheetN?: number, currentEducatif?: string|null, planStart?: *, weekIndex?: number }} [opts]
 * @returns {Promise<{ session: object|null, focus: string, week: object, sheetError?: boolean, sheetErrorMessage?: string }>}
 */
export async function buildProgressionLoopSession(profile, cursor = 0, isPremium = false, opts = {}) {
  const c = Math.max(0, Number(cursor) || 0);
  const ordinalIndex = Math.max(
    0,
    Number(opts.ordinalIndex != null ? opts.ordinalIndex : c) || 0,
  );
  const easyPhase = c < 3;
  const family = loopFamilyFromProfile(profile);
  const sessionTitle = formatLoopSessionTitle(ordinalIndex);

  // Diplôme : templates examen (pas le générateur coach générique)
  if (family === "diplome") {
    const { variant, session: diplomaSession } = buildDiplomaLoopSessionPayload(profile, c, easyPhase);
    const session = { ...diplomaSession, title: sessionTitle };
    const week = {
      number: 1,
      focus: sessionTitle,
      tip: null,
      feedback: null,
      isBilan: false,
      isTest: false,
      sessions: [session],
    };
    return { session, focus: sessionTitle, week };
  }

  const variants = loopVariantsForEvent(family, profile.goal);
  const easyVariants = LOOP_EASY_BY_FAMILY[family] || LOOP_EASY_BY_FAMILY.progression;
  const variant = easyPhase
    ? easyVariants[c % easyVariants.length]
    : variants[(c - 3) % variants.length];

  const niveauKey = mapNiveau(profile);
  const profilObj = mapObjectifProfil(profile);
  const sport = buildSportProfile(profile);
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
  const wishHints = trainingWishToHints(profile.trainingWishMeta || profile.trainingWish, {
    equipmentOwned: Array.isArray(profile.equipment) ? profile.equipment : null,
  });
  const wishedRoles = biasRolesForTrainingWish(roles, wishHints);
  const role = wishedRoles[0] || variant.role;
  const focusLabel = variant.focus;
  const weekNum = c + 1;

  let session = null;
  let sheetError = false;
  let sheetErrorMessage = null;

  // Catalogue Google Sheet — familles soft : source obligatoire (pas de composeur de secours)
  const sheetFamily = sheetFamilyIdFromProfile(profile);
  const sheetLocked = Boolean(sheetFamily) && isNatationSheetCatalogueEnabled();

  if (sheetLocked) {
    try {
      const excludeNs = [];
      const curN = opts.currentSheetN;
      if (curN != null && Number.isFinite(Number(curN))) excludeNs.push(Number(curN));
      const fromSheet = await composeFromNatationSheet(
        { ...profile, equipment: sport.equipment },
        {
          cursor: c,
          history: opts.history || [],
          excludeNs,
          currentEducatif: opts.currentEducatif || null,
          isPremium: !!isPremium,
          ordinalIndex: opts.ordinalIndex ?? c,
          planStart: opts.planStart || profile.planStartedAt || null,
          weekIndex: opts.weekIndex,
        },
      );
      if (fromSheet) {
        session = {
          ...fromSheet,
          title: sessionTitle,
          objectives: variant.objectives,
        };
      }
    } catch (err) {
      console.warn("[natation-sheet] loop", err?.message || err);
      sheetErrorMessage = err?.message || String(err);
    }
    if (!session) {
      sheetError = true;
      sheetErrorMessage =
        sheetErrorMessage || `Catalogue Sheet «${sheetFamily}» indisponible`;
      const week = {
        number: 1,
        focus: sessionTitle,
        tip: null,
        feedback: null,
        isBilan: false,
        isTest: false,
        sessions: [],
      };
      return { session: null, focus: sessionTitle, week, sheetError, sheetErrorMessage };
    }
  }

  // Composeur pédagogique — uniquement hors familles Sheet soft (Oly+ / OW / etc.)
  if (!session && !sheetLocked && isComposerEnabledForLevel(sport.level)) {
    const preferred = normalizeTargetSessionDistance(profile.targetSessionDistance, sport.level);
    const baseVol =
      preferred ||
      (sport.level === "decouverte"
        ? 800
        : sport.level === "regulier"
          ? 1600
          : sport.level === "sportif"
            ? 2200
            : 2800);
    const volumeTarget = Math.max(
      500,
      Math.round((baseVol * (easyPhase ? 0.85 : 1) * Math.min(1.15, Math.max(0.75, volMult))) / 50) * 50,
    );
    const family = String(role.objectif || "").startsWith("technique")
      ? "technique"
      : role.objectif === "vitesse"
        ? "vitesse"
        : role.zone === "Z3"
          ? "seuil"
          : role.objectif === "mixte"
            ? "endurance"
            : "endurance";
    const sessionIntent =
      family === "technique"
        ? sport.level === "decouverte"
          ? "aisance"
          : "technique_endurance"
        : family === "vitesse"
          ? "vitesse"
          : family === "seuil"
            ? sport.level === "regulier"
              ? "allure_progressive"
              : "seuil"
            : "endurance";
    const brief = buildSessionBrief({
      sport: { ...sport, sessionsPerWeek: 1 },
      weekCtx: {
        volumePlan: {
          sessionTargets: [volumeTarget],
          weekTarget: volumeTarget,
          lever: "volume",
          typeSemaine,
        },
        phaseKey,
        effectivePhase: easyPhase ? "base" : "development",
      },
      role: {
        ...role,
        family,
        intent: sessionIntent,
        sessionIntent,
        qualitySession: role.zone === "Z3" || role.zone === "Z4",
      },
      weekIndex: c,
      sessionIndex: 0,
      durationTarget: Number(profile.sessionDuration || profile.duration) || (easyPhase ? 35 : 45),
      seed: `loop|${sport.level}|c${c}|${variant.id}|${volumeTarget}`,
    });
    const result = composeSession(brief);
    if (result.ok && result.session) {
      session = {
        ...result.session,
        title: sessionTitle,
        objectives: variant.objectives,
        loopVariant: variant.id,
        composedBy: "session-composer",
      };
    } else {
      logComposerFallback(result.reason || "loop compose failed", {
        level: sport.level,
        weekIndex: c,
        sessionIndex: 0,
        seed: brief.seed,
      });
    }
  }

  if (!session) {
  const useConfirmeBank = usesConfirmeArchetypeBank(niveauKey, profilObj) && !easyPhase;
  const bankOpts = { isPremium: !!isPremium, pace100: profile.pace100 ?? null };
  const bankLevel =
    profile.level === "advanced" || profile.level === "performance"
      ? profile.level
      : "performance";

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
      wishedRoles,
      { volMult, simplifyWording, pool, tasteHints },
    );
    const raw = weekData.sessions[0];
    session = {
      ...toMySwymSession(raw, role, weekNum, 0, focusLabel, beginnerFriendly),
      title: sessionTitle,
      objectives: variant.objectives,
      loopVariant: variant.id,
    };
  }
  }

  // Ancre distance moyenne — pas sur les séances Sheet (on garde le cahier tel quel)
  const sportLevel =
    profile.level === "découverte" || profile.level === "beginner"
      ? "decouverte"
      : profile.level === "régulier"
        ? "regulier"
        : profile.level === "sportif"
          ? "sportif"
          : profile.level === "performance" || profile.level === "advanced"
            ? "performance"
            : "regulier";
  const preferred = normalizeTargetSessionDistance(profile.targetSessionDistance, sportLevel);
  if (
    preferred &&
    session &&
    session.composedBy !== "session-composer" &&
    session.composedBy !== "natation-sheet"
  ) {
    const scale = sessionDistancePhaseScale({
      typeSemaine,
      effectivePhase: easyPhase ? "base" : "development",
    });
    const target = Math.max(400, Math.round((preferred * scale * (easyPhase ? 0.9 : 1)) / 50) * 50);
    const base =
      session.trainingDistance ||
      parseInt(String(session.distance || "").replace(/\D/g, ""), 10) ||
      0;
    if (base > 200 && Math.abs(base - target) / target > 0.08) {
      session = scaleSessionLinesToVolume(session, base, target, { lever: "reps" });
      session.trainingDistance =
        session.volumeFromDetails ||
        parseInt(String(session.distance || "").replace(/\D/g, ""), 10) ||
        target;
    }
  }

  // Titre boucle = numéro de séance (cursor 0 → n°1 ; +1 à chaque validation)
  if (session) {
    session = { ...session, title: sessionTitle };
  }

  const week = {
    number: 1,
    focus: sessionTitle,
    tip: null,
    feedback: null,
    isBilan: false,
    isTest: false,
    sessions: [session],
  };

  return { session, focus: sessionTitle, week, sheetError: false };
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
