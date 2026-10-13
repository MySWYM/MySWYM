import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LIBRARY_MOTION_FILES } from "./library-motion-map.js";
import { resolveLibraryMotionUrl } from "./motion.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pub = join(root, "public", "library-motion");

const entries = Object.entries(LIBRARY_MOTION_FILES);
assert.ok(entries.length > 0, "mapping vide");

for (const [id, file] of entries) {
  const path = join(pub, file);
  assert.ok(existsSync(path), `fichier manquant : ${file}`);
  const json = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(Array.isArray(json.layers) && json.layers.length > 0, `${file} : layers vide`);
  assert.equal(json.w, 800, file);
  assert.equal(json.h, 400, file);
  assert.equal(json.fr, 30, file);
  assert.ok(json.op >= 60 && json.op <= 200, `${file} : op ${json.op}`);

  const name = id.replace(/^sheet:/, "");
  assert.equal(resolveLibraryMotionUrl({ id, name, source: "sheet" }), `/library-motion/${file}`, id);
}

// Aucun fichier orphelin dans public/library-motion
for (const f of readdirSync(pub).filter((x) => x.endsWith(".json"))) {
  assert.ok(Object.values(LIBRARY_MOTION_FILES).includes(f), `orphelin : ${f}`);
}

// Pas de substitut : fiche Sheet inconnue → null
assert.equal(resolveLibraryMotionUrl({ id: "sheet:exercice inconnu", name: "exercice inconnu", source: "sheet" }), null);

// Fiche couverte par une étape École au titre identique : pas de doublon, on garde l'École
assert.equal(
  resolveLibraryMotionUrl({ id: "sheet:dos à deux bras", name: "dos à deux bras", source: "sheet" }),
  "/school-motion/dos-05-deux-bras.json",
);

// Une fiche livre ne prend jamais un Lottie Sheet par homonymie
assert.equal(resolveLibraryMotionUrl({ id: "livre:x", name: "flèche", source: "livre" }), null);

console.log(`library-motion.test.js OK (${entries.length} fiches)`);
