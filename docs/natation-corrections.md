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
- Distances **multiples de la longueur de bassin** (`snap`, `pool` 25 ou 50 m).
- Chaque séance structurée : **échauffement** + **retour calme** (sauf séances eau libre spécifiques).
- Premium : intervalles en `D…` (départ) + allure cible si `pace100` renseigné. Gratuit : `R…` (récup simple) **sans** tags `@mm:ss` d'allure.
- Allures cibles / step onboarding « Tes allures cibles » / vidéos Instagram sous séance : **Premium only**.
- Moteur coaching : à côté de chaque `(Z1)`…`(Z4)`, afficher `@mm:ss-mm:ss` calculé depuis `pace100`/`pace400` — **uniquement Premium** (gratuit = zone seule). Inclut départ et fin, pas seulement le corps.
- Profil Premium : carte **Évolution des temps** (courbe projetée sur les semaines + points saisis via `paceHistory`). Gratuit = teaser verrouillé.
- Coefficients allure si `pace100` : easy ×1,35 · seuil ×1,08 · sprint ×0,95.
- Rotation des variantes via `weekIdx` — ne pas dupliquer la même variante deux semaines de suite sans raison.

### Niveaux

- **MySWYM = générateur de séances** (pas école de natation / correction de geste).
- **Bloc milieu** : privilégier **jambes** et nage appliquée. **Grand/petit chien** = rare (≈1 séance sur 8), pas dominant. Trop d’éducatifs fait fuir.
- **Focus jambes** : toujours **éducatif court puis série jambes** — jamais enchaîner deux blocs battements (titre + détail).
- **Même structure** départ → technique → corps → fin ; **volume** selon niveau : découverte ≈0.55 · régulier ≈0.8 · sportif ≈1.0 · performance ≈1.25 (triathlon perf ≈1.35).
- **Découverte** : wording allégé (Z1→facile, R15→repos) uniquement — pas de tutoriel technique.
- **Triathlon / eau libre** : niveau « découverte » **interdit** à l’onboarding (déjà en UI).
- **Sportif vs performance** : volumes clairement distincts via le multiplicateur.
- **Inter / confirmé** : format Arthur Excel (Z1–Z4, R15'', Cr/Dos).

### Périodisation (volume + difficulté)

- **Montée volume** : semaine N ≤ semaine N−1 × **1,10** (réellement appliqué via `weekScale` dans le générateur).
- **Décharges** : ~toutes les 4 semaines (−30 %) + phases affûtage.
- **Difficulté** : zones qui montent par mésocycle (Z1–Z2 foncier → Z3–Z4 spécifique).
- **Semaines test** (`phase: "test"`) : chronos 100/200/400 m pour mesurer l’évolution — 1 à 2 selon la durée du plan (après base / après développement).
- **Affûtage** : 1 semaine dès 6 sem. de plan, **2 semaines** dès 10 sem. Volume ↓, touches vitesse, puis semaine compétition.
- Progression « Nager & Progresser » (12 sem.) : base → **test** → développement → **test** → peak → bilan.

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
- Feedback hebdo (`easy` / `ok` / `hard`) : ajuste le **volume** des semaines futures (`adjustPlan`), pas le texte des séances.

---

## Historique des corrections

| Date | Contexte | Correction | Statut |
|------|----------|------------|--------|
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
| 2026-06-29 | Eau libre 5k/10k S1–S3 | Banque `OW_BASE_SESSIONS` (9 archétypes signature coach) en phase base semaines 1–3 : éducatifs lents → Z2 nage appliquée → sensation/RAC. Scaling régulier/sportif/perf. `OPEN_WATER_PATTERNS`. `PLAN_VERSION` → 12 | ✅ |
| | | *Ajouter ici chaque nouvelle correction* | |

### Format pour une nouvelle ligne

```
| YYYY-MM-DD | BNSSA S3 / niveau sportif / … | Description précise de ce qui était faux et ce qu’il faut faire | ✅ ou 🔄 |
```

---

## Erreurs récurrentes à ne **pas** refaire

1. **BNSSA** : oublier le volet sauvetage (sortie bassin, enchaînement, chrono 100 m examen).
2. **Découverte** : reprendre des séances « seuil » ou des départs serrés type confirmé. Ni jargon cru (Z1, RAC, R15'' sans explication) sur le moteur coaching débutant.
3. **Eau libre + niveau Performance** : appliquer le bloc `isAdv` « Alternée 4 nages » plein de brasse — utiliser séances crawl/sighting (`usePoolIMBlock`).
4. **Eau libre** : écrire uniquement des `8×100m` bassin sans consigne sighting / lieu.
5. **Allures** : donner des récup fixes identiques pour tous sans tenir compte de `pace100` quand il est renseigné.
6. **Distance** : séance qui annonce 2000 m mais détail qui ne tombe pas juste (vérifier avec `calcSessionDistance`).
7. **Sportif / Performance** : mêmes volumes et mêmes intitulés — doit rester différencié.
8. **Vocabulaire** : dire **godilles**, pas « sculling » (anglicisme) dans les consignes de séance. Sur débutant : expliquer les éducatifs (grand/petit chien) plutôt que le terme seul.
9. **Éducatifs** : ne pas saturer les séances de grand/petit chien — privilégier **jambes** et nage. MySWYM = générateur, pas école. **Jamais** deux blocs jambes d’affilée (ex. 400m jambes + 8x50 jambes) — éducatif puis jambes.
10. **Migration plan** : incrémenter `PLAN_VERSION` n'autorise **pas** une régénération complète des semaines — risque d'effacer la progression. Migration légère (previewWeeks, version) uniquement. **Exception** : force regen explicite demandée par Arthur (ex. v14, aucun user actif).
11. **Confirmé / inter** : ne pas appliquer le wording débutant (format Arthur Excel doit rester).

---

## Pistes produit (pas encore codées)

- Table `coach_rules` en base + application dans `generatePlan` (mémoire globale app).
- Feedback **par séance** (pas seulement fin de semaine) pour affiner les templates.
