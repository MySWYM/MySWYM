/**
 * Build web pour Capacitor.
 * Vite loadEnv peut recevoir [SENSITIVE] dans l’agent Cursor ; on relit
 * le fichier env via fs et on l’injecte dans process.env (priorité Vite).
 * Défaut : .env.local (staging). Recette abo live : CAP_ENV_FILE=.env.ios-prod.local
 * (ne pas utiliser .env.production.local : clés souvent [SENSITIVE] dans l’agent).
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const envFile = process.env.CAP_ENV_FILE || ".env.local";
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith("VITE_") && env[key] === "[SENSITIVE]") delete env[key];
}

try {
  const text = readFileSync(envFile, "utf8");
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
  process.stderr.write(`[cap-web-build] ${envFile}\n`);
} catch {
  /* pas de fichier env : Vite suit son chargement habituel */
}

env.CI = "1";
const viteBin = new URL("../node_modules/.bin/vite", import.meta.url).pathname;
const child = spawn(viteBin, ["build"], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
