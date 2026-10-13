import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBookMarkdown } from "./book-parse.js";
import { resolveLibraryMotionStepId, resolveLibraryMotionUrl, stepIdFromLibraryCode } from "./motion.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(stepIdFromLibraryCode("adc1"), "ADC1");
assert.equal(stepIdFromLibraryCode("AVC10"), "AVC10");

const adc = parseBookMarkdown(readFileSync(join(root, "docs/natation-savoir/crawl-performant-adc.md"), "utf8"), {
  source: "ADC",
  nage: "crawl",
});
for (const item of adc) {
  const sid = resolveLibraryMotionStepId(item);
  assert.equal(sid, item.code.toUpperCase(), item.name);
  assert.ok(resolveLibraryMotionUrl(item)?.includes("/school-motion/"), item.name);
}

const avc = parseBookMarkdown(readFileSync(join(root, "docs/natation-savoir/crawl-performant-avc.md"), "utf8"), {
  source: "AVC",
  nage: "crawl",
});
for (const item of avc) {
  assert.equal(resolveLibraryMotionStepId(item), item.code.toUpperCase(), item.name);
}

// Sheet sans code / titre école → pas de motion approximative
assert.equal(
  resolveLibraryMotionStepId({
    name: "Exercice inventé xyz",
    cue: "virage culbute",
    nage: "crawl",
  }),
  null,
);

// Titre école exact → OK
assert.equal(resolveLibraryMotionStepId({ name: "Coulée ventrale" }), "ANC1");

console.log("motion.test.js OK");
