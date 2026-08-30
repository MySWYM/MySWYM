/**
 * Copy lock: live send.ts must match the React Email preview template.
 * Run: node api/_lib/emails/reactivation.test.js
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const sendTs = readFileSync(resolve(dir, "../../email/send.ts"), "utf8");
const preview = readFileSync(resolve(dir, "reactivation.tsx"), "utf8");
const job = readFileSync(
  resolve(dir, "../../../supabase/functions/reactivate-nonpayers/index.ts"),
  "utf8",
);

const shared = [
  "tes séances ont changé",
  "On a repris le générateur de séances.",
  "Tes séances déjà validées restent",
  "7 jours pour tout voir, sans carte",
  "Rouvrir MySWYM",
];

for (const phrase of shared) {
  assert.ok(sendTs.includes(phrase), `send.ts missing: ${phrase}`);
  assert.ok(preview.includes(phrase), `reactivation.tsx missing: ${phrase}`);
}

assert.ok(
  sendTs.includes("Tes séances MySWYM ont changé"),
  "send.ts missing subject",
);

assert.ok(
  !sendTs.includes("ton plan n’a pas bougé") &&
    !sendTs.includes("ton plan n'a pas bougé") &&
    !sendTs.includes("Reprends exactement où tu en étais"),
  "send.ts still has v1 reactivation copy",
);

assert.ok(
  job.includes('RELAUNCH_CAMPAIGN_ID = "session-gen-2026-08"'),
  "job missing campaign id",
);
assert.ok(
  job.includes("reactivation_campaign === RELAUNCH_CAMPAIGN_ID"),
  "job still gates on v1 reactivation_email_sent only",
);
assert.ok(
  job.includes("https://www.myswym.app/app"),
  "job CTA should use www.myswym.app",
);

console.log("reactivation email copy ok");
