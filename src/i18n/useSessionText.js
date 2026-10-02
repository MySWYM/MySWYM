import { useTranslation } from "react-i18next";
import { normalizeAppLanguage } from "./languages.js";
import { translateSessionText } from "./session-terms.js";

/** Retraduit les lignes de séance quand la langue change. */
export function useSessionText() {
  const { i18n } = useTranslation();
  const lang = normalizeAppLanguage(i18n.language);
  return (text) => translateSessionText(text, lang);
}
