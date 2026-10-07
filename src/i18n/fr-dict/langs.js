import { SUPPORTED_LANGS } from "../languages.js";

/** Langues cibles du dictionnaire français → autres langues. */
export const TARGET_LANGS = SUPPORTED_LANGS.filter((l) => l !== "fr");

/** Chaînes identiques dans toutes les langues. */
export const KEEP_AS_IS = new Set(["MySWYM", "mySWYM", "Premium", "T100", "FAQ", "OK", "Apple", "Google", "Facebook", "Strava", "Garmin"]);
