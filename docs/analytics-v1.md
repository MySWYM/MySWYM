# MySWYM — Analytics produit V1 (PostHog)

> Abstraction unique : `src/lib/analytics.js` (`track` / `identify` / `reset`).  
> Ne pas appeler `posthog-js` ailleurs. Ne pas envoyer de contenu de séance ni notes libres.

## Variables d’environnement

```text
VITE_PUBLIC_POSTHOG_KEY=<project api key>
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

À définir aussi sur Vercel (Production + Preview). Sans clé, les appels sont no-op.

Consentement cookies requis (`myswym_cookie_consent_v1=accepted`) avant tout envoi PostHog.

---

## Événements V1

| Événement | Déclencheur | Props principales | Anti-doublon |
|-----------|-------------|-------------------|--------------|
| `landing_viewed` | Mount `/` (landing) | `source` | session once |
| `signup_started` | CTA inscription / auth register | `source` | onceKey par source |
| `signup_completed` | Compte créé / auth depuis `/inscription` | — | `userId` |
| `onboarding_started` | Écran onboarding step 1 | person props | `userId` |
| `onboarding_completed` | Plan généré depuis questionnaire | person props | `userId+goal` |
| `plan_created` | Création réelle d’un plan | level, objective, frequency, duration, totalWeeks | `planId` |
| `plan_viewed` | Onglet home/plan avec plan actif | person + totalWeeks | `planId` / session |
| `session_viewed` | Ouverture détail séance | level, objective, planWeek, sessionIndex, intent, volume, phase | plan+week+index |
| `session_started` | Copie séance / menu validation / Terminer | level, objective, planWeek, sessionIndex, volume | idem |
| `session_completed` | Marquée terminée | + plannedVolume, actualDistance, duration | idem |
| `session_missed` | Oubliée / pas faite | + reason | idem+reason |
| `feedback_submitted` | Feedback séance ou semaine | difficulty, completed, level, objective, planWeek, sessionIntent, pain? | at / week |
| `adaptation_applied` | `_weeklyAdaptation` réelle | action, primaryLever, magnitude, confidence, … | plan+week+action |
| `paywall_viewed` | Modal upgrade affichée | context, access_status | context+plan |
| `trial_started` | Sync Stripe → status trial | trial_ends_at | `userId` |
| `subscription_started` | Sync Stripe → status active | premium | `userId` |
| `app_opened` | Boot app (1× / onglet) | premium? | sessionStorage |
| `ui_error` | ErrorBoundary, `window.onerror`, `unhandledrejection`, Buddy OTP | reason, context, error_kind, pathname | — |
| `plan_sync_applied` | Re-sync visibility a réellement appliqué un merge remote | reason (`progress_up` / `plan_count` / …), context | — |
| `generation_failed` | Timeout Loading / échec génération plan | reason, context | — |

> Observabilité crashes : **PostHog only** (`trackUiError` / `installGlobalErrorHandlers`). Pas de Sentry pour l’instant.

Person properties (`identify`) : `level`, `objective`, `frequency`, `sessionDuration`, `poolLength`, `premium`.

**Jamais envoyés** : email, nom, notes, comment, details de séance, `_engineHistory`, `capacityDimensions`, rationale textuel.

---

## Funnels PostHog (à créer dans l’UI)

### Funnel principal

```text
signup_completed
→ onboarding_completed
→ plan_created
→ session_started
→ session_completed
→ trial_started
→ subscription_started
```

### Activation

```text
plan_created → session_started → session_completed
```

### Coaching

```text
session_completed → feedback_submitted → adaptation_applied
```

---

## Cohortes / breakdowns

Person / event properties :

- `level` : `decouverte` | `regulier` | `sportif` | `performance`
- `objective` : `eau_libre` | triathlon | `nager_progresser` / progression | course piscine…
- `frequency`, `sessionDuration`, `poolLength`, `premium`

Comparer Découverte vs Régulier vs Sportif vs Performance ; eau libre vs triathlon vs nager_progresser vs course piscine.

---

## Rétention

Pas de système custom. Dans PostHog Retention :

- Events : `app_opened`, `session_completed`
- Fenêtres : D1 / D7 / D14 / D30 et W2 / W4

---

## Dashboard « MySWYM — Product V1 » (checklist UI)

### Acquisition
- signups (`signup_completed`)
- onboarding completion
- plans created

### Activation
- plan → first session (`plan_created` → `session_started`)
- first session completion

### Engagement
- sessions / user
- WAU
- D7 / D30 (`app_opened` / `session_completed`)

### Coaching
- feedback distribution (`difficulty`)
- adaptation rate
- session completion

### Business
- paywall views
- trials
- subscriptions
- conversion trial → paid

---

## Legacy

`trackEvent(...)` continue d’écrire dans Supabase `conversion_events` (funnels historiques).  
Les nouveaux parcours produit passent par `track(...)` → PostHog.

**Pas de Google Analytics (gtag / GA4)** — volontaire. Un seul tracker produit : PostHog, après consentement cookies. Ne pas dupliquer avec GA.

---

## Tests

```bash
npm run test:analytics
```

Parcours manuel : accepter cookies → nouveau compte → onboarding → plan → séance (détail → copie/terminer) → feedback → paywall → trial. Vérifier Live events PostHog + `reset` au logout.
