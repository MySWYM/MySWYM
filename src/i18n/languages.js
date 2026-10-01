/** Langues de l'app. Le drapeau est un pays (code ISO), pas le code langue. */

export const APP_LANGUAGES = [
  { id: "fr", name: "Français", flag: "FR", intl: "fr-FR", prefixes: ["fr"] },
  { id: "en", name: "English", flag: "GB", intl: "en-GB", prefixes: ["en"] },
  { id: "de", name: "Deutsch", flag: "DE", intl: "de-DE", prefixes: ["de"] },
  { id: "es", name: "Español", flag: "ES", intl: "es-ES", prefixes: ["es"] },
  { id: "ja", name: "日本語", flag: "JP", intl: "ja-JP", prefixes: ["ja"] },
  { id: "nl", name: "Nederlands", flag: "NL", intl: "nl-NL", prefixes: ["nl"] },
  { id: "it", name: "Italiano", flag: "IT", intl: "it-IT", prefixes: ["it"] },
  { id: "pt", name: "Português", flag: "PT", intl: "pt-PT", prefixes: ["pt"] },
  { id: "pt-BR", name: "Português (Brasil)", flag: "BR", intl: "pt-BR", prefixes: [] },
  { id: "sv", name: "Svenska", flag: "SE", intl: "sv-SE", prefixes: ["sv"] },
  { id: "da", name: "Dansk", flag: "DK", intl: "da-DK", prefixes: ["da"] },
  { id: "nb", name: "Norsk", flag: "NO", intl: "nb-NO", prefixes: ["nb", "no", "nn"] },
  { id: "fi", name: "Suomi", flag: "FI", intl: "fi-FI", prefixes: ["fi"] },
];

export const SUPPORTED_LANGS = APP_LANGUAGES.map((l) => l.id);

export function normalizeAppLanguage(code) {
  const raw = String(code || "").trim().replace(/_/g, "-");
  if (!raw) return "en";
  const lower = raw.toLowerCase();
  if (lower === "pt-br" || lower.startsWith("pt-br")) return "pt-BR";
  const exact = APP_LANGUAGES.find((l) => l.id.toLowerCase() === lower);
  if (exact) return exact.id;
  const base = lower.split("-")[0];
  const byPrefix = APP_LANGUAGES.find((l) => l.prefixes.includes(base));
  return byPrefix ? byPrefix.id : "en";
}

export function intlLocaleFor(code) {
  const id = normalizeAppLanguage(code);
  return APP_LANGUAGES.find((l) => l.id === id)?.intl || "en-GB";
}
