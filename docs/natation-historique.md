# Historique natation MySWYM

> Journal complet des décisions Arthur.  
> **Les règles à appliquer aujourd’hui** sont dans [`natation-regles-actives.md`](./natation-regles-actives.md) et [`natation-validation-seances.md`](./natation-validation-seances.md).  
> Ce fichier est un journal : une entrée `✅` ici n’écrase pas une règle plus récente marquée `↩ remplacée`.

### Statuts

| Symbole | Signification |
| --- | --- |
| `✅ active` | Toujours en vigueur (voir aussi règles actives / validation) |
| `↩ remplacée` | Remplacée par une règle plus récente — ne pas réappliquer |
| `🧪 à vérifier` | Décision historique à confirmer avant de s’y fier |

---

## Entrées datées

| Date | Contexte | Correction | Statut |
| --- | --- | --- | --- |
| 2026-08-28 | Lexique Sheet zones D | Tokens canoniques `{D:facile\|endurance\|seuil\|VO2\|sprint}` (+ `{@:…}`). Alias anciens (moyen→endurance, etc.). Fichier coach : `docs/coach-ligne/lexique-sheet-myswym.xlsx`. Débutant = jamais de pace. | ✅ active |
| 2026-08-28 | Sheet D/@ depuis T100 | Placeholders `{D:…}` / `{@:…}` calculés depuis T100 si **intermédiaire ou avancé + Premium + T100**. **Débutant = jamais**. | ✅ active |
| 2026-08-28 | Catalogue Sheet vague 2 | Soft-branch étendu à **XS / Sprint 04–06** (`triathlon_xs` + `triathlon_sprint`). Même grille niveau / 4 nages que Nager. Oly/Half/Full, eau libre, diplômes = pas encore. | ✅ active |
| 2026-08-27 | 4 nages + éducatifs | Sheet : dès qu’une ligne contient **« 4 nages » + « éducatif(s) »**, tirage **1 éducatif par nage** (pap → dos → brasse → crawl). Distances inchangées ; seuls les noms sont injectés. Anti-doublon par nage ; 4 fiches « Voir · … ». | ✅ active |
| 2026-08-27 | Allures Sheet (tips) | Pastilles ⓘ sur séances : **Souple**, **Moyen** (ou « allure régulière »), **Progressif**, **Vite**, **À bloc**. Vocabulaire Sheet int/avancé ; débutant reste sur facile/souple. | ✅ active |
| 2026-08-27 | Éducatif ≠ matos | Tirage éducatif Sheet = **niveau + nage** seulement. Matos fiche = optionnel (`et/ou`) : utilisé uniquement sur `{matériel}`, et seulement s’il est dans l’inventaire nageur. | ✅ active |
| 2026-08-27 | Éducatif jamais 2× d’affilée | Sheet : le dernier éducatif est en exclusion dure ; recyclage seulement s’il n’existe aucune autre option compatible (niveau/matos). | ✅ active |
| 2026-08-27 | Sheet Nager = source unique | Familles `01`–`03` : await catalogue, **interdit** de retomber sur le composeur si le Sheet rate (toast / séance inchangée). Flag ON dans le navigateur par défaut ; kill-switch `VITE_NATATION_SHEET_CATALOGUE=0`. | ✅ active |
| 2026-08-27 | Variété éducatifs Sheet | Soft-branch : anti-doublon sur les **5 derniers** éducatifs de l’historique (+ éducatif courant à la régénération). Si le pool est trop petit → recyclage autorisé. | ✅ active |
| 2026-08-27 | Traçabilité séance (support) | Chaque séance expose sa provenance : `session-provenance.js` → `Réf. 01-42` (onglet Sheet + ligne) dans la vue séance et l'historique, clic = copie de la ligne complète. Réf. jointe automatiquement aux messages support (Telegram, ligne `🏊`) et aux events PostHog (`composedBy`, `sheetFamily`, `sheetN`). **« Séance n°6 » = 6e validation du nageur, jamais la ligne du Sheet.** | ✅ active |
| 2026-08-27 | Catalogue Sheet vague 1 | Soft-branch étendu à **Nager 01–03** (débutant crawl, intermédiaire crawl, 4 nages). Triathlon / eau libre / diplômes = pas encore. `SHEET_SOFT_FAMILIES`. | ✅ active |
| 2026-08-27 | Fiches éducatifs Sheet | Séances `composedBy=natation-sheet` : « Voir l’éducatif » = onglet Éducatifs du Google Sheet (`sheetEducatif`), pas `arthur-educatif-fiches.js` / `matchEducatif`. Niveaux & consignes = colonnes Sheet. | ✅ active |
| 2026-08-27 | Matos pull+palmes | Interdit **dans le même exercice** (même ligne), plus « même séance / même jour ». Posséder les deux OK. Soft-branch catalogue Google Sheet en local (`VITE_NATATION_SHEET_CATALOGUE`). | ✅ active |
| 2026-08-26 | Avancé = 4 nages | Niveau Avancé : plus de question 4 nages, `swimStyle=4_nages` (bouton + moteur). Un ancien Avancé resté en crawl est traité 4 nages. Intermédiaire garde Oui/Non. Débutant reste crawl. | ✅ active |
| 2026-08-26 | 4 nages sans nage favorite | Profil : uniquement Oui/Non 4 nages. Débutant : pas de question, crawl. Mix 4 nages = 40/20/20/20, plus de pondération favorite. | ✅ active |
| 2026-08-25 | UX 4 nages + crawl pur | Profil : « Sais-tu nager du 4 nages ? » (Oui/Non) ; nage favorite seulement si Oui. Diplômes : pas de choix. Tri/eau libre : choix OK. `swimStyle=crawl` → séances 100 % crawl (composeur + QG `crawl_only`, pas de dos en alt/échauff/RAC). | ↩ remplacée |
| 2026-08-15 | Merge séance validée | Hotfix prod : `FORCE_PLAN_REGEN` ne bypass plus le merge. Séance `completed`/`skipped` conservée ; non validée régénérée ; semaine feedback/satisfaction intacte ; structure incompatible → fallback semaine. One-shot = `version < PLAN_VERSION` (option A), pas à chaque ouverture. | ✅ active |
| 2026-08-16 | Éducatifs 4 nages Excel | Séances `strokeFocus=4n` : ~40 % technique = éducatifs Arthur tagués `4_nages` filtrés par « niveau Arthur » ; ~60 % = nages explicites (mix). Découverte 4n : dos à deux bras / papillon un bras / papillon baleine — pas flèche forcée. Plus d’« éducatif libre » inventé dans l’IM drill. | ✅ active |
| 2026-08-15 | Niveaux Excel éducatifs | « niveau Arthur » = gate produit. `parseArthurEducatifLevels` : « adaptable à tous niveaux » n’ouvre plus la Découverte ; sélection = `levels.includes(niveau)` (+ allowlist Découverte règle 8). Petit chien / toucher cuisse / 6 battements hors Découverte ; grand chien reste via notes Excel. | ✅ active |
| 2026-08-15 | Force regen v48 live | Demande Arthur : `PLAN_VERSION` 48 + `FORCE_PLAN_REGEN=true` — tous les plans existants reprennent la pédagogie Arthur (`composeSession` : échauffements, RAC, éducatifs, fun, volume Découverte). Progression écrasée. Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ↩ remplacée |
| 2026-08-15 | Boucle tous objectifs | Triathlon, eau libre et diplôme = séance du jour (`usesSessionLoop` + `PLAN_VERSION` 47). Reprise / maître restent multi-semaines. | ✅ active |
| 2026-08-15 | Bug D9 souple/Z1 | `attachFourNagesCoverage` et `buildConfirmeArchetypeSession` passent par `sanitizeSessionDetails`. Remplacements morts `(Z1)` remplacés par `humanizeArthurDisplayTerms`. Banques OW inchangées (filtre à la sortie). | ✅ active |
| 2026-08-15 | Bug objectifs quasi-identiques | `resolve*Intent` lit `roleObjectif` avant le court-circuit `strokeFocus===4n`. `composeSessionBlueprint` + `biasBlocksForObjectif` varient les proportions départ/technique/corps selon l’objectif (progression vs compétition, triathlon, reprise…). | ✅ active |
| 2026-08-15 | Bug volume Découverte | `coherentVolumeForDecouverte` scale durée/cible comme Régulier/Sportif ; `volumeHint` n’écrête plus 1200–1400 m à ~700 m. Corps Découverte respecte `maxRepsPerSet` (découpe multi-blocs). Tolérance produit ~±150 m. | ✅ active |
| 2026-08-15 | LLM coach à former | Arthur utilise le LLM et lui apprend à entraîner (méthode MySWYM). Le LLM propose / varie ; `composeSession` + quality gate + validation Arthur restent le filtre avant le nageur. Pas de séance inventée live non cadrée. | ✅ active |
| 2026-08-15 | IA vs LLM in-app | « Pas de LLM » = pas d’appel API dans l’app pour inventer une séance. L’IA (Cursor) sert au dev, à améliorer les séances et à les rendre moins monotones ; le moteur reste rule-based sur du contenu validé. | ↩ remplacée |
| 2026-08-15 | Livraison composeur Arthur | `composeSession` = générateur des nouvelles séances (échauffements, RAC dos 100/200 « facile sans forcer », éducatifs, corps fun par objectif). Boucle Nager & Progresser via `buildProgressionLoopSession` → composeur ; fallback seulement si échec réel. Flags pédagogie ON (rollback env `=0`). Matos visible dans les détails (pas de phantom). Force regen v48 pour les plans déjà persistés. | ✅ active |
| 2026-08-15 | Mémoire scindée | Réorganisation : `natation-regles-actives.md` + `natation-source-de-verite.md` + `natation-validation-seances.md` + ce journal. Distances (total …00/…50), cohérence blocs, `block()` sans arrondi, hiérarchie sources, matos disponibilité≠obligation, mix 4 nages reformulé. Aucun code métier modifié. | ✅ active |
| 2026-08-15 | Distances / volume | Règle active : blocs = multiples du bassin ; total = somme exacte ; total final …00 ou …50 uniquement (jamais …25/…75) ; bloc 25 m OK en bassin 25 seulement ; ajustement nage facile / RAC si cible invalide. | ✅ active |
| 2026-08-15 | Cohérence des blocs | Distance explicite sur chaque bloc ; volume = somme stricte ; consigne ×25 m couvre la distance annoncée ; pas d’incohérence d’unité. | ✅ active |
| 2026-08-15 | `block()` | Calcule le volume exact depuis les lignes ; ne corrige pas par arrondi ; séance invalide → rejet ou recomposition. | ✅ active |
| 2026-08-15 | Matériel | Disponibilité ≠ obligation ; séance sans matos OK même si inventaire rempli ; matos utilisé = visible sur la ligne ; jamais pull+palmes ; matos lié à l’éducatif. | ✅ active |
| 2026-08-15 | 4 nages mix | Crawl = plus grande part. Sans préf. 40/20/20/20 ; préf. crawl 50/17/17/16 ; autre préf. 40/30/15/15. | ✅ active |
| 2026-08-15 | Éducatifs chiens | Chien rare ≈1 séance sur 8 ; priorité jambes + nage appliquée. | ✅ active |
| 2026-08-15 | Bascule R4 warmups | Un seul générateur (`composeSession`) : flag `pedagogy-flags.warmups` → recettes échauffement Arthur avec fallback départ synthétique. Respect maxContinuous. Rollback `MYSWYM_PEDAGOGY_WARMUPS=0`. Pas de 2e parcours ; pas de regen séances persistées. | ✅ active |
| 2026-08-15 | Fun partout | Du fun dans tout l’entraînement et tous les entraînements. Composeur : échauffement avec jeu, technique intercalée, seuils/4 nages/sprint contrastés, anti double-série même allure. | ✅ active |
| 2026-08-15 | Composeur brouillon — fun | Feedback lot A01–A10 : pas 2 séries même allure ; pas monolithes 18×25 / 20×50 ; blocs progressifs / contrastés ; filler = contraste. Affichage : pas `souple` (D9). | ✅ active |
| 2026-08-15 | Affichage D9 | Jamais `souple` ni `Z1` dans les `details` nageur. | ✅ active |
| 2026-08-15 | Rédaction affichage | Règle D9 + doc `docs/redaction-seances.md`. Pas de change générateur / textes source gris. | ✅ active |
| 2026-08-14 | Force regen v45 live | `PLAN_VERSION` 45 + `FORCE_PLAN_REGEN=true` — 4 nages explicites + IM. Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ✅ active |
| 2026-08-14 | 4 nages composition | Case 4 nages = 4 nages explicites ; mix 40/20/20/20 etc. ; papillon fractionné. Formulation « crawl toujours majoritaire » → voir entrée 2026-08-15 (mix reformulé). | ↩ remplacée |
| 2026-08-14 | 4 nages IM | Formats olympiques 100/200/400 ; fun 8×50 à 12,5 m/nage ; Découverte sans IM enchaîné. | ✅ active |
| 2026-08-14 | Pull + palmes | Interdit dans une séance (pas dans l’inventaire). | ✅ active |
| 2026-08-14 | Inventaire matériel | Multi-sélection + « Aucun » ; disponibilité ≠ obligation ; jamais pull+palmes. | ✅ active |
| 2026-08-14 | Libellés séance | Plus de suffixes `(facile @2)` ; éducatif nommé ou nage concrète. | ✅ active |
| 2026-08-14 | Éducatifs + matos | Cycle ~3/8 jambes, chiens rare ; matos pédagogique lié à l’éducatif. | ✅ active |
| 2026-08-14 | Composeur corps banque | Aérobie = `CORPS_PHYSIO` scalé, pas 2× série clone. | ✅ active |
| 2026-08-14 | Complétion → planned_sessions | `markSessionStatus("completed")` dès `handleComplete`. | ✅ active |
| 2026-08-14 | Composeur technique banque | Vraies lignes `TECHNIQUE` ; bassin 50 : Nx25 → volume en 50 ; Découverte = flèche + grand chien. | ✅ active |
| 2026-08-14 | Matos pédagogique (Arthur) | Multi-select ; matos lié éducatif ; interdit pull+palmes. | ✅ active |
| 2026-08-14 | Distance moyenne + wish | Slider distance/séance + wish ; `PLAN_VERSION` 46 + FORCE regen. | ✅ active |
| 2026-08-13 | Engagement matériel | Inventaire non vide → ≥1 item matos visible / séance (hors récup / taper / course). QG `equipment_engagement`. | ↩ remplacée |
| 2026-08-10 | Composeur J3 (qualité) | Intensité réelle Z3/Z4 ; anti-filler ; cues objectif ; taper/post_race ; QG Q16–Q29. | ✅ active |
| 2026-08-10 | Pyramide Ironman | Cap `MAX_PYRAMID_VOLUME=1000` ; paliers explicites ; QG refuse pyramide opaque. | ✅ active |
| 2026-08-10 | Restitution coach | `coach-restitution.js` : strip headlines, pyramides décomposées, matos sur ligne nageable. | ✅ active |
| 2026-08-10 | Force regen v44 live | `PLAN_VERSION` 44 + FORCE — restitution coach. | ✅ active |
| 2026-08-08 | Composeur Sportif D | `sportif` dans `SESSION_COMPOSER_ENABLED_LEVELS` ; polarisation A/B/C. | ✅ active |
| 2026-08-08 | Régulier refinement | setFormat, repos variable, equipmentUsage, sessionSpecificity. | ✅ active |
| 2026-08-08 | Objectif reprendre | `mapGoalToObjectifV1` : objectifs explicites avant fallback progression. | ✅ active |
| 2026-08-08 | Moteur sportif V1 | Module `sports-engine/` ; `PLAN_VERSION` 40. | ✅ active |
| 2026-08-08 | Composeur séances B | `session-composer` + inventaire drills ; Découverte first. | ✅ active |
| 2026-08-08 | Découverte sport refine | Pas de long continu par défaut ; split 20/27/40/13. | ✅ active |
| 2026-08-08 | Gold + strokeFocus | Intentions Gold ; papillon adapté si non maîtrisé (voir aussi règle 4 nages explicites). | 🧪 à vérifier |
| 2026-08-08 | Composeur Régulier C | Régulier actif ; semaine A/B/C. | ✅ active |
| 2026-08-08 | RaceTarget chaîne | Sportif + course_piscine seulement. | ✅ active |
| 2026-08-08 | Sportif pré-Perf | Polarisation ; `maxContinuous` stroke-aware. | ✅ active |
| 2026-08-08 | Étape F Performance | `PerformanceStrategy` ; composeur Performance. | ✅ active |
| 2026-08-08 | Étape G Taper/Race | Phases TAPER/RACE ; Race Day hors volume. | ✅ active |
| 2026-08-08 | Étape H Feedback | FeedbackSignal → Capacity EMA → WeeklyAdaptation. | ✅ active |
| 2026-08-08 | Étape I Orchestration | Phase effective ; volume final unique. | ✅ active |
| 2026-08-08 | Étape J2 Quality Gate | `validateComposedSession` ; tests Q1–Q15. | ✅ active |
| 2026-08-08 | Étape K Persistance | Tables faits sportifs + RLS. | ✅ active |
| 2026-08-08 | Force regen v41 / v42 | FORCE regen moteur V1 + matos. | ✅ active |
| 2026-08-08 | Matériel questionnaire | Étape matos tous niveaux ; `equipment: []` si aucun. | ✅ active |
| 2026-08-04 | Questionnaire | Âge, poids, taille, blessure, fréquence, style, nage préférée. | ✅ active |
| 2026-08-04 | Distances × bassin | Plus de totaux impossibles (ex. 320 m). `block()` = somme des lignes + **arrondi ×25**. Virages 15 m → 25 m. `PLAN_VERSION` 39. | ↩ remplacée |
| 2026-08-04 | Nager & Progresser | Boucle séance unique (`isSessionLoop`) ; freemium 8 + 2/sem. | ✅ active |
| 2026-08-03 | Découverte flèche/chien | Éducatifs = flèche + grand chien (+ palmes / tuba). | ✅ active |
| 2026-08-03 | Force regen Découverte v28 | Overwrite uniquement découverte/beginner. | ✅ active |
| 2026-08-03 | Découverte sans T100 | Pas de T100 onboarding/profil en découverte. | ✅ active |
| 2026-08-03 | Semaine compétition easy | 1 ou 2 séances ; touches ≤12,5 m ; phrase rassurance. | ✅ active |
| 2026-08-03 | Force regen v29 / v31 | FORCE regen banque / plans. | ✅ active |
| 2026-08-03 | Blocs technique UI | 1 numéro = 1 bloc ; sous-séries indentées. | ✅ active |
| 2026-08-03 | UX séances Performance | Expand `A · B · C` en sous-séries. | ✅ active |
| 2026-08-03 | Matos cohérent | Pas de matos aléatoire sur titre ; interdit pull+palmes. | ✅ active |
| 2026-08-03 | Banque `session_templates` | Table Supabase + seed ; Gold Arthur (descend, pyramide, IM, etc.). | ✅ active |
| 2026-08-03 | Banque live + wire | Confirmé eau_libre/mixte → Arthur gold, sinon JS. | 🧪 à vérifier |
| 2026-08-03 | Profil goûts client | `user-taste.js` + soft bias générateur. | ✅ active |
| 2026-08-02 | Feedback par séance | Sheet easy/ok/hard ; micro-nudge Premium ±3 %. | ✅ active |
| 2026-07-29 | Force regen v26 | FORCE regen contenu actuel. | ✅ active |
| 2026-07-24 | Variété / vocabulaire / sync | Variantes ↑ ; rattrapé / coulée ; `mergePlanLists` ; banque confirmé ×2. | ✅ active |
| 2026-07-24 | Code mort générateur | Suppression orphelins hors pipeline. | ✅ active |
| 2026-07-24 | Onboarding niveaux | Distances repères Régulier/Sportif. | ✅ active |
| 2026-07-23 | Allures T100 seul | Suppression T400. | ✅ active |
| 2026-07-23 | Bassin 25/50 coach | `pool` via bridge ; pas Nx25 en bassin 50. | ✅ active |
| 2026-07-23 | Pool 50 = 25+25 | Variantes vitesse : 25 à bloc + 25 relâché (≠ éducatifs Nx25→N/2×50). | ✅ active |
| 2026-07-23 | Feedback `adjustPlan` | Régénère semaines vierges ; `volumeAdj` ∈ [0,70 ; 1,30]. | ✅ active |
| 2026-07-23 | Migration PLAN_VERSION | Merge progression ; `FORCE_PLAN_REGEN` off par défaut. | ✅ active |
| 2026-07-23 | Banque confirmé coach | Réintégration archétypes OW dans coach. | 🧪 à vérifier |
| 2026-07-18 | Wording débutant S1 | Clarifier wording découverte uniquement. | ✅ active |
| 2026-07-18 | Générateur + Premium | Allures / IG / step pace = Premium only. | ✅ active |
| 2026-07-18 | Volume × niveau | Multiplicateurs découverte→perf. | ✅ active |
| 2026-07-18 | Périodisation | +10 % ; tests chrono ; affûtage. | ✅ active |
| 2026-07-18 | Allures départ/fin | Annoter toutes les zones nues si Premium. | ✅ active |
| 2026-07-18 | Jambes > chiens | Cycle ~3/8 jambes, chiens 1/8. Départs sans chien. | ✅ active |
| 2026-07-18 | Jambes ≠ jambes | Focus jambes = éducatif court + série jambes. | ✅ active |
| 2026-07-16 | Format Arthur | Structure départ → technique → corps Z → RAC. | ✅ active |
| 2026-07-16 | COSD + Arthur | Programmation polarisée COSD. | ✅ active |
| 2026-07-16 | Force regen v14 | Migration forcée preview. | ✅ active |
| 2026-07-16 | Distances propres | Blocs type Excel (50/100/150/200/400) — sans 125/175. | 🧪 à vérifier |
| 2026-07-16 | Roulis = palmes | Jamais plaquettes sur roulis. | ✅ active |
| 2026-07-16 | Grand & petit chien | Focus `technique_chiens` 3× dans le cycle ; présent dans ~2/3 des séances. | ↩ remplacée |
| 2026-07-15 | Moteur coaching | Intégration `swim-session-generator.js` via bridge — BNSSA/BPJEPS ancien moteur. | 🧪 à vérifier |
| 2026-07-15 | Moteur coaching (rôle actuel) | Ancien parcours = fallback temporaire ; décision = `composeSession` (voir hiérarchie sources). | ✅ active |
| 2026-06-29 | Eau libre 5k/10k S1–S3 | Banque `OW_BASE_SESSIONS` phase base. | 🧪 à vérifier |
| 2026-06-09 | Vocabulaire séances | « sculling » → « godilles ». | ✅ active |
| 2026-06-09 | Migration PLAN_VERSION | Ne plus régénérer les semaines au bump — préserver progression. | ✅ active |
| 2026-05-16 | Mémoire initiale | Création mémoire + règles Cursor. | ✅ active |
| 2026-05-16 | Eau libre + Performance | `usePoolIMBlock` = false pour OW/triathlon. | ✅ active |

### Format pour une nouvelle ligne

```
| YYYY-MM-DD | Contexte | Description précise | ✅ active / ↩ remplacée / 🧪 à vérifier |
```

---

## Erreurs récurrentes (ne pas refaire)

Les items ci-dessous restent des garde-fous. Si une formulation contredit [`natation-regles-actives.md`](./natation-regles-actives.md), **la règle active gagne**.

1. **BNSSA** : oublier le volet sauvetage (sortie bassin, enchaînement, chrono 100 m examen).
2. **Découverte** : pas de seuil/vitesse précoce ni jargon cru. Éducatifs = flèche + grand chien (+ palmes/tuba) seulement. **Ne pas demander de T100.**
3. **Matériel** : pas de matos aléatoire sur le titre ; jamais pull-buoy + palmes dans la même séance ; disponibilité ≠ obligation (~~inventaire déclaré → matos obligatoire~~ ↩ remplacée).
4. **Eau libre + Performance** : ne pas appliquer le bloc IM plein de brasse — crawl/sighting (`usePoolIMBlock`).
5. **Eau libre** : pas uniquement des `8×100 m` bassin sans sighting / lieu.
6. **Allures** : T100 seul ; Premium only pour `@mm:ss`.
7. **Distance** : volume affiché = somme exacte des blocs ; total final …00 ou …50 ; jamais arrondi silencieux ni `block()` qui « corrige » par ×25.
8. **Cohérence blocs** : chaque bloc a une distance ; une consigne ×25 m doit coller à la distance annoncée ; pas d’incohérence d’unité.
9. **Sportif / Performance** : volumes et intitulés différenciés.
10. **Vocabulaire** : godilles.
11. **Éducatifs** : ne pas saturer de grand/petit chien — ~1/8, priorité jambes + nage. Jamais deux blocs jambes d’affilée.
12. **Migration plan** : `PLAN_VERSION` n’autorise pas une regen complète sauf force explicite Arthur.
13. **Nager & Progresser** : boucle séance unique, pas plan multi-semaines.
14. **Sportif course piscine** : polarisation (pas B et C en Z3 par défaut).
15. **Sportif vitesse** : préparation → qualité → consolidation.
16. **Continu 4N** : `maxContinuous` stroke-aware.
17. **Arthur tests** : ne valider que si templates prêts ; ne pas scaler en ne touchant que `session.distance`.
18. **Taper Performance** : pas de coeff uniforme ; Race Day ≠ volume.
19. **Feedback / adaptation** : un signal ≠ crash/boom ; pain = sécurité ; pas de double séance manquée.
20. **Quality Gate** : toujours `validateComposedSession` ; Arthur ne contourne pas.
21. **Pyramide** : ≤ 1000 m ; paliers nageables.
22. **Restitution coach** : pas de headlines moteur / marketing.
23. **Intent = intensité réelle** : seuil ⇒ mètres Z3/Z4 réels.
24. **Anti-filler** : pas de suite / pyramide opaque pour coller le volume.
25. **Objectif dans le corps** : OW → sighting ; tri → économie ; course → race pace ; 4N → part réelle multi-nages.
26. **Post-race borné** : `daysToComp ∈ [-10, 0[`.
27. **Technique composeur** : lignes Arthur variées ; éducatif puis nage appliquée ; Découverte = flèche + grand chien.
28. **Complétion vs feedback** : completed dès `handleComplete`.
29. **Corps composeur** : pas deux séries clones ; `CORPS_PHYSIO` / formats d’intensité.
30. **Fun / anti-répétition** : pas 2 séries même allure ; pas de monolithes.
31. **Matos × éducatif** : lié à l’éducatif, jamais tiré au sort ; jamais pull + palmes.
32. **Libellés** : pas de codes d’intensité bruts ; éducatif nommé ou nage concrète.
33. **4 nages coché** : quatre blocs nagés ; papillon présent ; mix selon règle active (crawl = plus grande part).

---

## Pistes produit (pas encore codées)

- Affiner scaling distances dans les lignes Arthur (pas seulement distance annoncée).
- Table `session_patterns` dédiée si métadonnées patterns dépassent `session_templates`.
- Mode reprise UI explicite après interruption longue.
