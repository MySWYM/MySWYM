/**
 * Construction des phases de plan — orchestration calendaire (pas le contenu des séances).
 * Aligné sur App.jsx (buildPlanPhases / buildWellnessPhases / computePlanTotalWeeks).
 * Ne calcule PAS volume, composer, readiness, ni séances.
 */

const WELLNESS_GOALS = new Set(["reprendre", "perte_de_poids"]);

export function isWellnessGoal(goalId) {
  return WELLNESS_GOALS.has(goalId);
}

export function isProgressionGoal(goalId) {
  return goalId === "progression" || String(goalId || "").startsWith("prog_");
}

/** Tips UI — identiques App.jsx TIPS (affichage semaine, pas logique moteur). */
export const PLAN_TIPS = {
  debut:
    "Priorité à la régularité sur l'intensité. Concentre-toi sur la position du corps dans l'eau — plus tu es horizontal, moins tu freines.",
  aerobie:
    "Travaille la respiration bilatérale (3 temps). Un appui symétrique des deux côtés améliore la rotation et l'efficacité de nage.",
  endurance:
    "Si tu dois t'arrêter, c'est que tu vas trop vite. Ralentis jusqu'à trouver une allure où tu pourrais tenir une conversation courte.",
  seuil:
    "Le seuil doit être inconfortable mais régulier. Utilise un chrono — la constance des temps de passage est le seul indicateur qui compte.",
  vitesse:
    "Récupération complète entre chaque sprint. Sans ça, tu travailles l'endurance, pas la vitesse. Qualité absolue > quantité.",
  volume:
    "Semaine de charge maximale. Mange +15 % de glucides, vise 8 h de sommeil — c'est pendant la récupération que le corps s'adapte.",
  affutage:
    "Réduis le volume de 40 % mais maintiens 2–3 accélérations par séance pour garder la réactivité musculaire.",
  competition:
    "Dernière semaine avant l'événement : 1–2 séances courtes, volume bas, rappels de vitesse (12,5 m max). Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.",
  test: "Semaine chrono : note ton T100 (100 m, départ dans l'eau). Compare avec le test précédent — c'est la seule façon de voir si tu évolues vraiment.",
};

export function buildWellnessPhases(totalWeeks) {
  const phases = [];
  const testAt = totalWeeks >= 6 ? Math.floor(totalWeeks / 2) : -1;
  for (let i = 0; i < totalWeeks; i++) {
    if (i === testAt) {
      phases.push({
        phase: "test",
        focus: "Test de progression",
        progression: 1.1,
        tipKey: "test",
        isTest: true,
      });
      continue;
    }
    const t = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;
    const isBase = t < 0.5;
    phases.push({
      phase: isBase ? "base" : "development",
      focus:
        t < 0.25
          ? "Mise en mouvement"
          : t < 0.5
            ? "Construction"
            : t < 0.75
              ? "Progression"
              : "Consolidation",
      progression: 1.0 + t * 0.35,
      tipKey: t < 0.4 ? "debut" : "endurance",
      isTest: false,
    });
  }
  return phases;
}

export function buildPlanPhases(totalWeeks) {
  if (totalWeeks === 1) {
    return [
      {
        phase: "competition",
        focus: "Semaine de compétition",
        progression: 0.6,
        tipKey: "competition",
      },
    ];
  }
  if (totalWeeks === 2) {
    return [
      { phase: "base", focus: "Mise en jambes", progression: 1.0, tipKey: "debut" },
      {
        phase: "competition",
        focus: "Semaine de compétition",
        progression: 0.6,
        tipKey: "competition",
      },
    ];
  }
  if (totalWeeks === 3) {
    return [
      { phase: "base", focus: "Mise en jambes", progression: 1.0, tipKey: "debut" },
      {
        phase: "development",
        focus: "Développement",
        progression: 1.2,
        tipKey: "endurance",
      },
      {
        phase: "competition",
        focus: "Semaine de compétition",
        progression: 0.6,
        tipKey: "competition",
      },
    ];
  }
  if (totalWeeks === 4) {
    return [
      { phase: "base", focus: "Mise en jambes", progression: 1.0, tipKey: "debut" },
      {
        phase: "development",
        focus: "Développement",
        progression: 1.2,
        tipKey: "endurance",
      },
      {
        phase: "test",
        focus: "Test de progression",
        progression: 1.1,
        tipKey: "test",
        isTest: true,
      },
      {
        phase: "competition",
        focus: "Semaine de compétition",
        progression: 0.6,
        tipKey: "competition",
      },
    ];
  }

  const compWeeks = 1;
  const taperWeeks = totalWeeks >= 10 ? 2 : totalWeeks >= 6 ? 1 : 0;
  const testSlots = totalWeeks >= 10 ? 2 : totalWeeks >= 5 ? 1 : 0;
  const remaining = totalWeeks - compWeeks - taperWeeks - testSlots;
  const peakCount = Math.max(1, Math.round(remaining * 0.2));
  const devCount = Math.max(1, Math.round(remaining * 0.38));
  const baseCount = Math.max(1, remaining - peakCount - devCount);
  const phases = [];

  for (let i = 0; i < baseCount; i++) {
    const t = baseCount > 1 ? i / (baseCount - 1) : 0;
    phases.push({
      phase: "base",
      focus: t < 0.45 ? "Mise en jambes" : "Construction aérobie",
      progression: 1.0 + t * 0.28,
      tipKey: t < 0.45 ? "debut" : "aerobie",
      isTest: false,
    });
  }
  if (testSlots >= 1) {
    phases.push({
      phase: "test",
      focus: "Test de progression",
      progression: 1.1,
      tipKey: "test",
      isTest: true,
    });
  }
  for (let i = 0; i < devCount; i++) {
    const t = devCount > 1 ? i / (devCount - 1) : 0;
    phases.push({
      phase: "development",
      focus: t < 0.5 ? "Développement endurance" : "Travail au seuil",
      progression: 1.28 + t * 0.22,
      tipKey: t < 0.5 ? "endurance" : "seuil",
      isTest: false,
    });
  }
  if (testSlots >= 2) {
    phases.push({
      phase: "test",
      focus: "Contrôle allure",
      progression: 1.3,
      tipKey: "test",
      isTest: true,
    });
  }
  for (let i = 0; i < peakCount; i++) {
    const t = peakCount > 1 ? i / (peakCount - 1) : 0;
    phases.push({
      phase: "peak",
      focus: t < 0.5 ? "Intensité & vitesse" : "Volume maximum",
      progression: 1.5 + t * 0.1,
      tipKey: t < 0.5 ? "vitesse" : "volume",
      isTest: false,
    });
  }
  if (taperWeeks === 2) {
    phases.push({
      phase: "taper",
      focus: "Affûtage — volume ↓",
      progression: 1.1,
      tipKey: "affutage",
      isTest: false,
    });
    phases.push({
      phase: "taper",
      focus: "Affûtage final",
      progression: 0.9,
      tipKey: "affutage",
      isTest: false,
    });
  } else if (taperWeeks === 1) {
    phases.push({
      phase: "taper",
      focus: "Affûtage",
      progression: 1.05,
      tipKey: "affutage",
      isTest: false,
    });
  }
  phases.push({
    phase: "competition",
    focus: "Semaine de compétition",
    progression: 0.6,
    tipKey: "competition",
    isTest: false,
  });
  return phases;
}

export function computePlanTotalWeeks(profile, referenceTime = Date.now(), weeksOverride = null) {
  if (weeksOverride != null) {
    const n = Math.round(Number(weeksOverride));
    if (Number.isFinite(n)) return Math.min(52, Math.max(1, n));
  }

  const { goal } = profile || {};
  if (isProgressionGoal(goal)) return 12;

  if (isWellnessGoal(goal)) {
    if (goal === "perte_de_poids") {
      const loss = Math.max(
        0,
        (parseFloat(profile.weightCurrent) || 0) - (parseFloat(profile.weightGoal) || 0),
      );
      return loss > 0 ? Math.min(16, Math.max(4, Math.ceil(loss * 2))) : 8;
    }
    if (goal === "reprendre") return 6;
    return 8;
  }

  const eventDate = profile?.eventDate ? new Date(profile.eventDate) : null;
  if (!eventDate || Number.isNaN(eventDate.getTime())) return 8;
  const refDate = new Date(referenceTime);
  return Math.min(52, Math.max(1, Math.ceil((eventDate - refDate) / (7 * 86400000))) || 8);
}

export function buildPhaseListForProfile(profile, referenceTime = Date.now(), weeksOverride = null) {
  const rawWeeks = computePlanTotalWeeks(profile, referenceTime, weeksOverride);
  const phaseList = isWellnessGoal(profile?.goal)
    ? buildWellnessPhases(rawWeeks)
    : buildPlanPhases(rawWeeks);
  return { rawWeeks, phaseList };
}
