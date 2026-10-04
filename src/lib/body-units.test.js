import assert from "node:assert/strict";
import {
  BODY_UNITS_IMPERIAL,
  BODY_UNITS_METRIC,
  cmToFeetInches,
  defaultBodyUnitsForCountry,
  feetInchesToCm,
  kgToWeightDisplay,
  normalizeBodyUnits,
  resolveBodyUnits,
  weightDisplayToKg,
} from "./body-units.js";

assert.equal(normalizeBodyUnits("imperial"), BODY_UNITS_IMPERIAL);
assert.equal(normalizeBodyUnits("metric"), BODY_UNITS_METRIC);
assert.equal(normalizeBodyUnits("nope"), "");

assert.equal(defaultBodyUnitsForCountry("US"), BODY_UNITS_IMPERIAL);
assert.equal(defaultBodyUnitsForCountry("FR"), BODY_UNITS_METRIC);
assert.equal(defaultBodyUnitsForCountry("GB"), BODY_UNITS_METRIC);

assert.equal(resolveBodyUnits({ bodyUnits: "imperial", country: "FR" }), BODY_UNITS_IMPERIAL);
assert.equal(resolveBodyUnits({ country: "US" }), BODY_UNITS_IMPERIAL);
assert.equal(resolveBodyUnits({ country: "FR" }), BODY_UNITS_METRIC);

assert.equal(kgToWeightDisplay(80, BODY_UNITS_METRIC), "80");
assert.equal(kgToWeightDisplay(80, BODY_UNITS_IMPERIAL), "176.4");
assert.equal(weightDisplayToKg("176.4", BODY_UNITS_IMPERIAL), 80);
assert.equal(weightDisplayToKg("72", BODY_UNITS_METRIC), 72);
assert.equal(weightDisplayToKg("", BODY_UNITS_METRIC), "");

const fi = cmToFeetInches(175);
assert.equal(fi.feet, "5");
assert.ok(Number(fi.inches) >= 8.8 && Number(fi.inches) <= 9);
assert.equal(feetInchesToCm(5, 9), 175);
assert.equal(feetInchesToCm("", ""), "");

// Round-trip kg
for (const kg of [50, 72.5, 100]) {
  const lb = kgToWeightDisplay(kg, BODY_UNITS_IMPERIAL);
  const back = weightDisplayToKg(lb, BODY_UNITS_IMPERIAL);
  assert.ok(Math.abs(back - kg) < 0.15, `kg roundtrip ${kg} → ${lb} → ${back}`);
}

console.log("body-units.test.js: ok");
