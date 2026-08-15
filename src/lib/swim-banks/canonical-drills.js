/**
 * Banque canonique des éducatifs (étape 2 refonte).
 *
 * Une fiche = UN éducatif réutilisable (jamais une série TECHNIQUE complète).
 * Textes / utilités : uniquement sources existantes (educatifs-canoniques, catalogues).
 * Non branchée au composeur / générateur — préparation seulement.
 *
 * Généré mécaniquement le 2026-08-15 — ne pas inventer de pédagogie ici.
 */

/** @typedef {'canonical'|'legacy'|'to_review'|'excluded'} CanonicalDrillStatus */

/**
 * @typedef {object} CanonicalDrill
 * @property {string} id
 * @property {string} name
 * @property {string[]} strokes
 * @property {string} category
 * @property {string[]} levels
 * @property {string} levelLabel
 * @property {string[]} objectiveTags
 * @property {string[]} equipmentRequired
 * @property {string[]} equipmentOptional
 * @property {string} safetyNotes
 * @property {{ status: string, notes: string }} painCompatibility
 * @property {{ status: string, notes: string }} taperCompatibility
 * @property {string} description
 * @property {string} utility
 * @property {string} suggestedFormat
 * @property {string} source
 * @property {string[]} runtimeSeriesIds
 * @property {CanonicalDrillStatus} status
 * @property {string[]} reviewReasons
 * @property {number} occurrenceCount
 * @property {string|null} alternateOf
 */

/** @type {CanonicalDrill[]} */
export const CANONICAL_DRILLS = [
  {
    id: "educatif_petit_chien",
    name: "Petit chien",
    strokes: ["crawl"],
    category: "traction",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["petit chien","aisance","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas proposer en découverte tant que le geste n’est pas relire et cadré.",
    painCompatibility: {"status":"compatible","notes":"Ne pas proposer en découverte tant que le geste n’est pas relire et cadré."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "À documenter. Le nom « petit chien » apparaît dans la bibliothèque, sans description du geste à exécuter.",
    utility: "À documenter. La bibliothèque l’utilise comme éducatif d’aisance, sans préciser la compétence visée.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_chiens_1","technique_chiens_2","technique_chiens_5","technique_chiens_6"],
    status: "to_review",
    reviewReasons: ["description_ou_utilite_a_documenter"],
    occurrenceCount: 4,
    alternateOf: null,
  },
  {
    id: "educatif_grand_chien",
    name: "Grand chien",
    strokes: ["crawl"],
    category: "traction",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["grand chien","traction","aisance","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Garder la tête dans une position confortable ; souffler sans bloquer.",
    painCompatibility: {"status":"compatible","notes":"Garder la tête dans une position confortable ; souffler sans bloquer."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Le nageur avance en crawl en gardant les bras sous l’eau. La traction est large, les mains ne sortent pas. Le rythme reste lent pour sentir l’eau.",
    utility: "Installer une traction sous-marine large et une aisance dans l’appui, sans retour aérien.",
    suggestedFormat: "6 à 10 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_chiens_0","technique_chiens_2","technique_chiens_3","technique_chiens_4","technique_chiens_6","technique_chiens_7","technique_grand_chien_0","technique_grand_chien_1","technique_grand_chien_2","technique_grand_chien_3","technique_grand_chien_4","technique_grand_chien_5"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 12,
    alternateOf: null,
  },
  {
    id: "educatif_fleche",
    name: "Flèche",
    strokes: ["crawl"],
    category: "coulée",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["flèche","glisse","coulée","alignement"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas forcer l’apnée : reprendre la nage dès que la glisse s’arrête.",
    painCompatibility: {"status":"forbidden","notes":"Ne pas forcer l’apnée : reprendre la nage dès que la glisse s’arrête."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Après la poussée au mur, le nageur glisse bras tendus, tête entre les bras, avant de nager. Il cherche à rester long et stable le plus longtemps possible.",
    utility: "Fixer l’alignement de la coulée et la sensation de glisse après la poussée.",
    suggestedFormat: "6 à 10 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_fleche_0","technique_fleche_1","technique_fleche_2","technique_fleche_3","technique_fleche_4","technique_fleche_5","technique_grand_chien_4"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 7,
    alternateOf: null,
  },
  {
    id: "educatif_crawl_rattrape",
    name: "Crawl rattrapé",
    strokes: ["crawl"],
    category: "coordination",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["rattrapé","glisse","crawl","coordination"],
    equipmentRequired: [],
    equipmentOptional: ["palmes","plaquettes"],
    safetyNotes: "Avec plaquettes, réduire l’amplitude si l’épaule tire.",
    painCompatibility: {"status":"compatible","notes":"Avec plaquettes, réduire l’amplitude si l’épaule tire."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Une main attend devant, dans l’axe de l’épaule, pendant que l’autre termine sa traction. Les mains se rejoignent devant le visage avant le mouvement suivant. La glisse n’est pas coupée.",
    utility: "Allonger le temps de glisse et aligner l’entrée de main avant d’enchaîner la traction.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_catchup_0","technique_catchup_1","technique_catchup_2","technique_catchup_3","technique_catchup_4","technique_catchup_5","technique_catchup_6","technique_catchup_7","technique_catchup_8","technique_catchup_9","technique_catchup_10","technique_jambes_0","technique_jambes_3","technique_jambes_5","technique_jambes_8","technique_jambes_12","technique_croisement_3","technique_croisement_7"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 24,
    alternateOf: null,
  },
  {
    id: "educatif_toucher_cuisse",
    name: "Toucher cuisse",
    strokes: ["crawl"],
    category: "roulis",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["toucher cuisse","roulis","fin de traction"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Ne pas cambrer pour chercher l’air ; palmes facultatives pour le confort.",
    painCompatibility: {"status":"compatible","notes":"Ne pas cambrer pour chercher l’air ; palmes facultatives pour le confort."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Un bras reste tendu devant, l’autre le long de la cuisse. On inverse ensuite. La respiration se fait sur le côté, sans lever la tête.",
    utility: "Aller au bout de la traction et lier le roulis à un bras directeur devant.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_5"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 1,
    alternateOf: null,
  },
  {
    id: "educatif_six_battements_par_roulis",
    name: "Six battements par roulis",
    strokes: ["crawl"],
    category: "roulis",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["roulis","battements","coordination","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Garder un battement souple ; ne pas bloquer les genoux pour « compter plus fort ».",
    painCompatibility: {"status":"compatible","notes":"Garder un battement souple ; ne pas bloquer les genoux pour « compter plus fort »."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur compte six battements pour un roulis d’un côté, puis six de l’autre. Les hanches tournent avec les épaules, le regard reste vers le fond entre les respirations.",
    utility: "Caler les battements sur la rotation du corps, au lieu de battre dans le vide.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_3"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 1,
    alternateOf: null,
  },
  {
    id: "educatif_un_bras",
    name: "Crawl à un bras",
    strokes: ["crawl"],
    category: "coordination",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["un bras","rotation","crawl"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Changer de bras avant que l’épaule travaille de travers.",
    painCompatibility: {"status":"compatible","notes":"Changer de bras avant que l’épaule travaille de travers."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Un bras nage, l’autre reste tendu devant. On inverse ensuite. Le nageur tourne les hanches du côté du bras qui rame, sans laisser le bras d’attente couler.",
    utility: "Isoler la traction d’un bras et la rotation, tout en gardant un appui directeur devant.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_1","technique_roulis_8","technique_roulis_12","technique_jambes_1","technique_jambes_6","technique_jambes_10","technique_jambes_15","technique_croisement_1","technique_croisement_6"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 9,
    alternateOf: null,
  },
  {
    id: "educatif_apnee_controlee",
    name: "Apnée contrôlée",
    strokes: ["crawl"],
    category: "respiration",
    levels: ["sportif","performance"],
    levelLabel: "Avancé",
    objectiveTags: ["apnée","respiration","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Pas en découverte. Pas d’apnée forcée, pas d’hyperventilation avant. Sortir dès le premier inconfort.",
    painCompatibility: {"status":"forbidden","notes":"Pas en découverte. Pas d’apnée forcée, pas d’hyperventilation avant. Sortir dès le premier inconfort."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Le nageur avance quelques mouvements ou une courte distance sans inspirer, puis reprend une respiration calme. Il s’arrête dès que le geste se déforme.",
    utility: "Allonger le confort sans air sans passer en survie, ni casser l’alignement.",
    suggestedFormat: "4 à 6 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_respiration_1","technique_respiration_4","technique_respiration_10","technique_respiration_13","technique_virages_7"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 5,
    alternateOf: null,
  },
  {
    id: "educatif_respiration_tardive",
    name: "Respiration tardive",
    strokes: ["crawl"],
    category: "respiration",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["respiration tardive","tête basse","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas retenir l’air au point de se crisper ; souffler d’abord, puis tourner.",
    painCompatibility: {"status":"compatible","notes":"Ne pas retenir l’air au point de se crisper ; souffler d’abord, puis tourner."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur retarde l’inspiration : la tête reste basse, dans l’axe, le plus longtemps possible avant de tourner la bouche vers l’air. Il ne lève pas la tête en avant.",
    utility: "Garder la tête dans l’alignement et supprimer le relevé de tête à l’inspiration.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_respiration_2","technique_respiration_5","technique_respiration_12","technique_roulis_1"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 4,
    alternateOf: null,
  },
  {
    id: "educatif_respiration_bilaterale",
    name: "Respiration bilatérale",
    strokes: ["crawl"],
    category: "respiration",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["bilatéral","respiration","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Accepter un rythme plus lent au début plutôt que de jeter la tête.",
    painCompatibility: {"status":"compatible","notes":"Accepter un rythme plus lent au début plutôt que de jeter la tête."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur inspire d’un côté puis de l’autre, en alternance. Le rythme de nage reste le même ; il évite de toujours prendre l’air du même côté.",
    utility: "Équilibrer la rotation et l’appui des deux côtés, au lieu de nager « à une épaule ».",
    suggestedFormat: "4 à 6 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_respiration_1","technique_respiration_4","technique_respiration_9","technique_respiration_11","technique_respiration_13"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 5,
    alternateOf: null,
  },
  {
    id: "educatif_respiration_par_temps",
    name: "Respiration par temps",
    strokes: ["crawl"],
    category: "respiration",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["respiration","3 temps","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Cinq temps et plus : seulement si le nageur reste souple. Sept temps et au-delà : hors découverte, sortir dès que le geste se déforme.",
    painCompatibility: {"status":"compatible","notes":"Cinq temps et plus : seulement si le nageur reste souple. Sept temps et au-delà : hors découverte, sortir dès que le geste se déforme."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur compte un nombre fixe de mouvements de bras entre deux respirations. Trois, cinq ou sept temps sont des réglages de séance, pas des éducatifs différents. La tête revient dans l’axe après l’inspiration.",
    utility: "Régler le rythme respiratoire sans casser la nage, en gardant un compte clair.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_respiration_0","technique_respiration_1","technique_respiration_2","technique_respiration_3","technique_respiration_5","technique_respiration_6","technique_respiration_7","technique_respiration_8","technique_respiration_9","technique_respiration_10","technique_respiration_11","technique_respiration_12","technique_jambes_13"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 17,
    alternateOf: null,
  },
  {
    id: "educatif_crawl_immerge",
    name: "Crawl immergé",
    strokes: ["crawl"],
    category: "coulée",
    levels: ["sportif","performance"],
    levelLabel: "Avancé",
    objectiveTags: ["immergé","coulée","palmes","crawl"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Distance courte. Pas d’hyperventilation. Revenir à l’air dès que le besoin se fait sentir.",
    painCompatibility: {"status":"forbidden","notes":"Distance courte. Pas d’hyperventilation. Revenir à l’air dès que le besoin se fait sentir."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Le nageur avance en crawl sous l’eau, souvent avec palmes. Les mouvements restent amples, sans chercher l’air au milieu de la longueur.",
    utility: "Tenir l’alignement et la traction sans la respiration aérienne pour se rattraper.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_7","technique_grand_chien_0","technique_grand_chien_5"],
    status: "to_review",
    reviewReasons: ["segments_multi_match_ambigu","majorite_occurrences_ambigues","souvent_confondu_avec_grand_chien_sous_eau"],
    occurrenceCount: 3,
    alternateOf: null,
  },
  {
    id: "educatif_godille",
    name: "Godille",
    strokes: ["dos"],
    category: "prise d'appui",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["godille","appui","dos"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Garder les poignets souples ; arrêter si les avant-bras chauffent trop.",
    painCompatibility: {"status":"compatible","notes":"Garder les poignets souples ; arrêter si les avant-bras chauffent trop."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Les mains dessinent de petits huit pour se propulser, sans grand cycle de bras. Une variante de la bibliothèque se fait sur le dos, pieds en avant.",
    utility: "Sentir un appui d’eau continu avec les paumes, indépendamment de la nage complète.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_7","technique_jambes_2","technique_jambes_11"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 3,
    alternateOf: null,
  },
  {
    id: "educatif_roulis",
    name: "Roulis",
    strokes: ["crawl"],
    category: "roulis",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["roulis","rotation","crawl"],
    equipmentRequired: [],
    equipmentOptional: ["pull","palmes"],
    safetyNotes: "Ne pas forcer l’amplitude d’épaule ; le roulis part des hanches, pas d’un coup de tête.",
    painCompatibility: {"status":"compatible","notes":"Ne pas forcer l’amplitude d’épaule ; le roulis part des hanches, pas d’un coup de tête."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur exagère la rotation : l’épaule du bras qui rame sort de l’eau, hanches et épaules tournent ensemble. Le regard reste vers le fond entre les respirations.",
    utility: "Lier la rotation du corps à la traction, pour un appui plus long et moins plat.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_0","technique_roulis_1","technique_roulis_2","technique_roulis_3","technique_roulis_4","technique_roulis_9","technique_roulis_10","technique_roulis_11","technique_roulis_12","technique_roulis_13"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 13,
    alternateOf: null,
  },
  {
    id: "educatif_nage_economique",
    name: "Nage économique",
    strokes: ["crawl"],
    category: "traction",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["économie","traction","glisse","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Si le nageur se met à glisser en apnée raide, raccourcir la distance.",
    painCompatibility: {"status":"forbidden","notes":"Si le nageur se met à glisser en apnée raide, raccourcir la distance."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Le nageur cherche le moins de mouvements possible sur la distance. Chaque traction est complète, la glisse n’est pas coupée, sans accélérer pour compenser.",
    utility: "Allonger la distance par cycle et sentir l’efficacité d’appui, pas la cadence.",
    suggestedFormat: "4 à 8 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_roulis_6"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 1,
    alternateOf: null,
  },
  {
    id: "educatif_jambes_dos",
    name: "Battements de dos",
    strokes: ["dos"],
    category: "battements",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["jambes","dos","battements","planche"],
    equipmentRequired: [],
    equipmentOptional: ["planche"],
    safetyNotes: "Dégager les voies respiratoires ; ne pas jeter la tête en arrière.",
    painCompatibility: {"status":"compatible","notes":"Dégager les voies respiratoires ; ne pas jeter la tête en arrière."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Le nageur avance sur le dos surtout aux jambes. Les hanches restent hautes, les battements partent de la cuisse, une planche peut aider à tenir la position.",
    utility: "Stabiliser le battement de dos et le bassin, sans s’asseoir dans l’eau.",
    suggestedFormat: "4 à 6 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_jambes_2","technique_jambes_11","technique_jambes_14"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 3,
    alternateOf: null,
  },
  {
    id: "educatif_jambes_crawl",
    name: "Battements de crawl",
    strokes: ["crawl"],
    category: "battements",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["jambes","crawl","battements","planche"],
    equipmentRequired: [],
    equipmentOptional: ["planche","palmes"],
    safetyNotes: "Sans planche, garder les bras devant plutôt que de cambrer pour respirer.",
    painCompatibility: {"status":"compatible","notes":"Sans planche, garder les bras devant plutôt que de cambrer pour respirer."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Le nageur avance aux jambes en crawl, planche, palmes ou bras devant selon le matériel du jour. Les genoux restent souples, le battement part de la hanche.",
    utility: "Tenir un battement stable et un gainage, sans que les pieds tapent l’eau en surface.",
    suggestedFormat: "4 à 6 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_jambes_0","technique_jambes_1","technique_jambes_3","technique_jambes_4","technique_jambes_5","technique_jambes_6","technique_jambes_7","technique_jambes_8","technique_jambes_9","technique_jambes_10","technique_jambes_12","technique_jambes_13","technique_jambes_15"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 13,
    alternateOf: null,
  },
  {
    id: "educatif_entree_main",
    name: "Entrée de main alignée",
    strokes: ["crawl"],
    category: "prise d'appui",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["entrée de main","alignement","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas claquer la main en surface ; entrée souple pour l’épaule.",
    painCompatibility: {"status":"compatible","notes":"Ne pas claquer la main en surface ; entrée souple pour l’épaule."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "La main entre dans l’eau devant l’épaule, pas au milieu de la tête ni croisée. Les doigts piquent vers le fond, puis la glisse précède la traction.",
    utility: "Corriger le croisement et préparer un appui dans l’axe, pas en travers du corps.",
    suggestedFormat: "4 à 8 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_catchup_9","technique_jambes_7","technique_jambes_14","technique_croisement_0","technique_croisement_5","technique_croisement_9","technique_croisement_10"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 7,
    alternateOf: null,
  },
  {
    id: "educatif_regard_fond",
    name: "Regard vers le fond",
    strokes: ["crawl"],
    category: "position",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["regard","position","tête","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Souffler dans l’eau ; ne pas bloquer la nuque en fixant trop bas.",
    painCompatibility: {"status":"compatible","notes":"Souffler dans l’eau ; ne pas bloquer la nuque en fixant trop bas."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "En crawl lent, le nageur garde le regard vers le fond. La tête reste dans le prolongement du dos, sans casser la nuque ni regarder devant.",
    utility: "Aligner tête et colonne pour que le bassin ne s’asseye pas.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_jambes_4","technique_croisement_2","technique_croisement_8"],
    status: "canonical",
    reviewReasons: [],
    occurrenceCount: 3,
    alternateOf: null,
  },
  {
    id: "educatif_virage_culbute",
    name: "Virage culbute",
    strokes: ["crawl"],
    category: "virage",
    levels: ["sportif","performance"],
    levelLabel: "Avancé",
    objectiveTags: ["culbute","virage","coulée","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Pas en découverte ni en régulier d’aisance. Distances courtes. Sortir si vertige ou eau dans le nez trop gênante.",
    painCompatibility: {"status":"forbidden","notes":"Pas en découverte ni en régulier d’aisance. Distances courtes. Sortir si vertige ou eau dans le nez trop gênante."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Le nageur groupe la culbute d’abord sans mur, puis l’enchaîne à l’approche du mur. Les mains restent basses, vers les hanches, et la sortie se fait en coulée, souvent quelques battements avant de nager.",
    utility: "Enchaîner rotation, pose des pieds et coulée de sortie, sans remonter les mains vers le visage.",
    suggestedFormat: "6 à 10 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_BIBLIOTHEQUE",
    runtimeSeriesIds: ["technique_virages_0","technique_virages_1","technique_virages_2","technique_virages_3","technique_virages_4","technique_virages_5","technique_virages_6","technique_virages_7","technique_virages_8","technique_virages_9","technique_virages_10"],
    status: "canonical",
    reviewReasons: ["segments_multi_match_ambigu"],
    occurrenceCount: 23,
    alternateOf: null,
  },
  {
    id: "nouveau_doigts_surface",
    name: "Doigts à la surface",
    strokes: ["crawl"],
    category: "position",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["doigts","retour de bras","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas frotter l’eau au point de casser le poignet.",
    painCompatibility: {"status":"compatible","notes":"Ne pas frotter l’eau au point de casser le poignet."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Pendant le retour aérien, les doigts frôlent la surface jusqu’à l’entrée de la main. Le coude reste plus haut que la main, l’épaule ne se jette pas vers l’avant.",
    utility: "Relâcher le retour de bras et poser une entrée de main proche de l’eau.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_crawl_polo",
    name: "Crawl polo",
    strokes: ["crawl"],
    category: "position",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["polo","tête hors de l'eau","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Distances courtes : la nuque et le bas du dos fatiguent vite.",
    painCompatibility: {"status":"compatible","notes":"Distances courtes : la nuque et le bas du dos fatiguent vite."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur avance en crawl la tête hors de l’eau, regard vers l’avant. Les battements portent le buste ; le bas du dos ne se cambre pas pour « voir loin ».",
    utility: "Garder vision et gainage quand la tête doit rester émergée, sans tout casser.",
    suggestedFormat: "4 à 6 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_crawl_envers",
    name: "Crawl à l’envers",
    strokes: ["crawl"],
    category: "coordination",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["rattrapé inverse","fin d'appui","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Épaules souples ; ne pas forcer l’extension arrière.",
    painCompatibility: {"status":"compatible","notes":"Épaules souples ; ne pas forcer l’extension arrière."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le rattrapé se fait à la cuisse : la main d’appui attend le long de la jambe jusqu’à ce que l’autre la rejoigne, puis les deux reviennent. Les mains ne se retrouvent pas devant la tête.",
    utility: "Aller au bout de la traction et sentir la fin d’appui, au lieu de couper sous l’épaule.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_jet_eau",
    name: "Jet d’eau",
    strokes: ["crawl"],
    category: "traction",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["jet d'eau","fin de traction","crawl"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Le jet reste petit ; ce n’est pas un claquement d’eau.",
    painCompatibility: {"status":"compatible","notes":"Le jet reste petit ; ce n’est pas un claquement d’eau."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "En fin de traction, la main quitte l’eau près de la cuisse en envoyant un petit jet vers l’arrière. Le nageur s’en sert comme preuve que l’appui est allé au bout, puis relâche le bras.",
    utility: "Marquer la fin de traction et éviter une sortie de main trop tôt.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_jambes_brasse_verticales",
    name: "Jambes de brasse verticales",
    strokes: ["brasse"],
    category: "battements",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["brasse","ciseau","vertical"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Sortir dès l’essoufflement. Pas d’apnée. Fond sous les pieds ou bord à portée.",
    painCompatibility: {"status":"forbidden","notes":"Sortir dès l’essoufflement. Pas d’apnée. Fond sous les pieds ou bord à portée."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "À la verticale, tête hors de l’eau, le nageur se maintient avec le ciseau de brasse, sans avancer. Les genoux restent plus serrés que les talons ; les bras peuvent aider un instant puis se reposer.",
    utility: "Isoler le ciseau et le gainage, sans compenser en pédalant ou en s’asseyant.",
    suggestedFormat: "4 à 6 × 20 s",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_doubles_coulees",
    name: "Doubles coulées",
    strokes: ["brasse"],
    category: "coulée",
    levels: ["sportif","performance"],
    levelLabel: "Avancé",
    objectiveTags: ["brasse","coulée","mur"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Coulée courte. Pas en découverte. Pas d’hyperventilation.",
    painCompatibility: {"status":"compatible","notes":"Coulée courte. Pas en découverte. Pas d’hyperventilation."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Après la poussée du mur, le nageur enchaîne une coulée de brasse sous l’eau avant de passer en nage ventrale. Le corps reste aligné ; on ne casse pas la coulée pour inspirer trop tôt.",
    utility: "Garder la vitesse du mur et allonger la phase sous-marine de la brasse.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_brasse_opposition",
    name: "Brasse en opposition",
    strokes: ["brasse"],
    category: "coordination",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["brasse","opposition","glisse"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Rythme lent ; ne pas forcer le genou en écart.",
    painCompatibility: {"status":"compatible","notes":"Rythme lent ; ne pas forcer le genou en écart."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Les bras et les jambes ne poussent jamais ensemble : on glisse bras tendus pendant le ciseau, puis on tire pendant que les jambes restent allongées. Un court alignement sépare les deux actions.",
    utility: "Rétablir le temps de glisse et supprimer le cycle « tout en même temps ».",
    suggestedFormat: "4 à 6 × 50 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_brasse_balle",
    name: "Brasse avec balle de tennis",
    strokes: ["brasse"],
    category: "battements",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["brasse","balle","ciseau"],
    equipmentRequired: ["balle de tennis"],
    equipmentOptional: [],
    safetyNotes: "Ne pas coincer la balle au point de blesser l’intérieur des cuisses. Récupérer la balle sans plongée brusque.",
    painCompatibility: {"status":"compatible","notes":"Ne pas coincer la balle au point de blesser l’intérieur des cuisses. Récupérer la balle sans plongée brusque."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Une balle de tennis est tenue entre les cuisses pendant la brasse. Le nageur doit la garder sans bloquer le ciseau, ce qui l’empêche d’écarter trop les genoux.",
    utility: "Resserrer la largeur du ciseau et diriger le rappel plus vers l’arrière que sur les côtés.",
    suggestedFormat: "4 à 6 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_dos_deux_bras",
    name: "Dos à deux bras",
    strokes: ["dos"],
    category: "traction",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["dos","deux bras","gainage"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Dégager les voies ; ne pas jeter la tête en arrière pour « aider » les bras.",
    painCompatibility: {"status":"compatible","notes":"Dégager les voies ; ne pas jeter la tête en arrière pour « aider » les bras."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Sur le dos, les deux bras travaillent ensemble : ils passent au-dessus de la tête, puis poussent vers les cuisses en même temps. La tête reste calme, les hanches hautes.",
    utility: "Sentir une poussée symétrique et le gainage du dos, sans se servir du roulis.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_dos_gobelet",
    name: "Dos avec gobelet",
    strokes: ["dos"],
    category: "position",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["dos","gobelet","alignement"],
    equipmentRequired: ["gobelet"],
    equipmentOptional: [],
    safetyNotes: "Si le gobelet tombe, s’arrêter calmement. Pas de sprint.",
    painCompatibility: {"status":"compatible","notes":"Si le gobelet tombe, s’arrêter calmement. Pas de sprint."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Un gobelet avec un peu d’eau repose sur le front pendant le dos. Le nageur avance sans le faire tomber, donc sans secouer la tête ni s’asseoir.",
    utility: "Stabiliser la tête et l’alignement en dos pour nager plus à plat.",
    suggestedFormat: "4 à 6 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_rattrape_vertical",
    name: "Rattrapé vertical",
    strokes: ["dos"],
    category: "roulis",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["dos","rattrapé vertical","roulis"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Ne pas forcer l’épaule du bras vertical ; le poignet reste souple.",
    painCompatibility: {"status":"compatible","notes":"Ne pas forcer l’épaule du bras vertical ; le poignet reste souple."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "En dos, un bras reste à la verticale, doigts vers le ciel, pendant que l’autre rame. On inverse ensuite. Les épaules tournent autour du bras qui sert de piquet.",
    utility: "Amplifier le roulis en dos tout en gardant un bras directeur hors de l’eau.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_dos_soldat",
    name: "Dos soldat",
    strokes: ["dos"],
    category: "position",
    levels: ["decouverte","regulier","sportif","performance"],
    levelLabel: "Débutant",
    objectiveTags: ["dos","soldat","position","battements"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Respiration libre. Revenir sur le ventre si l’eau passe trop sur le visage.",
    painCompatibility: {"status":"compatible","notes":"Respiration libre. Revenir sur le ventre si l’eau passe trop sur le visage."},
    taperCompatibility: {"status":"ok","notes":""},
    description: "Sur le dos, les bras restent le long du corps, mains vers les cuisses. Le nageur avance surtout aux jambes, ventre vers le plafond, sans laisser le bassin couler.",
    utility: "Installer la position du dos (tête, bassin, gainage) avant d’ajouter les bras.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_ondulations_verticales",
    name: "Ondulations verticales",
    strokes: ["papillon"],
    category: "ondulation",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["papillon","ondulation","vertical"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Fond ou bord à portée. Sortir avant de compenser en pédalant. Pas d’apnée.",
    painCompatibility: {"status":"forbidden","notes":"Fond ou bord à portée. Sortir avant de compenser en pédalant. Pas d’apnée."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "À la verticale, le nageur ondule pour se maintenir : la poitrine donne le départ de la vague, les jambes restent souples. Les bras peuvent rester le long du corps.",
    utility: "Isoler l’ondulation du papillon, sans se servir des bras pour se rattraper.",
    suggestedFormat: "4 à 6 × 20 s",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_papillon_baleine",
    name: "Papillon baleine",
    strokes: ["papillon"],
    category: "ondulation",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["papillon","baleine","ondulation"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Souffler dans l’eau. Distances courtes si la lombaires fatiguent.",
    painCompatibility: {"status":"compatible","notes":"Souffler dans l’eau. Distances courtes si la lombaires fatiguent."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Le nageur avance en ondulant, bras le long du corps. La tête sort puis plonge, la vague parcourt le corps jusqu’aux pieds. Pas de cycle de bras.",
    utility: "Construire une ondulation ample avant d’ajouter les bras du papillon.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_pousse_tete",
    name: "Pousse-tête",
    strokes: ["papillon"],
    category: "ondulation",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["papillon","tête","ondulation"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Petit mouvement de nuque, pas un coup. Arrêter si la cervicale gêne.",
    painCompatibility: {"status":"compatible","notes":"Petit mouvement de nuque, pas un coup. Arrêter si la cervicale gêne."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "Pour démarrer l’ondulation, le nageur pousse d’abord le sommet de la tête vers l’avant et un peu vers le fond, puis laisse la poitrine et les hanches suivre. Les pieds ne donnent pas le départ.",
    utility: "Déclencher la vague du haut du corps, au lieu de commencer par un coup de pieds.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_ondule_tete",
    name: "Ondule-tête",
    strokes: ["papillon"],
    category: "ondulation",
    levels: ["regulier","sportif","performance"],
    levelLabel: "Intermédiaire",
    objectiveTags: ["papillon","ondule-tête","fluidité"],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "Amplitude petite. Pas de claquement de nuque.",
    painCompatibility: {"status":"compatible","notes":"Amplitude petite. Pas de claquement de nuque."},
    taperCompatibility: {"status":"light_only","notes":""},
    description: "La tête dessine un petit oui continu : elle plonge, puis revient, et le reste du corps copie cette oscillation. Le geste reste petit et régulier, sans à-coup.",
    utility: "Lier la tête au corps pour une ondulation continue, plus fluide qu’un fouetté isolé.",
    suggestedFormat: "6 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "nouveau_amorce",
    name: "Amorce",
    strokes: ["papillon"],
    category: "prise d'appui",
    levels: ["sportif","performance"],
    levelLabel: "Avancé",
    objectiveTags: ["papillon","amorce","appui"],
    equipmentRequired: [],
    equipmentOptional: ["palmes"],
    safetyNotes: "Épaules souples. S’arrêter si l’amorce devient un plat de bras en force.",
    painCompatibility: {"status":"compatible","notes":"Épaules souples. S’arrêter si l’amorce devient un plat de bras en force."},
    taperCompatibility: {"status":"avoid","notes":"Complexité / intensité — éviter taper chaud (règles existantes)."},
    description: "Après une ou deux ondulations, les mains entament seulement le début de l’appui papillon, puis reviennent. On ne tire pas jusqu’aux cuisses : on cherche le premier appui, pas le cycle entier.",
    utility: "Poser le début de traction du papillon sans se fatiguer sur le cycle complet.",
    suggestedFormat: "4 à 8 × 25 m",
    source: "scripts/lib/educatifs-canoniques.mjs#EDUCATIFS_NOUVEAUX",
    runtimeSeriesIds: [],
    status: "excluded",
    reviewReasons: ["absent_de_TECHNIQUE_runtime","proposition_non_integree"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "orphan_glisse_position",
    name: "glisse / position",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":"Non renseigné — validation humaine requise."},
    taperCompatibility: {"status":"unknown","notes":"Non renseigné — validation humaine requise."},
    description: "",
    utility: "",
    suggestedFormat: "",
    source: "src/lib/swim-banks/technique-drills.js:technique_jambes_9",
    runtimeSeriesIds: ["technique_jambes_9"],
    status: "to_review",
    reviewReasons: ["segment_TECHNIQUE_sans_fiche_canonique","metadonnees_incompletes"],
    occurrenceCount: 1,
    alternateOf: null,
  },
  {
    id: "ui_catalog_respiration_3t",
    name: "Respiration 3 temps",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu inspires tous les 3 coups de bras, en alternant les côtés.",
    utility: "Équilibrer la respiration et fluidifier le crawl.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_respiration_par_temps",
  },
  {
    id: "ui_catalog_respiration_1t",
    name: "Respiration 1 temps",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu inspires à chaque cycle de bras (souvent un seul côté).",
    utility: "Travailler le rythme respiratoire en sprint ou en effort court.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "ui_catalog_respiration_5t",
    name: "Respiration 5 temps",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu inspires tous les 5 coups de bras.",
    utility: "Allonger l’apnée contrôlée et renforcer le contrôle.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_respiration_par_temps",
  },
  {
    id: "ui_catalog_rattrape",
    name: "Rattrapé",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Une main attend devant pendant que l’autre tire.",
    utility: "Améliorer le glissé et le timing des bras.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_crawl_rattrape",
  },
  {
    id: "ui_catalog_godille",
    name: "Godille",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Petits mouvements de main en huit pour sentir l’appui.",
    utility: "Développer le feeling d’eau et l’appui de main.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_godille",
  },
  {
    id: "ui_catalog_poings_fermes",
    name: "Poings fermés",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu nages avec les poings fermés pour sentir l’avant-bras.",
    utility: "Améliorer l’appui avant-bras / coude haut.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "ui_catalog_crawl_polo",
    name: "Crawl polo",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tête hors de l’eau (ou haute), nage type water-polo.",
    utility: "Renforcer le gainage et le battement.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "nouveau_crawl_polo",
  },
  {
    id: "ui_catalog_un_bras",
    name: "Un bras",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu nages en utilisant un seul bras (l’autre devant ou le long du corps).",
    utility: "Corriger le trajet de bras et la rotation.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_un_bras",
  },
  {
    id: "ui_catalog_jambes",
    name: "Jambes / battements",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Travail de battement (souvent avec planche).",
    utility: "Renforcer les jambes et la position horizontale.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_jambes_crawl",
  },
  {
    id: "ui_catalog_amplitude",
    name: "Amplitude",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu allonges chaque cycle : moins de coups, plus de glisse.",
    utility: "Améliorer l’efficacité et la distance par cycle.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "ui_catalog_progressif",
    name: "Progressif",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Tu accélères progressivement sur la distance.",
    utility: "Contrôler la montée d’allure.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: null,
  },
  {
    id: "ui_catalog_fleche",
    name: "Flèche",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Poussée mur + glisse en position profilée.",
    utility: "Améliorer les départs et la position hydrodynamique.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: "educatif_fleche",
  },
  {
    id: "ui_catalog_doigts_trainants",
    name: "Doigts traînants",
    strokes: [],
    category: "",
    levels: [],
    levelLabel: "",
    objectiveTags: [],
    equipmentRequired: [],
    equipmentOptional: [],
    safetyNotes: "",
    painCompatibility: {"status":"unknown","notes":""},
    taperCompatibility: {"status":"unknown","notes":""},
    description: "Les doigts frôlent l’eau au retour du bras.",
    utility: "Corriger le retour de bras et le relâchement.",
    suggestedFormat: "",
    source: "src/content/educatifs-catalog.js",
    runtimeSeriesIds: [],
    status: "legacy",
    reviewReasons: ["catalogue_ui_alternatif_non_fusionne","ids_differents_des_educatif_star"],
    occurrenceCount: 0,
    alternateOf: null,
  }
];

/**
 * Séries TECHNIQUE runtime (97 blocs) — packaging legacy, pas des éducatifs unitaires.
 * Conservées pour traçabilité ; le générateur continue de les utiliser via technique-drills.js.
 */
export const LEGACY_TECHNIQUE_SERIES = [
  {
    "id": "technique_respiration_0",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 8x25m respiration 3T (3 temps) R15''",
      "· 8x25m respiration 5T R15''",
      "· 4x50m alterné 3T/5T par 25m"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[0]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_1",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 6x50m bilatéral 3T R20''",
      "· 4x25m apnée contrôlée 2 coups sans respirer + reprise",
      "· 4x50m 3T/5T alterné"
    ],
    "canonicalIds": [
      "educatif_respiration_bilaterale",
      "educatif_apnee_controlee",
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[1]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_2",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 450,
    "lines": [
      "· 10x25m respiration 5T, focus sortie d'eau tête basse R10''",
      "· 4x50m 3T aller / 5T retour R20''"
    ],
    "canonicalIds": [
      "educatif_respiration_tardive",
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[2]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_3",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 400,
    "lines": [
      "· 8x25m respiration 7T (endurance apnée) R20''",
      "· 4x50m 3T avec accélération dernier 15m R20''"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[3]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_4",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 450,
    "lines": [
      "· 6x50m bilatéral 3T, focus rythme régulier R20''",
      "· 6x25m sans respirer 15m + reprise 3T R15''"
    ],
    "canonicalIds": [
      "educatif_respiration_bilaterale",
      "educatif_apnee_controlee"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[4]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_5",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 700,
    "lines": [
      "· 4x150 : 3T/5T/7T/5T/3T par 25m",
      "· 4x25m respiration tardive, tête qui reste basse R15''"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps",
      "educatif_respiration_tardive"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[5]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_6",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 6x100m : (3T/5T/7T/9T par 50m)"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[6]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_7",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 12x50 D1' (Z2) — (3T/5T/7T/9T par 50m)"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[7]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_8",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 450,
    "lines": [
      "· 10x25m respiration 3T R15''",
      "· 4x50m 5T sans accélérer"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[8]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_9",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 4x100m bilatéral 3T R20''",
      "· 4x50m 5T, focus régularité R15''"
    ],
    "canonicalIds": [
      "educatif_respiration_bilaterale",
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[9]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_10",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 400,
    "lines": [
      "· 8x25m apnée 1 longueur puis reprise 3T R20''",
      "· 4x50m 3T normal"
    ],
    "canonicalIds": [
      "educatif_apnee_controlee",
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[10]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_11",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 500,
    "lines": [
      "· 6x50m 3T aller, 5T retour R15''",
      "· 4x50m bilatérale libre"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps",
      "educatif_respiration_bilaterale"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[11]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_12",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 400,
    "lines": [
      "· 8x25m respiration tardive, tête basse le plus longtemps possible R15''",
      "· 4x50m 3T régulier"
    ],
    "canonicalIds": [
      "educatif_respiration_tardive",
      "educatif_respiration_par_temps"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[12]",
    "status": "legacy"
  },
  {
    "id": "technique_respiration_13",
    "focusKey": "technique_respiration",
    "label": "Respiration",
    "distance": 600,
    "lines": [
      "· 4x100m : 25m apnée + 75m respiration 3T R20''",
      "· 4x50m bilatéral 5T"
    ],
    "canonicalIds": [
      "educatif_apnee_controlee",
      "educatif_respiration_bilaterale"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_respiration[13]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_0",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 600,
    "lines": [
      "· 6x50m roulis exagéré, épaule qui sort de l'eau R20''",
      "· 4x25m avec pull-buoy, focus rotation bassin",
      "· 4x50m amplitude + roulis R15''"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[0]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_1",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 8x25m un bras (l'autre tendu devant), focus rotation R15''",
      "· 4x50m roulis marqué, respiration tardive R20''"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_respiration_tardive",
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[1]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_2",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 6x50m roulis + glisse prolongée R20''",
      "· 4x25m pull-buoy rotation complète épaules-hanches"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[2]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_3",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 8x25m « 6 battements par roulis » R15''",
      "· 4x50m roulis contrôlé, regard fixe vers le fond R20''"
    ],
    "canonicalIds": [
      "educatif_six_battements_par_roulis",
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[3]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_4",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 6x50m roulis avec pull-buoy, focus appui R20''",
      "· 4x25m nage complète, garder l'amplitude de roulis"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[4]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_5",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 200,
    "lines": [
      "· 4x50 palmes : 25m bras droit devant / gauche cuisse ; 25m inversé — respiration latérale"
    ],
    "canonicalIds": [
      "educatif_toucher_cuisse"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[5]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_6",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 8x50m le moins de mouvements possible/25m — focus position, efficacité de traction R20''"
    ],
    "canonicalIds": [
      "educatif_nage_economique"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[6]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_7",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 200,
    "lines": [
      "· 8x25m palmes : 1x crawl sous l'eau · 1x godille pieds en avant sur le dos R15''"
    ],
    "canonicalIds": [
      "educatif_crawl_immerge",
      "educatif_godille"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[7]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_8",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 6x50m un bras, focus rotation des hanches R20''",
      "· 4x25m nage complète, garder l'amplitude"
    ],
    "canonicalIds": [
      "educatif_un_bras"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[8]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_9",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 8x25m roulis marqué, épaule qui sort franchement R15''",
      "· 4x50m nage complète"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[9]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_10",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 4x100m : 50m roulis exagéré + 50m nage normale R20''"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[10]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_11",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 300,
    "lines": [
      "· 6x50m pull-buoy, focus rotation bassin-épaules R20''"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[11]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_12",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 400,
    "lines": [
      "· 8x25m un bras alterné, main qui reste devant R15''",
      "· 4x50m amplitude + roulis"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[12]",
    "status": "legacy"
  },
  {
    "id": "technique_roulis_13",
    "focusKey": "technique_roulis",
    "label": "Roulis / rotation du corps",
    "distance": 200,
    "lines": [
      "· 4x50m palmes, focus rotation complète sans forcer R20''"
    ],
    "canonicalIds": [
      "educatif_roulis"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_roulis[13]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_0",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 500,
    "lines": [
      "· 8x25m rattrapé (bras dans l'axe des épaules) R15''",
      "· 4x50m rattrapé lent, focus glisse",
      "· 4x25m rattrapé rapide, transition vers nage normale"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[0]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_1",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 500,
    "lines": [
      "· 6x50m rattrapé R20''",
      "· 4x25m rattrapé avec palmes, focus appui",
      "· 4x25m retour à nage complète, garder la glisse"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[1]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_2",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 450,
    "lines": [
      "· 10x25m rattrapé très lent, glisse maximale R15''",
      "· 4x50m rattrapé progressif (lent → rapide) R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[2]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_3",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 6x50m rattrapé + plaquettes légères, focus prise d'appui R20''",
      "· 4x25m nage complète en gardant le temps de glisse"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[3]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_4",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 8x25m rattrapé, compter le temps de glisse à voix haute R15''",
      "· 4x50m rattrapé / nage normale alterné par 25m"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[4]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_5",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 8x25m rattrapé, main qui attend franchement R15''",
      "· 4x50m rattrapé rapide"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[5]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_6",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 4x100m : 50m rattrapé + 50m nage normale R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[6]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_7",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 6x50m rattrapé avec palmes R20''",
      "· 4x25m nage complète, garder la glisse"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[7]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_8",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 250,
    "lines": [
      "· 10x25m rattrapé progressif (lent → rapide) R15''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[8]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_9",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 400,
    "lines": [
      "· 8x25m rattrapé, focus alignement épaule-main R15''",
      "· 4x50m nage normale"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_entree_main"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[9]",
    "status": "legacy"
  },
  {
    "id": "technique_catchup_10",
    "focusKey": "technique_catchup",
    "label": "Rattrapé",
    "distance": 500,
    "lines": [
      "· 6x50m rattrapé + plaquettes légères R20''",
      "· 4x50m nage complète"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_catchup[10]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_0",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x25m rattrapé R15''",
      "· 6x50m jambes crawl planche R15''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[0]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_1",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x50m un bras (l'autre tendu devant) R20''",
      "· 4x50m jambes crawl planche R15''"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[1]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_2",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 500,
    "lines": [
      "· 8x25m godilles R15''",
      "· 6x50m jambes dos planche R15''"
    ],
    "canonicalIds": [
      "educatif_godille",
      "educatif_jambes_dos"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[2]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_3",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x25m rattrapé R15''",
      "· 4x50m jambes crawl palmes R20''",
      "· 4x25m nage complète"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[3]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_4",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 6x25m crawl lent regard fond R15''",
      "· 5x50m jambes crawl planche R15''"
    ],
    "canonicalIds": [
      "educatif_regard_fond",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[4]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_5",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x50m rattrapé R20''",
      "· 4x50m jambes crawl sans planche (bras devant) R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[5]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_6",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 550,
    "lines": [
      "· 8x25m un bras R15''",
      "· 6x50m jambes crawl planche R15''",
      "· 2x25m nage complète"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[6]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_7",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x25m entrée de main alignée R15''",
      "· 4x50m jambes crawl planche R15''",
      "· 4x25m nage"
    ],
    "canonicalIds": [
      "educatif_entree_main",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[7]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_8",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 600,
    "lines": [
      "· 4x50m rattrapé R20''",
      "· 4x100m : 50m jambes · 50m crawl R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[8]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_9",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 450,
    "lines": [
      "· 6x25m glisse / position R15''",
      "· 4x50m jambes crawl R15''",
      "· 4x25m nage complète"
    ],
    "canonicalIds": [
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[9]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_10",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x25m un bras R15''",
      "· 6x50m jambes crawl palmes R15''"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[10]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_11",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 450,
    "lines": [
      "· 6x25m godilles R15''",
      "· 5x50m jambes dos planche R15''",
      "· 2x25m nage complète"
    ],
    "canonicalIds": [
      "educatif_godille",
      "educatif_jambes_dos"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[11]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_12",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 400,
    "lines": [
      "· 4x50m rattrapé R20''",
      "· 4x50m jambes crawl planche, focus gainage R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[12]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_13",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 500,
    "lines": [
      "· 4x25m respiration 3T R15''",
      "· 4x100m : 50m jambes · 50m crawl R20''"
    ],
    "canonicalIds": [
      "educatif_respiration_par_temps",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[13]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_14",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 350,
    "lines": [
      "· 6x25m entrée de main alignée R15''",
      "· 4x50m jambes dos planche R15''"
    ],
    "canonicalIds": [
      "educatif_entree_main",
      "educatif_jambes_dos"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[14]",
    "status": "legacy"
  },
  {
    "id": "technique_jambes_15",
    "focusKey": "technique_jambes",
    "label": "Éducatif + jambes",
    "distance": 500,
    "lines": [
      "· 4x50m un bras R20''",
      "· 5x50m jambes crawl palmes R15''",
      "· 2x25m nage"
    ],
    "canonicalIds": [
      "educatif_un_bras",
      "educatif_jambes_crawl"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_jambes[15]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_0",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 400,
    "lines": [
      "· 8x50 : 25m grand chien · 25m normal"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[0]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_1",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 400,
    "lines": [
      "· 8x50 : 25m petit chien · 25m normal"
    ],
    "canonicalIds": [
      "educatif_petit_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[1]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_2",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 500,
    "lines": [
      "· 6x25m grand chien R15''",
      "· 6x25m petit chien R15''",
      "· 4x50m nage normale"
    ],
    "canonicalIds": [
      "educatif_grand_chien",
      "educatif_petit_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[2]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_3",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 400,
    "lines": [
      "· 8x25m grand chien R15''",
      "· 4x50m nage complète"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[3]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_4",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 350,
    "lines": [
      "· 6x25m grand chien R15''",
      "· 4x50m nage normale"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[4]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_5",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 350,
    "lines": [
      "· 6x25m petit chien R15''",
      "· 4x50m nage complète"
    ],
    "canonicalIds": [
      "educatif_petit_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[5]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_6",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 400,
    "lines": [
      "· 4x50 : 25m grand chien · 25m petit chien",
      "· 4x50m nage normale"
    ],
    "canonicalIds": [
      "educatif_grand_chien",
      "educatif_petit_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[6]",
    "status": "legacy"
  },
  {
    "id": "technique_chiens_7",
    "focusKey": "technique_chiens",
    "label": "Grand chien & petit chien",
    "distance": 300,
    "lines": [
      "· 8x25m grand chien R10''",
      "· 4x25m nage complète"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_chiens[7]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_0",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 400,
    "lines": [
      "· 8x25m flèche : poussée mur + glisse bras tendus, tête entre les bras R15''",
      "· 4x50m crawl facile"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[0]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_1",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m flèche · 25m crawl facile R20''"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[1]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_2",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 350,
    "lines": [
      "· 10x25m flèche, sens la glisse le plus longtemps possible R15''",
      "· 4x25m crawl facile"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[2]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_3",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 400,
    "lines": [
      "· 8x25m flèche R15''",
      "· 4x50m nage facile, garde la sensation de glisse"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[3]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_4",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m flèche · 25m dos facile R20''"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[4]",
    "status": "legacy"
  },
  {
    "id": "technique_fleche_5",
    "focusKey": "technique_fleche",
    "label": "La flèche",
    "distance": 400,
    "lines": [
      "· 8x25m flèche, souffle doucement pendant la glisse R15''",
      "· 4x50m crawl facile"
    ],
    "canonicalIds": [
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_fleche[5]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_0",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 400,
    "lines": [
      "· 8x25m grand chien : bras qui restent sous l'eau, traction large R15''",
      "· 4x50m crawl facile"
    ],
    "canonicalIds": [
      "educatif_grand_chien",
      "educatif_crawl_immerge"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[0]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_1",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m grand chien · 25m crawl facile R20''"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[1]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_2",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 350,
    "lines": [
      "· 10x25m grand chien, lentement, sens l'eau R15''",
      "· 4x25m crawl facile"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[2]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_3",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 400,
    "lines": [
      "· 8x25m grand chien R15''",
      "· 4x50m nage facile"
    ],
    "canonicalIds": [
      "educatif_grand_chien"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[3]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_4",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m grand chien · 25m flèche R20''"
    ],
    "canonicalIds": [
      "educatif_grand_chien",
      "educatif_fleche"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[4]",
    "status": "legacy"
  },
  {
    "id": "technique_grand_chien_5",
    "focusKey": "technique_grand_chien",
    "label": "Grand chien",
    "distance": 400,
    "lines": [
      "· 8x25m grand chien, bras sous l'eau du début à la fin R15''",
      "· 4x50m crawl facile"
    ],
    "canonicalIds": [
      "educatif_grand_chien",
      "educatif_crawl_immerge"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_grand_chien[5]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_0",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 8x50m focus entrée de main alignée épaule R20''"
    ],
    "canonicalIds": [
      "educatif_entree_main"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[0]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_1",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m un bras · 25m nage complète R20''"
    ],
    "canonicalIds": [
      "educatif_un_bras"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[1]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_2",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 8x25m crawl lent, regard vers le fond R15''",
      "· 4x50m nage normale, checker l'alignement"
    ],
    "canonicalIds": [
      "educatif_regard_fond"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[2]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_3",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 8x50m : 25m rattrapé large · 25m nage R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[3]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_4",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 300,
    "lines": [
      "· 6x50m nage complète, entrée de main devant l'épaule R20''"
    ],
    "canonicalIds": [],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[4]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_5",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 300,
    "lines": [
      "· 6x50m entrée de main devant l'épaule, focus alignement R20''"
    ],
    "canonicalIds": [
      "educatif_entree_main"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[5]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_6",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 8x25m un bras, main qui entre alignée R15''",
      "· 4x50m nage complète"
    ],
    "canonicalIds": [
      "educatif_un_bras"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[6]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_7",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 300,
    "lines": [
      "· 6x50m : 25m rattrapé serré · 25m nage normale R20''"
    ],
    "canonicalIds": [
      "educatif_crawl_rattrape"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[7]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_8",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 8x50m focus regard vers le fond, alignement tête-colonne R20''"
    ],
    "canonicalIds": [
      "educatif_regard_fond"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[8]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_9",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 350,
    "lines": [
      "· 6x25m entrée de main + glisse avant traction R15''",
      "· 4x50m nage normale, vérifier l'alignement"
    ],
    "canonicalIds": [
      "educatif_entree_main"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[9]",
    "status": "legacy"
  },
  {
    "id": "technique_croisement_10",
    "focusKey": "technique_croisement",
    "label": "Alignement / entrée de main",
    "distance": 400,
    "lines": [
      "· 4x100m : 50m focus alignement + 50m nage complète R20''"
    ],
    "canonicalIds": [
      "educatif_entree_main"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_croisement[10]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_0",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 550,
    "lines": [
      "· 8x25m culbute sans mur (rotation seule) R20''",
      "· 6x25m approche + virage, mains fixes hauteur hanches R20''",
      "· 4x50m avec virage au mur, sortie propulsée"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[0]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_1",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 550,
    "lines": [
      "· 6x25m virage + coulée R20''",
      "· 8x25m rotation seule, focus mains basses fixes",
      "· 4x50m enchaînement 2 virages par longueur"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[1]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_2",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 450,
    "lines": [
      "· 10x25m culbute isolée R15''",
      "· 4x50m virage + accélération sortie de mur R25''"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[2]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_3",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 350,
    "lines": [
      "· 8x25m rotation seule, compter 1-2 pour la rotation autour des épaules R20''",
      "· 6x25m virage complet, focus mains qui ne remontent pas R20''"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[3]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_4",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 350,
    "lines": [
      "· 6x25m approche à vitesse réelle + virage R20''",
      "· 4x50m 2 longueurs avec virage, sortie en 5 coups de jambes"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[4]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_5",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 400,
    "lines": [
      "· 8x25m culbute, focus position groupée R20''",
      "· 4x50m avec virage, sortie rapide"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[5]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_6",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 300,
    "lines": [
      "· 6x25m approche + virage, mains basses R20''",
      "· 6x25m sortie de virage en 5 coups de jambes R15''"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[6]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_7",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 450,
    "lines": [
      "· 10x25m rotation seule, apnée courte R15''",
      "· 4x50m virage complet enchaîné"
    ],
    "canonicalIds": [
      "educatif_apnee_controlee",
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[7]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_8",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 350,
    "lines": [
      "· 6x25m virage + coulée R20''",
      "· 4x50m 2 virages par longueur, allure contrôlée"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[8]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_9",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 350,
    "lines": [
      "· 8x25m culbute sans mur, compter la rotation R20''",
      "· 6x25m virage réel, mains fixes"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[9]",
    "status": "legacy"
  },
  {
    "id": "technique_virages_10",
    "focusKey": "technique_virages",
    "label": "Virages culbute",
    "distance": 400,
    "lines": [
      "· 4x100m avec 2 virages par répétition, sortie propulsée R20''"
    ],
    "canonicalIds": [
      "educatif_virage_culbute"
    ],
    "source": "src/lib/swim-banks/technique-drills.js:src/lib/swim-session-generator.js:TECHNIQUE.technique_virages[10]",
    "status": "legacy"
  }
];

export const CANONICAL_DRILL_META = {
  "generatedAt": "2026-08-15",
  "note": "Banque canonique éducatifs — étape 2. Non branchée au générateur. Textes pédagogiques uniquement issus des sources existantes.",
  "statusCount": {
    "canonical": 18,
    "legacy": 13,
    "to_review": 3,
    "excluded": 17
  },
  "techniqueSeriesLegacyCount": 97,
  "ambiguousSegments": [
    {
      "seriesId": "technique_roulis_1",
      "segment": "4x50m roulis marqué, respiration tardive",
      "ids": [
        "educatif_respiration_tardive",
        "educatif_roulis"
      ]
    },
    {
      "seriesId": "technique_catchup_9",
      "segment": "8x25m rattrapé, focus alignement épaule-main",
      "ids": [
        "educatif_crawl_rattrape",
        "educatif_entree_main"
      ]
    },
    {
      "seriesId": "technique_grand_chien_0",
      "segment": "8x25m grand chien : bras qui restent sous l'eau, traction large",
      "ids": [
        "educatif_grand_chien",
        "educatif_crawl_immerge"
      ]
    },
    {
      "seriesId": "technique_grand_chien_5",
      "segment": "8x25m grand chien, bras sous l'eau du début à la fin",
      "ids": [
        "educatif_grand_chien",
        "educatif_crawl_immerge"
      ]
    },
    {
      "seriesId": "technique_virages_7",
      "segment": "10x25m rotation seule, apnée courte",
      "ids": [
        "educatif_apnee_controlee",
        "educatif_virage_culbute"
      ]
    }
  ],
  "unmatchedSegments": [
    {
      "seriesId": "technique_jambes_8",
      "focusKey": "technique_jambes",
      "segment": "50m crawl"
    },
    {
      "seriesId": "technique_jambes_9",
      "focusKey": "technique_jambes",
      "segment": "6x25m glisse / position"
    },
    {
      "seriesId": "technique_jambes_13",
      "focusKey": "technique_jambes",
      "segment": "50m crawl"
    }
  ]
};

export function getCanonicalDrills(filter = {}) {
  let list = CANONICAL_DRILLS;
  if (filter.status) {
    const want = Array.isArray(filter.status) ? filter.status : [filter.status];
    list = list.filter((d) => want.includes(d.status));
  }
  if (filter.stroke) {
    list = list.filter((d) => d.strokes.includes(filter.stroke));
  }
  return list;
}

export function getCanonicalDrillById(id) {
  return CANONICAL_DRILLS.find((d) => d.id === id) || null;
}

export function countCanonicalByStatus() {
  const out = { canonical: 0, legacy: 0, to_review: 0, excluded: 0 };
  for (const d of CANONICAL_DRILLS) {
    if (out[d.status] != null) out[d.status] += 1;
  }
  return out;
}

export function listExactCanonicalDuplicates() {
  /** @type {Map<string, string[]>} */
  const byKey = new Map();
  for (const d of CANONICAL_DRILLS.filter((x) => x.status === "canonical")) {
    const key = `${d.name.toLowerCase()}|${(d.strokes || []).join(",")}|${d.category}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(d.id);
  }
  return [...byKey.entries()].filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids }));
}

export function assertCanonicalDrillShape(d) {
  const required = [
    "id",
    "name",
    "strokes",
    "category",
    "levels",
    "objectiveTags",
    "equipmentRequired",
    "equipmentOptional",
    "safetyNotes",
    "painCompatibility",
    "taperCompatibility",
    "source",
    "status",
  ];
  const missing = required.filter((k) => d[k] == null);
  return { ok: missing.length === 0, missing };
}
