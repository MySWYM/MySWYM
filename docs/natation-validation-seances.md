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
- Pyramide : paliers toujours explicites (jamais un monolithe opaque). Volume ≤ 1000 m si `pyramidVariants.length < 2` **ou** niveau Découverte. Si ≥ 2 dimensions varient vraiment (`nage` / `allure` / `respiration` / `exercice`) et niveau régulier+ : autorisée au-delà de 1000 m, plafonnée à 65–70 % du volume du bloc corps physio. Douleur / affûtage : pyramide interdite, indépendamment de `pyramidVariants`.

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
- Échauffement + corps + retour au calme obligatoires (sauf OW déjà structuré autrement).
- **1 séance éducatif / semaine** (drills / corrections). Les autres jours n’ont pas de bloc technique.
- Éducatifs : Découverte a accès à **tout** le catalogue. Case 4 nages : éducatifs tagués `4_nages` + nages explicites dans le corps.
- Triathlon / eau libre : **mêmes éducatifs et mêmes jours de nage** que les autres plans. Pas de sighting / économie.

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
- Interdit : pain + Z3/Z4 ; Découverte continu > `maxContinuous` ; `NxM` rest=0 hors continuous ; 4N titre sans multi-nages.

### Découverte continu > maxContinuous (2026-08-18)

Le plafond `maxContinuousForDecouverte` (défaut 50 m ; 100 m si `known≥100` et confiance ≥ 0.35 ; 200 m si `known≥200` et confiance ≥ 0.45) n’a pas changé. Ce qui manquait : **`known` n’était jamais alimenté**.

- **Qui écrit `known`** : auto-report optionnel sur l’écran « Retour séance » (`SessionFeedbackSheet`), **Découverte seulement**. Stocké dans `plan._engineHistory.maxContinuousDistance` (et le miroir profil). Suit `mergePlanLists` / blob `plans_json` — pas de table parallèle. `rebuildEngineHistory` recopie ces champs depuis le blob.
- **Cadence** : au moins 4 séances complétées **et** ~3 semaines (les deux). Première question : 4 séances + 3 semaines depuis `planStartDate`. Ensuite : 4 séances depuis la dernière question **et** ~3 semaines depuis cette question. Plateau (3 réponses dans la même tranche) : 7 semaines (milieu de 6–8). Skip = n’écrit pas de mètres, tamponne la date, retente au cycle suivant. Jamais obligatoire.
- **Conversion tranche → mètres** (borne basse, selon `profile.pool`) :
  - Bassin 25 m : moins de 2 → 25 ; 2 à 4 → 50 ; 4 à 8 → 100 ; 8 et plus → 200.
  - Bassin 50 m : 1 → 50 ; 2 → 100 ; 3 à 4 → 150 ; 4 et plus → 200.
- **Confiance** : `capacity.confidence` = **0,7** (auto-report honnête mais imprécis ; passe les seuils 0,35 / 0,45 sans T100).
- **Anti yo-yo** : `known` = max des 2 dernières réponses écrites. Si 2 réponses consécutives sont plus basses que celle d’avant → baisse réelle (max de ces 2). Si 3 consécutives plus basses → on retient la dernière.
- **Plafond unique** : `resolveHardConstraints` (Découverte) passe toujours par `maxContinuousForDecouverte` (paliers + facteur 0,75 au palier 200 m → typiquement 150 m). Le composeur et le fallback quality-gate lisent ce plafond ; plus de recap silencieux à 50 m.
- **Séries** : dès que le plafond ≥ 100 m, le corps Découverte vise des répétitions de 100 m (unité demandée d’abord, plus la plus petite qui rentre).
- Chaîne : `_engineHistory` → `estimateCapacity` (Découverte) → `previousSessionContext.capacity.maxContinuousDistance` → `buildSessionBrief` → `maxContinuousForDecouverte`.
- Ne régénère pas les semaines déjà composées. La prochaine séance **générée** (boucle, regen, nouvelles semaines) lit le `known`.

- Intent seuil / Z3 / race pace ⇒ mètres Z3 (ou Z4 si VO2) réels dans le corps.

### Anti-filler et série longue (2026-08-18)

**Toujours interdit** : `— suite` pour contourner `maxRepsPerSet` (deux moitiés identiques raccordées) ; pyramide / block opaque uniquement pour coller le volume. Une pyramide, c’est un vrai exercice (paliers visibles : 50-100-150-200-…). Un énorme `-1750 m pyramide` sans paliers, ou un block opaque, reste du filler.

**Plafond pyramide** (août 2026, assoupli) :

- `pyramidVariants.length < 2` (seule la distance change, ou une seule dimension) → **1000 m max**.
- `pyramidVariants.length >= 2` (`nage` / `allure` / `respiration` / `exercice` qui varient vraiment d’un palier à l’autre) → au-delà de 1000 m autorisé, **jamais plus de 65–70 % du volume du bloc corps physio**.
- **Découverte** : 1000 m max, quelle que soit la variété. Pyramide > 1000 m = régulier+ / sportif / performance.
- **Douleur / affûtage** : pyramide interdite, ne dépend jamais de `pyramidVariants`.
- Paliers toujours explicites.
- Pas de compteur de fréquence : le composeur n’utilise la pyramide étendue que si l’objectif du jour la justifie (endurance / aérobie / seuil / test), pas comme filler quand le volume ne tombe pas rond.

D’abord les formats normaux : changer la distance de répétition, ou un 2ᵉ bloc **volontaire et distinct** (jambes / facile).

**Série longue structurée** (exception, pas le défaut) : jusqu’à **20 reps dans un seul bloc**, jamais 20 fois strictement identique. Progression **affichée** (paliers d’allure qui montent / descendent, ou stimulus qui change tous les 4–5 reps : respiration, allure, sensation).

- **Objectifs** : endurance fondamentale, seuil / allure soutenue, sortie longue, prépa fractionnée à une épreuve régulière. Pas technique, pas vitesse, pas mixte.
- **Niveaux** : régulier+ (sportif / performance ; régulier en fin de cycle). **Découverte exclue** — une série longue répétitive contredit le plafond `maxContinuous`.
- **Fréquence** : au plus 1× toutes les 4 séances, et seulement rattachée aux objectifs ci-dessus. Pas dès que le volume ne tombe pas rond.
- **Hors** : douleur, J-3 / race week. `maxRepsPerSet` reste 12 (8 en semaine de course) si le bloc n’a pas cette structure.

- Post-race borné : seulement si `daysToComp ∈ [-10, 0[`.
- **Affûtage (date de course)** — pas un coeff unique ni une « race week » plate. Filet QG : pas de gros volume / gros Z3 trop près du jour J. Protocole :
  - **J-14 à J-8** : dernière vraie semaine de travail. Volume et intensité encore là ; dernière grosse séance spécifique course.
  - **J-7 à J-4** : volume −30 à −50 %, nage régulière. Séries à allure course courtes, beaucoup de récupération. Pas un bloc seuil de construction.
  - **J-3 / J-2** : séances courtes et propres (technique, sensations, accélérations 25/50 m). Sortir en ayant l’impression qu’on aurait pu en faire davantage. Pas de gros test, nouvel éducatif ou nouveau matos.
  - **J-1** : repos.
  - **Jour J** : échauffement progressif 400 à 800 m, quelques passages à allure course, 2–4 accélérations courtes avant le départ. Ce n’est pas une séance d’entraînement.
  - **Après le jour J** : le plan ne s’arrête pas. Deux semaines visibles (récupération légère, puis reprise douce). Valider le jour J ouvre une fête + un feedback course + une évaluation de l’app. Boucle triathlon / eau libre : carte Jour J le jour de l’épreuve, puis séances faciles pendant ~10 j.
- Feedback : un seul `too_easy` ≠ +10 % ; `pain` = sécurité ; ne jamais doubler une séance manquée.

---

## Rendu nageur

Ce que le nageur **lit** (carte, copie WhatsApp / Strava, pastille d’intensité). Le moteur peut encore parler `Z1` / `souple` en interne.

- Jamais `souple` ni `Z1` dans les consignes **visibles** (D9). Dire `nage facile` / `relâché` / `mise en route` / `retour au calme`. Filet : `humanizeArthurDisplayTerms`. Sportif / Performance peuvent voir `Z2`/`Z3`/`Z4` ; `Z1` devient `Facile`.
- Chemins de sortie qui passent le filet : `finalizeCoachSession`, `attachFourNagesCoverage`, `buildConfirmeArchetypeSession`, et l’UI (`expandCompoundDetailLines` → `toCoachDetailLines` + `prettifySessionDetailLine`). Les banques / fallbacks (diplôme, semaine compétition) peuvent encore contenir `souple`/`Z1` en source : ça ne doit pas arriver jusqu’à l’écran.
- Jamais `(facile @2)` / `@2` / `@3` dans un titre (code d’effort interne). Un `@1:30` d’allure Premium n’est pas la même chose.
- Restitution coach : une ligne = distance + nage + intensité + repos. Pas de headlines moteur (`→ Aujourd'hui`) ni marketing (`on savoure`).
- Premium : départs `D…` + `@mm:ss` depuis le T100. Gratuit : `R…` (repos) sans tag d’allure.
- Ton : français, tutoiement, consignes actionnables.
- Fun : contrastes ; pas 2 séries d’affilée à la même allure ; pas de monolithes répétitifs (sauf série longue structurée, voir anti-filler).
- Vocabulaire nageur : **godilles** (pas sculling) ; **rattrapé** (pas catch-up) ; **coulée** (pas sortie en apnée). Découverte peut paraphraser les godilles (« petits mouvements des mains ») — jamais l’anglais.
