/**
 * Catalogues onboarding / profil — extrait App.jsx vague 2.
 */
import {
  Activity, Waves, Shield, Award, Trophy, RotateCcw, Target, TrendingUp,
} from "lucide-react";
import i18n from "../i18n/index.js";
import { canonicalizeGoal } from "./sports-engine/race-event.js";
import { isAvanceLevelId, isDebutantLevelId } from "./onboarding-level-gate.js";

export const GOALS = [
  { id: "triathlon_xs",      label: "Triathlon XS",           dist: "400 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_sprint",  label: "Triathlon Sprint",       dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon Olympique",     dist: "1 500 m nage",                icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_half",    label: "Triathlon Half",         dist: "1 900 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_ironman", label: "Triathlon Full",         dist: "3 800 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_short",  label: "Eau libre courte",       dist: "500 m à 1,5 km",               icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_mid",    label: "Eau libre moyenne",      dist: "2 km à 5 km",                  icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_long",   label: "Eau libre longue",       dist: "7,5 km et +",                  icon: <Waves size={20} />,    wellness: false },
  { id: "bnssa",             label: "Prépa BNSSA",            dist: "100 m & 250 m sauvetage",      icon: <Shield size={20} />,   wellness: false },
  { id: "bpjeps_aan",        label: "Prépa BPJEPS AAN",       dist: "400 m NL < 7'40\" · 100 m 4 nages < 1'50\"", icon: <Award size={20} />, wellness: false },
  { id: "caepmns",           label: "Prépa CAEPMNS",          dist: "300 m palmes · parcours sauvetage", icon: <Shield size={20} />, wellness: false },
  { id: "tests_pompiers",    label: "Tests Pompiers",         dist: "400 m NL + 50 m sauvetage",    icon: <Shield size={20} />,   wellness: false },
  { id: "competition_maitre",label: "Compétition Maître",     dist: "50–1 500 m",                   icon: <Trophy size={20} />,   wellness: false },
  { id: "reprendre",         label: "Reprendre la natation",  dist: "6 semaines · en douceur",      icon: <RotateCcw size={20} />, wellness: true },
  { id: "perte_de_poids",    label: "Activité physique",       dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
];

// Catégories onboarding (step 1)
export const CATEGORIES = [
  { id: "progression", label: "Nager & Progresser",  Icon: TrendingUp,  desc: "Séance du jour · Progresser à ton rythme" },
  { id: "triathlon",   label: "Triathlon",            Icon: Activity,    desc: "Séance du jour · XS · Sprint · Oly · Half · Full" },
  { id: "eau_libre",   label: "Eau libre",            Icon: Waves,       desc: "Séance du jour · Courte · Moyenne · Longue" },
  { id: "diplome",     label: "Prépa diplôme",        Icon: Award,       desc: "Séance du jour · BNSSA · BPJEPS · CAEPMNS", comingSoon: true },
];

// Sous-objectifs par catégorie
export const SUB_GOALS = {
  triathlon: [
    { id: "triathlon_xs",      label: "XS",             dist: "400 m nage" },
    { id: "triathlon_sprint",  label: "Sprint",         dist: "750 m nage" },
    { id: "triathlon_olympic", label: "Olympique",      dist: "1 500 m nage" },
    { id: "triathlon_half",    label: "Half",           dist: "1 900 m nage" },
    { id: "triathlon_ironman", label: "Full",           dist: "3 800 m nage" },
  ],
  eau_libre: [
    { id: "open_water_short", label: "Courte",  dist: "500 m à 1,5 km" },
    { id: "open_water_mid",   label: "Moyenne", dist: "2 km à 5 km" },
    { id: "open_water_long",  label: "Longue",  dist: "7,5 km et +" },
  ],
  diplome: [
    { id: "bnssa",      label: "BNSSA",      dist: "100 m & 250 m sauvetage" },
    { id: "bpjeps_aan", label: "BPJEPS AAN", dist: "400 m NL < 7'40\" · 100 m 4 nages < 1'50\"" },
    { id: "caepmns",    label: "CAEPMNS",    dist: "300 m palmes · parcours sauvetage" },
  ],
};

export const isWellnessGoal = (goalId) => findGoalById(goalId)?.wellness === true;
export const isProgressionGoal = (goalId) => goalId === "progression" || goalId?.startsWith("prog_");

/** Lookup catalogue, y compris IDs eau libre legacy (5k, 25k…). */
export function findGoalById(goalId, list = GOALS) {
  const id = canonicalizeGoal(goalId);
  return list.find((g) => g.id === id) || list.find((g) => g.id === goalId);
}
// Niveaux onboarding = capacité (IDs moteur inchangés). Découverte = legacy, plus proposée.
export const LEVELS = [
  {
    id: "régulier",
    label: "Débutant",
    desc: "Je sais nager des longueurs, mais je suis encore en train d'apprendre",
    detail: "Je nage des longueurs, j'apprends encore à m'entraîner",
    color: "#00C48C",
    bg: "#E6FFF6",
    dot: 1,
  },
  {
    id: "sportif",
    label: "Intermédiaire",
    desc: "Je suis à l'aise dans la piscine, mais je veux m'améliorer",
    detail: "À l'aise au bassin, je veux structurer ma progression",
    color: "#0057FF",
    bg: "#EEF3FF",
    dot: 2,
  },
  {
    id: "performance",
    label: "Avancé",
    desc: "Je suis un nageur expérimenté",
    detail: "Nageur expérimenté, je m'entraîne avec régularité",
    color: "#7C3AED",
    bg: "#EDE9FE",
    dot: 3,
  },
  {
    id: "découverte",
    label: "Découverte",
    desc: "Je m'arrête après quelques longueurs",
    detail: "Moins de 4 longueurs sans pause, ou je reprends après un arrêt",
    color: "#00B4D8",
    bg: "#E0F7FA",
    dot: 0,
    legacy: true,
  },
];

export const ONBOARDING_LEVELS = LEVELS.filter((l) => !l.legacy);

export function levelsForPicker(currentId) {
  return LEVELS.filter((l) => !l.legacy || l.id === currentId);
}

export function findLevelById(levelId) {
  return LEVELS.find((l) => l.id === levelId);
}

// Rétro-compat anciens IDs → index 0-3
export const getLvlIndex = (level) => ({
  découverte: 0, beginner: 1, régulier: 1,
  intermediate: 2, sportif: 2,
  advanced: 3, performance: 3,
}[level] ?? 1);

export const FREQUENCIES = [
  { id: 1, label: "1×/semaine",  desc: "Je suis occupé·e" },
  { id: 2, label: "2×/semaine",  desc: "Mon rythme idéal" },
  { id: 3, label: "3×/semaine",  desc: "Je suis motivé·e" },
  { id: 4, label: "4×/semaine",  desc: "Je suis sérieux·se" },
  { id: 5, label: "5×/semaine",  desc: "Mode compétition" },
];

export const POOLS = [{ id: 25, label: "25 m" }, { id: 50, label: "50 m" }];

/** Style d'entraînement — stocké crawl | 4_nages (UX : sais-tu nager du 4 nages ?) */
export const SWIM_STYLES = [
  { id: "crawl", label: "Non", desc: "Je nage surtout en crawl" },
  { id: "4_nages", label: "Oui", desc: "Je sais nager les quatre nages" },
];

/** Diplômes : pas de choix 4 nages (prépa spécifique). Tri / eau libre : choix autorisé. */
export const DIPLOMA_GOAL_IDS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"]);
export const goalHidesFourNagesChoice = (profile = {}) => {
  const cat = String(profile.category || "");
  const goal = String(profile.goal || "");
  return cat === "diplome" || DIPLOMA_GOAL_IDS.has(goal);
};

/** Pas de question 4 nages : diplômes, Débutant (crawl), Avancé (4 nages). */
export const hidesFourNagesChoice = (profile = {}) =>
  goalHidesFourNagesChoice(profile)
  || isDebutantLevelId(profile.level)
  || isAvanceLevelId(profile.level);

/** Nage préférée (stroke) */
export const PREFERRED_STROKES = [
  { id: "crawl", label: "Crawl" },
  { id: "dos", label: "Dos" },
  { id: "brasse", label: "Brasse" },
  { id: "papillon", label: "Papillon" },
];

export const STROKE_LABELS = Object.fromEntries(PREFERRED_STROKES.map((s) => [s.id, s.label]));
export const STYLE_LABELS = { crawl: "Crawl", "4_nages": "4 nages" };

/** Matériel — édité dans Profil (plus dans le questionnaire) et affiché sur les séances. */
export const EQUIPMENT_OPTS = [
  { id: "palmes" },
  { id: "tuba" },
  { id: "pull" },
  { id: "planche" },
  { id: "plaquettes" },
];
export const eqLabel = (id) => i18n.t(`equipment.${id}`, { ns: "onboarding", defaultValue: id });
