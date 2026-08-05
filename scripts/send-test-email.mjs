/**
 * Smoke test Resend API key (no React Email templates).
 * Usage: RESEND_API_KEY=re_xxx npm run email:test
 * Full template path: POST /api/email/send via vercel dev.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Resend } from "resend";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("Missing RESEND_API_KEY (.env.local or env).");
  process.exit(1);
}

const from = process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
const to = process.env.EMAIL_TEST_TO || "delivered@resend.dev";

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: "[MySWYM] Resend smoke test",
  html: "<p>Resend API key OK — infrastructure smoke test.</p>",
  tags: [{ name: "category", value: "smoke_test" }],
});

if (error) {
  console.error("[email:test] failed:", error);
  process.exit(1);
}

console.log("[email:test] sent:", data?.id, "→", to);
