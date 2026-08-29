/** Gradual extraction: App registers shell UI used by PlanTab / Dashboard. */
import { BADGE_DEFS, computeStats, checkBadges } from "./lib/plan-stats.js";

let tabUi = null;

const NullUi = () => null;

/** Repli si HMR a remis le registry à null avant re-register App.jsx. */
function fallbackTabUi() {
  return {
    AppTopBar: NullUi,
    OnboardingWizard: NullUi,
    ProgressionLoopView: NullUi,
    PlanSelector: NullUi,
    PremiumBanner: NullUi,
    PremiumTeaser: NullUi,
    WeekProjectionCard: NullUi,
    ResetConfirmButton: NullUi,
    UpdateProgramCard: NullUi,
    WeekCard: NullUi,
    MonAllureCard: NullUi,
    StravaSection: NullUi,
    GOALS: [],
    CATEGORIES: [],
    BADGE_DEFS,
    computeStats,
    checkBadges,
    getTypeMeta: () => ({ color: "#94A3B8", label: "" }),
  };
}

export function registerTabUi(next) {
  tabUi = next;
}

export function getTabUi() {
  if (!tabUi) {
    if (import.meta.env?.DEV) {
      console.warn("[MySWYM] tab UI registry not ready, fallback temporaire");
    }
    return fallbackTabUi();
  }
  return tabUi;
}

// Survive Vite HMR of this module: keep last registration.
if (import.meta.hot) {
  import.meta.hot.accept();
  if (import.meta.hot.data?.tabUi) tabUi = import.meta.hot.data.tabUi;
  import.meta.hot.dispose((data) => {
    data.tabUi = tabUi;
  });
}
