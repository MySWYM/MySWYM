# Étape K — Persistance sportive Supabase

> **Supabase = mémoire. Sports Engine = cerveau.**  
> Ne modifie pas les règles sportives (composeur, quality gate, taper, strategy).

---

## 1. AUDIT — EXISTANT (2026-08-08)

### Ce qui est déjà persistant

| Donnée | Où | Rejoué par le moteur au reload ? |
|--------|-----|----------------------------------|
| Multi-plans + semaines + séances | `user_plans.plans_json` (+ localStorage) | Oui (blob) |
| `completed` / `skipped` | dans `plans_json` | Oui |
| `session.feedback` / `week.feedback` | dans `plans_json` | Partiel (flags) |
| `volumeAdj` | `plan.volumeAdj` dans blob | **Oui** (charge) |
| `_weeklyAdaptation` | dernier objet sur le plan | Partiel (1 seul) |
| Taste scores | `user_taste_profile` | Oui (goûts, pas charge) |
| Miroir feedback SQL | `session_feedback`, `week_feedback` | **Non** (insert-only analytics) |
| Accès / Stripe | `user_access_state` | N/A coaching |
| Banque coach | `session_templates` | Contenu, pas historique user |

### Uniquement local / éphémère

| Donnée | Problème |
|--------|----------|
| `_engineHistory` | Souvent reconstruit pour **une** regen `adjustPlan`, **pas toujours réécrit** sur le plan |
| `raceTarget` structuré | Résolu en mémoire depuis profil ; pas de table |
| `raceResult` | Stub moteur ; pas persisté |
| `capacityDimensions` historique | Au mieux dernier snapshot sur plan |
| `postRaceRecovery` | Flag dans history éphémère |
| `painProtection` | Flag history / injuryStatus profil |
| Feedback 4 niveaux | SQL collapse `too_easy`→`easy`, `too_hard`→`hard` |

### À migrer (faits → tables K)

```text
sport profile (niveau, objectif, freq, matos, bassin, nage)
planned sessions (status, training_distance, payload)
session_feedback brut (too_easy|good|hard|too_hard + pain)
weekly_adaptations (historique décisions)
capacity_snapshots (historique)
race_targets / race_results
post_race_recovery
```

### Doit rester calculé (moteur)

```text
effectivePhase, effectiveWeekVolume, Strategy, QualityToDevelop,
Adaptation (décision), SessionBrief, Composer, Quality Gate
```

### Relation `volumeAdj` ↔ `weeklyAdaptation` (déjà Étape I)

```text
App cumule volumeAdj *= volumeMul  (persisté sur le plan)
Orchestration : resolveEffectiveWeekVolume utilise volumeAdjLegacy
              adaptationMul = null  (pas de double ×)
weekly_adaptations = historique / rationale / levier / safety
                   ≠ 2e multiplicateur de charge
```

---

## 2. Source de vérité (cible K)

| Donnée | Source |
|--------|--------|
| Profil sportif | Supabase `sport_profiles` (+ miroir `plans_json.profile`) |
| Feedback brut | Supabase `session_feedback` (étendu) |
| Séances planifiées / réalisées | `plans_json` + `planned_sessions` |
| Race target / result | `race_targets` / `race_results` |
| Adaptation historique | `weekly_adaptations` |
| Capacity historique | `capacity_snapshots` |
| Post-race | `post_race_recovery` |
| Phase / volume final / strategy / séance | **moteur** |
| Charge persistante | `plan.volumeAdj` (blob) — facts d’adaptation en table |

### Compat `_engineHistory`

```text
reload → loadSportsFacts(user, planId)
      → rebuildEngineHistory(facts)
      → profile._engineHistory = view
      → buildCoachPlanWeeks (inchangé)
```

Ne pas supprimer `_engineHistory` du blob tant que la migration n’est pas vérifiée.

---

## 3. Tables K

Voir migration `supabase/migrations/20260808120000_sports_engine_persistence.sql`.

---

## 5. Rapport final Étape K

### Schéma

```text
auth.users
 ├─ sport_profiles (1:1)
 ├─ user_plans.plans_json (blob compat)
 ├─ planned_sessions (N)
 ├─ session_feedback (N) ← étendu difficulty/pain
 ├─ weekly_adaptations (N)
 ├─ capacity_snapshots (N)
 ├─ race_targets (N, active)
 ├─ race_results (N)
 └─ post_race_recovery (N)
```

### volumeAdj vs weeklyAdaptation

```text
feedback too_hard
→ decideAdaptAction → volumeMul=0.94
→ plan.volumeAdj *= 0.94          ← CHARGE (persistée blob)
→ weekly_adaptations.insert(...)  ← HISTORIQUE (rationale/levier)
→ reload → rebuildEngineHistory
→ buildCoachPlanWeeks(profile.volumeAdj=0.94)
→ orchestration lit volumeAdj UNE fois (adaptationMul=null)
```

### E2E (test K12 local)

```text
S1 volumeAdj=1 → week2 vol ≈ 6150
feedback too_hard → volumeAdj=0.88 + adaptation REDUCE
reload view → buildCoachPlanWeeks
S2 vol ≈ 3700  (< S1) ✓
```

### Appliquer la migration

```bash
supabase db push
# ou : supabase migration up
```

### Critère de sortie

Un utilisateur peut fermer MySWYM après `too_hard`, revenir plus tard : `volumeAdj` + `_engineHistory` reconstruite suffisent pour continuer le coaching.
