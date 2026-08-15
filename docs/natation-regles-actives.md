# Règles actives natation MySWYM

> **Maximum 20 règles non négociables.**  
> Détail validation : [`natation-validation-seances.md`](./natation-validation-seances.md) · Sources : [`natation-source-de-verite.md`](./natation-source-de-verite.md) · Journal : [`natation-historique.md`](./natation-historique.md).

---

1. **Un seul générateur visible** — Point d’entrée unique : `composeSession`. Arthur **apprend au LLM à entraîner** (règles, catalogues Gold, corrections, lots). Le LLM rédige, varie, propose ; une séance nageur ne part jamais sans moteur + quality gate + validation Arthur. Pas de LLM in-app non cadré (CGU). L’ancien moteur est un fallback technique temporaire, jamais une source de décision concurrente.

2. **Distances / bassin** — Chaque bloc est un multiple de la longueur du bassin. Le volume total affiché est la somme exacte des blocs, sans arrondi silencieux. Une séance doit toujours se terminer sur un total finissant par `00` ou `50 m`, jamais par `25 m` ou `75 m`. En bassin de 25 m, un bloc peut faire 25 m ; cette tolérance ne vaut pas pour le total final de séance. Si le total cible ne respecte pas cette règle, le composeur ajuste un bloc de nage facile ou le retour au calme.

3. **Cohérence des blocs** — Toute séance affichant un volume en mètres doit donner une distance explicite à chaque bloc (échauffement et retour au calme inclus). Volume affiché = somme stricte des distances des blocs. Une consigne répétée par 25 m doit couvrir exactement la distance annoncée. Exemple : `4×150 m` avec cinq longueurs de 25 m est invalide → `4×125 m` ou sixième longueur. Jamais d’incohérence d’unité (ex. `4×100 m` puis « du premier au dernier 200 m »).

4. **`block()`** — Calcule le volume exact depuis les lignes. Il ne corrige pas une incohérence par un arrondi. Une séance invalide doit être rejetée ou recomposée.

5. **Structure** — Chaque séance structurée : échauffement + retour au calme (sauf eau libre déjà structurée autrement).

6. **Fun partout** — Du fun dans tout l’entraînement et tous les entraînements. Blocs progressifs / contrastés ; jamais 2 séries d’affilée à la même allure ; pas de monolithes type 18×25 ou 20×50 empilés.

7. **Éducatifs / jambes** — Bloc milieu : privilégier jambes et nage appliquée. Grand/petit chien = rare (≈1 séance sur 8), pas dominant. Focus jambes = éducatif court puis série jambes — jamais deux blocs battements d’affilée.

8. **Découverte** — Éducatifs uniquement : flèche + grand chien, avec palmes + tuba frontal. Pas de catch-up / roulis / virages / petit chien. Pas de demande T100. Wording allégé. Les niveaux Excel (« niveau Arthur ») filtrent aussi : un éducatif absent de Découverte n’entre pas dans un programme Découverte (« adaptable à tous niveaux » ≠ « Tous niveaux »).

9. **Matériel** — Le matériel déclaré indique ce que le nageur peut utiliser, jamais ce qu’il doit utiliser. Une séance peut être sans matériel même si l’inventaire est rempli. Lorsqu’un matériel est utilisé, il doit être affiché explicitement sur la ligne d’exercice concernée. Jamais pull-buoy + palmes dans une même séance ; matériel lié à l’éducatif, jamais tiré au sort.

10. **Quatre nages** — Le crawl garde toujours la plus grande part du volume. Sans préférence : 40 % crawl, 20 % dos, 20 % brasse, 20 % papillon. Avec préférence crawl : 50 / 17 / 17 / 16. Avec préférence dos, brasse ou papillon : 40 % crawl, 30 % nage préférée, 15 % et 15 % pour les deux autres. Case 4 nages = les quatre nages en blocs nagés explicites ; papillon fractionné, jamais omis.

11. **Affichage nageur (D9)** — Jamais `souple` ni `Z1` visibles. Remplacer par une intention concrète (`nage facile` / `relâché` / `facile` / `mise en route` / `retour au calme`…).

12. **Libellés** — Jamais `(facile @2)` / `@2` / `@3` dans un titre nageur. Jamais un bloc = volume + thème seul (`600m respiration`, `6x50 technique`). Éducatif nommé ou nage concrète.

13. **Premium / gratuit** — Allures `@mm:ss`, départs `D…`, step allures, vidéos IG sous séance = Premium. Gratuit : `R…` sans tags d’allure. T100 seul (plus de T400).

14. **Périodisation volume** — Semaine N ≤ N−1 × 1,10. Feedback hebdo `volumeAdj` plafonné [0,70 ; 1,30]. Ne jamais régénérer silencieusement une semaine déjà commencée.

15. **Migration plan** — `PLAN_VERSION` = métadonnées. Merge séance par séance : séance `completed` / `skipped` conservée intacte ; séance non validée remplacée par le moteur ; semaine avec feedback/satisfaction conservée entière ; nombre de séances différent → fallback semaine entière. `FORCE_PLAN_REGEN` ne bypass jamais le merge (pas d’écrasement total).

16. **Quality Gate** — Toute séance composée passe `validateComposedSession`. Arthur ne contourne pas le gate. Sous-volume > séance incohérente.

17. **Objectifs** — BNSSA/pompiers : sauvetage (pas endurance générique seule). BPJEPS : 400 m NL. Eau libre : sighting / lieu. Triathlon : cues course. Même niveau + même focus nage : l’objectif (`roleObjectif`) doit changer intent et proportions de blocs (pas seulement le libellé). MySWYM = générateur de séances, pas école de natation.

18. **Sprint / seuil** — Sprint = récup complète entre reps. Seuil = effort soutenu et régulier (constance des temps).

19. **Restitution coach** — Une ligne = distance + nage + intensité + repos. Pas de headlines moteur (`→ Aujourd'hui`), headers `Technique ·`, ni marketing.

20. **Complétion** — `markSessionStatus("completed")` dès « séance faite » (`handleComplete`), pas à la soumission du feedback.
