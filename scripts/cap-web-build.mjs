/**
 * Build web pour Capacitor.
 * Vite loadEnv peut recevoir [SENSITIVE] dans l’agent Cursor ; on relit
 * .env.local via fs et on l’injecte dans process.env (priorité Vite).
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith("VITE_") && env[key] === "[SENSITIVE]") delete env[key];
}

try {
  const text = readFileSync(".env.local", "utf8");
  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const eq = s.indexOf("=");
    const key = s.slice(0, eq).trim();
    if (!key.startsWith("VITE_")) continue;
    let value = s.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "[SENSITIVE]") continue;
    env[key] = value;
  }
} catch {
  /* pas de .env.local : Vite suit son chargement habituel */
}

env.CI = "1";
const viteBin = new URL("../node_modules/.bin/vite", import.meta.url).pathname;
const child = spawn(viteBin, ["build"], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
