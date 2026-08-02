# Parcours conversion mySWYM

Prototype interactif : **`/prototype/conversion`**

Module code : `src/conversion/`

---

## Nouveau flow (vs actuel)

```
Welcome (valeur émotionnelle)
  → Objectif
  → Niveau + bassin
  → Fréquence (jusqu’à 3× gratuit, 4–5× signal Premium sans bloquer)
  → Plan Reveal (aha moment — timeline S1–S4 vs suite)
  → Première séance (détail complet)
  → Accueil habit (streak, ring, prochaine séance)
  → [après 1ère séance] Soft paywall dismissible
  → … semaines 1–4 …
  → Hard paywall honnête à la semaine 5
```

**Changement clé vs aujourd’hui :** ne plus ouvrir `UpgradeModal` 1,2 s après la génération du plan.

---

## Décisions freemium

| Paramètre | Recommandation | Raison |
|-----------|----------------|--------|
| Semaines gratuites | **4** | Habitude ~21 j ; 4 semaines = un « chapitre » |
| Fréquence gratuite | **3×** (pas 2) | 2× handicape le loop ; 3× = vrai entraînement |
| Soft paywall | Après **1ère séance validée** | Valeur ressentie |
| Hard paywall | Accès **semaine 5+** | Frontière claire, pas de dark pattern |
| Fréquence 4–5× à l’onboarding | Sélectionnable, plan généré, exécution free plafonnée à 3 | Transparence Runna-like |

### Gratuit

- 4 semaines personnalisées
- Jusqu’à 3 séances / semaine
- Suivi, badges, séries, retours
- Intervalles en `R…`

### Premium

- Plan jusqu’à l’événement
- 4–5× / semaine
- Allures `D…` + T100
- Ajustement auto feedback
- Multi-plans, copie, vidéos IG, courbe allures

---

## Design tokens

Voir `tokens.ts` + `conversion.css`.

- Fond `#f5f7fb` · Ink `#0f1419` · Blue `#355da3`
- Display **Barlow Condensed** · Body **Lexend**
- Spacing 4 / 8 / 16 / 24 / 32 / 48
- Radius 10 / 14 / 20 / 28
- Motion : ease `[0.22,1,0.36,1]`, springs snappy/soft, `prefers-reduced-motion`

Préfixe Tailwind : `cv:` (n’impacte pas les styles legacy d’`App.jsx`).

---

## Notifications

Banque dans `notifications.ts` (reminder, streak protect, week complete, comeback, milestone, soft premium, race countdown).

---

## Intégration progressive

1. ~~Tester le prototype `/prototype/conversion`~~
2. ✅ Remplacé l’ouverture auto du paywall post-génération dans `App.jsx`
3. ✅ `FREE_FREQ_LIMIT` 2 → 3
4. ✅ Soft paywall après 1ʳᵉ séance (`myswym_soft_paywall_v1`, copy `after_first_session`)
5. Brancher célébration post-séance dédiée (optionnel) + hard paywall semaine 5 UX
