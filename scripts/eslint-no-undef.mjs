#!/usr/bin/env node
/**
 * Échoue seulement sur no-undef (ignore react-hooks / react-refresh / etc.).
 * Usage : node scripts/eslint-no-undef.mjs [chemins…]
 */
import { ESLint } from "eslint";

const targets = process.argv.slice(2);
const files = targets.length ? targets : ["src"];

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: "eslint.config.js",
});

const results = await eslint.lintFiles(files);
const undef = [];
for (const result of results) {
  for (const msg of result.messages) {
    if (msg.ruleId === "no-undef") {
      undef.push({ file: result.filePath, ...msg });
    }
  }
}

if (undef.length === 0) {
  console.log("no-undef ok");
  process.exit(0);
}

for (const m of undef) {
  console.error(`${m.file}:${m.line}:${m.column}  ${m.message}  (no-undef)`);
}
console.error(`\n${undef.length} no-undef error(s).`);
process.exit(1);
