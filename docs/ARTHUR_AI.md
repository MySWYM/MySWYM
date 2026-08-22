# Arthur AI — documentation V1

Assistant IA MySWYM (coaching + qualification + conversion).  
Backend uniquement : **Vercel `/api`** → OpenAI → tools sécurisés → Supabase / moteur existant.

> OpenAI n’est **jamais** appelé depuis le frontend.  
> Le moteur d’entraînement MySWYM reste la **seule** source de vérité sportive.

---

## Architecture

```text
Web (/api/ai/chat)  ─┐
Instagram webhook   ─┼─→ arthurAIService
                     │        ↓
                     │   OpenAI Responses API
                     │        ↓
                     │   Tools (écriture web only)
                     │        ↓
                     └─→ Supabase + generateArthurPlan → buildCoachPlanWeeks
```

Hub : `api/_lib/arthur-ai/`  
Endpoints :
- `POST /api/ai/chat` — test web
- `GET|POST /api/instagram/webhook` — Meta
- `POST /api/instagram/mock` — mock local
- `POST /api/ai/identity-link` — lier IGSID ↔ user MySWYM (JWT)
- `GET|POST /api/admin/arthur-growth` — Growth Engine F1 (admin)
- `GET|POST /api/admin/arthur-followups` — Conversion Engine F2 (admin)
- `GET|POST /api/admin/arthur-optimize` — Optimization Loop F3 (admin)
- `GET|POST /api/admin/arthur-readiness` — Production Readiness G (admin)
- `GET|POST /api/admin/arthur-shadow` — Shadow Mode H1 (admin)
- UI : `/admin/arthur-growth`, `/admin/arthur-followups`, `/admin/arthur-optimize`, `/admin/arthur-readiness`, `/admin/arthur-shadow`

Stripe : **inchangé** — Edge Function `create-checkout` appelée avec le JWT utilisateur.

---

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `OPENAI_API_KEY` | Serveur only |
| `OPENAI_MODEL` | Défaut `gpt-4.1-mini` |
| `SUPABASE_URL` | (+ fallback `VITE_SUPABASE_URL`) |
| `SUPABASE_ANON_KEY` | Vérif JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Écritures AI (filtre code obligatoire) |
| `ARTHUR_AI_MOCK=1` | Tests sans OpenAI |
| `ARTHUR_AI_INTERNAL_SECRET` | Header `x-myswym-arthur-secret` + `testUserId` |
| `APP_URL` | Origin pour checkout |
| `STRIPE_PRICE_MONTHLY_FLEX` / `STRIPE_PRICE_MONTHLY_COMMIT` / `STRIPE_PRICE_ANNUAL` | IDs prix (pas le secret Stripe). Alias legacy : `STRIPE_PRICE_MONTHLY` = commit. |
| `META_APP_ID` | Meta app |
| `META_APP_SECRET` | Signature webhook `X-Hub-Signature-256` |
| `META_VERIFY_TOKEN` | Challenge GET webhook |
| `INSTAGRAM_ACCESS_TOKEN` | Envoi DM Graph API |
| `INSTAGRAM_BUSINESS_ID` | Optionnel (défaut `me`) |
| `INSTAGRAM_MOCK=1` | Mock local (pas d’appel Meta) |
| `ARTHUR_ADMIN_SECRET` | Header `x-myswym-arthur-admin` (dashboard Growth) |
| `ARTHUR_ADMIN_EMAILS` | Emails admin séparés par virgule (JWT) |
| `ARTHUR_FOLLOWUPS_SEND` | `1` = autorise envoi relances (OFF par défaut) |
| `ARTHUR_FOLLOWUPS_SEND_MOCK` | `1` = mock même si SEND=1 (recommandé avant live) |

Interdit : `VITE_OPENAI_*`, `STRIPE_SECRET_KEY`, tokens Meta côté client.

---

## Conversations

Tables : `ai_conversations`, `ai_messages`, `ai_leads`, `ai_events`, `ai_user_context`, `ai_prompt_versions`.

Contexte envoyé au modèle :
- résumé + facts (`ai_user_context`)
- ~12 derniers messages
- aperçu profil / abo / lead
- `knowledge_hints` (snippets coaching F3, optionnels)

Pas d’historique illimité.

---

## Tools

### Lecture

| Tool | Source |
|------|--------|
| `get_user_profile` | `sport_profiles` |
| `get_current_plan` | `user_plans.plans_json` (aperçu) |
| `get_training_history` | feedback / planned_sessions / adaptations |
| `get_subscription_status` | `user_access_state` |

### Écriture (user MySWYM authentifié uniquement)

| Tool | Comportement |
|------|----------------|
| `create_training_plan` | `generateArthurPlan` → moteur → `user_plans` |
| `update_user_profile` | Whitelist coaching only |
| `create_checkout` | HTTP → Edge `create-checkout` → `checkout_url` |

Prospects Instagram **non liés** : pas d’écriture plan / profil / checkout.

---

## Confirmation plan (obligatoire)

1. Suggestion : « Je peux te générer ton plan… Tu veux que je le crée ? »
2. Utilisateur : « Oui »
3. Tool : `create_training_plan({ confirmed: true })`

Si plan actif :
- sans `replace_existing` → `requires_confirmation` / `active_plan_exists`
- avec confirmation → merge via `mergePreservingProgress` (semaines réalisées conservées)

---

## Génération de plan

Façade : `src/lib/sports-engine/server-adapter/generateArthurPlan.js`

```text
Arthur → generateArthurPlan → buildCoachPlanWeeks / sports-engine → plan JSON
```

- Phases : `plan-phases.js` (calendrier, aligné App.jsx)
- Contenu séances : `buildCoachPlanWeeks` (existant)
- Preserve : `preserve-progress.js` (politique App)

**Hors V1** : objectifs diplôme (BNSSA, BPJEPS, …) encore liés à `SESSION_TEMPLATES` dans `App.jsx` → refus explicite.

**Interdit** : appeler `generatePlan()` dans `App.jsx`.

---

## Instagram / Meta

```text
Reel / commentaire PLAN
    ↓
DM Instagram
    ↓
GET/POST /api/instagram/webhook
    ↓
parse + attribution (source, campaign, reel_id, keyword)
    ↓
ai_identity_links (pending) — PAS de compte auto
    ↓
processArthurMessage(channel=instagram, externalUserId=IGSID)
    ↓
userId seulement si lien status=verified
    ↓
reply via Graph API (ou mock)
```

### Mapping `ai_identity_links`

| status | Effet |
|--------|--------|
| `pending` | IGSID vu en DM, pas de user MySWYM |
| `verified` | Lien explicite via `POST /api/ai/identity-link` (JWT) |
| `revoked` | Inutilisable |

**Jamais** : IGSID → création compte, IGSID = `user_id`, plan auto depuis Instagram.

### Écritures depuis Instagram

Désactivées (même si lien verified) : `create_training_plan`, `update_user_profile`, `create_checkout`.  
Arthur qualifie + renvoie vers MySWYM.

### Attribution

Stockée sur `ai_leads` (`source`, `campaign`, `reel_id`, `keyword`) + metadata `ai_events`.  
Chaîne mesurée (F1) : `reel_id → DM → lead → signup → premium`.

---

## Growth Engine (Phase F1)

Objectif : **mesurer** les conversions avant toute automatisation de relances.

### Scoring leads

Fonction pure `scoreLead` (`api/_lib/arthur-ai/growth/scoring.ts`) — 0–100, bandes :

| Band | Score |
|------|-------|
| cold | &lt; 40 |
| warm | 40–69 |
| hot | ≥ 70 |

Facteurs : statut, profil (goal/level/freq/date), attribution (reel/campaign/keyword), intent, température, engagement messages, identity link / premium.

Persistance : colonnes `score`, `score_band`, `score_reasons`, `scored_at` sur `ai_leads` (migration `20260809130000_arthur_ai_growth_f1.sql`).  
Recalcul automatique à chaque upsert lead + après identity link.

### Attribution complète

```text
Reel / keyword
    → dm_received (ai_events)
    → ai_leads (new → qualified)
    → identity_link verified → status=signup (+ event signup)
    → user_access_state premium → status=premium
```

- `POST /api/ai/identity-link` appelle `markLeadSignupFromIdentity`
- Admin `POST { action: "sync" }` resynchronise signup/premium depuis `ai_identity_links` + `user_access_state`
- Table optionnelle `ai_growth_daily` (agrégats, rebuild via `action: "rebuild"`)

**Hors F1** : relances / nurture automatiques — volontairement absentes.

### Dashboard admin

- URL : `/admin/arthur-growth`
- API : `GET /api/admin/arthur-growth?days=30`
- Auth : `ARTHUR_ADMIN_SECRET` (header) **ou** JWT email ∈ `ARTHUR_ADMIN_EMAILS` **ou** `app_metadata.arthur_admin=true`
- Affiche : funnel, scores, table Reel/campagne, leads récents
- Bouton « Sync signup / premium » uniquement (pas d’envoi de messages)

```bash
npm run test:arthur:growth

# GET /api/admin/arthur-growth?days=30
# header: x-myswym-arthur-admin: $ARTHUR_ADMIN_SECRET
```

---

## Conversion Engine (Phase F2)

Objectif : **relances intelligentes mesurables** avant automatisation complète.  
**Ne spamme jamais.** Envois Instagram réels **gated**.

### Table `ai_followups`

Migration `20260809140000_arthur_ai_followups_f2.sql`.

Statuts : `planned` → `approved` → `queued` → `sent` | `failed` | `cancelled`  
Outcomes : `pending` | `replied` | `signup` | `premium` | …

### Moteur de décision

`decideFollowup` (`api/_lib/arthur-ai/conversion/decide.ts`) — pure function :

Entrées : score / bande, intent, stade funnel, historique messages, compteurs sent/open.

Anti-spam (`FOLLOWUP_POLICY`) :
- max **3** envois / lead
- max **1** followup ouvert
- **48h** min entre envois
- **24h** silence user + **36h** après dernier assistant
- pas de premium / inactive / score cold &lt; 25
- quiet hours (pas de schedule nuit)

Templates : `convert_hot`, `plan_nudge`, `nurture_warm`, `reengage_cold`, `signup_to_premium`.

### Gate d’envoi (critique)

| Env | Effet |
|-----|--------|
| (défaut) | `send_gate=blocked` — plan / approve OK, **aucun** envoi |
| `ARTHUR_FOLLOWUPS_SEND=1` + `ARTHUR_FOLLOWUPS_SEND_MOCK=1` | mock |
| `ARTHUR_FOLLOWUPS_SEND=1` seul | live Graph API |

Sans validation explicite → ne pas activer `ARTHUR_FOLLOWUPS_SEND`.

### Tracking résultats

- Reply : inbound DM → `markFollowupReplied` (7j)
- Signup / premium : identity-link + sync lifecycle → `markFollowupConverted`
- Events : `followup_planned`, `followup_suppressed`, `followup_approved`, `followup_sent`, `followup_failed`, `followup_replied`, `followup_converted`

### Admin

- UI : `/admin/arthur-followups`
- API : `GET /api/admin/arthur-followups?days=30`
- POST actions : `plan_dry_run` | `plan` | `approve` | `send` | `cancel`

```bash
npm run test:arthur:conversion

# Planifier sans envoyer
# POST /api/admin/arthur-followups { "action": "plan_dry_run" }
# header: x-myswym-arthur-admin: $ARTHUR_ADMIN_SECRET
```

---

## Optimization Loop (Phase F3)

Objectif : **améliorer DM → Premium** avant scaling — mesurer qualité & CTA, pas activer les envois auto.

### Tables

Migration `20260809150000_arthur_ai_optimization_f3.sql` :

| Table | Rôle |
|-------|------|
| `ai_knowledge_snippets` | Bibliothèque coaching (seeds crawl, triathlon, OW…) |
| `ai_response_scores` | Score qualité 0–100 / réponse |
| `ai_conversation_insights` | Drop-risk + findings + recommandations |
| `ai_cta_events` | CTA sent / attribution signup·premium |

### Qualité des réponses

`scoreResponseQuality` — règles déterministes : longueur, conseil concret, question, spam, timing CTA, alignement knowledge.

Persistance auto après chaque réponse Arthur (`recordResponseOptimization`).

### Knowledge

Snippets injectés dans le contexte modèle (`knowledge_hints`) selon message / intent.  
Ce n’est **pas** le moteur de plan — conseils courts seulement.

### Analyse conversationnelle

`analyzeConversation` + `analyze_batch` admin : drop-risk (`low|medium|high`), findings (`engaged_no_cta`, `cta_heavy`, …), recommandations prompt/CTA.

### CTA Instagram

- Détection liens `myswym.app` + `suggested_action=suggest_myswym`
- Events `cta_sent` / table `ai_cta_events`
- Liens trackables : `buildTrackedCtaUrl` (`?ref=arthur_ig`)
- Attribution signup/premium depuis identity-link / sync lifecycle

### Admin

- UI : `/admin/arthur-optimize`
- API : `GET /api/admin/arthur-optimize?days=30`
- POST : `analyze_batch` | `analyze_one`
- Toute action `send` / auto-send → **403** (F3 ne scale pas les envois)

```bash
npm run test:arthur:optimize
```

**Hors F3** : activation `ARTHUR_FOLLOWUPS_SEND` — reste une décision F2 explicite.

---

## Production Readiness (Phase G)

Objectif : **scaler en sécurité** — coûts, limites, offline, takeover, flags.  
**Ne pas activer les envois automatiques** sans validation (`ARTHUR_FOLLOWUPS_SEND`).

### Feature flags (env)

| Variable | Défaut | Effet |
|----------|--------|--------|
| `ARTHUR_FLAG_ENABLED` | on | Kill switch global |
| `ARTHUR_FLAG_WEB` | on | Canal web |
| `ARTHUR_FLAG_INSTAGRAM` | on | Canal Instagram |
| `ARTHUR_FLAG_TOOLS_WRITE` | on | Tools écriture |
| `ARTHUR_FLAG_OPTIMIZATION` | on | Scoring F3 |
| `ARTHUR_FLAG_OFFLINE` | off | Force fallback sans OpenAI |
| `ARTHUR_FLAG_HUMAN_TAKEOVER_ALL` | off | Toutes conv. → humain |
| `ARTHUR_FOLLOWUPS_SEND` | **off** | Envois relances (validation explicite) |

### Rate limiting

Tables `ai_rate_buckets`. Config :

- `ARTHUR_RATE_PER_HOUR` (défaut 40)
- `ARTHUR_RATE_PER_DAY` (défaut 200)

Dépassement → message offline + event `rate_limited` (pas de spam OpenAI).

### Monitoring coûts

- Agrégation `ai_events.cost_estimate` + snapshot `ai_cost_daily`
- `ARTHUR_COST_BUDGET_DAY_USD` (25) / `ARTHUR_COST_BUDGET_MONTH_USD` (400)
- Soft (`ARTHUR_COST_SOFT_RATIO=0.8`) → event warn ; hard → **offline forcé**

### Fallback offline

`buildOfflineResponse` — intent heuristique + knowledge tip, sans OpenAI.  
Déclenché par : flag offline, budget hard, erreur OpenAI, absence de clé, canal désactivé, rate limit.

### Human takeover

- Mots-clés user (« parler à un humain », « stop arthur »…)
- `suggested_action=handoff_human`
- Flag global / admin `start_takeover`
- Conversation `status=human_takeover` — Arthur ne répond plus (message hold)
- Admin : release via `/admin/arthur-readiness`

Migration : `20260809160000_arthur_ai_production_g.sql`

### Admin readiness

- UI : `/admin/arthur-readiness`
- API : `GET /api/admin/arthur-readiness`
- POST : `release_takeover` | `start_takeover` | `list_takeovers`
- Toute activation auto-send → **403**

```bash
npm run test:arthur:production
```

---

## Shadow Mode (Phase H1)

Objectif : **apprendre / valider** les réponses Instagram avant tout envoi auto.

### Comportement

```text
DM Instagram
  → processArthurMessage (analyse + lead + intent)
  → ai_shadow_proposals (pending)
  → AUCUN sendInstagramTextMessage
  → validation humaine /admin/arthur-shadow
```

Approve / reject / edit_approve **≠ send**. `sent_at` reste `null` en H1.

### Flags (double gate live)

| Variable | Défaut | Effet |
|----------|--------|--------|
| `ARTHUR_FLAG_SHADOW_INSTAGRAM` | **on** | Shadow : pas d’envoi DM |
| `ARTHUR_INSTAGRAM_LIVE_SEND` | **off** | Live send seulement si shadow=off **et** ce flag=1 |
| `ARTHUR_FOLLOWUPS_SEND` | **off** | Inchangé — ne pas activer |

### Table `ai_shadow_proposals`

Migration `20260809170000_arthur_ai_shadow_h1.sql`.

Champs clés : `proposed_message`, `intent`, `lead_temperature`, `recommended_action`, `lead_score_snapshot`, `classification`, `status`.

`recommended_action` : `reply` | `qualify` | `suggest_myswym` | `handoff_human` | `ignore` | `followup_later`.

### Admin

- UI : `/admin/arthur-shadow`
- API : `GET /api/admin/arthur-shadow?status=pending`
- POST : `approve` | `reject` | `edit_approve` | `cancel`
- Toute action `send` / `approve_and_send` / enable live → **403**

```bash
npm run test:arthur:shadow
```

**Hors H1** : envoi après validation (éventuel H2) — non implémenté.

---

## Ops Instagram

> **H1** : Shadow Mode ON par défaut — les DM sont analysés, la réponse est proposée dans `/admin/arthur-shadow`, **aucun envoi auto**.

### Credentials manquants

Sans `META_*` / `INSTAGRAM_ACCESS_TOKEN` → mode mock automatique.  
Documenter dans Meta App Dashboard : callback `https://myswym.app/api/instagram/webhook`.

### Tester Instagram mock

```bash
npm run test:arthur:instagram

# POST /api/instagram/mock
# header: x-myswym-instagram-mock: $ARTHUR_AI_INTERNAL_SECRET
# body: {
#   "senderId": "ig_test_1",
#   "text": "PLAN triathlon 12 semaines",
#   "referral": { "reel_id": "reel_123", "campaign": "ow_summer", "source": "ADS" }
# }
```

---

## Sécurité

```text
JWT / secret serveur → userId serveur → authorization → tool
```

- Jamais `model → userId → Supabase`
- `external_user_id` Instagram ≠ `auth.users.id`
- Mapping uniquement via `ai_identity_links.status = verified`
- Pas d’auto-création de compte / plan depuis Instagram
- `service_role` bypasse RLS → filtre obligatoire dans le code
- Checkout : JWT user vers Edge Function (secret Stripe reste côté Supabase)
- Webhook : `X-Hub-Signature-256` (sauf mock)

Limites tool loop : max 4 tours, max 3 tools / tour.

---

## Personnalité

Prompt : `api/_lib/arthur-ai/prompt.ts` + table `ai_prompt_versions` (`active=true`).

Pour changer le ton : activer une nouvelle ligne dans `ai_prompt_versions` (un seul `active`).

---

## Tester localement

```bash
# Migrations Arthur
# supabase db push   # … + 20260809170000_arthur_ai_shadow_h1

npm run test:arthur
npm run test:arthur:instagram
npm run test:arthur:growth
npm run test:arthur:conversion
npm run test:arthur:optimize
npm run test:arthur:production
npm run test:arthur:shadow

# Chat mock
ARTHUR_AI_MOCK=1 \
ARTHUR_AI_INTERNAL_SECRET=dev \
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
# POST /api/ai/chat
# headers: x-myswym-arthur-secret: dev
# body: { "message": "Je prépare un triathlon", "testUserId": "<uuid>" }
```

Auth prod : `Authorization: Bearer <supabase_access_token>`.

---

## Ajouter un tool

1. Créer `api/_lib/arthur-ai/tools/mon-tool.ts`
2. Enregistrer dans `tools/index.ts` (`getArthurOpenAITools` + `executeArthurTool`)
3. Filtrer toujours `ctx.auth.userId`
4. Retourner `{ success, data, error }`
5. Tracker via `ai_events` si action métier
6. Documenter ici + tests

---

## Événements `ai_events`

`dm_received`, `ai_response`, `lead_qualified`, `myswym_link_sent`, `signup`,  
`plan_requested`, `plan_created`, `plan_creation_blocked`,  
`profile_updated`, `checkout_started`, `subscription_started`,  
`instagram_webhook_received`, `instagram_message_sent`, `instagram_message_failed`,  
`identity_link_verified`,  
`followup_planned`, `followup_suppressed`, `followup_approved`, `followup_sent`,  
`followup_failed`, `followup_replied`, `followup_converted`,  
`response_scored`, `conversation_analyzed`, `cta_sent`, `cta_clicked`, `knowledge_served`,  
`rate_limited`, `cost_budget_soft`, `cost_budget_hard`, `offline_fallback`,  
`human_takeover_started`, `human_takeover_released`, `feature_flag_blocked`,  
`shadow_proposal_created`, `shadow_proposal_approved`, `shadow_proposal_rejected`,  
`shadow_send_blocked`

Tokens / modèle / `cost_estimate` sur les réponses IA.
