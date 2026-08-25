/**
 * Catalogues onboarding / profil — extrait App.jsx vague 2.
 */
import {
  Activity, Waves, Shield, Award, Trophy, RotateCcw, Target, TrendingUp,
} from "lucide-react";
import i18n from "../i18n/index.js";

export const GOALS = [
  { id: "triathlon_xs",      label: "Triathlon XS",           dist: "300–400 m nage",               icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_sprint",  label: "Triathlon S · Sprint",   dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon M · Olympique", dist: "1 500 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_half",    label: "Triathlon L · Half-Ironman", dist: "1 900 m nage",              icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_ironman", label: "Triathlon XXL · Ironman", dist: "3 800 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_500",   label: "Eau libre 500 m",        dist: "500 m",                        icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_1k",     label: "Eau libre 1 km",         dist: "1 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_2_5k",   label: "Eau libre 2,5 km",       dist: "2,5 km",                       icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_5k",     label: "Eau libre 5 km",         dist: "5 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_10k",    label: "Eau libre 10 km",        dist: "10 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_25k",    label: "Eau libre 25 km",        dist: "25 km",                        icon: <Waves size={20} />,    wellness: false },
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
  { id: "triathlon",   label: "Triathlon",            Icon: Activity,    desc: "Séance du jour · XS · S · M · L · XXL" },
  { id: "eau_libre",   label: "Eau libre",            Icon: Waves,       desc: "Séance du jour · 500 m à 25 km" },
  { id: "diplome",     label: "Prépa diplôme",        Icon: Award,       desc: "Séance du jour · BNSSA · BPJEPS · CAEPMNS" },
];

// Sous-objectifs par catégorie
export const SUB_GOALS = {
  triathlon: [
    { id: "triathlon_xs",      label: "XS",                dist: "300–400 m · 8–10 km vélo · 2–2,5 km CAP · 10,3–12,9 km" },
    { id: "triathlon_sprint",  label: "S · Sprint",        dist: "750 m · 20 km vélo · 5 km CAP · 25,7 km" },
    { id: "triathlon_olympic", label: "M · Olympique",     dist: "1,5 km · 40 km vélo · 10 km CAP · 51,5 km" },
    { id: "triathlon_half",    label: "L · Half-Ironman",  dist: "1,9 km · 90 km vélo · 21,1 km CAP · 113 km" },
    { id: "triathlon_ironman", label: "XXL · Ironman",     dist: "3,8 km · 180 km vélo · 42,195 km CAP · 226 km" },
  ],
  eau_libre: [
    { id: "open_water_500",  label: "500 m",  dist: "Eau vive" },
    { id: "open_water_1k",   label: "1 km",   dist: "Eau vive" },
    { id: "open_water_2_5k", label: "2,5 km", dist: "Eau vive" },
    { id: "open_water_5k",   label: "5 km",   dist: "Eau vive" },
    { id: "open_water_10k",  label: "10 km",  dist: "Eau vive" },
    { id: "open_water_25k",  label: "25 km",  dist: "Eau vive" },
  ],
  diplome: [
    { id: "bnssa",      label: "BNSSA",      dist: "100 m & 250 m sauvetage" },
    { id: "bpjeps_aan", label: "BPJEPS AAN", dist: "400 m NL < 7'40\" · 100 m 4 nages < 1'50\"" },
    { id: "caepmns",    label: "CAEPMNS",    dist: "300 m palmes · parcours sauvetage" },
  ],
};

export const isWellnessGoal = (goalId) => GOALS.find(g => g.id === goalId)?.wellness === true;
export const isProgressionGoal = (goalId) => goalId === "progression" || goalId?.startsWith("prog_");
// 4 niveaux mesurables — auto-évaluation physique + logique
export const LEVELS = [
  {
    id: "découverte",
    label: "Découverte",
    desc: "Je m'arrête après quelques longueurs",
    detail: "Moins de 4 longueurs sans pause, ou je reprends après un arrêt",
    color: "#00B4D8",
    bg: "#E0F7FA",
    dot: 1,
  },
  {
    id: "régulier",
    label: "Régulier",
    desc: "Je tiens 400m sans m'arrêter",
    detail: "Je peux enchaîner sans forcer, mais je ne travaille pas encore mes allures",
    color: "#00C48C",
    bg: "#E6FFF6",
    dot: 2,
  },
  {
    id: "sportif",
    label: "Sportif",
    desc: "Je tiens 1500m sans m'arrêter, et je nage plusieurs fois par semaine",
    detail: "Technique solide, je m'entraîne avec régularité et je veux structurer ma progression",
    color: "#0057FF",
    bg: "#EEF3FF",
    dot: 3,
  },
  {
    id: "performance",
    label: "Performance",
    desc: "J'ai déjà fait des courses ou des compétitions",
    detail: "Je connais mes chronos, je veux un plan taillé pour la compétition",
    color: "#7C3AED",
    bg: "#EDE9FE",
    dot: 4,
  },
];

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
