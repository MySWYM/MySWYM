/**
 * Vérifie un ou plusieurs fichiers src/i18n/fr-dict/*.json.
 * Usage : node scripts/i18n-dict-validate.mjs [fichier...]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TARGET_LANGS, KEEP_AS_IS } from "../src/i18n/fr-dict/langs.js";

const DIR = new URL("../src/i18n/fr-dict/", import.meta.url).pathname;

function placeholders(s) {
  return (String(s).match(/\{\{\d+\}\}/g) || []).sort().join(",");
}

export function validateDict(dict, label = "") {
  const errors = [];
  for (const [fr, row] of Object.entries(dict)) {
    if (row === null) continue;
    if (typeof row !== "object") {
      errors.push(`${label} ${JSON.stringify(fr)} : valeur invalide`);
      continue;
    }
    const ph = placeholders(fr);
    for (const lng of TARGET_LANGS) {
      const v = row[lng];
      if (typeof v !== "string" || !v.trim()) {
        errors.push(`${label} ${JSON.stringify(fr)} : langue manquante ${lng}`);
        continue;
      }
      if (/[\u2013\u2014]/.test(v)) errors.push(`${label} ${JSON.stringify(fr)} : tiret long en ${lng}`);
      const extra = (v.match(/\{\{\d+\}\}/g) || []).filter((p) => !ph.split(",").includes(p));
      if (extra.length) errors.push(`${label} ${JSON.stringify(fr)} : placeholder inconnu en ${lng} (${extra.join(",")})`);
      if (v === fr && /[àâäéèêëïîôùûüçœ]/i.test(fr) && !KEEP_AS_IS.has(fr)) {
        errors.push(`${label} ${JSON.stringify(fr)} : copie du français en ${lng}`);
      }
    }
    for (const k of Object.keys(row)) {
      if (!TARGET_LANGS.includes(k)) errors.push(`${label} ${JSON.stringify(fr)} : langue inconnue ${k}`);
    }
  }
  return errors;
}

export function loadAllDicts() {
  const merged = {};
  for (const name of readdirSync(DIR).filter((n) => n.endsWith(".json")).sort()) {
    Object.assign(merged, JSON.parse(readFileSync(join(DIR, name), "utf8")));
  }
  return merged;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  const targets = files.length ? files : readdirSync(DIR).filter((n) => n.endsWith(".json")).map((n) => join(DIR, n));
  let errors = [];
  for (const f of targets) {
    let dict;
    try {
      dict = JSON.parse(readFileSync(f, "utf8"));
    } catch (e) {
      errors.push(`${f} : JSON invalide (${e.message})`);
      continue;
    }
    errors = errors.concat(validateDict(dict, f.split("/").pop()));
  }
  errors.forEach((e) => console.log(e));
  console.log(errors.length ? `\n${errors.length} erreur(s)` : "ok");
  process.exit(errors.length ? 1 : 0);
}
