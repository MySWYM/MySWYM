/**
 * Unités corps : affichage kg/lb + cm/ft·in.
 * Stockage canonique toujours weightKg / heightCm.
 */

export const BODY_UNITS_METRIC = "metric";
export const BODY_UNITS_IMPERIAL = "imperial";

/** Pays où le défaut UI est impérial (poids lb, taille ft/in). */
export const IMPERIAL_DEFAULT_COUNTRIES = Object.freeze(new Set(["US", "LR", "MM"]));

const LB_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;

export function normalizeBodyUnits(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === BODY_UNITS_IMPERIAL || s === "us" || s === "imperial_us") return BODY_UNITS_IMPERIAL;
  if (s === BODY_UNITS_METRIC || s === "si" || s === "metric_si") return BODY_UNITS_METRIC;
  return "";
}

/** Défaut selon pays (ISO alpha-2). */
export function defaultBodyUnitsForCountry(country) {
  const code = String(country || "").trim().toUpperCase();
  return IMPERIAL_DEFAULT_COUNTRIES.has(code) ? BODY_UNITS_IMPERIAL : BODY_UNITS_METRIC;
}

/**
 * Préférence profil > pays > métrique.
 * @param {{ bodyUnits?: string, country?: string } | null | undefined} profile
 * @param {string} [countryFallback]
 */
export function resolveBodyUnits(profile, countryFallback = "") {
  const fromProfile = normalizeBodyUnits(profile?.bodyUnits);
  if (fromProfile) return fromProfile;
  const country = profile?.country || countryFallback;
  return defaultBodyUnitsForCountry(country);
}

export function isImperialBodyUnits(units) {
  return normalizeBodyUnits(units) === BODY_UNITS_IMPERIAL;
}

function finiteOrNull(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

/** kg → affichage lb (1 décimale) ou kg (1 décimale si besoin). */
export function kgToWeightDisplay(kg, units) {
  const v = finiteOrNull(kg);
  if (v == null) return "";
  if (isImperialBodyUnits(units)) {
    return String(Math.round(v * LB_PER_KG * 10) / 10);
  }
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

/** Saisie affichage → kg (nombre ou ""). */
export function weightDisplayToKg(raw, units) {
  const s = String(raw ?? "").trim().replace(",", ".");
  if (s === "") return "";
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return "";
  if (isImperialBodyUnits(units)) {
    // 1 décimale kg : round-trip propre depuis lb affiché à 1 décimale.
    return Math.round((n / LB_PER_KG) * 10) / 10;
  }
  return Math.round(n * 10) / 10;
}

/** cm → { feet, inches } (inches 0–11.9, arrondi 0.1). */
export function cmToFeetInches(cm) {
  const v = finiteOrNull(cm);
  if (v == null || v <= 0) return { feet: "", inches: "" };
  const totalIn = v / CM_PER_INCH;
  let feet = Math.floor(totalIn / 12);
  let inches = Math.round((totalIn - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return {
    feet: String(feet),
    inches: Number.isInteger(inches) ? String(Math.round(inches)) : String(inches),
  };
}

/** cm → affichage métrique. */
export function cmToHeightDisplay(cm, units) {
  if (isImperialBodyUnits(units)) {
    const { feet, inches } = cmToFeetInches(cm);
    if (feet === "" && inches === "") return "";
    return { feet, inches };
  }
  const v = finiteOrNull(cm);
  if (v == null) return "";
  const rounded = Math.round(v);
  return String(rounded);
}

/** ft + in → cm. */
export function feetInchesToCm(feetRaw, inchesRaw) {
  const fS = String(feetRaw ?? "").trim().replace(",", ".");
  const iS = String(inchesRaw ?? "").trim().replace(",", ".");
  if (fS === "" && iS === "") return "";
  const feet = fS === "" ? 0 : Number(fS);
  const inches = iS === "" ? 0 : Number(iS);
  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) return "";
  const totalIn = feet * 12 + inches;
  return Math.round(totalIn * CM_PER_INCH);
}

/** Saisie hauteur métrique (cm) → cm. */
export function heightDisplayToCm(raw, units, inchesRaw) {
  if (isImperialBodyUnits(units)) {
    return feetInchesToCm(raw, inchesRaw);
  }
  const s = String(raw ?? "").trim().replace(",", ".");
  if (s === "") return "";
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return "";
  return Math.round(n);
}
