# Générateur coaching — branché dans l'app

> Source : `generateur_seances.html` → `src/lib/swim-session-generator.js`  
> Pont MySWYM : `src/lib/swim-plan-bridge.js` → `generatePlan()` dans `App.jsx`

**Actif pour** : triathlon, eau libre, progression, bien-être, compétition maître.  
**Exclu** (ancien moteur `SESSION_TEMPLATES`) : BNSSA, BPJEPS, tests pompiers.


```js
import { genererSeance, genererSemaine } from './lib/swim-session-generator.js';

// Une séance isolée
const texte = genererSeance('intermediaire', 'endurance', 'foncier', '45');

// Une semaine complète (3 séances), avec allures et règle des +10%
const texteSemaine = genererSemaine(
  'confirme',        // niveau : debutant | intermediaire | confirme | triathlete
  'endurance',        // objectif : technique_respiration | technique_roulis | technique_catchup
                       //            | technique_croisement | technique_virages
                       //            | endurance | vitesse | mixte | eau_libre
  'developpement',     // phase : foncier | developpement | specifique | affutage
  3,                   // nb de séances dans la semaine
  2,                   // numéro de semaine (juste pour l'affichage "S2.1", "S2.2"...)
  '1:08',              // allure repère T100 ('' si absent)
  '',                  // legacy 400m — ignoré, ne plus utiliser
  'normale',           // type de semaine : reference | normale | allegee
  4700                 // distance de la semaine précédente en m (0 si type=reference)
);
```

Les deux fonctions retournent une **chaîne de texte prête à afficher** (déjà formatée avec tirets, retours à la ligne, etc.). Si ton app a besoin de données structurées plutôt que du texte brut (ex: pour afficher chaque set dans une carte séparée), c'est le point d'évolution le plus utile : découper `genererSeance`/`genererSeanceDeSemaine` pour qu'elles retournent un objet `{ echauffement: [...], corps: [...], retour: [...], total: 1100 }` au lieu d'assembler directement une chaîne. Dis-le à Cursor si c'est ton cas.

## 3. Étendre le contenu sans toucher au moteur

Toute la bibliothèque de contenu est dans des constantes en haut du fichier : `ECHAUFFEMENTS`, `TECHNIQUE`, `CORPS_PHYSIO`, `RETOURS_CALME`, `FINS_SEMAINE`, `DEPARTS_SEMAINE`. Tu peux demander à Cursor d'en ajouter sans risque de casser le calcul de distances/allures — ce sont juste des tableaux de variantes piochées au hasard.

## 4. Ce qui est déjà géré (donc à ne pas refaire)

- Calcul des allures par zone à partir du **seul** temps de référence **T100** (bandes adaptatives dans `src/lib/swim-pace.js`)
- Règle des +10% avec comparaison à la semaine précédente et statut OK/Dépassement
- Arrondi des totaux de séance à la centaine de mètres près
- Anti-répétition (`pick()` évite de ressortir deux fois de suite le même contenu dans une catégorie)
