/** Pont DA landing → questionnaire : un tap sur une carte pré-remplit l’onboarding. */

export const LANDING_CARD_PREFILL = {
  p1: { category: "progression", level: "découverte" },
  p2: { category: "progression", level: "régulier" },
  p3: { category: "progression", level: "sportif" },
  p4: { category: "progression", level: "performance" },
  t1: { category: "triathlon", goal: "triathlon_xs" },
  t2: { category: "triathlon", goal: "triathlon_sprint" },
  t3: { category: "triathlon", goal: "triathlon_olympic" },
  t4: { category: "triathlon", goal: "triathlon_half" },
  t5: { category: "triathlon", goal: "triathlon_ironman" },
  w1: { category: "eau_libre", goal: "open_water_500" },
  w2: { category: "eau_libre", goal: "open_water_1k" },
  w3: { category: "eau_libre", goal: "open_water_2_5k" },
  w4: { category: "eau_libre", goal: "open_water_5k" },
  w5: { category: "eau_libre", goal: "open_water_10k" },
  w6: { category: "eau_libre", goal: "open_water_25k" },
  d1: { category: "diplome", goal: "bnssa" },
  d2: { category: "diplome", goal: "bpjeps_aan" },
  d3: { category: "diplome", goal: "caepmns" },
};

const CATEGORIES = new Set(["progression", "triathlon", "eau_libre", "diplome"]);
const LEVELS = new Set(["découverte", "régulier", "sportif", "performance"]);
const GOALS = new Set([
  "progression",
  "triathlon_xs",
  "triathlon_sprint",
  "triathlon_olympic",
  "triathlon_half",
  "triathlon_ironman",
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
  if (!prefill) return path;
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
  if (!CATEGORIES.has(category)) return null;
  const goal = params.get("goal") || "";
  const level = params.get("level") || "";
  const prefill = { category };
  if (goal && GOALS.has(goal)) prefill.goal = goal;
  if (level && LEVELS.has(level)) prefill.level = level;
  return prefill;
}

export function profilePatchFromPrefill(prefill) {
  if (!prefill?.category) return {};
  const patch = { category: prefill.category };
  if (prefill.category === "progression") {
    patch.goal = "progression";
    if (prefill.level) patch.level = prefill.level;
    return patch;
  }
  if (prefill.goal) patch.goal = prefill.goal;
  if (prefill.category === "diplome" && prefill.goal) patch.level = "sportif";
  else if (prefill.level) patch.level = prefill.level;
  return patch;
}

/** Étape questionnaire après un tap landing — on ne refait pas le choix déjà fait. */
export function stepFromPrefill(prefill) {
  if (!prefill?.category) return 1;
  if (prefill.category === "progression" && prefill.level) return 5;
  if (prefill.category === "diplome" && prefill.goal) return 5;
  if ((prefill.category === "triathlon" || prefill.category === "eau_libre") && prefill.goal) return 3;
  if (prefill.category === "progression") return 3;
  return 2;
}

export function persistOnboardingPrefill(prefill) {
  if (!prefill?.category) return;
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(prefill));
  } catch { /* ignore */ }
}

export function readPersistedOnboardingPrefill() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.category && CATEGORIES.has(parsed.category) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearOnboardingPrefill() {
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch { /* ignore */ }
}
