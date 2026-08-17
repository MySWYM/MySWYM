# Revue d’orientation MySWYM — 17/08/2026

> **Statut** : audit + plan de sujets. Aucune implémentation dans ce lot.  
> **Méthode** : un sujet à la fois, jusqu’au bout (comprendre → décider → documenter → implémenter → tester → valider).  
> **Code vérifié** : HEAD de cette revue (après PR #27 checkout consent). Les docs datées du 16/08 citées dans le brief (`contexte-maitre-myswym.md`, `audit-complet-2026-08-16.md`) **ne sont pas dans le dépôt**.

---

## Ce qu’il ne faut pas casser

Le socle suivant est réel dans le code, pas seulement dans les docs :

| Socle | Où | Pourquoi ne pas y toucher en parallèle |
| --- | --- | --- |
| Un seul générateur visible | `composeSession` (`src/lib/sports-engine/session-composer.js`) via `swim-plan-bridge.js` | Règle 1. Fallback ancien moteur = technique seulement. |
| Structure Arthur | Départ → technique → corps → fin/RAC ; `splitSessionBlocks*` + `biasBlocksForObjectif` | Axe 4 : on habille / module, on ne change pas la formule. |
| Quality gate | `validateComposedSession` | Règle 16. |
| `volumeAdj` plafonné | `[0.70, 1.30]` dans `adjustPlan` (`App.jsx`) et le pont moteur | Règle 14. Changer le wording, pas le multiplicateur. |
| Merge de progression au regen | `mergePreservingProgress` / `shouldPreserveWeek` (`src/lib/plan-progress-merge.js`) | Hotfix 15/08 (PR #25). `FORCE_PLAN_REGEN = false`, `PLAN_VERSION = 48`. |
| Un plan actif max | `enforceSingleActivePlan`, `canUseMultiPlan: false` | Ne pas réouvrir le multi-plans. |
| Trial-first | aperçu squelette sans abo ; essai Stripe 7 j carte ; Premium = séances + allures + `adjustPlan` | `src/lib/access.js` + `docs/conversion-ux.md`. |
| Vocabulaire séances | `humanizeArthurDisplayTerms`, `sanitizeSessionDetailLine`, `displayIntensity` | D9 + rattrapé/coulée déjà en place sur le **contenu des séances**. |

Arthur forme le LLM à entraîner ; le nageur ne voit jamais une séance hors moteur + gate.

---

## Documents lus vs code

Lu dans l’ordre demandé :

1. `docs/natation-corrections.md` — index, pas une source de règles.
2. `docs/natation-regles-actives.md` — 20 règles (plus 16 : le fichier a grandi).
3. `docs/natation-source-de-verite.md`, `natation-historique.md`, `natation-validation-seances.md`, `docs/conversion-ux.md`.

**Absents du repo** : `contexte-maitre-myswym.md`, `audit-complet-2026-08-16.md`. Les constats du 16/08 repris dans le brief ont été **revérifiés contre le code** ; plusieurs sont encore vrais, un est déjà faux (`src/lib/pricing.js` n’existe pas).

---

## Axe 1 — Modèle économique 5 €/mois

### Ce qui existe et fonctionne

- Offre réelle : essai 7 jours **uniquement sur le mensuel** (`create-checkout` : `grantTrial = price === PRICE_MONTHLY && !trialAlreadyUsed`). Annuel = prépaiement sans essai (aligné CGV dans `LegalPages.jsx`).
- Prix affichés cohérents **en apparence** : 4,99 €/mois, 39,99 €/an (~3,33 €/mois).
- Entitlement nageur : `src/lib/access.js` (`getAccessState`) est la bonne implémentation — `active` n’est pas premium à vie si `subscription_end` est passé ; `canceled` n’est premium que si la fin de période est encore future.
- Landing : toggle annuel **déjà sélectionné par défaut** (`useState("annual")` dans `Landing.jsx`).
- Moteur rule-based : coût marginal ≈ 0. C’est l’atout. Ne pas y greffer un LLM in-app.

### Ce qui doit changer (avant toute nouvelle offre)

Le catalogue n’a **pas** de source unique réellement importée.

`src/lib/pricing.js` **n’existe pas** dans ce HEAD. Les IDs / libellés sont recopiés :

| Fichier | Quoi |
| --- | --- |
| `src/Landing.jsx` | `PRICE_MONTHLY` / `PRICE_ANNUAL` + labels |
| `src/Tarifs.jsx` | idem, recalcul économies |
| `src/App.jsx` | idem ; **UpgradeModal défaut = mensuel** (`useState("monthly")`) parce que l’essai est mensuel |
| `src/conversion/tokens.ts` | labels seulement (prototype `/prototype/conversion`) |
| `supabase/functions/create-checkout/index.ts` | IDs + `PRICE_BIENNIAL` **non exposé UI** + anciens IDs en allowlist |
| `supabase/functions/stripe-webhook/index.ts` | IDs + libellés facture |
| `api/_lib/arthur-ai/tools/create-checkout.ts` | IDs |
| `api/_lib/arthur-ai/knowledge/myswym-product.ts` | labels |
| Plus copies marketing | `SupportBubble.jsx`, `LegalPages.jsx`, `coach-insights.js`, `conversion/notifications.ts`, Welcome/paywalls prototype |

**3ᵉ check Premium divergente** (constat 16/08 **toujours vrai**) : `api/_lib/arthur-ai/tools/get-subscription-status.ts`

- `status === "active"` → `hasPremium = true` **sans** regarder `subscription_ends_at`.
- `canceled` → premium si la date est absente **ou** future (`!Number.isFinite(subEnds) \|\| subEnds > now`), alors que `access.js` exige une date **présente et future**.

`supabase/functions/_shared/access-state.ts` `hasEntitlement` est proche d’`access.js` (avec un léger écart : `active` + fin nulle = encore entitled côté serveur).

### Piste « annuel par défaut à l’écran »

Déjà vrai sur la **landing**. **Faux** dans l’app (UpgradeModal = mensuel). Ce n’est pas un oubli : l’essai 7 j n’existe que sur le mensuel. Pousser l’annuel comme CTA principal **dans l’app** = soit on perd l’essai (conversion), soit on décide d’un essai aussi sur l’annuel (changement Stripe + CGV).

À discuter **après** la consolidation, pas avant. Ne pas empiler un 7ᵉ exemplaire des prix.

### Contradiction docs / code

La règle workspace mentionne encore « multi-plans » Premium. Le code a retiré le multi-plans (`canUseMultiPlan: false`). `docs/conversion-ux.md` est plus à jour.

---

## Axe 2 — App plus humaine (sans IA générative)

### Ce qui existe et fonctionne

- Adaptation réelle : `decideAdaptAction` → `adjustPlan` → regen des semaines **vierges** (ou scale fallback). Plafond `[0.70, 1.30]` intact. Ne pas y toucher.
- Vocabulaire **séances** déjà travaillé : rattrapé, coulée, godilles, D9 (`souple` / `Z1` → intention concrète), `displayIntensity` déjà **par niveau** :
  - découverte : Très facile / Facile / Modéré ;
  - régulier : Facile / Modéré / Soutenu ;
  - sportif / performance : Z1–Z4.
- Insights paywall plutôt humains : `src/lib/coach-insights.js`.
- Mapping jargon découverte : `src/lib/sports-engine/user-facing.js` (RAC → récup, godilles → paraphrase) — surtout utilisé en fin de séance, pas sur tous les messages système.

### Ce qui doit changer

Les messages **après feedback** sonnent encore « algo » :

- Toast Premium : « Premium affine volume et style des prochaines séances. »
- Toast douleur : un peu mieux (« on allège la suite ») mais générique.
- Modal semaine, aperçu gratuit : « trop dur → volume −12 % la semaine suivante. »
- Fiche séance : « Ton ressenti affine le volume des prochaines séances. »

`adapt.action` (`PROGRESSER` / `MAINTENIR` / `AJUSTER` / `RÉCUPÉRER`) et `devExplain` sont stockés (`_lastAdapt`, `_adaptExplain`) et **non affichés** au nageur (`devExplain` est même dans la denylist analytics). Le nageur ne voit jamais « cette semaine je t’allège un peu ».

Étendre le vocabulaire hors séances : toasts, UpgradeModal, SupportBubble, notifications prototype, labels dashboard (« Série », « Dashboard natation »). Pas le moteur.

### Tension produit à trancher plus tard (axe 4, pas 2)

Règle 11 = jamais `Z1` visible **pour tout le monde**. `displayIntensity` **garde** Z1–Z4 pour sportif/performance. La piste « zones pour sportif, ressenti pour découverte/régulier » est donc **déjà l’intention du composeur** sur le champ `intensity`, mais D9 écrase encore `Z1` dans les `details`. À documenter comme amendement de la règle 11 si tu confirmes, pas à patcher en silence.

---

## Axe 3 — Engagement sain

### Ce qui existe déjà

| Idée | État réel |
| --- | --- |
| Streak | Calculé (`computeStats`) : séances **consécutives validées dans l’ordre du plan**, pas une série calendaire. Affiché accueil (grille stats) + profil. |
| Badges distance | 1 / 5 / 10 km seulement (`km1`, `km5`, `km10`). **Pas** 50 km ni 100 km. |
| Badges sur l’accueil | `HomeBadgesSection` est déjà sur le Dashboard **et** le profil — mais en bas d’accueil, après Strava. Pas un héros. |
| Récap hebdo | `weeklyData` (km faits vs planifiés par semaine) est **calculé et jamais affiché**. Boucle « séance du jour » : `weeklyData: []`. |
| Notifications jour de séance | Copys dans `src/conversion/notifications.ts` (**prototype, non branché**). Inbox in-app (`GLOBAL_NOTIFICATION_FEED`) **vide**. Pas de push. |
| Prototype habit | `/prototype/conversion` (`ConversionFlow`) — pas le shell prod. |

### Bloquant : séances cochées qui ne survivent pas au refresh

Le hotfix du 15/08 (PR #25, `mergePreservingProgress`) protège les séances validées **quand on régénère** un plan (`PLAN_VERSION`). **Ce n’est pas** le bug refresh quotidien.

#### Source de vérité réelle

L’UI relit `user_plans.plans_json` (fusionné avec le cache `localStorage`).  
`planned_sessions` est un **fait parallèle** :

- `handleComplete` appelle `markSessionStatus("completed")` → `UPDATE` sur `planned_sessions`.
- Si la ligne n’existe pas, **0 ligne mise à jour**, sans upsert.
- `loadSportsFacts` **ne recharge pas** `planned_sessions` et **n’overlay pas** le statut completed sur le blob.

Donc cocher « séance faite » ne vit que si le blob `plans_json` est bien écrit.

#### Cause probable n°1 — course d’autosave (lost update)

```12320:12345:src/App.jsx
  useEffect(() => {
    if (!user || plans.length === 0 || !plansHydratedRef.current) return;
    const saveGen = ++plansSaveGenRef.current;
    const save = async () => {
      const snapshot = plans;
      // ...
      const { plans: merged, ... } = await persistAccountPlans(...);
      if (saveGen !== plansSaveGenRef.current) return; // trop tard : l’écriture a déjà eu lieu
```

`persistAccountPlans` **fetch remote + merge + upsert Supabase + écrit localStorage** dès qu’il est lancé. `saveGen` empêche seulement de **réappliquer** le merge dans React. Un save **périmé** (snapshot `completed: false`) qui finit **après** un save à jour **réécrit** le remote et le cache.

`persistAccountPlans` refetch toujours le remote et fusionne via `mergePlanLists`. À progression égale, le côté « plus récent » gagne — or un save périmé force `localTime = Date.now()` au moment de **son** write.

#### Cause probable n°2 — boucle « séance du jour »

`planProgressScore` ne compte que `plan.weeks`, **pas** `plan.history`. Après `advanceProgressionLoop`, la semaine courante est une **nouvelle** séance non cochée ; la progression est dans `history`. Score local = 0. Un remote encore « séance cochée non archivée » (score 1) peut gagner et **écraser l’historique**.

La migration `PLAN_VERSION` pour une boucle déjà en loop **remplace** `weeks` par une séance fraîche (`buildProgressionLoopSession`) et ne merge pas la séance courante via `mergePreservingProgress` si elle était cochée mais pas encore dans `history` (fenêtre feedback).

#### Cause probable n°3 — sync visibilité

Le `visibilitychange` refusionne local/remote. Moins grave si le blob est juste, catastrophique s’il a déjà été corrompu par (1) ou (2).

### Plan de fix (à documenter puis coder — sujet 1)

Ne pas construire streaks / jalons / récap dessus avant ça.

**Ne pas toucher** : `mergePreservingProgress` (regen), `volumeAdj`, composeur, `adjustPlan`.

**Changer** :

1. Annuler l’écriture si `saveGen` n’est plus le courant **avant** l’upsert (`persistAccountPlans` doit pouvoir abort, ou file d’attente 1 save à la fois avec snapshot le plus récent).
2. Fusionner au grain **séance** (`completed` / `skipped` / `feedback` / `history` loop) : une coche ne se perd jamais au profit d’une version « plus récente » non validée.
3. Inclure `plan.history` (et la séance loop courante) dans `planProgressScore`.
4. `markSessionStatus` : upsert si pas de ligne ; optionnellement overlay au load — ou arrêter de faire semblant que `planned_sessions` est la source UI.
5. Tests : two saves overlapping ; loop complete → refresh ; classic complete → refresh ; visibilitychange immédiat.

**Fichiers** : `src/App.jsx` (autosave, `mergePlanLists`, `planProgressScore`, load) ; `src/lib/sports-persistence/index.js` ; tests dédiés (aujourd’hui **aucun** test `persistAccountPlans` / `mergePlanLists`). Extraire les helpers hors de `App.jsx` si on touche cette zone — le fichier est ~14 k lignes.

**Validé quand** : cocher une séance, refresh dur, encore cochée ; enchaîner coche + changement d’onglet / retour app ; boucle : historique km/séries intact après refresh ; pas de régression regen `PLAN_VERSION`.

---

## Axe 4 — Structure des séances grand public

Le format actuel **reste le bon socle**. Public visé : découverte → performance, 1–4×/semaine. Ne pas transposer volumes/HR type club jeunes / C.O.S.D. tels quels.

### Pistes vs `composeSession` / `biasBlocksForObjectif`

#### 1. Durée cible 30–45 min (découverte/régulier) et 60–75 (sportif/performance)

**Cohérent avec le moteur.** Cibles par niveau dans le pont : 30 / 45 / 60 / 70 min. Durée affichée = `min(cible, volume / vitesse estimée)` (÷28 découverte, ÷35 régulier, ÷40–42 sportif/perf).

Volume semaine de référence : 2800 / 4000 / 5200 / 6200 m. À 3×/sem. ça tombe ~35–45 min en découverte/régulier. Sportif/perf : la formule volume/vitesse peut **sous-estimer** vs 60–75 (souvent ~50 min si le volume ne « remplit » pas la cible).

Le questionnaire ancre une **distance** (`targetSessionDistance`), pas une durée vécue. `sessionDuration` existe sur le profil mais n’est pas le levier UX principal.

**Changement** : surtout mesure + éventuellement caler l’estimateur / le volume pour que la durée **affichée** soit prévisible. Pas une 2ᵉ structure.

**Valider** : échantillon de séances générées par niveau (tests existants `session-composer-*.test.js` + tableau durées). Commencer par **mesurer** avant de changer les banques.

#### 2. Noyau + bonus (s’arrêter ≠ échec)

**Pas dans le composeur aujourd’hui.** `optional: true` existe pour des **jours de repos taper** (Performance), pas pour un bloc intra-séance.

Les 4 blocs sont déjà des objets (`depart`, `technique`, `corps`, `fin`) avec `set.block`. On peut marquer p.ex. la 2ᵉ moitié du corps comme `optional` **sans** changer `biasBlocksForObjectif`.

**Changement** : flag sur les sets + UI « cœur / si tu as le temps » + règle de complétion (cocher = cœur suffisant ?). Touche `composeSession` + affichage `App.jsx` / live view. Décision produit : est-ce que le volume annoncé inclut le bonus ?

**Ne pas commencer par là** : ça change le contrat « séance faite » alors que la persistance de la coche est cassée.

#### 3. Langage adapté au niveau (zones vs ressenti)

**Déjà amorcé** via `displayIntensity` (voir axe 2). Les **lignes** (`formatSetLine`) n’utilisent plus `_beginnerFriendly` (paramètre ignoré) : le ressenti n’est pas doublé sur chaque série.

Pour sportif/perf, garder Z2–Z4 est aligné `displayIntensity` ; Z1 se heurte à la règle 11.

**Changement** : couche d’habillage dans `session-labels.js` / `displayIntensity`, pas un 2ᵉ moteur. Trancher règle 11 avant.

#### 4. Séance 1 spéciale (plus courte / plus facile)

**Partiel.** Boucle « Nager & progresser » : `easyPhase = cursor < 3` → volume ×0,72, durée cible 35 min, wording simplifié. C’est **3 premières séances allégées**, pas une S1 structurellement différente.

Plans multi-semaines : semaine 0 = `typeSemaine: "reference"` (volume de référence, **pas** allégé).

**Cohérent** à ajouter comme intent / seed `cursor === 0` dans `buildProgressionLoopSession` + éventuellement semaine 1 des plans classiques. Reste dans `composeSession` (mêmes 4 blocs, cibles plus basses).

Bonne candidate **après** persistance + (si tu n’as qu’un sujet séance) avant noyau/bonus.

#### 5. Fin de séance émotion grand public

Le RAC existe déjà : dos facile / « au choix (récup) » / recettes `FINS_SEMAINE`. Ce n’est pas mis en scène (dernier 50–100 m au choix + repère de progression visible).

**Changement** : copy + éventuellement 1 ligne de banque fin, pas la structure. Peut se coupler au récap (axe 3) une fois les coches fiables.

### Si un seul sujet séance cette semaine

**Pas** le noyau+bonus, **pas** un rewrite C.O.S.D.  
**Oui** : soit (A) **séance 1 spéciale** sur la boucle (onboarding 100 %), soit (B) **audit durées réelles** (mesure only, décision ensuite).  
Recommandation séance : **A** seulement **après** le fix persistance. Cette semaine calendaire : persistance d’abord (voir ci-dessous).

---

## Plan ordonné (sujets ~2 h, un à la fois)

Règle : pas de chantier ouvert en parallèle. Chaque ligne = une session (parfois deux si tests + doc).

| # | Sujet | Risque | Dépend de | Fichiers | Fait / validé quand |
| --- | --- | --- | --- | --- | --- |
| **1** | **Fix persistance coches (refresh)** | Élevé si mal fusionné ; **bloquant** pour 3 et 4 | — | `App.jsx` persist/merge, `sports-persistence`, tests nouveaux | Refresh + visibilité + boucle : coche et history tiennent |
| **2** | **Une source de vérité prix + entitlement** | Moyen (Stripe) | — | nouveau module importé partout ; `get-subscription-status.ts` aligné `access.js` | Un seul import ; Arthur AI et app d’accord sur `subscription_end` ; IDs biennaux documentés ou retirés de l’UI |
| **3** | **Voix coach sur le feedback** (`adjustPlan` inchangé) | Bas | — | toasts + copy `FeedbackModal` / `SessionFeedbackSheet` ; petite table action → phrase | Nageur lit une phrase coach ; `volumeAdj` et tests moteur identiques |
| **4** | **Décision annuelle par défaut in-app** (discuter, puis 1 écran) | Produit / legal | 2 | UpgradeModal, éventuellement Stripe trial annuel | Décision écrite (essai ou pas) ; un écran ; CGV inchangées ou amendées exprès |
| **5** | **Séance 1 boucle** plus courte / réussissable | Moyen (volume) | 1 | `swim-plan-bridge.js` `buildProgressionLoopSession`, tests loop | Cursor 0 ≠ cursor 5 (durée/volume) ; gate OK ; pas de regen silencieuse des plans en cours |
| **6** | **Accueil : streak + jalons** (10 / 50 / 100 km) sans dark pattern | Bas UX ; faux si 1 pas fait | 1 | `BADGE_DEFS`, Dashboard (pas le prototype conversion) | Accueil montre série + palier suivant ; badges 50/100 ; pas de culpabilisation |
| **7** | **Récap hebdo affichage** | Bas | 1 | Dashboard ; `weeklyData` ou history loop | « Cette semaine : X km, ±Y % vs précédente » visible, calcul existant |
| **8** | **Audit durées** (mesure) puis calage si écart | Bas puis moyen | — | tests composer + tableau | Chiffres par niveau vs 30–45 / 60–75 ; décision volume vs estimateur |
| **9** | **Langage zones par niveau** (trancher règle 11) | Doc + labels | 8 optionnel | `session-labels.js`, `displayIntensity`, règle 11 | Découverte/régulier : ressenti ; sportif/perf : zones assumées |
| **10** | **Noyau + bonus** | Élevé (contrat « séance faite ») | 1, 8, décision produit | composer sets + UI | Cœur obligatoire marqué ; s’arrêter n’affiche pas un échec |
| **11** | **Fin émotion + notif jour de séance** | Moyen (infra notif) | 1, 6 | banque fin + plus tard push/edge | Dernière ligne au choix ; rappel le **jour** de la séance, pas un generic |

Hors scope volontaire : LLM in-app, multi-plans, rewrite moteur, C.O.S.D. brut, dark patterns (`streak_protect` du prototype à 20 h — ne pas porter tel quel).

---

## Premier sujet — par quoi commencer

**Sujet 1 : persistance des séances cochées.**

Justification :

1. Tu l’as toi-même posé comme **bloquant** avant streaks / jalons / récap.
2. C’est un bug d’infra, pas une idée produit : pas de contradiction « nouvelle offre vs ancienne ».
3. Le hotfix 15/08 a traité le **regen**, pas le **refresh**. On ne recommence pas ; on ferme le trou restant.
4. ~une session pour le diagnostic+garde-fous d’écriture, une autre pour merge au grain séance + tests — tenable à 2 h/j.
5. Les axes 1 (prix) et 2 (voix coach) sont importants mais **non bloquants** pour la confiance nageur. Un nageur qui perd sa coche ne croira ni le streak ni le coach.

**Cette session** : documenter (ce fichier). **Prochaine session** : décider le contrat de merge (blob = source UI ; `planned_sessions` = fait dérivé ou overlay), puis implémenter uniquement le sujet 1.

---

## Décisions à ne pas improvisers en cours de route

À écrire ici (ou dans l’historique natation si ça devient une règle) **avant** le code correspondant :

- [ ] Blob `user_plans.plans_json` = source UI ; rôle exact de `planned_sessions`.
- [ ] Annuel in-app : défaut visuel vs essai 7 j mensuel only.
- [ ] Règle 11 : Z1 interdit partout, ou seulement hors sportif/performance.
- [ ] « Séance faite » si le nageur s’arrête au noyau.
- [ ] Streak = ordre du plan (actuel) ou jours calendaires.

Tant qu’une case n’est pas tranchée, le sujet associé n’est pas commencé.
