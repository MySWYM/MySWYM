/**
 * Profil nageur persistant vs objectif de plan.
 * Source de vérité compte : sport_profiles (+ miroir dans le plan actif pour offline).
 * Un utilisateur = un profil ; un seul plan actif (plans_json length ≤ 1).
 */

export const SWIMMER_PROFILE_KEYS = Object.freeze([
  "level",
  "pool",
  "sessionsPerWeek",
  "birthMonth",
  "birthYear",
  "age", // dérivé de birthMonth/birthYear (miroir legacy)
  "weightKg",
  "heightCm",
  "equipment",
  "swimStyle",
  "preferredStroke",
  "targetSessionDistance",
  "injuryStatus",
  "injuryZone",
  "injurySeverity",
  "injuryNote",
  "healthConsent",
  "healthConsentAt",
  "healthDeclaration",
  "pace100",
  "readinessProfile",
  "sessionDuration",
]);

/** Mois de naissance (1–12) — libellés FR pour selects. */
export const BIRTH_MONTH_OPTIONS = Object.freeze([
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
]);

/**
 * Âge en années révolues depuis mois + année de naissance.
 * Sans jour : anniversaire traité au 1er du mois de naissance.
 */
export function computeAgeFromBirth(birthMonth, birthYear, now = new Date()) {
  const year = Number(birthYear);
  const month = Number(birthMonth);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  const y = Math.round(year);
  const m = Math.round(month);
  const maxYear = now.getFullYear();
  if (y < 1900 || y > maxYear || m < 1 || m > 12) return null;
  let age = maxYear - y;
  const nowMonth = now.getMonth() + 1;
  if (nowMonth < m) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

/** Normalise mois/année et recalcule `age` si possible (sinon conserve age legacy). */
export function withDerivedAge(profile = {}, now = new Date()) {
  if (!profile || typeof profile !== "object") return {};
  const out = { ...profile };

  const monthNum =
    profile.birthMonth != null && profile.birthMonth !== ""
      ? Math.round(Number(profile.birthMonth))
      : null;
  const yearNum =
    profile.birthYear != null && profile.birthYear !== ""
      ? Math.round(Number(profile.birthYear))
      : null;

  if (Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
    out.birthMonth = monthNum;
  } else if (profile.birthMonth === "") {
    out.birthMonth = "";
  }

  const maxYear = now.getFullYear();
  if (Number.isFinite(yearNum) && yearNum >= 1900 && yearNum <= maxYear) {
    out.birthYear = yearNum;
  } else if (profile.birthYear === "") {
    out.birthYear = "";
  }

  const derived = computeAgeFromBirth(out.birthMonth, out.birthYear, now);
  if (derived != null) {
    out.age = derived;
  } else if (profile.age != null && profile.age !== "") {
    const a = Number(profile.age);
    if (Number.isFinite(a)) out.age = Math.round(a);
  }
  return out;
}

export const PLAN_OBJECTIVE_KEYS = Object.freeze([
  "category",
  "goal",
  "eventDate",
  "raceTarget",
  "trainingFocus",
  "trainingWish",
  "trainingWishMeta",
]);

/** Champs indispensables pour générer sans re-questionnaire profil. */
export const REQUIRED_SWIMMER_FIELDS = Object.freeze([
  "level",
  "pool",
  "sessionsPerWeek",
  "swimStyle",
  "preferredStroke",
]);

export const TRAINING_FOCUS_OPTIONS = Object.freeze([
  {
    id: "technique",
    label: "Technique & sensations",
    desc: "Éducatifs, fluidité, meilleure nage",
  },
  {
    id: "endurance",
    label: "Endurance & régularité",
    desc: "Volume maîtrisé, rythme durable",
  },
  {
    id: "intensite",
    label: "Intensité & vitesse",
    desc: "Allures, reprises, travail de vitesse",
  },
  {
    id: "plaisir",
    label: "Plaisir & variété",
    desc: "Séances variées, motivation, fun",
  },
]);

const EQUIPMENT_IDS = new Set([
  "planche",
  "pull",
  "palmes",
  "tuba",
  "plaquettes",
  "elastique",
]);

function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== "object") return out;
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export function normalizeEquipment(equipment) {
  if (!Array.isArray(equipment)) return equipment == null ? null : [];
  return equipment.filter((id) => EQUIPMENT_IDS.has(id));
}

/** Extrait les champs stables du nageur depuis un profil / row / plan. */
export function extractSwimmerProfile(source = {}) {
  const raw = pick(source, SWIMMER_PROFILE_KEYS);
  if (raw.equipment !== undefined) {
    raw.equipment = normalizeEquipment(raw.equipment);
  }
  if (raw.pool != null) raw.pool = Number(raw.pool) === 50 ? 50 : 25;
  if (raw.sessionsPerWeek != null && raw.sessionsPerWeek !== "") {
    const n = Number(raw.sessionsPerWeek);
    if (Number.isFinite(n)) raw.sessionsPerWeek = Math.max(1, Math.min(5, n));
  }
  return withDerivedAge(raw);
}

/** Extrait l'objectif / préférences de cycle (plan). */
export function extractPlanObjective(source = {}) {
  return pick(source, PLAN_OBJECTIVE_KEYS);
}

/** Fusion pour le générateur : profil + objectif + contraintes. */
export function mergeForGeneration(swimmerProfile = {}, objective = {}, extras = {}) {
  const equipment = normalizeEquipment(
    swimmerProfile.equipment !== undefined ? swimmerProfile.equipment : extras.equipment,
  );
  return {
    ...extractSwimmerProfile(swimmerProfile),
    ...extractPlanObjective(objective),
    ...extras,
    equipment: Array.isArray(equipment) ? equipment : [],
  };
}

export function missingSwimmerProfileFields(profile = {}) {
  const missing = [];
  for (const key of REQUIRED_SWIMMER_FIELDS) {
    const v = profile[key];
    if (v == null || v === "") missing.push(key);
  }
  // equipment : null = inconnu (à demander) ; [] = aucun matos (ok)
  if (!Array.isArray(profile.equipment)) missing.push("equipment");
  return missing;
}

export function isSwimmerProfileComplete(profile) {
  return missingSwimmerProfileFields(profile).length === 0;
}

/**
 * Mode questionnaire :
 * - full : première fois / profil incomplet
 * - goal : profil complet → objectif + focus seulement
 */
export function resolveQuestionnaireMode(swimmerProfile, { replacing = false } = {}) {
  if (isSwimmerProfileComplete(swimmerProfile)) return "goal";
  if (replacing && isSwimmerProfileComplete(swimmerProfile)) return "goal";
  return "full";
}

/**
 * Garantit au plus un plan actif.
 * Les autres entrées vont en historique (sans doublon d'id).
 */
export function enforceSingleActivePlan(plans = [], activeId = null, history = []) {
  const list = Array.isArray(plans) ? plans.filter(Boolean) : [];
  const hist = Array.isArray(history) ? [...history] : [];
  if (list.length === 0) {
    return { plans: [], activeId: null, history: hist };
  }

  let active =
    (activeId && list.find((e) => e.id === activeId)) ||
    list[0];
  const activePlanId = active?.id || null;

  for (const e of list) {
    if (!e?.id || e.id === activePlanId) continue;
    if (!hist.some((h) => h?.id === e.id)) {
      hist.push({
        ...e,
        archivedAt: e.archivedAt || new Date().toISOString(),
        archiveReason: e.archiveReason || "single_active_enforced",
      });
    }
  }

  return {
    plans: active ? [active] : [],
    activeId: activePlanId,
    history: hist,
  };
}

/**
 * Remplace le plan actif : ancien → historique, nouveau devient seul actif.
 */
export function replaceActivePlan(plans = [], history = [], newEntry, previousActiveId = null) {
  const hist = Array.isArray(history) ? [...history] : [];
  const list = Array.isArray(plans) ? plans : [];
  const prevId = previousActiveId || list[0]?.id || null;

  for (const e of list) {
    if (!e?.id || e.id === newEntry?.id) continue;
    if (!hist.some((h) => h?.id === e.id)) {
      hist.push({
        ...e,
        archivedAt: new Date().toISOString(),
        archiveReason: e.id === prevId ? "replaced" : "single_active_enforced",
      });
    }
  }

  return {
    plans: newEntry ? [newEntry] : [],
    activeId: newEntry?.id || null,
    history: hist,
  };
}

/** Prefill questionnaire depuis profil persisté + objectif draft. */
export function buildQuestionnaireDraft(swimmerProfile = {}, objective = {}) {
  return {
    category: "",
    goal: "",
    eventDate: "",
    trainingFocus: null,
    level: "",
    pool: 50,
    sessionsPerWeek: null,
    birthMonth: "",
    birthYear: "",
    age: "",
    weightKg: "",
    heightCm: "",
    injuryStatus: null,
    injuryZone: null,
    injurySeverity: null,
    injuryNote: "",
    healthConsent: false,
    healthConsentAt: null,
    healthDeclaration: false,
    swimStyle: null,
    preferredStroke: null,
    equipment: null,
    pace100: null,
    targetSessionDistance: null,
    trainingWish: "",
    trainingWishMeta: null,
    ...extractSwimmerProfile(swimmerProfile),
    ...extractPlanObjective(objective),
  };
}

/** Merge sport_profiles row fields + plan blob profile (blob wins for equipment if set). */
export function hydrateSwimmerFromSources({ sportRowFields = {}, planProfile = {} } = {}) {
  const fromSport = extractSwimmerProfile(sportRowFields);
  const fromPlan = extractSwimmerProfile(planProfile);
  const merged = { ...fromSport, ...fromPlan };
  // Prefer account sport_profiles for stable fields when plan lacks them
  for (const key of REQUIRED_SWIMMER_FIELDS) {
    if ((merged[key] == null || merged[key] === "") && fromSport[key] != null && fromSport[key] !== "") {
      merged[key] = fromSport[key];
    }
  }
  if (!Array.isArray(merged.equipment) && Array.isArray(fromSport.equipment)) {
    merged.equipment = fromSport.equipment;
  }
  return merged;
}
