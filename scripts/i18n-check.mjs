/**
 * Contrôle i18n : tout français visible a ses 12 traductions.
 * Usage : npm run i18n:check
 *
 * 1. Chaque chaîne française en dur trouvée par le scan est dans src/i18n/fr-dict/*.json.
 * 2. Le dictionnaire est complet (langues, placeholders, pas de tiret long).
 * 3. Les catalogues JSON (src/i18n/locales/<langue>/*.json) ont toutes les clés du français.
 * 4. Les catalogues app (app-copy*.js) ont une valeur par langue.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { scanRepo } from "./i18n-scan.mjs";
import { validateDict, loadAllDicts } from "./i18n-dict-validate.mjs";
import { TARGET_LANGS } from "../src/i18n/fr-dict/langs.js";

const ROOT = new URL("..", import.meta.url).pathname;
const errors = [];

const dict = loadAllDicts();
const missing = new Map();
for (const hit of scanRepo()) {
  if (hit.text in dict) continue;
  if (!missing.has(hit.text)) missing.set(hit.text, hit);
}
for (const hit of missing.values()) {
  errors.push(`${hit.file}:${hit.line}  français sans traduction : ${JSON.stringify(hit.text)}`);
}

errors.push(...validateDict(dict, "fr-dict"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const LOCALES = join(ROOT, "src/i18n/locales");
for (const ns of readdirSync(join(LOCALES, "fr")).filter((n) => n.endsWith(".json"))) {
  const fr = flatten(JSON.parse(readFileSync(join(LOCALES, "fr", ns), "utf8")));
  for (const lng of TARGET_LANGS) {
    const file = join(LOCALES, lng, ns);
    const other = existsSync(file) ? flatten(JSON.parse(readFileSync(file, "utf8"))) : {};
    for (const key of Object.keys(fr)) {
      const v = other[key];
      if (typeof fr[key] !== "string") continue;
      if (typeof v !== "string" || !v.trim()) errors.push(`locales/${lng}/${ns}  clé manquante : ${key}`);
      else if (/[\u2013\u2014]/.test(v)) errors.push(`locales/${lng}/${ns}  tiret long : ${key}`);
    }
  }
}

const { EXTRA_ROWS } = await import("../src/i18n/app-copy-extra.js");
for (const [key, row] of Object.entries(EXTRA_ROWS)) {
  for (const lng of TARGET_LANGS) {
    if (typeof row[lng] !== "string" || !row[lng].trim()) errors.push(`app-copy-extra  ${key} : langue manquante ${lng}`);
  }
}

if (process.argv.includes("--summary")) {
  const by = {};
  for (const e of errors) {
    const k = e.includes("français sans traduction") ? "français sans traduction" : e.split("  ")[0].split(":")[0];
    by[k] = (by[k] || 0) + 1;
  }
  console.log(by);
} else {
  errors.forEach((e) => console.log(e));
}
if (errors.length) {
  console.log(`\n${errors.length} problème(s). Ajoute les traductions dans src/i18n/fr-dict/ (une entrée par phrase, 12 langues).`);
  process.exit(1);
}
console.log("i18n ok : tout le français visible est traduit.");
