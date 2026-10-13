/**
 * Bibliothèque éducatifs : un Lottie soft mist par fiche Sheet (geste exact de la fiche).
 *
 * Moteur partagé avec les 70 motions École : store/school-motion/_source/motion_core.py
 * (nageur 3D projeté de profil, palette mist / eau / corps #4A90C4 / membres proches et éloignés).
 * Scènes : store/library-motion/_source/scenes_library.py (une par éducatif).
 *
 * Écrit :
 *   store/library-motion/sheet-<slug>.json + _index.json
 *   public/library-motion/sheet-<slug>.json
 *   src/lib/library/library-motion-map.js (id fiche → fichier)
 *
 * Usage : node scripts/generate-library-motion-lotties.mjs
 * (Python 3 requis, sans dépendance. Ne touche pas à public/school-motion/.)
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = join(ROOT, "store", "library-motion");
const PUBLIC = join(ROOT, "public", "library-motion");
const MAP_FILE = join(ROOT, "src", "lib", "library", "library-motion-map.js");

execFileSync("python3", [join(STORE, "_source", "generate_library.py"), STORE], {
  stdio: "inherit",
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
});

/** @type {{ id: string, name: string, file: string, todo: string|null }[]} */
const index = JSON.parse(readFileSync(join(STORE, "_index.json"), "utf8"));

mkdirSync(PUBLIC, { recursive: true });
for (const f of readdirSync(STORE)) {
  if (/^sheet-.*\.json$/.test(f)) copyFileSync(join(STORE, f), join(PUBLIC, f));
}

const lines = index.map((e) => `  ${JSON.stringify(e.id)}: ${JSON.stringify(e.file)},`).join("\n");
writeFileSync(
  MAP_FILE,
  `/**
 * Généré par scripts/generate-library-motion-lotties.mjs : ne pas éditer à la main.
 * Fiche Sheet (id \`sheet:<nom>\`) → Lottie dédié dans public/library-motion/.
 */

/** @type {Record<string, string>} */
export const LIBRARY_MOTION_FILES = {
${lines}
};
`,
);

const todo = index.filter((e) => e.todo);
console.log(`library-motion : ${index.length} fiches, ${todo.length} TODO Arthur`);
for (const e of todo) console.log(`  · ${e.name} : ${e.todo}`);
