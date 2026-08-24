/**
 * Modèle de l’écran trophée post-génération (DA landing).
 * Lecture seule — ne touche pas au moteur.
 */
import { buildWorkoutView } from "./workout-display.js";
import { isSessionResolved } from "./plan-progress-merge.js";

const CATEGORY_LABELS = {
  progression: "Nager",
  triathlon: "Triathlon",
  eau_libre: "Eau libre",
  diplome: "Diplômes",
};

const GOAL_LABELS = {
  progression: "Nager",
  triathlon_xs: "Triathlon XS",
  triathlon_sprint: "Triathlon S · Sprint",
  triathlon_olympic: "Triathlon M · Olympique",
  triathlon_half: "Triathlon L · Half-Ironman",
  triathlon_ironman: "Triathlon XXL · Ironman",
  open_water_500: "Eau libre 500 m",
  open_water_1k: "Eau libre 1 km",
  open_water_2_5k: "Eau libre 2,5 km",
  open_water_5k: "Eau libre 5 km",
  open_water_10k: "Eau libre 10 km",
  open_water_25k: "Eau libre 25 km",
  bnssa: "Prépa BNSSA",
  bpjeps_aan: "Prépa BPJEPS AAN",
  caepmns: "Prépa CAEPMNS",
  tests_pompiers: "Tests Pompiers",
  competition_maitre: "Compétition Maître",
  reprendre: "Reprendre la natation",
  perte_de_poids: "Activité physique",
};

const LEVEL_LABELS = {
  decouverte: "Découverte",
  découverte: "Découverte",
  beginner: "Découverte",
  regulier: "Régulier",
  régulier: "Régulier",
  sportif: "Sportif",
  performance: "Performance",
};

export const PLAN_REVEAL_MIN_MS = 1400;

export function shouldShowPlanReveal({ addingPlan = false } = {}) {
  return !addingPlan;
}

export function revealGoalLabel(profile = {}) {
  const goal = String(profile.goal || "").trim();
  if (GOAL_LABELS[goal]) return GOAL_LABELS[goal];
  const cat = String(profile.category || "").trim();
  return CATEGORY_LABELS[cat] || "Ton objectif";
}

export function revealLevelLabel(profile = {}) {
  const raw = String(profile.level || "").trim().toLowerCase();
  return LEVEL_LABELS[raw] || (profile.level ? String(profile.level) : "");
}

function clipDetail(text, max = 72) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function sectionDetail(section) {
  const ex = section?.exercises?.[0];
  if (!ex) return "";
  if (ex.volumeLabel && ex.main && String(ex.main).includes(ex.volumeLabel)) {
    return clipDetail(ex.main);
  }
  return clipDetail([ex.volumeLabel, ex.main].filter(Boolean).join(" · "));
}

export function sessionCardModel(session) {
  if (!session) {
    return {
      title: "Séance 1",
      type: "Première séance",
      distanceLabel: null,
      durationLabel: null,
      blocks: [],
    };
  }
  const view = buildWorkoutView(session);
  const blocks = (view.sections || []).slice(0, 3).map((s) => ({
    label: s.label,
    detail: sectionDetail(s),
  })).filter((b) => b.detail);
  return {
    title: view.header.title || session.title || "Séance 1",
    type: view.header.type || session.type || "Première séance",
    distanceLabel: view.header.distanceLabel || (session.distance ? `${session.distance} m` : null),
    durationLabel: view.header.durationLabel || null,
    blocks,
  };
}

export function sessionPreviewFromPlan(plan) {
  return sessionCardModel(plan?.weeks?.[0]?.sessions?.[0] || null);
}

/** Prochaine séance à nager (boucle = séance courante). */
export function findNextSession(plan) {
  const weeks = plan?.weeks;
  if (!Array.isArray(weeks) || weeks.length === 0) return null;
  if (plan.isSessionLoop) {
    const session = weeks[0]?.sessions?.[0];
    if (!session) return null;
    return { weekIndex: 0, sessionIndex: 0, session, resolved: isSessionResolved(session) };
  }
  const wi = weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved));
  if (wi < 0) {
    const lastW = weeks.length - 1;
    const sessions = weeks[lastW]?.sessions || [];
    if (!sessions.length) return null;
    const si = sessions.length - 1;
    return { weekIndex: lastW, sessionIndex: si, session: sessions[si], resolved: true };
  }
  const sessions = weeks[wi].sessions || [];
  const si = sessions.findIndex((s) => !isSessionResolved(s));
  if (si < 0) return null;
  return { weekIndex: wi, sessionIndex: si, session: sessions[si], resolved: false };
}

export function revealMinWaitMs(elapsedMs, reduceMotion = false) {
  if (reduceMotion) return 0;
  return Math.max(0, PLAN_REVEAL_MIN_MS - Math.max(0, elapsedMs));
}

export function buildPlanRevealModel(plan, profile) {
  const isLoop = !!(plan?.isSessionLoop || plan?.isProgression);
  const weeks = plan?.totalRealWeeks || plan?.weeks?.length || 0;
  const frequency = Number(profile?.sessionsPerWeek) || 0;
  return {
    goalLabel: revealGoalLabel(profile),
    levelLabel: revealLevelLabel(profile),
    weeks,
    frequency,
    isLoop,
    session: sessionCardModel(plan?.weeks?.[0]?.sessions?.[0] || null),
    barCount: isLoop ? 0 : Math.min(12, Math.max(0, weeks)),
  };
}
