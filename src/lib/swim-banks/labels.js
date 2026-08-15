/**
 * Libellés / notes associés aux banques (matériel découverte, respirations).
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 */
import { bankMeta } from "./_helpers.js";
import { TECHNIQUE } from "./technique-drills.js";

/** Découverte : palmes et tuba frontal sur la ligne d'éducatif. */
export const MATERIEL_DECOUVERTE = [" palmes et tuba frontal", " palmes et tuba frontal"];
export const RESPIRATIONS = ["bilatérale 3T", "libre", "bilatérale alternée"];

export const LABEL_ENTRIES = [
  ...MATERIEL_DECOUVERTE.map((value, index) => ({
    ...bankMeta({ id: `materiel_decouverte_${index}`, sourceSymbol: `MATERIEL_DECOUVERTE[${index}]`, status: "candidate" }),
    kind: "materiel_decouverte",
    value,
  })),
  ...RESPIRATIONS.map((value, index) => ({
    ...bankMeta({ id: `respiration_${index}`, sourceSymbol: `RESPIRATIONS[${index}]`, status: "candidate" }),
    kind: "respiration",
    value,
  })),
  ...Object.entries(TECHNIQUE).map(([focusKey, focus]) => ({
    ...bankMeta({ id: `focus_label_${focusKey}`, sourceSymbol: `TECHNIQUE.${focusKey}.label`, status: "candidate" }),
    kind: "technique_focus_label",
    focusKey,
    value: focus.label,
  })),
];
