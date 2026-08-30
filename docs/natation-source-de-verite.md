# Sources de vérité natation MySWYM

> Architecture des données et hiérarchie des décisions.  
> Règles actives : [`natation-regles-actives.md`](./natation-regles-actives.md) · Validation : [`natation-validation-seances.md`](./natation-validation-seances.md) · Journal : [`natation-historique.md`](./natation-historique.md).

---

## Hiérarchie des sources de vérité

| Sujet | Source de vérité |
| --- | --- |
| Décisions pédagogiques Arthur | Excel validé + règles actives Arthur |
| Bibliothèque utilisée par le composeur | Catalogue versionné dans le code |
| Catalogue soft Google Sheet (flag local) | Live Sheet = séances + onglet Éducatifs ; fiches UI via `sheetEducatif`, pas `.js` Arthur. Soft **01–13** = **source visible** (Nager + triathlon + eau libre). Diplômes hors Sheet. |
| Séances Gold / modèles validés | Supabase `session_templates` |
| Composition hors Soft (diplômes, etc.) | `composeSession` + quality gate |
| Ancien moteur | Fallback technique temporaire hors Soft, jamais une source Soft concurrente |

**Précision obligatoire** : Soft **01–13** = Sheet (await, pas de composeur de secours). Hors Soft = `composeSession` + quality gate. Arthur **apprend au LLM à entraîner** (méthode MySWYM). Le LLM écrit et propose ; il ne décide pas une séance nageur sans Sheet Soft ou composeur + validation Arthur.

---

## Cartographie technique (modules internes ≠ générateurs concurrents)

| Rôle | Emplacement | Statut |
| --- | --- | --- |
| Catalogue Sheet (soft) | `natation-sheet/` + flag (ON navigateur ; `=0` kill) | **Source visible Soft 01–13** (await, pas de composeur de secours) ; éducatif = `sheetEducatif` ; pas de QG sur les lignes (Sheet = foi) |
| Orchestrateur / composeur | `composeSession` (`sports-engine` / `session-composer`) | **Hors Soft uniquement** (diplômes, etc.) + quality gate |
| Banque drills / catalogues | Catalogue versionné dans le code (`exercise-library`, `swim-banks`, éducatifs) | Source bibliothèque composeur |
| Templates Gold | Supabase `session_templates` (`quality=gold` / `coach_approved`) | Modèles validés Arthur |
| Bridge plan | `swim-plan-bridge.js` | Soft Sheet si famille 01–13 ; sinon composeur |
| Provenance séance (support) | `session-provenance.js` + `support-context.js` | Réf. `onglet-ligne` affichée / copiée, jointe au support et aux events |
| Ancien moteur | `SESSION_TEMPLATES` / `PHASE_PATTERNS` (ex. BNSSA, BPJEPS, pompiers) | Fallback temporaire seulement |
| Générateur legacy coach | `swim-session-generator.js` | Ne décide plus en concurrence avec `composeSession` |

---

## Banque Supabase `session_templates`

- Templates coach au format Arthur (`details` + blocs départ / technique / corps / RAC).
- Seed + séances `coach_approved` / `arthur_excel` (`quality=gold`).
- Lecture runtime pour patterns Arthur scalés ; hors Soft, le composeur reste le point de composition, contrôles et rendu.

---

## Mémoire agent

Quand Arthur corrige le contenu des séances, un objectif ou une règle métier :

1. Appliquer le fix dans le code **seulement si demandé**.
2. Mettre à jour [`natation-regles-actives.md`](./natation-regles-actives.md) et/ou [`natation-validation-seances.md`](./natation-validation-seances.md) si règle durable.
3. Ajouter une ligne datée dans [`natation-historique.md`](./natation-historique.md) avec statut `✅ active` / `↩ remplacée` / `🧪 à vérifier`.
4. Aligner `.cursor/rules/natation-seances.mdc` si la règle doit guider l’agent.
