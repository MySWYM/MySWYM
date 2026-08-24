/**
 * Pont landing → onboarding.
 * Usage : node src/lib/landing-onboarding.test.js
 */
import {
  landingCtaPath,
  parseOnboardingPrefill,
  profilePatchFromPrefill,
  stepFromPrefill,
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
ok(landingCtaPath("p3") === "/app?category=progression&level=sportif", "sportif URL");
ok(landingCtaPath("unknown") === "/app", "unknown card stays /app");
ok(Object.keys(LANDING_CARD_PREFILL).length === 18, "all landing cards mapped");

const sprint = parseOnboardingPrefill("?category=triathlon&goal=triathlon_sprint");
ok(sprint.category === "triathlon" && sprint.goal === "triathlon_sprint", "parse sprint");
ok(parseOnboardingPrefill("?category=hacker") === null, "reject unknown category");
ok(parseOnboardingPrefill("?category=triathlon&goal=nope").goal == null, "drop unknown goal");

ok(profilePatchFromPrefill(sprint).goal === "triathlon_sprint", "patch triathlon");
ok(profilePatchFromPrefill({ category: "progression", level: "sportif" }).goal === "progression", "progression goal");
ok(profilePatchFromPrefill({ category: "diplome", goal: "bnssa" }).level === "sportif", "diploma level");

ok(stepFromPrefill(sprint) === 3, "triathlon skips to level");
ok(stepFromPrefill({ category: "progression", level: "sportif" }) === 5, "level card skips to frequency");
ok(stepFromPrefill({ category: "diplome", goal: "bnssa" }) === 5, "diploma skips to frequency");
ok(stepFromPrefill({ category: "triathlon" }) === 2, "category only → subgoal");

console.log(`ok ${n}`);
