/**
 * Catalogue d’éducatifs MySWYM / Arthur Natation.
 * Architecture prête pour vidéos & contenus propriétaires.
 * Aucun contenu OpenSwim / concurrent.
 *
 * Affichage : si une fiche Arthur fiable existe pour un éducatif *existant*,
 * nom / utilité / consignes / niveau / matériel viennent d’Arthur.
 * Les 11 ajouts `arthur_*` ne sont pas matchés ici (pas de sélection auto).
 */

import {
  CATALOG_ID_TO_ARTHUR_ID,
  applyArthurFicheToEducatif,
  getArthurEducatifFiche,
  matchArthurEducatif,
} from "./arthur-educatif-fiches.js";

/** @typedef {{
 *  id: string,
 *  name: string,
 *  shortDescription: string,
 *  objective: string,
 *  cue: string,
 *  mistakes: string[],
 *  videoUrl?: string | null,
 *  thumbUrl?: string | null,
 *  match: RegExp[],
 *  level?: string | null,
 *  equipment?: string | null,
 *  ficheSource?: 'catalog' | 'arthur',
 *  arthurId?: string | null,
 * }} Educatif
 */

/** @type {Educatif[]} */
export const EDUCATIFS = [
  {
    id: "respiration_3t",
    name: "Respiration 3 temps",
    shortDescription: "Tu inspires tous les 3 coups de bras, en alternant les côtés.",
    objective: "Équilibrer la respiration et fluidifier le crawl.",
    cue: "Expire dans l’eau, inspire vite sur le côté, sans lever la tête.",
    mistakes: ["Bloquer l’air trop longtemps", "Tourner la tête trop haut", "Toujours le même côté"],
    videoUrl: null,
    thumbUrl: null,
    match: [/respiration\s*3\s*t/i, /3\s*temps/i, /\b3T\b/],
  },
  {
    id: "respiration_1t",
    name: "Respiration 1 temps",
    shortDescription: "Tu inspires à chaque cycle de bras (souvent un seul côté).",
    objective: "Travailler le rythme respiratoire en sprint ou en effort court.",
    cue: "Inspire court, expire continue dans l’eau.",
    mistakes: ["Apnée forcée", "Rupture du rythme de nage"],
    videoUrl: null,
    thumbUrl: null,
    match: [/respiration\s*1\s*t/i, /1\s*temps/i, /\b1T\b/],
  },
  {
    id: "respiration_5t",
    name: "Respiration 5 temps",
    shortDescription: "Tu inspires tous les 5 coups de bras.",
    objective: "Allonger l’apnée contrôlée et renforcer le contrôle.",
    cue: "Reste détendu : expire longtemps, inspire vite.",
    mistakes: ["Forcer l’apnée jusqu’à paniquer", "Raccourcir l’amplitude"],
    videoUrl: null,
    thumbUrl: null,
    match: [/respiration\s*5\s*t/i, /5\s*temps/i, /\b5T\b/],
  },
  {
    id: "rattrape",
    name: "Rattrapé",
    shortDescription: "Une main attend devant pendant que l’autre tire.",
    objective: "Améliorer le glissé et le timing des bras.",
    cue: "Main devant stable, tire complet, puis échange.",
    mistakes: ["Commencer le bras trop tôt", "Couler les hanches"],
    videoUrl: null,
    thumbUrl: null,
    match: [/rattrap/i],
  },
  {
    id: "godille",
    name: "Godille",
    shortDescription: "Petits mouvements de main en huit pour sentir l’appui.",
    objective: "Développer le feeling d’eau et l’appui de main.",
    cue: "Main souple, pression constante, pas de grand balayage.",
    mistakes: ["Bras raide", "Aller trop vite sans appui"],
    videoUrl: null,
    thumbUrl: null,
    match: [/godille/i],
  },
  {
    id: "poings_fermes",
    name: "Poings fermés",
    shortDescription: "Tu nages avec les poings fermés pour sentir l’avant-bras.",
    objective: "Améliorer l’appui avant-bras / coude haut.",
    cue: "Garde le coude haut, sens l’eau sur l’avant-bras.",
    mistakes: ["Tirer uniquement avec le poing", "Oublier la rotation"],
    videoUrl: null,
    thumbUrl: null,
    match: [/poings?\s*ferm/i, /poing\s*ferm/i],
  },
  {
    id: "crawl_polo",
    name: "Crawl polo",
    shortDescription: "Tête hors de l’eau (ou haute), nage type water-polo.",
    objective: "Renforcer le gainage et le battement.",
    cue: "Regard devant, bassin stable, battement actif.",
    mistakes: ["Cambrer le dos", "Battement trop passif"],
    videoUrl: null,
    thumbUrl: null,
    match: [/crawl\s*polo/i, /polo/i],
  },
  {
    id: "un_bras",
    name: "Un bras",
    shortDescription: "Tu nages en utilisant un seul bras (l’autre devant ou le long du corps).",
    objective: "Corriger le trajet de bras et la rotation.",
    cue: "Rotation claire, traction longue, main qui termine derrière.",
    mistakes: ["Épaule qui s’affaisse", "Couper la traction"],
    videoUrl: null,
    thumbUrl: null,
    match: [/un\s*bras/i, /bras\s*altern/i, /1\s*bras/i],
  },
  {
    id: "jambes",
    name: "Jambes / battements",
    shortDescription: "Travail de battement (souvent avec planche).",
    objective: "Renforcer les jambes et la position horizontale.",
    cue: "Battement depuis la hanche, cheville souple, amplitude courte.",
    mistakes: ["Genoux trop pliés", "Battement trop large"],
    videoUrl: null,
    thumbUrl: null,
    match: [/\bjambes?\b/i, /battement/i, /\bkick\b/i],
  },
  {
    id: "amplitude",
    name: "Amplitude",
    shortDescription: "Tu allonges chaque cycle : moins de coups, plus de glisse.",
    objective: "Améliorer l’efficacité et la distance par cycle.",
    cue: "Allonge devant, tire complet, glisse un instant.",
    mistakes: ["Accélérer en raccourcissant", "Coudes bas"],
    videoUrl: null,
    thumbUrl: null,
    match: [/amplitude/i, /dps\b/i, /distance\s*par\s*cycle/i],
  },
  {
    id: "progressif",
    name: "Progressif",
    shortDescription: "Tu accélères progressivement sur la distance.",
    objective: "Contrôler la montée d’allure.",
    cue: "Départ facile, fin plus soutenue, sans exploser trop tôt.",
    mistakes: ["Partir trop vite", "Finir en technique cassée"],
    videoUrl: null,
    thumbUrl: null,
    match: [/progressif/i, /négatif/i, /descend/i],
  },
  {
    id: "fleche",
    name: "Flèche",
    shortDescription: "Poussée mur + glisse en position profilée.",
    objective: "Améliorer les départs et la position hydrodynamique.",
    cue: "Serré, regard vers le fond, glisse longue avant le 1er mouvement.",
    mistakes: ["Relever la tête trop tôt", "Battre trop vite dès la poussée"],
    videoUrl: null,
    thumbUrl: null,
    match: [/flèche/i, /fleche/i],
  },
  {
    id: "doigts_trainants",
    name: "Doigts traînants",
    shortDescription: "Les doigts frôlent l’eau au retour du bras.",
    objective: "Corriger le retour de bras et le relâchement.",
    cue: "Coude haut, doigts légers à la surface, retour détendu.",
    mistakes: ["Bras tendu au retour", "Éclabousser"],
    videoUrl: null,
    thumbUrl: null,
    match: [/doigts?\s*tra[iî]n/i, /finger\s*trail/i],
  },
];

function withArthurOverlay(edu) {
  if (!edu) return null;
  const arthurId = CATALOG_ID_TO_ARTHUR_ID[edu.id];
  if (!arthurId) {
    return { ...edu, ficheSource: edu.ficheSource || "catalog", arthurId: null };
  }
  const fiche = getArthurEducatifFiche(arthurId);
  if (!fiche) {
    return { ...edu, ficheSource: "catalog", arthurId: null };
  }
  return applyArthurFicheToEducatif(edu, fiche);
}

/**
 * Trouve le premier éducatif correspondant à un texte de séance.
 * Catalogue d’abord (overlay Arthur si map fiable), sinon fiches Arthur existantes.
 * @param {string} text
 * @returns {Educatif | null}
 */
export function matchEducatif(text) {
  const t = String(text || "");
  if (!t.trim()) return null;

  const arthur = matchArthurEducatif(t);

  for (const edu of EDUCATIFS) {
    if (!edu.match.some((re) => re.test(t))) continue;

    // « jambes » catalogue est trop large : préférer crawl/dos Arthur si détecté
    if (
      edu.id === "jambes" &&
      arthur &&
      (arthur.arthurId === "educatif_jambes_crawl" || arthur.arthurId === "educatif_jambes_dos")
    ) {
      return arthur;
    }

    // Nouveaux éducatifs Arthur (`arthur_*`) : ne pas coller la fiche existante « rattrapé »
    if (edu.id === "rattrape" && /rattrap[eé]\s*cuisse/i.test(t)) {
      continue;
    }

    return withArthurOverlay(edu);
  }

  return arthur;
}

export function getEducatifById(id) {
  if (!id) return null;
  const fromCatalog = EDUCATIFS.find((e) => e.id === id);
  if (fromCatalog) return withArthurOverlay(fromCatalog);
  const fiche = getArthurEducatifFiche(id);
  if (fiche) {
    return {
      id: fiche.id,
      name: fiche.name,
      shortDescription: fiche.utility || "",
      objective: fiche.utility || "",
      cue: fiche.instructions || "",
      mistakes: [],
      videoUrl: null,
      thumbUrl: null,
      match: [],
      level: fiche.level || null,
      equipment: fiche.equipment || null,
      ficheSource: "arthur",
      arthurId: fiche.id,
    };
  }
  return null;
}
