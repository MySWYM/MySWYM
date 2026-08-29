import { canonicalizeGoal } from "./sports-engine/race-event.js";
import { impliedSwimStyleForLevel } from "./onboarding-level-gate.js";

/** Pont DA landing → questionnaire : un tap sur une carte pré-remplit l’onboarding. */

export const LANDING_CARD_PREFILL = {
  p1: { category: "progression", level: "régulier" },
  p2: { category: "progression", level: "sportif" },
  p3: { category: "progression", level: "performance" },
  p4: { category: "progression", level: "performance" },
  t1: { category: "triathlon", goal: "triathlon_xs" },
  t2: { category: "triathlon", goal: "triathlon_sprint" },
  t3: { category: "triathlon", goal: "triathlon_olympic" },
  t4: { category: "triathlon", goal: "triathlon_half" },
  t5: { category: "triathlon", goal: "triathlon_ironman" },
  w1: { category: "eau_libre", goal: "open_water_short" },
  w2: { category: "eau_libre", goal: "open_water_mid" },
  w3: { category: "eau_libre", goal: "open_water_long" },
  d1: { category: "diplome", goal: "bnssa" },
  d2: { category: "diplome", goal: "bpjeps_aan" },
  d3: { category: "diplome", goal: "caepmns" },
};

const CATEGORIES = new Set(["progression", "triathlon", "eau_libre", "diplome"]);
const COMING_SOON_CATEGORIES = new Set(["diplome"]);

export function isComingSoonCategory(category) {
  return COMING_SOON_CATEGORIES.has(String(category || ""));
}

const LEVELS = new Set(["découverte", "régulier", "sportif", "performance", "beginner"]);

function canonicalizeLevel(level) {
  const l = String(level || "");
  if (l === "découverte" || l === "decouverte" || l === "beginner") return "régulier";
  return l;
}
const GOALS = new Set([
  "progression",
  "triathlon_xs",
  "triathlon_sprint",
  "triathlon_olympic",
  "triathlon_half",
  "triathlon_ironman",
  "open_water_short",
  "open_water_mid",
  "open_water_long",
  "open_water_500",
  "open_water_1k",
  "open_water_2_5k",
  "open_water_5k",
  "open_water_10k",
  "open_water_25k",
  "bnssa",
  "bpjeps_aan",
  "caepmns",
]);

const STORE_KEY = "myswym_onboarding_prefill";

export function landingCtaPath(cardKey, baseHref = "/app") {
  const prefill = LANDING_CARD_PREFILL[cardKey];
  const path = String(baseHref || "/app").split("?")[0] || "/app";
  if (!prefill || isComingSoonCategory(prefill.category)) return path;
  const params = new URLSearchParams();
  params.set("category", prefill.category);
  if (prefill.goal) params.set("goal", prefill.goal);
  if (prefill.level) params.set("level", prefill.level);
  return `${path}?${params.toString()}`;
}

export function parseOnboardingPrefill(search) {
  if (!search) return null;
  const params = new URLSearchParams(
    typeof search === "string" && search.startsWith("?") ? search.slice(1) : search,
  );
  const category = params.get("category");
  if (!CATEGORIES.has(category) || isComingSoonCategory(category)) return null;
  const goal = params.get("goal") || "";
  const level = params.get("level") || "";
  const prefill = { category };
  if (goal && GOALS.has(goal)) prefill.goal = canonicalizeGoal(goal);
  if (level && LEVELS.has(level)) prefill.level = canonicalizeLevel(level);
  return prefill;
}

export function profilePatchFromPrefill(prefill) {
  if (!prefill?.category) return {};
  const patch = { category: prefill.category };
  if (prefill.category === "progression") {
    patch.goal = "progression";
    if (prefill.level) patch.level = canonicalizeLevel(prefill.level);
  } else {
    if (prefill.goal) patch.goal = canonicalizeGoal(prefill.goal);
    if (prefill.category === "diplome" && prefill.goal) patch.level = "sportif";
    else if (prefill.level) patch.level = canonicalizeLevel(prefill.level);
  }
  const implied = impliedSwimStyleForLevel(patch.level);
  if (implied) patch.swimStyle = implied;
  return patch;
}

/** Étape questionnaire après un tap landing, on ne refait pas le choix déjà fait. */
export function stepFromPrefill(prefill) {
  if (!prefill?.category) return 1;
  if (prefill.category === "progression" && prefill.level) return 5;
  if (prefill.category === "diplome" && prefill.goal) return 5;
  if ((prefill.category === "triathlon" || prefill.category === "eau_libre") && prefill.goal) return 3;
  if (prefill.category === "progression") return 3;
  return 2;
}

export function persistOnboardingPrefill(prefill) {
  if (!prefill?.category || isComingSoonCategory(prefill.category)) return;
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(prefill));
  } catch { /* ignore */ }
}

export function readPersistedOnboardingPrefill() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.category && CATEGORIES.has(parsed.category) && !isComingSoonCategory(parsed.category)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function clearOnboardingPrefill() {
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch { /* ignore */ }
}
