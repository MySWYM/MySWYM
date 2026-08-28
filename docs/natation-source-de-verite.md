# Sources de vérité natation MySWYM

> Architecture des données et hiérarchie des décisions.  
> Règles actives : [`natation-regles-actives.md`](./natation-regles-actives.md) · Validation : [`natation-validation-seances.md`](./natation-validation-seances.md) · Journal : [`natation-historique.md`](./natation-historique.md).

---

## Hiérarchie des sources de vérité

| Sujet | Source de vérité |
| --- | --- |
| Décisions pédagogiques Arthur | Excel validé + règles actives Arthur |
| Bibliothèque utilisée par le composeur | Catalogue versionné dans le code |
| Catalogue soft Google Sheet (flag local) | Live Sheet = séances + onglet Éducatifs ; fiches UI via `sheetEducatif`, pas `.js` Arthur. Soft **01–13** (Nager + triathlon + eau libre). Diplômes hors Sheet. |
| Séances Gold / modèles validés | Supabase `session_templates` |
| Composition, contrôles et rendu | Un seul point d’entrée : `composeSession` |
| Ancien moteur | Fallback technique temporaire, jamais une source de décision concurrente |

**Précision obligatoire** : un seul générateur visible (`composeSession`) et un seul orchestrateur. Arthur **apprend au LLM à entraîner** (méthode MySWYM). Le LLM écrit et propose ; il ne décide pas une séance nageur sans moteur + quality gate + validation Arthur.

---

## Cartographie technique (modules internes ≠ générateurs concurrents)

| Rôle | Emplacement | Statut |
| --- | --- | --- |
| Orchestrateur / composeur | `composeSession` (`sports-engine` / `session-composer`) | **Point d’entrée unique** |
| Banque drills / catalogues | Catalogue versionné dans le code (`exercise-library`, `swim-banks`, éducatifs) | Source bibliothèque |
| Templates Gold | Supabase `session_templates` (`quality=gold` / `coach_approved`) | Modèles validés Arthur |
| Bridge plan | `swim-plan-bridge.js` | Branche le profil vers le composeur |
| Catalogue Sheet (soft) | `natation-sheet/` + flag (ON navigateur ; `=0` kill) | Soft **01–13** obligatoire (await, pas de composeur de secours) ; éducatif = `sheetEducatif` ; diplômes hors Sheet |
| Provenance séance (support) | `session-provenance.js` + `support-context.js` | Réf. `onglet-ligne` affichée / copiée, jointe au support et aux events |
| Ancien moteur | `SESSION_TEMPLATES` / `PHASE_PATTERNS` (ex. BNSSA, BPJEPS, pompiers) | Fallback temporaire seulement |
| Générateur legacy coach | `swim-session-generator.js` | Ne décide plus en concurrence avec `composeSession` |

---

## Banque Supabase `session_templates`

- Templates coach au format Arthur (`details` + blocs départ / technique / corps / RAC).
- Seed + séances `coach_approved` / `arthur_excel` (`quality=gold`).
- Lecture runtime pour patterns Arthur scalés ; le composeur reste le seul point de composition, contrôles et rendu.

---

## Mémoire agent

Quand Arthur corrige le contenu des séances, un objectif ou une règle métier :

1. Appliquer le fix dans le code **seulement si demandé**.
2. Mettre à jour [`natation-regles-actives.md`](./natation-regles-actives.md) et/ou [`natation-validation-seances.md`](./natation-validation-seances.md) si règle durable.
3. Ajouter une ligne datée dans [`natation-historique.md`](./natation-historique.md) avec statut `✅ active` / `↩ remplacée` / `🧪 à vérifier`.
4. Aligner `.cursor/rules/natation-seances.mdc` si la règle doit guider l’agent.
