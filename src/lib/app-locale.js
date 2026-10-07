/**
 * Locale Intl de la langue active de l’app (dates, nombres).
 * Ne jamais écrire "fr-FR" en dur dans un affichage : un nageur en anglais
 * verrait « 31 août », « 1 600 m » à la française.
 */
import i18next from "i18next";
import { intlLocaleFor } from "../i18n/languages.js";

export function appLocale() {
  return intlLocaleFor(i18next.language || "fr");
}
