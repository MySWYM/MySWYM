# Mémoire natation — corrections & décisions

> **Source de vérité** pour le contenu des séances MySWYM.  
> L’agent doit **lire ce fichier avant** de modifier `SESSION_TEMPLATES` ou les patterns de plan.  
> **Après chaque correction d’Arthur** : ajouter une entrée datée ici (et mettre à jour `.cursor/rules/natation-seances.mdc` si règle durable).

---

## Règles durables (ne pas violer)

### Moteur & format

- Les séances sont générées dans `generatePlan` :
  - **Moteur coaching** (`src/lib/swim-session-generator.js` + `swim-plan-bridge.js`) : triathlon, eau libre, progression, bien-être, compétition maître. Structure **départ (godilles Z1) → technique rotative → corps physio (Z1–Z4) → fin RAC**, règle **+10 %** hebdo.
  - **Ancien moteur** (`SESSION_TEMPLATES`, `PHASE_PATTERNS`) : BNSSA, BPJEPS, tests pompiers uniquement.
- **Pas de LLM** pour générer les séances : logique déterministe uniquement.
- Distances **multiples de la longueur de bassin** (`snap`, `pool` 25 ou 50 m). Moteur coach : `profile.pool` passé via `opts.pool` ; pas de séries `Nx25m` en bassin 50 (variantes 50m / adaptation technique).
- **Blocs technique** : 1 numéro UI = 1 bloc. Titre `400m éducatif + jambes :` + sous-séries indentées (pas de tirets/points numérotés séparément). Affichage regroupe header + `·` enfants.
- **Séances Performance / banque Arthur** : lignes compactes `A · B · C — Z2` découpées automatiquement en sous-séries verticales (`expandCompoundDetailLines`) — pas de mur de texte.
- Chaque séance structurée : **échauffement** + **retour calme** (sauf séances eau libre spécifiques).
- Premium : intervalles en `D…` (départ) + allure cible si `pace100` renseigné. Gratuit : `R…` (récup simple) **sans** tags `@mm:ss` d'allure.
- Allures cibles / step onboarding « Tes allures cibles » / vidéos Instagram sous séance : **Premium only**.
- Moteur coaching : à côté de chaque `(Z1)`…`(Z4)`, afficher `@mm:ss-mm:ss` calculé depuis **T100 seul** (`pace100`) — **uniquement Premium** (gratuit = zone seule). Inclut départ et fin, pas seulement le corps. **Plus de T400** (ni demandé, ni en formule).
- Profil Premium : carte **Évolution des temps** (courbe projetée sur les semaines + points saisis via `paceHistory`). Gratuit = teaser verrouillé.
- Coefficients allure : adaptés au T100 via `src/lib/swim-pace.js` — plus le T100 est rapide, plus les zones aérobie sont tolérantes (mults ↑, bandes resserrées).
- Projection progression : rendements décroissants selon T100 (`maxPaceGainFromT100`) — pas un −10 % fixe.
- Rotation des variantes via `weekIdx` — ne pas dupliquer la même variante deux semaines de suite sans raison.

### Niveaux

- **MySWYM = générateur de séances** (pas école de natation / correction de geste).
- **Bloc milieu** : privilégier **jambes** et nage appliquée. **Grand/petit chien** = rare (≈1 séance sur 8), pas dominant. Trop d’éducatifs fait fuir.
- **Focus jambes** : toujours **éducatif court puis série jambes** — jamais enchaîner deux blocs battements (titre + détail).
- **Même structure** départ → technique → corps → fin ; **volume** selon niveau : découverte ≈0.55 · régulier ≈0.8 · sportif ≈1.0 · performance ≈1.25 (triathlon perf ≈1.35).
- **Découverte** : wording allégé (Z1→facile, R15→repos). Éducatifs **uniquement** : **flèche** + **grand chien**, avec **palmes + tuba frontal**. Pas de catch-up / roulis / virages / petit chien à ce niveau — sensations, glisse, confiance. **Pas de demande T100** (onboarding / profil) : souvent incapables d’enchaîner 100 m — séances sans allures `@mm:ss`.
- **Matériel** : ne **jamais** coller de matos aléatoire sur le titre de bloc (incohérent avec les lignes). Matos **dans la ligne d’exo** seulement. **Interdit** : pull-buoy + palmes (incompatible). Exception Découverte : « palmes + tuba frontal » sur le titre.
- **Triathlon / eau libre** : niveau « découverte » autorisé (formats courts ouverts).
- **Sportif vs performance** : volumes clairement distincts via le multiplicateur.
- **Inter / confirmé** : format Arthur Excel (Z1–Z4, R15'', Cr/Dos).

### Périodisation (volume + difficulté)

- **Montée volume** : semaine N ≤ semaine N−1 × **1,10** (réellement appliqué via `weekScale` dans le générateur). Feedback hebdo (`easy`/`hard`) : multiplicateur cumulé `volumeAdj` plafonné **[0,70 ; 1,30]** — ne pas composer ±12 % sans borne. Feedback **séance** : micro-nudge **×1,03** / **×0,97** (premier retour only), même plafond.
- **Décharges** : ~toutes les 4 semaines (−30 %) + phases affûtage.
- **Difficulté** : zones qui montent par mésocycle (Z1–Z2 foncier → Z3–Z4 spécifique).
- **Semaines test** (`phase: "test"`) : chronos 100/200/400 m pour mesurer l’évolution — 1 à 2 selon la durée du plan (après base / après développement).
- **Affûtage** : 1 semaine dès 6 sem. de plan, **2 semaines** dès 10 sem. Volume ↓, touches vitesse, puis semaine compétition.
- **Semaine de compétition** (dernière avant l’event) : **toujours easy** — **1 séance** si fréquence ≤3×/sem, **2 séances** si >3. Volume très bas, séances courtes (~20–25 min), rappels de vitesse **≤12,5 m**, phrase : « Ne t’inquiète pas : si tu as suivi le plan, le travail est fait. »
- **« Nager & Progresser »** : **plus de plan multi-semaines**. Mode boucle (`isSessionLoop`) : une seule séance à la fois (`buildProgressionLoopSession`), validation Terminer/Abandonner → nouvelle génération. Questionnaire : **fréquence demandée** (comme les autres programmes) pour le profil ; la boucle génère toujours 1 séance à la fois. Freemium : **8 séances** au total + **2 nouvelles / semaine** calendaire ; Régénérer = Premium. Premières séances (cursor &lt; 3) forcées faciles.
- **Questionnaire commun** (tous programmes) : âge, poids (kg), taille (cm), blessure (aucune / oui + note), séances/semaine, style préféré (crawl / 4 nages), nage préférée (papillon / dos / brasse / crawl). Stockés dans `entry.profile` ; affichés sur l’onglet Profil.

### Objectifs spécifiques

- **BNSSA / tests pompiers** : séances orientées **examen** — apnée dynamique, **palmes + masque + tuba**, remorquage, simulations parcours. Beaucoup de slots `bnssa` dans `BNSSA_PATTERNS`.
- **BPJEPS AAN** : focus **400 m NL** (objectif < 7'40"), fractionné, régularité des temps — distinct de BNSSA.
- **Eau libre** : préfixer `À faire en eau libre`, sighting, combinaison, repères — pas uniquement des reps bassin.
- **Triathlon** : cues course (régularité, bouée, allure compétition sur reps longues).

### Pédagogie & ton

- Français, tutoiement, phrases **actionnables** (« repose 30" », pas « récupération active modérée » seul).
- Sprint : **récup complète** entre reps (sinon c’est de l’endurance déguisée).
- Seuil : effort soutenu mais **régulier** — constance des temps.
- Endurance découverte : l’utilisateur doit pouvoir **parler** / tenir sans s’arrêter toutes les longueurs.

### Technique produit

- Après changement structurel des plans : incrémenter `PLAN_VERSION` pour régénérer les plans obsolètes.
- Feedback hebdo (`easy` / `ok` / `hard`) : ajuste le **volume** des semaines futures vierges (`adjustPlan` + `volumeAdj` plafonné). Coach = régénération générateur (details = total) ; jamais une semaine déjà commencée.
- Feedback **par séance** (`session.feedback` : rating + tags + comment) : sheet après « séance faite » ; miroir table `session_feedback`. Premium : micro-`adjustPlan(..., { sessionNudge: true })` au **premier** retour only (±3 %) — le hebdo reste le levier principal. Ne pas poser `week.feedback` depuis un nudge sessionnel.
- **Profil de goûts** (`user_taste_profile` + `src/lib/user-taste.js`) : chaque retour (séance + hebdo) met à jour un score EMA par compte (volume, intensité, éducatifs, clarté, types, keywords/couleurs/styles). Alimente le générateur (volume ±8 %, rôles COSD, focus technique, wording). Persistance Supabase + localStorage ; migration anon → compte à la connexion. Ne jamais écraser une semaine commencée.

---

## Historique des corrections

| Date | Contexte | Correction | Statut |
|------|----------|------------|--------|
| 2026-08-04 | Questionnaire | Ajout champs communs tous programmes : âge, poids, taille, blessure, fréquence (y compris progression), style crawl/4 nages, nage préférée | ✅ |
| 2026-08-04 | Nager & Progresser | Mode boucle séance unique (`isSessionLoop`) : plus de plan 12 sem., plus de question fréquence. Freemium 8 séances + 2/sem. `PLAN_VERSION` → 35 | ✅ |
| 2026-05-16 | Mémoire initiale | Création de ce fichier + règles Cursor pour éviter de répéter les erreurs | ✅ |
| 2026-05-16 | Eau libre + Performance | Ne pas utiliser le bloc perf « 4 nages » (brasse) : `usePoolIMBlock` = false pour OW/triathlon. Séances crawl/sighting. 4 nages léger OK (1 tour IM, peu de brasse). `PLAN_VERSION` → 10 | ✅ |
| 2026-06-09 | Vocabulaire séances | Remplacer « sculling » par « godilles » (terme français) dans les templates récup / technique | ✅ |
| 2026-06-09 | Migration PLAN_VERSION | Ne plus régénérer les semaines au bump de version — préserver toute semaine avec séance validée/oubliée/sautée ou feedback | ✅ |
| 2026-07-15 | Moteur coaching | Intégration `swim-session-generator.js` (phases Foncier→Affûtage, +10%, allures Z1–Z4, godilles) via `swim-plan-bridge.js` — BNSSA/BPJEPS conservent l'ancien moteur | ✅ |
| 2026-07-16 | Format Arthur | Source de vérité séances = Excel OpenSwim (Thierry) : départ → technique → corps Z → RAC. Titres type `Construction du volume S4.1`, zones en intensité. Doc `arthur-session-format.md`. UI allégée. | ✅ |
| 2026-07-16 | COSD + Arthur | UI figée. Contenu = format Arthur + programmation polarisée COSD (rôles Aéro/Seuil/VO2/Vitesse par mésocycle). Doc `plan-methodology.md`. SessionCard restaurée. | ✅ |
| 2026-07-16 | Force regen v14 | Arthur : aucun user actif → `PLAN_VERSION` 14 régénère les semaines au chargement (migration forcée) pour preview contenu | ✅ |
| 2026-07-16 | Distances propres | Corps/départs sans 125/175m — blocs type Excel (50/100/150/200/400). `PLAN_VERSION` 15 | ✅ |
| 2026-07-16 | Roulis = palmes | Jamais de plaquettes sur roulis/rotation du corps — uniquement palmes. `PLAN_VERSION` 16 | ✅ |
| 2026-07-16 | Grand & petit chien | Focus `technique_chiens` 3× dans le cycle + départs ; présent dans ~2/3 des séances. `PLAN_VERSION` 17 | ✅ |
| 2026-07-18 | Wording débutant S1 | Feedback Steven : séances illisibles (Z1, RAC, R15'', grand chien…). Clarifier le wording **uniquement** si `niveauKey === debutant` (découverte/beginner/régulier) : zones en français, repos en secondes, éducatifs expliqués inline. Inter/confirmé = format Arthur inchangé. `PLAN_VERSION` 18 (métadonnées ; pas de regen forcée des semaines existantes) | ✅ |
| 2026-07-18 | Générateur + Premium | Positionnement = générateur de séances (pas école de natation). Allures `@mm:ss` + step onboarding allures = **Premium only**. Lien vidéos IG sous séance = Premium. Copier séance (texte Strava/WhatsApp). Bulle support DM. UI séance style landing. `PLAN_VERSION` 19 (force regen) | ✅ |
| 2026-07-18 | Volume × niveau | Même base coach, distances × niveau (découverte 0.55 → perf 1.25). Wording light uniquement découverte. Diplôme BNSSA/pompiers : +apnée/palmes/tuba, patterns plus `bnssa`. `PLAN_VERSION` 20 | ✅ |
| 2026-07-18 | Périodisation | Progression distance (+10 % réel), semaines **test chrono**, affûtage 1–2 sem. avant échéance, bilans progression. `PLAN_VERSION` 21 (force regen) | ✅ |
| 2026-07-18 | Allures départ/fin | Les `(Zx)` du départ et de la fin n’avaient pas `@mm:ss` (corps seul). Annoter toutes les zones nues si Premium + pace. `PLAN_VERSION` 22 | ✅ |
| 2026-07-18 | Jambes > chiens | Trop de petit/grand chien → fait peur. Cycle : ~3/8 jambes, chiens 1/8. Départs sans chien. Croisement sans éducatif chien. `PLAN_VERSION` 23 | ✅ |
| 2026-07-18 | Jambes ≠ jambes | Jamais 400m jambes puis encore 8x50 jambes. Focus jambes = **éducatif court + série jambes**. Pas de départ jambes si focus jambes. `PLAN_VERSION` 24 | ✅ |
| 2026-07-23 | Allures T100 seul | Suppression T400 onboarding/formules. Consigne UI départ dans l'eau. Zones % adaptatives + projection rendements décroissants (`swim-pace.js`). `PLAN_VERSION` 25 | ✅ |
| 2026-07-23 | Bassin 25/50 coach | `profile.pool` n’arrivait pas au moteur coach ; reps 25m en bassin 50. Passage `pool` via bridge + variantes vitesse/mixte + adapt technique Nx25→N/2x50. Pas de regen rétroactive. | ✅ |
| 2026-07-23 | Pool 50 = 25+25 | Variantes vitesse/technique bassin 50 : même nb de reps, chaque 50m = 25m à bloc + 25m relâché (pas un 50 sprint plein). Distance bloc recalculée. | ✅ |
| 2026-07-23 | Feedback `adjustPlan` | (1) Ne plus patcher seul `s.distance` — régénère semaines futures vierges via bridge/`volumeAdj` (sinon scale details+duration). (2) Plafond cumulé `volumeAdj` ∈ [0,70 ; 1,30] (fini le ×1.12^n). | ✅ |
| 2026-07-23 | Migration PLAN_VERSION | **Bug perte de progression** : l'effet migration remplaçait tout le plan sans `mergePreservingProgress` (contrairement au déblocage Premium). Fix = merge des semaines ; `FORCE_PLAN_REGEN` off par défaut pour un vrai force regen volontaire. | ✅ |
| 2026-07-23 | Banque confirmé coach | Réintégration ex-`OW_BASE_SESSIONS` (9 archétypes) dans `swim-session-generator.js` + branchement `buildCoachPlanWeeks` pour eau_libre / triathlon / nager&progresser au niveau confirmé (tout le plan, rotation `wi*3+si`). Retrait du vieux câblage mort dans `buildWeeks`. | ✅ |
| 2026-07-24 | Code mort générateur | Suppression `genererSeance` / `genererSemaine` / `phase.volMult` / `estimateSessionTotal` (+ avg*) — orphelins hors pipeline réel. Aucun changement de comportement. | ✅ |
| 2026-07-24 | Onboarding niveaux | Wording Régulier/Sportif clarifié — distances repères (400m/1500m) au lieu de formulations qui se chevauchaient ("nage régulièrement" dans les deux). Performance reformulé "courses ou compétitions". Aucun changement d'id, pas d'impact logique. | ✅ |
| 2026-07-24 | Sync multi-appareils | `mergePlanLists` perdait un plan créé hors-ligne si l'autre côté avait un `updatedAt` plus récent (absent ≠ supprimé). Fix : n'ignorer que les ids dans `deletedIds` ; sinon union + max progression. | ✅ |
| 2026-07-24 | Variété générateur | Doublé/triplé le volume de variantes disponibles : départs 8→16, RAC 6→12, fins 5→10, `CORPS_PHYSIO` (endurance 12→24, vitesse 10→20, mixte 8→16, eau_libre 6→14, test 6→10), `TECHNIQUE` (tous focus, +6 à +8 par catégorie). Objectif : réduire la répétition perçue sur un plan long. Aucun changement de structure/règles. | ✅ |
| 2026-07-24 | Vocabulaire technique | « catch-up » → « rattrapé » partout (label + drills). « sortie en apnée » (virages) → « coulée » (terme correct pour la glisse post-virage). Correction Arthur : le rattrapé ne se fait jamais mains qui se touchent, mais bras dans l'axe des épaules — description corrigée. | ✅ |
| 2026-07-24 | Banque confirmé x2 | 9 nouveaux archétypes (S4.1–S6.3) ajoutés à la banque confirmé (ex-`OW_BASE_SESSIONS`, 9→18) : rythme de nage, gestion d'allure 200m, virages, sighting avancé, négatif split, jambes/gainage, simulation course, respiration contrôlée, récup active. Rotation `wi*3+si` sur 18 au lieu de 9 → repeat toutes les 6 semaines au lieu de 3 (3 séances/sem). | ✅ |
| 2026-07-29 | Force regen v26 | Demande Arthur : `PLAN_VERSION` 26 + `FORCE_PLAN_REGEN=true` pour appliquer le contenu actuel à tous les plans existants (écrase aussi la progression). Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ✅ |
| 2026-06-29 | Eau libre 5k/10k S1–S3 | Banque `OW_BASE_SESSIONS` (9 archétypes signature coach) en phase base semaines 1–3 : éducatifs lents → Z2 nage appliquée → sensation/RAC. Scaling régulier/sportif/perf. `OPEN_WATER_PATTERNS`. `PLAN_VERSION` → 12 | ✅ |
| 2026-08-02 | Feedback par séance | Sheet après « séance faite » : rating easy/ok/hard + tags + commentaire. Stocké dans `session.feedback` + table `session_feedback`. Premium : micro-nudge `volumeAdj` ×1.03/×0.97 au premier retour (hebdo reste le levier ±12 %). | ✅ |
| 2026-08-03 | Découverte flèche/chien | Éducatifs Découverte = **flèche** + **grand chien** uniquement (+ palmes / tuba frontal). Cycle dédié `FOCUS_CYCLE_DECOUVERTE`. Prompt `docs/prompt-autre-ia.md`. `PLAN_VERSION` 27 + force regen. | ✅ |
| 2026-08-03 | Force regen Découverte v28 | Plans déjà en v27 : bump `PLAN_VERSION` 28. Force overwrite **uniquement** niveau découverte/beginner (autres = merge progression). Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ✅ |
| 2026-08-03 | Découverte sans T100 | Ne plus demander le temps au 100 m en onboarding / profil pour niveau découverte (souvent incapables d’enchaîner 100 m). Skip step pace Premium + hide carte évolution / champ T100. | ✅ |
| 2026-08-03 | Semaine compétition easy | Dernière semaine avant event : 1 séance (≤3×/sem) ou 2 (>3), volume bas, touches vitesse ≤12,5 m, phrase rassurance. Affûtage inchangé. `PLAN_VERSION` 30 + force regen. | ✅ |
| 2026-08-03 | Force regen v31 | Demande Arthur : bump `PLAN_VERSION` 31 + `FORCE_PLAN_REGEN=true` pour re-forcer tous les plans (déjà en v30). Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ✅ |
| 2026-08-03 | Blocs technique UI | Tirets + points numérotés séparément = illisible. 1 numéro = 1 bloc (titre + sous-séries). Préfixes `-`/`·` masqués. Générateur : `400m … :` + lignes indentées. `PLAN_VERSION` 33. | ✅ |
| 2026-08-03 | UX séances Performance | Lignes Arthur `A · B · C` (ex. Symétrie pull) → expand en sous-séries verticales à l’affichage + store. Migration SQL symétrie lisible. | ✅ |
| 2026-08-03 | Matos cohérent | Plus de matos aléatoire sur le titre de bloc. Interdit pull-buoy+palmes. Matos dans la ligne d’exo ; Découverte garde palmes+tuba au titre. `PLAN_VERSION` 34. | ✅ |
| 2026-08-03 | Banque `session_templates` | Table Supabase + seed 18 archétypes confirmé (ex-`OW_BASE_SESSIONS`). Mémoire / CMS coach ; le générateur JS reste la source runtime. Migration `20260803153000_session_templates.sql`. | ✅ |
| 2026-08-03 | Gold descend/DPS | 1ère séance `coach_approved` : structure concurrente réécrite format Arthur (2300m, D…). Migration `20260803154500_session_template_descend_dps.sql`. | ✅ |
| 2026-08-03 | Gold pyramide pull | 2e gold : 600/pull/jambes/pull/600 (3300m). Migration `20260803155000_session_template_pyramide_pull.sql`. | ✅ |
| 2026-08-03 | Gold qualité 4 nages | 3e gold : descend + IM + pap/dos/brasse/crawl (2000m), taguée mixte uniquement. Migration `20260803155500_session_template_qualite_4nages.sql`. | ✅ |
| 2026-08-03 | Gold échelle 300-200-100 | 4e gold : échelle ×2 + CD miroir (2700m), ok eau_libre. Migration `20260803160000_session_template_echelle_300.sql`. | ✅ |
| 2026-08-03 | Gold volume 150 pull | 5e gold : 12×150 pull→mix→free + drill 3 points (3000m). Migration `20260803160500_session_template_volume_150.sql`. | ✅ |
| 2026-08-03 | Gold IM build | 6e gold : qualité 4 nages / build (2400m), mixte only. Migration `20260803161000_session_template_im_build.sql`. | ✅ |
| 2026-08-03 | Gold symétrie pull | 7e gold : miroir kick/free/pull (3000m). Migration `20260803161500_session_template_symetrie_pull.sql`. | ✅ |
| 2026-08-03 | Gold best average | 8e gold : 4×50 best average + 200 ×3 (2200m). Migration `20260803162000_session_template_best_average.sql`. | ✅ |
| 2026-08-03 | Gold 10×100 BA | 9e gold : 10×100 best average + WU neg-split (3000m). Migration `20260803162500_session_template_10x100_ba.sql`. | ✅ |
| 2026-08-03 | Gold finger trail | 10e gold : traînée doigts + 8×100 dégressif (1700m). Migration `20260803163000_session_template_finger_trail.sql`. | ✅ |
| 2026-08-03 | Gold 200/pull/godilles | 11e gold : 200+pull+kick ×2, Catch Scull→godilles (2200m). Migration `20260803163500_session_template_200_pull_godilles.sql`. | ✅ |
| 2026-08-03 | Gold échelle effort | 12e gold : 200→50 %effort ×2 (2200m). Migration `20260803164000_session_template_echelle_effort.sql`. | ✅ |
| 2026-08-03 | Gold pyramide 400 | 13e gold : pyramide symétrique 400 (3600m). Migration `20260803164500_session_template_pyramide_400.sql`. | ✅ |
| 2026-08-03 | Gold race pace choice | 14e gold : allure course au choix + IM (3000m), mixte. Migration `20260803165000_session_template_race_pace_choice.sql`. | ✅ |
| 2026-08-03 | Gold pyramide 4 nages | 15e gold : Fly↔Free miroir (2100m + RAC ajouté). Migration `20260803165500_session_template_pyramide_4nages.sql`. | ✅ |
| 2026-08-03 | Gold palmes+plaquettes | 16e gold : 200/pull/50s matériel ×2 (2600m). Migration `20260803170000_session_template_palmes_plaquettes.sql`. | ✅ |
| 2026-08-03 | Gold volume 4 nages | 17e gold : couples pap/dos/brasse (3400m), mixte. Migration `20260803170500_session_template_volume_4nages.sql`. | ✅ |
| 2026-08-03 | Arthur tri S3–S4 | 6 séances coaché triathlon (construction volume + 4N + seuil intro + bricks run). Migration `20260803171500_session_templates_arthur_tri_s3_s4.sql`. | ✅ |
| 2026-08-03 | Arthur OW S6–S7 | 6 séances coaché eau libre (volume 5900m + décharge 4200m). Migration `20260803172000_session_templates_arthur_ow_s6_s7.sql`. | ✅ |
| 2026-08-03 | Banque live + wire | `session_templates` en prod (18 seed + 29 gold). App charge la banque ; confirmé eau_libre/mixte → Arthur gold, sinon JS. | ✅ |
| 2026-08-03 | Force regen v29 | Demande Arthur : `PLAN_VERSION` 29 + `FORCE_PLAN_REGEN=true` — overwrite **tous** les plans (progression écrasée) pour appliquer la banque. Remettre `FORCE_PLAN_REGEN=false` au prochain bump. | ✅ |
| 2026-08-03 | Profil goûts client | Retours séance/hebdo → scores EMA (`user-taste.js`) persistés `user_taste_profile` + tables `session_feedback` / `week_feedback`. Générateur biaisé (volume, intensité, éducatifs, focus). Soft caps — périodisation COSD prioritaire. | ✅ |
| | | *Ajouter ici chaque nouvelle correction* | |

### Format pour une nouvelle ligne

```
| YYYY-MM-DD | BNSSA S3 / niveau sportif / … | Description précise de ce qui était faux et ce qu’il faut faire | ✅ ou 🔄 |
```

---

## Erreurs récurrentes à ne **pas** refaire

1. **BNSSA** : oublier le volet sauvetage (sortie bassin, enchaînement, chrono 100 m examen).
2. **Découverte** : pas de seuil/vitesse précoce ni jargon cru. Éducatifs = **flèche + grand chien** (+ palmes/tuba) seulement — pas de catch-up/roulis/virages. **Ne pas demander de T100.**
2b. **Matériel** : pas de matos aléatoire sur le titre ; jamais **pull-buoy + palmes**.
3. **Eau libre + niveau Performance** : appliquer le bloc `isAdv` « Alternée 4 nages » plein de brasse — utiliser séances crawl/sighting (`usePoolIMBlock`).
4. **Eau libre** : écrire uniquement des `8×100m` bassin sans consigne sighting / lieu.
5. **Allures** : donner des récup fixes identiques pour tous sans tenir compte de `pace100` quand il est renseigné. Ne plus demander ni utiliser un temps 400 m comme référence — **T100 seul**, départ dans l'eau.
6. **Distance** : séance qui annonce 2000 m mais détail qui ne tombe pas juste (vérifier avec `calcSessionDistance`). **Feedback hebdo** : ne jamais patcher seul `s.distance` sans `details`/`duration` — régénérer ou scale cohérent.
7. **Sportif / Performance** : mêmes volumes et mêmes intitulés — doit rester différencié.
8. **Vocabulaire** : dire **godilles**, pas « sculling » (anglicisme) dans les consignes de séance. Sur débutant : expliquer les éducatifs (grand/petit chien) plutôt que le terme seul.
9. **Éducatifs** : ne pas saturer les séances de grand/petit chien — privilégier **jambes** et nage. MySWYM = générateur, pas école. **Jamais** deux blocs jambes d’affilée (ex. 400m jambes + 8x50 jambes) — éducatif puis jambes.
10. **Migration plan** : incrémenter `PLAN_VERSION` n'autorise **pas** une régénération complète des semaines — risque d'effacer la progression. Migration légère (previewWeeks, version) uniquement. **Exception** : force regen explicite demandée par Arthur (ex. v14, aucun user actif).
12. **Nager & Progresser** : ne pas regenerer un plan multi-semaines ni demander la fréquence — c’est une **boucle séance unique** (Terminer/Abandonner → suivante).

---

## Banque de séances (Supabase)

Table `session_templates` — templates coach au format Arthur (`details` + `blocks` départ/technique/corps/RAC).

- **V1** : 18 séances confirmé seedées (`source=js_ow_base`, `quality=seed`). Lecture publique RLS (`active=true`).
- **Runtime** : confirmé eau_libre/mixte charge la banque Arthur gold via `session-templates-store.js` (fallback `OW_BASE_SESSIONS` si cache vide). Endurance confirmé reste JS.
- **Alimentation** : Arthur envoie des séances (Excel / texte) → insert/update en base (`source=arthur_excel` ou `coach_approved`, `quality=gold`).
- **Suite** : scaling volume DB par niveau ; `programming_rules` ; sync historique migrations CLI.

## Pistes produit (pas encore codées)

- Brancher `generatePlan` / banque confirmé sur `session_templates` (fallback JS).
- Table `programming_rules` (`coach_rules`) + application dans `generatePlan`.
