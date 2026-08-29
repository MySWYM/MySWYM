/**
 * Patterns de reprise Régulier, reconstruire sensations → technique → volume → enchaînement → intensité légère.
 * Pas « la même séance avec moins de mètres ».
 */

/** @typedef {'sensations'|'technique'|'volume'|'enchainement'|'intensite_legere'} ReprisePatternId */

export const REPRISE_PATTERNS = Object.freeze([
  {
    id: "sensations",
    headline: "Aujourd'hui : retrouver les sensations",
    learnCue: "mouvement souple, sans exiger",
    applyCue: "écoute ton corps, nage confortable",
    techPrimary: "nage",
    setFormat: "mixed",
    corpsCue: "sensations - facile",
  },
  {
    id: "technique",
    headline: "Aujourd'hui : reconstruire la technique",
    learnCue: "mouvement propre avant la distance",
    applyCue: "applique l'éducatif sans forcer",
    techPrimary: "rattrape",
    setFormat: "alternating",
    corpsCue: "technique appliquée - facile",
  },
  {
    id: "volume",
    headline: "Aujourd'hui : remonter le volume tranquillement",
    learnCue: "respiration régulière",
    applyCue: "enchaîne sans chercher la perf",
    techPrimary: "respiration",
    setFormat: "repeated",
    preferredUnit: 100,
    corpsCue: "volume progressif - facile",
  },
  {
    id: "enchainement",
    headline: "Aujourd'hui : réapprendre à enchaîner",
    learnCue: "petits blocs propres",
    applyCue: "enchaîne les blocs, récupère bien entre",
    techPrimary: "nage",
    setFormat: "broken",
    corpsCue: "enchaînement - facile",
  },
  {
    id: "intensite_legere",
    headline: "Aujourd'hui : un peu plus d'allure, sans forcer",
    learnCue: "qualité avant la vitesse",
    applyCue: "facile → un cran au-dessus seulement",
    techPrimary: "rattrape",
    setFormat: "block",
    corpsCue: "intensité légère",
    lightQuality: true,
  },
]);

/**
 * Choisit un pattern de reprise selon semaine / index (déterministe).
 * Progression typique : sensations → technique → volume → enchaînement → intensité légère.
 */
export function selectReprisePattern(brief = {}, rng = Math.random) {
  if (brief.reprisePattern && REPRISE_PATTERNS.some((p) => p.id === brief.reprisePattern)) {
    return REPRISE_PATTERNS.find((p) => p.id === brief.reprisePattern);
  }
  const wi = Number(brief.weekIndex) || 0;
  const si = Number(brief.sessionIndex) || 0;
  // Par séance dans la semaine reprise : A / B distincts (C = récup hors reprise)
  const weekProgression = [
    ["sensations", "technique"],
    ["volume", "enchainement"],
    ["enchainement", "intensite_legere"],
    ["technique", "volume"],
    ["sensations", "intensite_legere"],
  ];
  const pair = weekProgression[wi % weekProgression.length];
  const id = pair[Math.min(si, pair.length - 1)] || pair[0];
  // Si si>=2 (rare sur reprise C), rester sur le 2e
  void rng; // déterminisme purement indexé pour la progression pédagogique
  return REPRISE_PATTERNS.find((p) => p.id === id) || REPRISE_PATTERNS[0];
}
