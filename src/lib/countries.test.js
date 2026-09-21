/**
 * Usage : node src/lib/countries.test.js
 */
import assert from "node:assert/strict";
import {
  COUNTRIES,
  normalizeCountry,
  countryByCode,
  countryLabelFr,
  countryFlagSrc,
  searchCountries,
} from "./countries.js";

assert.ok(COUNTRIES.length > 150, "liste mondiale");
assert.equal(countryByCode("FR")?.name, "France");
assert.equal(countryLabelFr("FR"), "France");
assert.equal(countryFlagSrc("FR"), "https://flagcdn.com/fr.svg");
assert.equal(normalizeCountry("fr"), "FR");
assert.equal(normalizeCountry("xx"), "");
assert.equal(normalizeCountry("UK"), "GB");
assert.equal(normalizeCountry("FX"), "FR");
assert.ok(searchCountries("fran").some((c) => c.code === "FR"));
assert.ok(searchCountries("Afgha").some((c) => c.code === "AF"));
assert.ok(COUNTRIES.some((c) => c.code === "ZA"));
assert.ok(COUNTRIES.some((c) => c.code === "GB"));
assert.ok(!COUNTRIES.some((c) => c.code === "UK"));
assert.ok(!COUNTRIES.some((c) => c.code === "FX"));
assert.equal(searchCountries("").length, COUNTRIES.length);

const names = COUNTRIES.map((c) => c.name);
assert.equal(new Set(names).size, names.length, "pas de doublon de libellé FR");
const codes = COUNTRIES.map((c) => c.code);
assert.equal(new Set(codes).size, codes.length, "pas de doublon de code");

console.log("countries.test.js ok", COUNTRIES.length);
