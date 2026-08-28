/**
 * Pont landing → onboarding.
 * Usage : node src/lib/landing-onboarding.test.js
 */
import {
  landingCtaPath,
  parseOnboardingPrefill,
  profilePatchFromPrefill,
  stepFromPrefill,
  isComingSoonCategory,
  LANDING_CARD_PREFILL,
} from "./landing-onboarding.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
let n = 0;
function ok(cond, msg) {
  assert(cond, msg);
  n += 1;
}

ok(landingCtaPath("t2") === "/app?category=triathlon&goal=triathlon_sprint", "sprint URL");
ok(decodeURIComponent(landingCtaPath("p1")) === "/app?category=progression&level=régulier", "beginner URL");
ok(landingCtaPath("p3") === "/app?category=progression&level=performance", "advanced URL");
ok(parseOnboardingPrefill("?category=progression&level=découverte").level === "régulier", "legacy découverte → régulier");
ok(landingCtaPath("w2") === "/app?category=eau_libre&goal=open_water_mid", "ow mid URL");
ok(parseOnboardingPrefill("?category=eau_libre&goal=open_water_25k").goal === "open_water_long", "legacy 25k → long");
ok(Object.keys(LANDING_CARD_PREFILL).length === 15, "all landing cards mapped");

const sprint = parseOnboardingPrefill("?category=triathlon&goal=triathlon_sprint");
ok(sprint.category === "triathlon" && sprint.goal === "triathlon_sprint", "parse sprint");
ok(landingCtaPath("d1") === "/app", "diploma card has no prefill URL");
ok(parseOnboardingPrefill("?category=diplome&goal=bnssa") === null, "reject diploma prefill");
ok(isComingSoonCategory("diplome") === true, "diploma marked coming soon");
ok(isComingSoonCategory("triathlon") === false, "triathlon not coming soon");
ok(parseOnboardingPrefill("?category=triathlon&goal=nope").goal == null, "drop unknown goal");

ok(profilePatchFromPrefill(sprint).goal === "triathlon_sprint", "patch triathlon");
ok(profilePatchFromPrefill({ category: "progression", level: "sportif" }).goal === "progression", "progression goal");
ok(profilePatchFromPrefill({ category: "progression", level: "performance" }).swimStyle === "4_nages", "avancé 4 nages");
ok(profilePatchFromPrefill({ category: "progression", level: "régulier" }).swimStyle === "crawl", "débutant crawl");
ok(profilePatchFromPrefill({ category: "progression", level: "sportif" }).swimStyle == null, "intermédiaire choisit");
ok(profilePatchFromPrefill({ category: "diplome", goal: "bnssa" }).level === "sportif", "diploma level");

ok(stepFromPrefill(sprint) === 3, "triathlon skips to level");
ok(stepFromPrefill({ category: "progression", level: "sportif" }) === 5, "level card skips to frequency");
ok(stepFromPrefill({ category: "diplome", goal: "bnssa" }) === 5, "diploma skips to frequency");
ok(stepFromPrefill({ category: "triathlon" }) === 2, "category only → subgoal");

console.log(`ok ${n}`);
