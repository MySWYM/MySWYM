/** Langue d'affichage des séances, sans importer i18n (les tests Node restent en français). */
let current = "fr";

export function setSessionDisplayLang(lng) {
  current = lng || "fr";
}

export function getSessionDisplayLang() {
  return current;
}
