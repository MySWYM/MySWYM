# Validation des séances natation MySWYM

> Contrôles distance, volume, matériel, quatre nages, sécurité et rendu.  
> Règles actives (synthèse) : [`natation-regles-actives.md`](./natation-regles-actives.md) · Sources : [`natation-source-de-verite.md`](./natation-source-de-verite.md).

---

## Distance et volume

Chaque bloc est un multiple de la longueur du bassin.  
Le volume total affiché est la somme exacte des blocs, sans arrondi silencieux.  
Une séance doit toujours se terminer sur un total finissant par `00` ou `50 m`, jamais par `25 m` ou `75 m`.  
En bassin de 25 m, un bloc peut faire 25 m ; cette tolérance ne vaut pas pour le total final de séance.  
Si le total cible ne respecte pas cette règle, le composeur ajuste un bloc de nage facile ou le retour au calme.

`block()` calcule le volume exact depuis les lignes. Il ne corrige pas une incohérence par un arrondi. Une séance invalide doit être rejetée ou recomposée.

Contrôles associés :

- Pas de séries `Nx25 m` en bassin 50 (variantes 50 m / adaptation technique).
- Source de vérité volume composeur = somme des séries / lignes, recoupée avec le détail affiché — pas la cible seule.
- Découverte : `coherentVolumeForDecouverte` scale avec durée et cible moteur (comme Régulier/Sportif) ; `volumeHint` guide sans écrêter 1200–1400 m à ~700 m. Séances courtes (≤30 min / `seance_courte`) restent plafonnées bas. Tolérance produit typique ±150 m vs cible.
- Feedback hebdo : ne jamais patcher seul `s.distance` sans `details` / `duration` — régénérer ou scale cohérent.
- Pyramide : volume ≤ 1000 m ; paliers explicites ; pas de monolithe opaque.

---

## Cohérence des blocs

Toute séance affichant un volume en mètres doit donner une distance explicite à chaque bloc, y compris échauffement et retour au calme.  
Le volume affiché est strictement égal à la somme des distances des blocs.  
Une consigne répétée par 25 m doit couvrir exactement la distance annoncée.  
Exemple : `4×150 m` avec cinq longueurs de 25 m est invalide : il faut passer à `4×125 m` ou décrire une sixième longueur.  
Une consigne ne peut jamais contenir une incohérence d’unité, par exemple `4×100 m` suivi de « du premier au dernier 200 m ».

Autres règles de structure :

- 1 numéro UI = 1 bloc ; titre avec éducatif nommé (jamais `600m respiration` / `6x50 technique`).
- Lignes compactes `A · B · C — Z2` → sous-séries verticales à l’affichage.
- Échauffement + retour au calme obligatoires (sauf OW déjà structuré autrement).
- Éducatifs : le niveau utilisateur doit figurer dans `levels` dérivés du « niveau Arthur » Excel. « adaptable à tous niveaux » n’ouvre pas la Découverte ; Découverte reste aussi bornée à flèche + grand chien (+ allowlist).

---

## Matériel

Le matériel déclaré indique ce que le nageur peut utiliser, jamais ce qu’il doit utiliser.  
Une séance peut être sans matériel même si l’inventaire est rempli.  
Lorsqu’un matériel est utilisé, il doit être affiché explicitement sur la ligne d’exercice concernée.  
Les contraintes existantes restent actives : jamais pull-buoy + palmes dans une même séance ; matériel lié à l’éducatif, jamais tiré au sort.

Rappels pédagogiques :

- Planche sur les jambes ; palmes sur le roulis (jamais plaquettes) ; tuba sur la respiration ; pull sur le corps aérobie si pas de palmes ce jour-là.
- Matos dans la ligne d’exo (`avec palmes` / `avec pull-buoy`), jamais collé au hasard sur le titre de bloc.
- « Aucun » = zéro matos. « sans planche » ≠ exige une planche.
- ~~Inventaire non vide → ≥1 item visible par séance~~ — **↩ remplacée** (disponibilité ≠ obligation).

---

## Quatre nages

Le crawl garde toujours la plus grande part du volume.  
Sans préférence : 40 % crawl, 20 % dos, 20 % brasse, 20 % papillon.  
Avec préférence crawl : 50 / 17 / 17 / 16.  
Avec préférence dos, brasse ou papillon : 40 % crawl, 30 % nage préférée, 15 % et 15 % pour les deux autres.

Autres contrôles :

- Case `quatre nages` = crawl + dos + brasse + papillon dans **chaque** séance, blocs nagés explicites (pas un seul intitulé « 4 nages »).
- `swimStyle=4_nages` prime sur la nage préférée (ne pas transformer la préférence en séance mono-nage).
- Papillon fractionné (longueur de bassin), jamais omis ni remplacé par ondulation seule.
- Formats IM olympiques (pap → dos → brasse → crawl) explicites ; Découverte : pas d’IM enchaîné.
- Eau libre / triathlon Performance : ne pas forcer un bloc IM plein de brasse (`usePoolIMBlock`).

---

## Sécurité et Quality Gate

- Toute séance composée passe `validateComposedSession` (+ recomposition limitée si échec).
- Interdit : pain + Z3/Z4 ; race week à gros volume / gros Z3 ; Découverte continu > `maxContinuous` ; `NxM` rest=0 hors continuous ; 4N titre sans multi-nages.
- Intent seuil / Z3 / race pace ⇒ mètres Z3 (ou Z4 si VO2) réels dans le corps.
- Anti-filler : pas de `— suite` pour contourner `maxRepsPerSet` ; pas de pyramide/block uniquement pour coller le volume.
- Post-race borné : seulement si `daysToComp ∈ [-10, 0[`.
- Taper Performance : pas de coeff uniforme ; pas de gros test / nouvelle technique / nouveau matos à J-3 ; Race Day ≠ volume entraînement.
- Feedback : un seul `too_easy` ≠ +10 % ; `pain` = sécurité ; ne jamais doubler une séance manquée.

---

## Rendu nageur

- Jamais `souple` ni `Z1` dans les consignes visibles (D9).
- Tous les chemins de sortie (`finalizeCoachSession`, `attachFourNagesCoverage`, `buildConfirmeArchetypeSession`) passent par `sanitizeSessionDetails` / `humanizeArthurDisplayTerms`. Les banques peuvent encore contenir `souple`/`Z1` en interne.
- Jamais `(facile @2)` / `@2` / `@3` dans un titre.
- Restitution coach : une ligne = distance + nage + intensité + repos ; pas de headlines moteur ni marketing.
- Premium : `D…` + `@mm:ss` depuis T100 ; Gratuit : `R…` sans allure.
- Ton : français, tutoiement, consignes actionnables.
- Fun : contrastes, pas 2 séries d’affilée à la même allure, pas de monolithes répétitifs.
- Vocabulaire : **godilles** (pas sculling) ; **rattrapé** (pas catch-up) ; **coulée** (pas sortie en apnée).
