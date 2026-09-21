/**
 * Pays ISO 3166-1 alpha-2, libellés FR.
 * Liste mondiale (comme GOWOD), pas seulement les storefronts App Store.
 * Drapeaux : SVG recadrés en rond (même recette que les langues).
 */
const SKIP = new Set([
  "EU", "EZ", "UN", "QO",
  // Codes obsolètes / alias → même nom FR qu’un code vivant
  "AN", "BU", "CS", "DD", "DY", "FX", "HV", "NH", "RH", "SU", "TP", "UK", "VD", "YD", "YU", "ZR",
]);

/** Code ISO à garder si deux régions partagent le même libellé FR. */
const PREFER = new Set([
  "FR", "GB", "DE", "RS", "MM", "BF", "BJ", "CD", "CW", "VU", "ZW", "RU", "TL", "VN", "YE",
]);

export function countryFlagSrc(code) {
  const cc = String(code || "").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) return "";
  return `https://flagcdn.com/${cc}.svg`;
}

function buildCountries() {
  const names = new Intl.DisplayNames(["fr"], { type: "region" });
  const byName = new Map();
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (SKIP.has(code)) continue;
      if (code[0] === "X" && code !== "XK") continue;
      let name = "";
      try {
        name = names.of(code) || "";
      } catch {
        name = "";
      }
      if (!name || name === code) continue;
      const prev = byName.get(name);
      if (!prev) {
        byName.set(name, code);
        continue;
      }
      if (PREFER.has(code) && !PREFER.has(prev)) byName.set(name, code);
    }
  }
  const out = [...byName.entries()].map(([name, code]) => ({ code, name }));
  out.sort((x, y) => x.name.localeCompare(y.name, "fr"));
  return out;
}

export const COUNTRIES = buildCountries();

const ALIAS = Object.freeze({
  UK: "GB",
  FX: "FR",
  AN: "CW",
  SU: "RU",
  YU: "RS",
  CS: "RS",
  ZR: "CD",
});

export function normalizeCountry(value) {
  let s = String(value || "").trim().toUpperCase();
  if (ALIAS[s]) s = ALIAS[s];
  return /^[A-Z]{2}$/.test(s) && COUNTRIES.some((c) => c.code === s) ? s : "";
}

export function countryByCode(code) {
  const id = normalizeCountry(code);
  return COUNTRIES.find((c) => c.code === id) || null;
}

export function countryLabelFr(code) {
  return countryByCode(code)?.name || "";
}

export function searchCountries(query) {
  const q = String(query || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!q) return COUNTRIES;
  return COUNTRIES.filter((c) => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    return name.includes(q) || c.code.toLowerCase() === q;
  });
}
