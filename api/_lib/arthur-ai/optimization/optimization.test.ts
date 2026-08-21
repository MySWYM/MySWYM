/**
 * Tests Optimization Loop F3 — qualité, analyse, CTA (pas d’envoi auto).
 * Run: npm run test:arthur:optimize
 */
import assert from "node:assert/strict";
import { scoreResponseQuality, detectCtaInMessage } from "./quality.js";
import { analyzeConversation } from "./analyze.js";
import { buildTrackedCtaUrl } from "./cta.js";
import { isFollowupSendEnabled } from "../conversion/send.js";

test("qualité strong — conseil + question", () => {
  const r = scoreResponseQuality({
    message:
      "En crawl, garde la tête dans l’eau et respire toutes les 3 coulées. Tu nages combien de séances par semaine ?",
    intent: "technique",
    lead_temperature: "warm",
    channel: "instagram",
    knowledge_topics: ["technique_crawl"],
  });
  assert.ok(r.quality_score >= 45);
  assert.ok(["ok", "strong"].includes(r.quality_band));
  assert.ok(r.reasons.includes("asks_question"));
});

test("qualité pénalise spam + CTA trop tôt", () => {
  const r = scoreResponseQuality({
    message:
      "Dernière chance ! Clique maintenant sur https://myswym.app/inscription offre limitée",
    lead_temperature: "cold",
    channel: "instagram",
  });
  assert.equal(r.cta_detected, true);
  assert.ok(r.reasons.includes("spammy_tone") || r.reasons.includes("cta_too_early"));
  assert.ok(r.quality_score < 55);
});

test("detect CTA types", () => {
  assert.equal(
    detectCtaInMessage("Viens sur https://myswym.app/fr/tarifs").cta_type,
    "tarifs",
  );
  assert.equal(
    detectCtaInMessage("Compte : https://myswym.app/inscription").cta_type,
    "inscription",
  );
});

test("analyse — engaged sans CTA = finding", () => {
  const a = analyzeConversation([
    { role: "user", content: "Salut" },
    { role: "assistant", content: "Hello, quel objectif ?" },
    { role: "user", content: "Triathlon" },
    { role: "assistant", content: "Ok niveau ?" },
    { role: "user", content: "Intermédiaire" },
    { role: "assistant", content: "Super on avance." },
  ]);
  assert.ok(a.findings.includes("engaged_no_cta"));
  assert.ok(a.recommendations.includes("add_soft_myswym_cta_when_goal_clear"));
});

test("analyse — CTA heavy", () => {
  const link = "https://myswym.app/inscription";
  const a = analyzeConversation([
    { role: "user", content: "hi" },
    { role: "assistant", content: `Va sur ${link}` },
    { role: "user", content: "ok" },
    { role: "assistant", content: `Encore ${link}` },
    { role: "user", content: "hmm" },
    { role: "assistant", content: `Toujours ${link}` },
  ]);
  assert.ok(a.cta_count >= 3);
  assert.ok(a.findings.includes("cta_heavy"));
  assert.equal(a.drop_risk, "high");
});

test("tracked CTA url", () => {
  const u = buildTrackedCtaUrl("/inscription", {
    ctaType: "suggest_myswym",
    campaign: "ow",
    reelId: "r1",
  });
  assert.ok(u.includes("ref=arthur_ig"));
  assert.ok(u.includes("cta=suggest_myswym"));
  assert.ok(u.includes("reel_id=r1"));
});

test("F3 ne force pas les envois auto", () => {
  delete process.env.ARTHUR_FOLLOWUPS_SEND;
  assert.equal(isFollowupSendEnabled(), false);
});

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

console.log("arthur optimization F3 tests passed");
