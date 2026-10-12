# Parcours conversion mySWYM

Prototype interactif : **`/prototype/conversion`**

Module code : `src/conversion/`

---

## Modèle live (octobre 2026) : essai 7j avec carte, puis prélèvement

```
Checkout Stripe / App Store
  → essai Premium 7 jours (avec carte, 1× par compte)
  → accès complet (plans, séances, adaptation)
  → fin d’essai : prélèvement sauf résiliation ; sans abo = app gelée
```

**Pendant l’essai / Premium :** séances complètes, allures, `adjustPlan`, multi-plans, coach card.  
**Sans abo (essai annulé / expiré) :** overlay de gel — aucun plan, aucune séance.

Entitlements : `src/lib/access.js` (`subscription_status` trial/active/canceled/expired).  
Essai sans carte : désactivé (`shouldGrantCardlessTrial` → false).  
Insights paywall : `src/lib/coach-insights.js`.

### Pricing

| Offre | Prix |
|-------|------|
| Essai | 7 jours · avec carte · puis prélèvement |
| Mensuel sans engagement | 8,99€ / mois |
| Annuel | 69,99€ / an · paiement en 1 fois · pas de remboursement au prorata (hors cas légaux) |

Offre engagement 12 mois (4,99€) retirée (legacy Stripe uniquement).

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

Tokens alignés essai avec carte (`trialRequiresCard: true`, `freeWeeks: 0`).  
Écrans Soft/Hard paywall, celebration, habit home — **pas** le shell production (`App.jsx`).

---

## Décisions (obsolète → remplacé)

| Ancien freemium | Live |
|-----------------|------|
| 4 semaines gratuites | 0 semaine utilisable sans essai |
| Essai sans carte | Essai avec carte (Stripe / Apple) |
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
4. ✅ **Essai 7j avec carte** + gel si pas d’abo
5. ✅ Insights coach pré-checkout + CoachCard monté (Premium)
6. ✅ Paywalls contextuels (`getUpgradeCopy`)
7. ✅ Emails essai J1/J3/J6 (`scripts/setup-resend-automations-v3-trial-drip.mjs` → `npm run email:setup-trial-drip`)
8. ✅ Cron J-1 (`marketing-cron` + `.github/workflows/marketing-cron.yml`)
9. ⬜ Fatigue score + calendrier intelligent (P1)

## Timeline emails essai

| Jour | Trigger | Contenu |
|------|---------|---------|
| J0 | Stripe checkout | Confirmation abo + event `trial.started` |
| J+1 | Resend automation | Coche 1ʳᵉ séance + feedback |
| J+3 | Resend automation | Adaptation coach / ressenti |
| J+6 | Resend automation | Soft convert (garde ton coach) |
| J-1 | `marketing-cron` → `trial.ending_soon` | Urgence « demain fin d’essai » |

DA emails : header dark `#000514` + CTA `#006bfd` (aligné `public.css`). Republish templates Resend : `npm run email:republish`.

Prix dans les mails : `8,99 €/mois sans engagement · 69,99 €/an` (`src/lib/pricing.js`).

Si l’utilisateur annule pendant le délai → `subscription.canceled` stoppe le drip (timeout only).
