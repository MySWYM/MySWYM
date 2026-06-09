# Mémoire natation — corrections & décisions

> **Source de vérité** pour le contenu des séances MySWYM.  
> L’agent doit **lire ce fichier avant** de modifier `SESSION_TEMPLATES` ou les patterns de plan.  
> **Après chaque correction d’Arthur** : ajouter une entrée datée ici (et mettre à jour `.cursor/rules/natation-seances.mdc` si règle durable).

---

## Règles durables (ne pas violer)

### Moteur & format

- Les séances sont générées dans `src/App.jsx` : `SESSION_TEMPLATES`, `PHASE_PATTERNS`, `generatePlan`, `PLAN_VERSION`.
- **Pas de LLM** pour générer les séances : logique déterministe uniquement.
- Distances **multiples de la longueur de bassin** (`snap`, `pool` 25 ou 50 m).
- Chaque séance structurée : **échauffement** + **retour calme** (sauf séances eau libre spécifiques).
- Premium : intervalles en `D…` (départ) + allure cible si `pace100` renseigné. Gratuit : `R…` (récup simple).
- Coefficients allure si `pace100` : easy ×1,35 · seuil ×1,08 · sprint ×0,95.
- Rotation des variantes via `weekIdx` — ne pas dupliquer la même variante deux semaines de suite sans raison.

### Niveaux

- **Découverte** : séances courtes, langage simple, fun, pas de seuil/vitesse agressif en phase base. Pas de jargon « CSS » sans explication.
- **Triathlon / eau libre** : niveau « découverte » **interdit** à l’onboarding (déjà en UI).
- **Sportif vs performance** : volumes et intensités **clairement distincts** (ne pas fusionner les deux profils).

### Objectifs spécifiques

- **BNSSA / tests pompiers** : séances orientées **examen** — répétitions 100 m, **simulations sauvetage** (sortie eau, enchaînement, marche), pas seulement de l’endurance crawl générique. `tests_pompiers` partage les templates `bnssa`.
- **BPJEPS AAN** : focus **400 m NL** (objectif < 7'40"), fractionné, régularité des temps — pas le même contenu que BNSSA.
- **Eau libre** : préfixer `📍 À faire en eau libre`, sighting, combinaison, repères — pas uniquement des reps bassin.
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
| | | *Ajouter ici chaque nouvelle correction* | |

### Format pour une nouvelle ligne

```
| YYYY-MM-DD | BNSSA S3 / niveau sportif / … | Description précise de ce qui était faux et ce qu’il faut faire | ✅ ou 🔄 |
```

---

## Erreurs récurrentes à ne **pas** refaire

1. **BNSSA** : oublier le volet sauvetage (sortie bassin, enchaînement, chrono 100 m examen).
2. **Découverte** : reprendre des séances « seuil » ou des départs serrés type confirmé.
3. **Eau libre + niveau Performance** : appliquer le bloc `isAdv` « Alternée 4 nages » plein de brasse — utiliser séances crawl/sighting (`usePoolIMBlock`).
4. **Eau libre** : écrire uniquement des `8×100m` bassin sans consigne sighting / lieu.
5. **Allures** : donner des récup fixes identiques pour tous sans tenir compte de `pace100` quand il est renseigné.
6. **Distance** : séance qui annonce 2000 m mais détail qui ne tombe pas juste (vérifier avec `calcSessionDistance`).
7. **Sportif / Performance** : mêmes volumes et mêmes intitulés — doit rester différencié.
8. **Vocabulaire** : dire **godilles**, pas « sculling » (anglicisme) dans les consignes de séance.

---

## Pistes produit (pas encore codées)

- Table `coach_rules` en base + application dans `generatePlan` (mémoire globale app).
- Feedback **par séance** (pas seulement fin de semaine) pour affiner les templates.
