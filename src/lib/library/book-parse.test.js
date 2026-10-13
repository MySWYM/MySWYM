import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseBookMarkdown } from "./book-parse.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const brasse = readFileSync(join(root, "docs/natation-savoir/nager2-brasse.md"), "utf8");
const items = parseBookMarkdown(brasse, { source: "Nager2", nage: "brasse" });

assert.ok(items.length >= 10, `expected many brasse fiches, got ${items.length}`);
assert.ok(items.every((it) => it.id.startsWith("livre:")), "livre ids");
assert.ok(items.every((it) => it.cue), "cue required");
assert.ok(items.some((it) => /prisonnier/i.test(it.name)), "prisonnier fiche");

const adc = readFileSync(join(root, "docs/natation-savoir/crawl-performant-adc.md"), "utf8");
const adcItems = parseBookMarkdown(adc, { source: "Crawl performant · ADC", nage: "crawl" });
assert.ok(adcItems.length >= 10, `expected 10 ADC fiches, got ${adcItems.length}`);
assert.ok(adcItems.every((it) => it.objective), "ADC objective");
assert.ok(adcItems.every((it) => it.successCriteria), "ADC successCriteria");
assert.ok(adcItems.every((it) => (it.watchPoints || []).length), "ADC watchPoints");

console.log("book-parse.test.js OK", items.length, "adc", adcItems.length);
