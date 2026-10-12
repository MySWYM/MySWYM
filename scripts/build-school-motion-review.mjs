/**
 * Construit store/school-motion/_review-data.json (+ copie public)
 * : index Lottie + consignes école pour la page review.html
 */
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHOOL_COURSES } from "../src/lib/swim-school/catalog.js";
import { readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storeDir = join(root, "store/school-motion");
const publicDir = join(root, "public/school-motion");
const indexPath = join(storeDir, "_index-all.json");

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const byStep = new Map(index.map((it) => [it.stepId, it]));

const courses = SCHOOL_COURSES.map((course) => ({
  id: course.id,
  trackId: course.trackId,
  titleKey: course.titleKey,
  label:
    {
      crawl: "Crawl",
      dos: "Dos",
      virage: "Virage",
      depart: "Départ",
      pap: "Papillon",
      brasse: "Brasse",
    }[course.id] || course.id,
  steps: course.steps.map((step, i) => {
    const motion = byStep.get(step.id) || null;
    return {
      n: i + 1,
      id: step.id,
      title: step.title,
      objectif: step.objectif,
      cue: step.cue,
      bonSi: step.bonSi,
      pasEncore: step.pasEncore,
      avoid: step.avoid,
      dosage: step.dosage,
      file: motion?.file || null,
      show: motion?.show || "",
      seconds: motion?.seconds ?? null,
      frames: motion?.frames ?? null,
    };
  }),
}));

const payload = {
  generatedAt: new Date().toISOString(),
  courses,
};

const outStore = join(storeDir, "_review-data.json");
const outPublic = join(publicDir, "_review-data.json");
writeFileSync(outStore, `${JSON.stringify(payload, null, 1)}\n`);
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
copyFileSync(outStore, outPublic);
console.log(`ok ${courses.reduce((n, c) => n + c.steps.length, 0)} steps → ${outStore}`);
