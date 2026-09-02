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
- Éducatifs : le niveau utilisateur doit figurer dans `levels` dérivés du « niveau Arthur » Excel. « adaptable à tous niveaux » n’ouvre pas la Découverte ; Découverte reste aussi bornée à flèche + grand chien (+ allowlist). Case 4 nages : mêmes niveaux Excel sur les éducatifs tagués `4_nages` (corps/IM gardent les 4 nages explicites).
- Soft-branch catalogue Sheet (`composedBy=natation-sheet`) : **source visible** Soft **01–13** (pas le composeur). Sélection + fiche « Voir l’éducatif » = colonnes de l’onglet **Éducatifs** du Google Sheet (`sheetEducatif` / `sheetEducatifs`). Pas de `matchEducatif` / fiches Arthur `.js` sur ces séances. **Soft 01–13** : Nager `01`–`03` ; triathlon XS/Sprint `04`–`06` ; Oly/Half/Full `07`–`08` ; eau libre courte `09`–`11` / moy-long `12`–`13`. Diplômes = composeur (pas d’onglet Sheet). Éducatif tiré au **niveau** (pas au matos). `{matériel}` = optionnel, tirage parmi la fiche ∩ inventaire. Variété : pas le même éducatif d’affilée (soft sur les 5 derniers). **Ligne 4 nages + éducatifs** : 4 fiches (1/nage, ordre IM) ; distances Sheet inchangées. **Jetons de format** (app + PDF, pas de dump MIXTE 25+25) : `{par 25m}` = 4 nages enchaîné (25 m/nage) ; `{par 100m}` ou `{par 50m}` = 1 éducatif sur toute la rep ; `{25m éducatif + 25m nage}` = 25 m drill + 25 m nage, une nage par 100. Sans jeton, « 4 nages éducatifs » = 1 nage / rep. Ne plus écrire `(25 m {éducatif} + 25 m) (4 nages)`. **Pas de fallback composeur** sur les familles soft. **Quality gate / parse strict des lignes = non** (option A) : confiance au Sheet Arthur ; correction = dans le Sheet.
- **Pace Sheet** : tokens `{D:facile}` `{D:endurance}` `{D:seuil}` `{D:VO2}` `{D:sprint}` et `{@:…}` (mêmes intents). Calcul depuis le **T100** si **intermédiaire ou avancé + Premium + T100**. **Débutant = jamais** (`{D:}` → `repos 30 s`, `{@:}` retiré). Alias : moyen→endurance, vite/course→seuil, souple→facile. Lexique Excel (1 onglet) : `docs/coach-ligne/lexique-sheet-myswym.xlsx` — régénérer via `python3 docs/coach-ligne/build_lexique_sheet.py` puis glisser l’onglet « Lexique MySWYM » dans le Google Sheet.
- **Calendrier event Sheet (XS/Sprint…)** : rôle de semaine depuis `eventDate` (S0 = semaine du jour J). **S0 + S-1** = deload (S0 : max 2 séances) ; **S-2 → S-5** = construction (pas de test/allégée cycle) ; **S-6+** = cycle **6 travail → allégée → test** ancré sur J (**S-6 allégée, S-7 test** ; ex. S-14 allégée → S-15 test → S-13…S-8 travail). Début de plan : **2 sem. travail** avant test/allégée cycle (S0/S-1 intacts). Sans date = même cycle + garde. Bandeau séance + planning accueil (`sheetWeekRole` / `EventWeekPlanCard`). Pastille « cette semaine » = **progression plan** (`weekIndex` = history / séances/sem), pas seulement aujourd’hui calendaire.

---

## Matériel

Le matériel déclaré indique ce que le nageur peut utiliser, jamais ce qu’il doit utiliser.  
Une séance peut être sans matériel même si l’inventaire est rempli.  
Lorsqu’un matériel est utilisé, il doit être affiché explicitement sur la ligne d’exercice concernée.  
Les contraintes existantes restent actives : jamais pull-buoy + palmes **dans le même exercice** (même ligne) ; matériel lié à l’éducatif, jamais tiré au sort.

Rappels pédagogiques :

- Planche sur les jambes ; palmes sur le roulis (jamais plaquettes) ; tuba sur la respiration ; pull sur le corps aérobie si pas de palmes ce jour-là.
- Matos dans la ligne d’exo (`avec palmes` / `avec pull-buoy`), jamais collé au hasard sur le titre de bloc.
- « Aucun » = zéro matos. « sans planche » ≠ exige une planche.
- ~~Inventaire non vide → ≥1 item visible par séance~~ — **↩ remplacée** (disponibilité ≠ obligation).

---

## Quatre nages

UX profil (**Intermédiaire seulement**) : « Sais-tu nager du 4 nages ? » → Non = `swimStyle=crawl` ; Oui = `4_nages`. Pas de nage favorite.  
Débutant : pas de question, crawl seulement. **Avancé : pas de question, 4 nages** (`isFourNagesDeclared` vrai même si `swimStyle` restait crawl). Diplômes : pas de choix 4 nages.

Si `swimStyle=crawl` / `strokeFocus=crawl` : **aucune** ligne ni set en dos, brasse, papillon ou « au choix » (quality gate `crawl_only`).

Le crawl garde toujours la plus grande part du volume en case 4 nages. Mix défaut : 40 % crawl, 20 % dos, 20 % brasse, 20 % papillon.

Autres contrôles :

- Case `quatre nages` = crawl + dos + brasse + papillon dans **chaque** séance, blocs nagés explicites (pas un seul intitulé « 4 nages »).
- Papillon fractionné (longueur de bassin), jamais omis ni remplacé par ondulation seule.
- Formats IM olympiques (pap → dos → brasse → crawl) explicites ; Découverte : pas d’IM enchaîné.
- Eau libre / triathlon : IM piscine seulement si 4 nages déclaré (`swimStyle=4_nages`).

---

## Sécurité et Quality Gate

- Séances **composeur** (hors Soft Sheet) : `validateComposedSession` (+ recomposition limitée si échec).
- Séances Soft Sheet **01–13** : pas de `validateComposedSession` ni parse strict des distances ligne à ligne ; le contenu Sheet est la source de vérité (option A).
- Interdit : pain + Z3/Z4 ; race week à gros volume / gros Z3 ; Découverte continu > `maxContinuous` ; `NxM` rest=0 hors continuous ; 4N titre sans multi-nages.
- Intent seuil / Z3 / race pace ⇒ mètres Z3 (ou Z4 si VO2) réels dans le corps.
- Anti-filler : pas de `— suite` pour contourner `maxRepsPerSet` ; pas de pyramide/block uniquement pour coller le volume.
- Post-race borné : seulement si `daysToComp ∈ [-10, 0[`.
- Taper Performance : pas de coeff uniforme ; pas de gros test / nouvelle technique / nouveau matos à J-3 ; Race Day ≠ volume entraînement.
- Feedback : un seul `too_easy` ≠ +10 % ; `pain` = sécurité ; ne jamais doubler une séance manquée.

---

## Rendu nageur

- Jamais `souple` ni `Z1` dans les consignes visibles (D9), **sauf** pastille d’allure `Souple ⓘ` quand le Sheet / la ligne porte ce marqueur (`crawl*souple`, `crawl souple`) — tip récupération, pas le mot en sous-texte libre.
- Tous les chemins de sortie (`finalizeCoachSession`, `attachFourNagesCoverage`, `buildConfirmeArchetypeSession`) passent par `sanitizeSessionDetails` / `humanizeArthurDisplayTerms`. Les banques peuvent encore contenir `souple`/`Z1` en interne.
- Jamais `(facile @2)` / `@2` / `@3` dans un titre.
- Restitution coach : une ligne = distance + nage + intensité + repos ; pas de headlines moteur ni marketing.
- Premium : `D…` + `@mm:ss` depuis T100 ; Gratuit : `R…` sans allure.
- Ton : français, tutoiement, consignes actionnables.
- Fun : contrastes, pas 2 séries d’affilée à la même allure, pas de monolithes répétitifs.
- Vocabulaire : **godilles** (sculling) ; **rattrapé** (catch-up) ; **coulée** (pas sortie en apnée).

## Traçabilité support

- Chaque séance affiche une réf. discrète `Réf. <onglet>-<ligne>` (ex. `01-42`) en bas de la vue séance et dans l'historique. Clic = copie de la ligne complète (`session-provenance.js`).
- Une séance composée hors Sheet affiche `Réf. C-1500` et la mention « pas de ligne Sheet » : **ne jamais inventer un n° de ligne** pour un fallback composeur.
- `Séance n°6` (titre nageur) = 6e validation, **≠** ligne du Sheet. Les deux figurent dans la réf. copiée (`UI n°6 | Sheet «01 Nager deb crawl» ligne n°42`).
- La réf. de la dernière séance vue part automatiquement avec les messages support (ligne `🏊` dans Telegram) et dans les events PostHog (`composedBy`, `sheetFamily`, `sheetN`).
- Vue séance partagée publiquement (`SessionLiveView`) : pas de réf. affichée.
