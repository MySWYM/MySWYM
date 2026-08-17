# Parcours conversion mySWYM

Prototype interactif : **`/prototype/conversion`**

Module code : `src/conversion/`

---

## Modèle live (août 2026) — essai 7j sans carte, puis gel

```
Création de compte
  → essai Premium 7 jours (sans carte, 1× par compte)
  → accès complet (plans, séances, adaptation)
  → J+7 : app gelée (rien de visible) jusqu’à abonnement Stripe payant
```

**Pendant l’essai / Premium :** séances complètes, allures, `adjustPlan`, multi-plans, coach card.  
**Après l’essai sans abo :** overlay de gel — aucun plan, aucune séance.

Entitlements : `src/lib/access.js` (`subscription_status` trial/active/canceled/expired).  
Grant essai : `sync-subscription` → `resolveAccessWithoutStripeSub`.  
Insights paywall : `src/lib/coach-insights.js`.

### Pricing

| Offre | Prix |
|-------|------|
| Essai | 7 jours · sans carte · puis gel |
| Mensuel | 4,99€ / mois |
| Annuel | 39,99€ / an · pas de remboursement |

### Paywalls contextuels (`UpgradeModal` softContext)

| Context | Moment |
|---------|--------|
| `trial_required` | Génération / action bloquée |
| `session_locked` | Clic séance / checkbox / détails |
| `trial_expired` | Fin d’essai |
| `after_first_session` | Legacy soft (inatteignable sans Premium pour compléter) |
| `feedback_adjust` / `analysis` | Prévus pour teasers feedback / stats |

---

## Prototype `/prototype/conversion`

Tokens alignés essai sans carte (`trialRequiresCard: false`, `freeWeeks: 0`).  
Écrans Soft/Hard paywall, celebration, habit home — **pas** le shell production (`App.jsx`).

---

## Décisions (obsolète → remplacé)

| Ancien freemium | Live |
|-----------------|------|
| 4 semaines gratuites | 0 semaine utilisable sans essai |
| Soft après 1ʳᵉ séance | PlanReady + skeleton lock |
| Hard gate semaine 5 | Supprimé |
| Freq free ≤ 3 | 1–5 sélectionnables ; exécution = Premium |

Constantes `FREE_WEEKS_LIMIT` / `FREE_FREQ_LIMIT` dans `App.jsx` = remnants, ne gate plus l’UX.

---

## Design tokens (prototype)

Voir `tokens.ts` + `conversion.css`.

- Fond `#f5f7fb` · Ink `#0f1419` · Blue `#355da3`
- Display **Barlow Condensed** · Body **Lexend**
- Préfixe Tailwind : `cv:`

---

## Intégration progressive

1. ~~Tester le prototype `/prototype/conversion`~~
2. ✅ Remplacé l’ouverture auto du paywall post-génération
3. ✅ Soft paywall legacy (code présent, flux live = trial)
4. ✅ **Essai 7j sans carte** + gel total après expiration
5. ✅ Insights coach pré-checkout + CoachCard monté (Premium)
6. ✅ Paywalls contextuels (`getUpgradeCopy`)
7. ✅ Emails essai J1/J3/J6 (`scripts/setup-resend-automations-v3-trial-drip.mjs` → `npm run email:setup-trial-drip`)
8. ✅ Cron J-1 (`marketing-cron` + `.github/workflows/marketing-cron.yml`)
9. ⬜ Fatigue score + calendrier intelligent (P1)

### Timeline emails essai

| Jour | Trigger | Contenu |
|------|---------|---------|
| J0 | Stripe checkout | Confirmation abo + event `trial.started` |
| J+1 | Resend automation | Coche 1ʳᵉ séance + feedback |
| J+3 | Resend automation | Adaptation coach / ressenti |
| J+6 | Resend automation | Soft convert (garde ton coach) |
| J-1 | `marketing-cron` → `trial.ending_soon` | Urgence « demain fin d’essai » |

Si l’utilisateur annule pendant le délai → `subscription.canceled` stoppe le drip (timeout only).
