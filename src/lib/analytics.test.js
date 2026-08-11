/**
 * Unit tests — analytics sanitize + once (no PostHog network).
 * Run: node src/lib/analytics.test.js
 */
import assert from "node:assert/strict";
import {
  sanitizeForTest,
  claimOnce,
  clearOnce,
  normalizeAnalyticsLevel,
  normalizeAnalyticsObjective,
  personPropertiesFromProfile,
  sessionAnalyticsProps,
} from "./analytics.test-helpers.js";

let passed = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  passed += 1;
}

// Levels
ok(normalizeAnalyticsLevel("Découverte") === "decouverte", "level découverte");
ok(normalizeAnalyticsLevel("beginner") === "decouverte", "level beginner");
ok(normalizeAnalyticsLevel("Régulier") === "regulier", "level régulier");
ok(normalizeAnalyticsLevel("Sportif") === "sportif", "level sportif");
ok(normalizeAnalyticsLevel("Performance") === "performance", "level perf");

// Objectives
ok(normalizeAnalyticsObjective({ goal: "eau_libre" }) === "eau_libre", "obj goal");
ok(normalizeAnalyticsObjective({ category: "triathlon" }) === "triathlon", "obj cat");

// Person props — no email / injury note
{
  const p = personPropertiesFromProfile({
    level: "Sportif",
    goal: "course_piscine",
    sessionsPerWeek: 3,
    pool: 25,
    email: "secret@x.com",
    injuryNote: "genou gauche",
  }, { premium: true });
  ok(p.level === "sportif", "person level");
  ok(p.premium === true, "person premium");
  ok(p.email == null, "no email");
  ok(p.injuryNote == null, "no injury note");
}

// Session props — no details lines
{
  const s = sessionAnalyticsProps(
    { level: "Régulier", goal: "eau_libre", pool: 50 },
    { distance: "750m", duration: 45, intent: "endurance", details: ["400 Cr", "8x50"], phase: "base" },
    { planWeek: 2, sessionIndex: 1, phase: "base" },
  );
  ok(s.volume === 750, "volume parsed");
  ok(s.planWeek === 2 && s.sessionIndex === 1, "indices");
  ok(s.intent === "endurance", "intent");
  ok(s.details == null, "no details");
}

// Sanitize blocks notes / nested
{
  const clean = sanitizeForTest({
    difficulty: "too_hard",
    notes: "j'ai mal",
    comment: "texte libre",
    _engineHistory: { a: 1 },
    capacityDimensions: { x: 1 },
    pain: true,
    action: "REDUCE",
  });
  ok(clean.difficulty === "too_hard", "diff ok");
  ok(clean.pain == null, "pain blocked (health)");
  ok(clean.notes == null && clean.comment == null, "no free text");
  ok(clean._engineHistory == null, "no history");
}

// Once dedup
{
  clearOnce("test-once-a");
  ok(claimOnce("test-once-a") === true, "once first");
  ok(claimOnce("test-once-a") === false, "once second");
  clearOnce("test-once-a");
  ok(claimOnce("test-once-a") === true, "once after clear");
}

console.log(`analytics.test.js: ${passed} assertions OK`);
