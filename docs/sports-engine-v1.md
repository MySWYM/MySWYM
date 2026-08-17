# Moteur sportif MySWYM V1

Référence produit : spécification coach adaptatif (niveau × objectif × phase × historique).

## Principes

1. **Niveau** = ce que le nageur peut absorber  
2. **Objectif** = ce qu’il doit développer  
3. **Phase** = quand le développer  
4. **Historique** = comment adapter  

Le moteur **décide** (rule-based). Pas d’IA pour inventer la charge.

## Objectifs V1

| Objectif V1 | IDs onboarding |
|-------------|----------------|
| `nager_progresser` | `progression` / session-loop |
| `reprendre` | `reprendre`, `perte_de_poids` |
| `course_piscine` | `competition_maitre`, `course_piscine` |
| `eau_libre` | `open_water_*` |
| `triathlon` | `triathlon_*` |
| `diplome` | BNSSA / BPJEPS / … — **hors moteur V1** |

## Module code

`src/lib/sports-engine/` — orchestration.  
Pont : `swim-plan-bridge.js`. Blocs Arthur : `swim-session-generator.js`. Banque : `session-templates-store.js`.

## Boucle

Profil → capacité → **week orchestration** (phase effective + volume final) → rôles → brief → **hard constraints** → composeur → **quality gate** → feedback → adaptation → semaine suivante.

### Étape I — Single Source of Truth

```text
weekStart → daysToComp → effectivePhase / taperStage
BASE × capacity × volumeAdj × phase|taper = effectiveWeekVolume
→ sessionTargets → composer (taperAppliedUpstream, pas de 2e ×)
```

- `trainingDistance` (Race/REST = 0) pour `prevWeekDistance`
- H : `weeklyAdaptation` (levier/sécurité) + `volumeAdj` (charge persistante, sans double)
- Taste **après** WeekRoles (garde-fous)
- Douleur → intent + zone
- `engineWhy` = valeurs effectives

Tests : `npm run test:orchestration` (inclus dans `test:composer:all`).

### Étape J2 — Composer Quality Gate

```text
SessionBrief → HARD CONSTRAINTS (taper/pain/continuous/reps/4N)
→ compose → validateComposedSession
→ FAIL → recomposition (≤3) → minimal safe
→ FinalSession
```

- Contraintes taper **dérivées** de `taperLoad` (`taperConstraintsFromLoad`) — pas un 2e moteur
- Pain → `maxIntensity=Z2`, zéro Z3/Z4 (brief + compose + validation + Arthur)
- Découverte : `maxContinuous` sur **tous** les blocs (départ/corps/fin)
- Interdit : `NxM` rest=0 (sauf continuous), `reps > maxRepsPerSet` (~12), 33×50
- 4N : share minimale corps/tech selon niveau
- Arthur : même gate ; rejet → fallback composeur
- Sous-volume préférable à séance absurde

Modules : `composer-constraints.js`, `composer-quality-gate.js`  
Tests : `npm run test:quality-gate` (Q1–Q15, inclus dans `test:composer:all`)  
Gold : `docs/_audit-30-seances-apres-j2.txt`, `docs/_audit-j2-avant-apres.txt`

### Étape K — Persistance sportive

> Supabase = mémoire. Sports Engine = cerveau.

- Migration : `supabase/migrations/20260808120000_sports_engine_persistence.sql`
- Module : `src/lib/sports-persistence/` (`rebuildEngineHistory`, dual-write feedback/adaptations)
- Doc : `docs/sports-persistence-k.md`
- Charge : `volumeAdj` persisté ; `weekly_adaptations` = historique (pas de 2e ×)
- Compat : `_engineHistory` reconstruit au reload ; blob `plans_json` conservé
- Tests : `npm run test:persist`

## Race Target → Race Gap → Quality To Develop

Chaîne **haut de funnel** (objectif chrono → écart → qualité → rôles).  
Implémentée pour **Sportif + `course_piscine`** uniquement. Performance non branché.

```text
RaceTarget → RaceGap → QualityToDevelop → WeekRoles → SessionBrief → Session
```

### RaceTarget

Ce que le nageur veut atteindre. **Jamais inventé.**

```js
{
  distance: 200,
  stroke: "crawl",
  targetTimeSec: 120,
  competitionDate: "...",
  source: "user" | "recent_best" | "validated_test" | "t100_css" | "coach"
}
```

Sources acceptées : `profile.raceTarget`, champs plats `raceDistance` + `raceTargetTimeSec`, test validé promu (`validatedTestAsTarget`).  
Module : `race-target.js` (`resolveRaceTarget`, `normalizeRaceTarget`).

### RaceGap

Écart performance actuelle ↔ cible.

```js
// OK
{ status: "ok", targetTimeSec, currentTimeSec, gapSec, gapPct, direction, confidence, evidence }
// Sans chrono courant
{ status: "insufficient_data", reason: "no_current_time"|"no_race_target", targetTimeSec }
```

Le gap n’est pas que temporel : `evidence` porte paces / splits pour le diagnostic.  
Module : `race-gap.js` (`computeRaceGap`). Projection T100 **désactivée par défaut** (`allowT100Projection`).

### QualityToDevelop

```js
{
  quality: "aerobic_capacity" | "threshold" | "speed" | "race_pace"
         | "technical_efficiency" | "pacing" | "specific_endurance" | "specific_speed",
  confidence: "high" | "medium" | "low",
  reason: "...", // DEV
  evidence: [...]
}
```

Si les données ne permettent pas d’identifier le facteur limitant → **`aerobic_capacity` / `low`** (prudent), jamais un diagnostic affirmatif sans preuve.

Niveaux de données :

| Niveau | Données |
|--------|---------|
| 1 | chrono cible + meilleur récent |
| 2 | multi-chronos 50/100/200/400 |
| 3 | T100 / CSS |
| 4 | feedback séances |

Module : `race-quality.js` (`analyzeRaceWeek`, `resolveQualityToDevelop`).

### Intégration rôles (Sportif course_piscine)

`sportifWeekRoles` : si `RaceTarget` + chrono courant → `qualityToDevelop` ajuste A/B/C **après** les défauts phase/objectif.

Exemples :

| Quality | B | C |
|---------|---|---|
| `threshold` | seuil | endurance + touches |
| `specific_endurance` | seuil / allure_specifique | endurance (+ peak plus spécifique) |
| `specific_speed` | vitesse (si capacité OK) | endurance + touches contrôlées |
| `race_pace` / `pacing` | allure_specifique | endurance + touches |
| `aerobic_capacity` | seuil si conf≥medium | endurance + touches |

**Données insuffisantes** → rôles course_piscine existants inchangés.

Debug DEV : `roles.raceAnalysis` + `role.raceDevExplain` (pas d’UI user pour l’instant).

### Priorité des signaux

1. sécurité / contraintes (douleur, reprise)  
2. phase (test, taper, peak…)  
3. capacité  
4. objectif  
5. `qualityToDevelop`  
6. strokeFocus  
7. matériel  
8. préférence de format  

Une qualité ne dépasse jamais les limites de capacité (ex. `specific_speed` → seuil si capacité faible).

### Non-régression

Découverte, Régulier, Sportif hors `course_piscine`, Performance : **inchangés** par cette chaîne.

Tests : `npm run test:race` · inclus dans `test:composer:all`.

## Performance Strategy (Étape F)

```text
RaceTarget → RaceGap → QualityToDevelop → PerformanceStrategy → WeekRoles → Session
```

`QualityToDevelop` = ce qui **limite** probablement.  
`PerformanceStrategy` = ce que le plan **décide de développer maintenant** (phase + échéance + capacité).

```js
{
  phase, primaryQuality, secondaryQuality,
  confidence, rationale, priority,
  horizonBand, weeksToComp, limitingStroke, raceAnalysis, devExplain
}
```

Modules : `performance-strategy.js`, `performance-week-roles.js`.  
Réutilise les modules Race — **pas** de 2e diagnostic.

| Distance | Qualités typiques |
|----------|-------------------|
| ≤100 | speed, specific_speed, threshold, race_pace, pacing, tech |
| 200 | threshold, specific_endurance, race_pace, pacing |
| ≥400 | aerobic, threshold, specific_endurance, race_pace — **Z4 limité** |

| Objectif | Qualités |
|----------|----------|
| eau_libre | aerobic, specific_endurance, open_water_specificity, speed_change… |
| triathlon | aerobic, race_pace, pacing… |
| course_piscine | selon distance |

Échéance → taper réel (Étape G) : `far` (>8w) · `build_specific` (4–8) · `specific_dominant` (2–4) · `pre_race` (<2 → **TAPER** via `taper-load.js`).

Phases fin de prep : `DEVELOPMENT → SPECIFIC → TAPER → RACE`.

| Stage | Jours | Charge typique |
|-------|-------|----------------|
| s3 | 21–27 | vol ≈ normal, spécifique |
| s2 | 14–20 | vol ↓, touches race pace |
| s1 | 7–13 | vol ↓↓, intensité courte |
| race_week | 1–6 | activation / repos selon J-x |
| race_day | 0 | `RACE` (volume entraînement = 0) |

Modèle : `{ volumeFactor, densityFactor, intensityRetention, specificityRetention, recoveryFactor }` — **pas** un ×0.5 uniforme. Suivre `absoluteMetersByZone` en plus des %.

Arthur : refusé si volume/phase incompatibles (`arthurFitsTaper`). Post-race : stub `raceCompleted` / `raceResult` seulement (pas d'adaptation long terme).

Tests : `npm run test:performance` · `npm run test:taper`.

## Composeur de séances (Étape A→B)

Flux : `SessionBrief` → `BlockSplit` → sélection inventaire → séries structurées → validation → `FinalSession`.

| Module | Rôle |
|--------|------|
| `session-brief.js` | Contrat WHY→HOW |
| `exercise-library.js` | Inventaire normalisé (~97 drills TECHNIQUE + départs/corps/fins) |
| `session-composer.js` | Remplit les 4 blocs ; volume = somme des séries (`volumeFromSets`) |
| `taper-load.js` | Charge taper / race week Performance |

- **Actif** : `decouverte` + `regulier` + `sportif` + **`performance`** (`SESSION_COMPOSER_ENABLED_LEVELS`)
- **Fallback** : `genererSemaineSessions` si échec — tag `COMPOSER_FALLBACK` (log DEV)
- **Déterministe** : même `seed` → même séance
- **Découverte** : aisance, continu max 50 m, flèche/grand chien ; jargon interne ≠ affichage (`user-facing.js`, ex. godille)
- **Régulier** : « apprendre à s'entraîner » — corps ~55–65 %, `setFormat` variés, repos variable (`restSecFor`), max 1 `qualitySession`/semaine (`regulierWeekRoles`)
- **Sportif** : « s'entraîner pour progresser » — polarisation Z1/Z2 majoritaire, 1 qualité (seuil/vitesse/allure), Z4 limité, allures `@mm:ss` seulement si Premium+T100, tests périodiques, Arthur prioritaire OW/tri si compatible (`arthur-scale` scale les reps)
- **Performance (Étape F+G)** : `PerformanceStrategy` → `taperLoad` si date course → `performanceWeekRoles` → Arthur si compatible → composeur. **Pas** « plus de Z4 ». Taper = volume/densité ↓, intensité courte conservée, Race Day hors volume entraînement.
- **setFormat** : + `descending` · `race_pace` (Sportif) ; **pyramide** plafonnée ≤ 1000 m avec paliers visibles (jamais monolithe 1750 m Ironman)
- **sessionSpecificity** : general | stroke_focus | goal_specific | race_specific
- **Volume soft** : jamais gonfler artificiellement
- **Hors scope** : diplômes ; adaptation post-course long terme ; persistance historique complète

Tests :
- `npm run test:composer`
- `npm run test:composer:regulier`
- `npm run test:composer:sportif`
- `npm run test:race`
- `npm run test:performance`
- `npm run test:taper`
- `npm run test:composer:all`

## Garde-fous

- Diplômes inchangés  
- `mergePreservingProgress` / pas de regen silencieuse  
- Découverte : tout le catalogue d’éducatifs, pas T100, pas Z3/Z4/CSS/hypoxie  
- Matériel : ne jamais exiger un matos non déclaré (si inventaire renseigné)  
- Volume affiché = `volumeFromSets` (pas une cible décorative)
