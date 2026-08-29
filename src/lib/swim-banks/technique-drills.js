/**
 * Éducatifs / focus technique (+ nage appliquée embarquée dans les drills).
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 */
import { block, bankMeta } from "./_helpers.js";

const TECHNIQUE_RAW = {
  technique_respiration: { label:"Respiration", drills:[
    block(600, ["· 8x25m respiration 3T (3 temps) R15''", "· 8x25m respiration 5T R15''", "· 4x50m alterné 3T/5T par 25m"]),
    block(600, ["· 6x50m bilatéral 3T R20''", "· 4x25m apnée contrôlée 2 coups sans respirer + reprise", "· 4x50m 3T/5T alterné"]),
    block(450, ["· 10x25m respiration 5T, focus sortie d'eau tête basse R10''", "· 4x50m 3T aller / 5T retour R20''"]),
    block(400, ["· 8x25m respiration 7T (endurance apnée) R20''", "· 4x50m 3T avec accélération dernier 15m R20''"]),
    block(450, ["· 6x50m bilatéral 3T, focus rythme régulier R20''", "· 6x25m sans respirer 15m + reprise 3T R15''"]),
    block(700, ["· 4x150 : 3T/5T/7T/5T/3T par 25m", "· 4x25m respiration tardive, tête qui reste basse R15''"]),
    block(600, ["· 6x100m : (3T/5T/7T/9T par 50m)"]),
    block(600, ["· 12x50 D1' (Z2) - (3T/5T/7T/9T par 50m)"]),
    block(500, ["· 10x25m respiration 3T R15''", "· 4x50m 5T sans accélérer"]),
    block(650, ["· 4x100m bilatéral 3T R20''", "· 4x50m 5T, focus régularité R15''"]),
    block(500, ["· 8x25m apnée 1 longueur puis reprise 3T R20''", "· 4x50m 3T normal"]),
    block(600, ["· 6x50m 3T aller, 5T retour R15''", "· 4x50m bilatérale libre"]),
    block(500, ["· 8x25m respiration tardive, tête basse le plus longtemps possible R15''", "· 4x50m 3T régulier"]),
    block(650, ["· 4x100m : 25m apnée + 75m respiration 3T R20''", "· 4x50m bilatéral 5T"]),
  ]},
  technique_roulis: { label:"Roulis / rotation du corps", drills:[
    block(600, ["· 6x50m roulis exagéré, épaule qui sort de l'eau R20''", "· 4x25m avec pull-buoy, focus rotation bassin", "· 4x50m amplitude + roulis R15''"]),
    block(400, ["· 8x25m un bras (l'autre tendu devant), focus rotation R15''", "· 4x50m roulis marqué, respiration tardive R20''"]),
    block(400, ["· 6x50m roulis + glisse prolongée R20''", "· 4x25m pull-buoy rotation complète épaules-hanches"]),
    block(400, ["· 8x25m « 6 battements par roulis » R15''", "· 4x50m roulis contrôlé, regard fixe vers le fond R20''"]),
    block(400, ["· 6x50m roulis avec pull-buoy, focus appui R20''", "· 4x25m nage complète, garder l'amplitude de roulis"]),
    block(200, ["· 4x50 palmes : 25m bras droit devant / gauche cuisse ; 25m inversé - respiration latérale"]),
    block(400, ["· 8x50m le moins de mouvements possible/25m - focus position, efficacité de traction R20''"]),
    block(200, ["· 8x25m palmes : 1x crawl sous l'eau · 1x godille pieds en avant sur le dos R15''"]),
    block(400, ["· 6x50m un bras, focus rotation des hanches R20''", "· 4x25m nage complète, garder l'amplitude"]),
    block(450, ["· 8x25m roulis marqué, épaule qui sort franchement R15''", "· 4x50m nage complète"]),
    block(400, ["· 4x100m : 50m roulis exagéré + 50m nage normale R20''"]),
    block(300, ["· 6x50m pull-buoy, focus rotation bassin-épaules R20''"]),
    block(400, ["· 8x25m un bras alterné, main qui reste devant R15''", "· 4x50m amplitude + roulis"]),
    block(200, ["· 4x50m palmes, focus rotation complète sans forcer R20''"]),
  ]},
  technique_catchup: { label:"Rattrapé", drills:[
    block(500, ["· 8x25m rattrapé (bras dans l'axe des épaules) R15''", "· 4x50m rattrapé lent, focus glisse", "· 4x25m rattrapé rapide, transition vers nage normale"]),
    block(500, ["· 6x50m rattrapé R20''", "· 4x25m rattrapé avec palmes, focus appui", "· 4x25m retour à nage complète, garder la glisse"]),
    block(450, ["· 10x25m rattrapé très lent, glisse maximale R15''", "· 4x50m rattrapé progressif (lent → rapide) R20''"]),
    block(400, ["· 6x50m rattrapé + plaquettes légères, focus prise d'appui R20''", "· 4x25m nage complète en gardant le temps de glisse"]),
    block(400, ["· 8x25m rattrapé, compter le temps de glisse à voix haute R15''", "· 4x50m rattrapé / nage normale alterné par 25m"]),
    block(450, ["· 8x25m rattrapé, main qui attend franchement R15''", "· 4x50m rattrapé rapide"]),
    block(500, ["· 4x100m : 50m rattrapé + 50m nage normale R20''"]),
    block(400, ["· 6x50m rattrapé avec palmes R20''", "· 4x25m nage complète, garder la glisse"]),
    block(450, ["· 10x25m rattrapé progressif (lent → rapide) R15''"]),
    block(400, ["· 8x25m rattrapé, focus alignement épaule-main R15''", "· 4x50m nage normale"]),
    block(500, ["· 6x50m rattrapé + plaquettes légères R20''", "· 4x50m nage complète"]),
  ]},
  /** Jambes = série battements + toujours un éducatif court avant (jamais jambes→jambes). */
  technique_jambes: { label:"Éducatif + jambes", drills:[
    block(400, ["· 4x25m rattrapé R15''", "· 6x50m jambes crawl planche R15''"]),
    block(400, ["· 4x50m un bras (l'autre tendu devant) R20''", "· 4x50m jambes crawl planche R15''"]),
    block(400, ["· 8x25m godilles R15''", "· 6x50m jambes dos planche R15''"]),
    block(450, ["· 4x25m rattrapé R15''", "· 4x50m jambes crawl palmes R20''", "· 4x25m nage complète"]),
    block(400, ["· 6x25m crawl lent regard fond R15''", "· 5x50m jambes crawl planche R15''"]),
    block(400, ["· 4x50m rattrapé R20''", "· 4x50m jambes crawl sans planche (bras devant) R20''"]),
    block(450, ["· 8x25m un bras R15''", "· 6x50m jambes crawl planche R15''", "· 2x25m nage complète"]),
    block(400, ["· 4x25m entrée de main alignée R15''", "· 4x50m jambes crawl planche R15''", "· 4x25m nage"]),
    block(500, ["· 4x50m rattrapé R20''", "· 4x100m : 50m jambes · 50m crawl R20''"]),
    block(400, ["· 6x25m glisse / position R15''", "· 4x50m jambes crawl R15''", "· 4x25m nage complète"]),
    block(400, ["· 4x25m un bras R15''", "· 6x50m jambes crawl palmes R15''"]),
    block(450, ["· 6x25m godilles R15''", "· 5x50m jambes dos planche R15''", "· 2x25m nage complète"]),
    block(400, ["· 4x50m rattrapé R20''", "· 4x50m jambes crawl planche, focus gainage R20''"]),
    block(500, ["· 4x25m respiration 3T R15''", "· 4x100m : 50m jambes · 50m crawl R20''"]),
    block(400, ["· 6x25m entrée de main alignée R15''", "· 4x50m jambes dos planche R15''"]),
    block(450, ["· 4x50m un bras R20''", "· 5x50m jambes crawl palmes R15''", "· 2x25m nage"]),
  ]},
  /** Chien = rare (1 slot / cycle). Blocs courts, peu de jargon. */
  technique_chiens: { label:"Grand chien & petit chien", drills:[
    block(400, ["· 8x50 : 25m grand chien · 25m normal"]),
    block(400, ["· 8x50 : 25m petit chien · 25m normal"]),
    block(300, ["· 6x25m grand chien R15''", "· 6x25m petit chien R15''", "· 4x50m nage normale"]),
    block(400, ["· 8x25m grand chien R15''", "· 4x50m nage complète"]),
    block(300, ["· 6x25m grand chien R15''", "· 4x50m nage normale"]),
    block(350, ["· 6x25m petit chien R15''", "· 4x50m nage complète"]),
    block(400, ["· 4x50 : 25m grand chien · 25m petit chien", "· 4x50m nage normale"]),
    block(300, ["· 8x25m grand chien R10''", "· 4x25m nage complète"]),
  ]},
  /** Découverte uniquement, flèche = glisse après poussée mur. */
  technique_fleche: { label:"La flèche", drills:[
    block(300, ["· 8x25m flèche : poussée mur + glisse bras tendus, tête entre les bras R15''", "· 4x50m crawl facile"]),
    block(350, ["· 6x50m : 25m flèche · 25m crawl facile R20''"]),
    block(300, ["· 10x25m flèche, sens la glisse le plus longtemps possible R15''", "· 4x25m crawl facile"]),
    block(350, ["· 8x25m flèche R15''", "· 4x50m nage facile, garde la sensation de glisse"]),
    block(300, ["· 6x50m : 25m flèche · 25m dos facile R20''"]),
    block(320, ["· 8x25m flèche, souffle doucement pendant la glisse R15''", "· 4x50m crawl facile"]),
  ]},
  /** Découverte uniquement, grand chien seul (pas de petit chien). */
  technique_grand_chien: { label:"Grand chien", drills:[
    block(300, ["· 8x25m grand chien : bras qui restent sous l'eau, traction large R15''", "· 4x50m crawl facile"]),
    block(350, ["· 6x50m : 25m grand chien · 25m crawl facile R20''"]),
    block(300, ["· 10x25m grand chien, lentement, sens l'eau R15''", "· 4x25m crawl facile"]),
    block(350, ["· 8x25m grand chien R15''", "· 4x50m nage facile"]),
    block(300, ["· 6x50m : 25m grand chien · 25m flèche R20''"]),
    block(320, ["· 8x25m grand chien, bras sous l'eau du début à la fin R15''", "· 4x50m crawl facile"]),
  ]},
  technique_croisement: { label:"Alignement / entrée de main", drills:[
    block(400, ["· 8x50m focus entrée de main alignée épaule R20''"]),
    block(400, ["· 6x50m : 25m un bras · 25m nage complète R20''"]),
    block(450, ["· 8x25m crawl lent, regard vers le fond R15''", "· 4x50m nage normale, checker l'alignement"]),
    block(400, ["· 8x50m : 25m rattrapé large · 25m nage R20''"]),
    block(400, ["· 6x50m nage complète, entrée de main devant l'épaule R20''"]),
    block(400, ["· 6x50m entrée de main devant l'épaule, focus alignement R20''"]),
    block(450, ["· 8x25m un bras, main qui entre alignée R15''", "· 4x50m nage complète"]),
    block(400, ["· 6x50m : 25m rattrapé serré · 25m nage normale R20''"]),
    block(400, ["· 8x50m focus regard vers le fond, alignement tête-colonne R20''"]),
    block(450, ["· 6x25m entrée de main + glisse avant traction R15''", "· 4x50m nage normale, vérifier l'alignement"]),
    block(400, ["· 4x100m : 50m focus alignement + 50m nage complète R20''"]),
  ]},
  technique_virages: { label:"Virages culbute", drills:[
    block(550, ["· 8x25m culbute sans mur (rotation seule) R20''", "· 6x25m approche + virage, mains fixes hauteur hanches R20''", "· 4x50m avec virage au mur, sortie propulsée"]),
    block(550, ["· 6x25m virage + coulée R20''", "· 8x25m rotation seule, focus mains basses fixes", "· 4x50m enchaînement 2 virages par longueur"]),
    block(350, ["· 10x25m culbute isolée R15''", "· 4x50m virage + accélération sortie de mur R25''"]),
    block(350, ["· 8x25m rotation seule, compter 1-2 pour la rotation autour des épaules R20''", "· 6x25m virage complet, focus mains qui ne remontent pas R20''"]),
    block(350, ["· 6x25m approche à vitesse réelle + virage R20''", "· 4x50m 2 longueurs avec virage, sortie en 5 coups de jambes"]),
    block(350, ["· 8x25m culbute, focus position groupée R20''", "· 4x50m avec virage, sortie rapide"]),
    block(350, ["· 6x25m approche + virage, mains basses R20''", "· 6x25m sortie de virage en 5 coups de jambes R15''"]),
    block(350, ["· 10x25m rotation seule, apnée courte R15''", "· 4x50m virage complet enchaîné"]),
    block(350, ["· 6x25m virage + coulée R20''", "· 4x50m 2 virages par longueur, allure contrôlée"]),
    block(350, ["· 8x25m culbute sans mur, compter la rotation R20''", "· 6x25m virage réel, mains fixes"]),
    block(400, ["· 4x100m avec 2 virages par répétition, sortie propulsée R20''"]),
  ]}
};

const FOCUS_CYCLE = [
  "technique_jambes",
  "technique_respiration",
  "technique_roulis",
  "technique_jambes",
  "technique_catchup",
  "technique_virages",
  "technique_chiens",
  "technique_jambes",
];

/** Découverte : uniquement flèche + grand chien (pas de catch-up / roulis / virages…). */
const FOCUS_CYCLE_DECOUVERTE = [
  "technique_fleche",
  "technique_grand_chien",
  "technique_fleche",
  "technique_grand_chien",
  "technique_fleche",
  "technique_grand_chien",
  "technique_fleche",
  "technique_grand_chien",
];

export const TECHNIQUE = TECHNIQUE_RAW;
export { FOCUS_CYCLE, FOCUS_CYCLE_DECOUVERTE };

export const TECHNIQUE_FOCUS_KEYS = Object.keys(TECHNIQUE);

export const TECHNIQUE_DRILL_ENTRIES = TECHNIQUE_FOCUS_KEYS.flatMap((focusKey) => {
  const focus = TECHNIQUE[focusKey];
  return focus.drills.map((drill, index) => ({
    ...bankMeta({
      id: `${focusKey}_${index}`,
      sourceSymbol: `TECHNIQUE.${focusKey}[${index}]`,
      status: "candidate",
    }),
    focusKey,
    label: focus.label,
    index,
    distance: drill.distance,
    lines: drill.lines,
    drill,
  }));
});
