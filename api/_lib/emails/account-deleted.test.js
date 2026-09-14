/**
 * Copy lock: live send.ts must match the React Email preview template.
 * Run: node api/_lib/emails/account-deleted.test.js
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const sendTs = readFileSync(resolve(dir, "../../email/send.ts"), "utf8");
const preview = readFileSync(resolve(dir, "account-deleted.tsx"), "utf8");
const job = readFileSync(
  resolve(dir, "../../../supabase/functions/delete-account/index.ts"),
  "utf8",
);

const shared = [
  "c’est fait.",
  "Ton compte MySWYM a bien été supprimé.",
  "Profil, plans et données associées sont effacés",
  "S’il restait un abonnement sans engagement, il a été arrêté",
  "Recréer un compte, c’est repartir de zéro",
  "Créer un nouveau compte",
];

for (const phrase of shared) {
  assert.ok(sendTs.includes(phrase), `send.ts missing: ${phrase}`);
  assert.ok(preview.includes(phrase), `account-deleted.tsx missing: ${phrase}`);
}

assert.ok(
  sendTs.includes("Ton compte MySWYM a été supprimé"),
  "send.ts missing subject",
);
assert.ok(
  sendTs.includes("/inscription"),
  "send.ts CTA should point to inscription",
);
assert.ok(
  job.includes('sendEmailViaHttp("account_deleted"'),
  "delete-account must send account_deleted",
);

console.log("account-deleted email copy ok");
