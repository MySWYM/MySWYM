# Checklist Arthur — ForSwim (max autonomie)

Mis à jour : 11 oct. 2026 (correctifs post-renommage P0).

## Fait

- [x] Marque ForSwim (code / i18n / légal / e-mails display)
- [x] CORS dual `*.forswim.app` + `*.myswym.app`
- [x] Sites : www + staging forswim, 301 apex → www
- [x] 301 `myswym.app` / `www.myswym.app` → forswim (deployé via main)
- [x] Logos S + wordmark en-tête
- [x] Resend `forswim.app` + From `noreply@forswim.app`
- [x] `contact@forswim.app` = support / reply-to
- [x] Apple / Google redirect forswim
- [x] Supabase Redirect URLs forswim (Arthur)
- [x] P0-1 paywall `showTrialOffer` / `trialEligible` (branche `fix/post-renommage-p0`)
- [x] P0-2 `vercel.json` : `/api/` exclu des 308 hôte myswym (à merger puis tester curl)
- [x] P0-3 Edge Functions redéployées à la main (CORS `www.forswim.app` OK) ; CI encore sans secret

## Com (plus tard, pas maintenant)

Textes prêts ci-dessous quand tu voudras.

**IG / story**

```
MySWYM devient ForSwim.
Même app, mêmes séances, même compte.
→ forswim.app
```

**Mail nageurs — sujet :** MySWYM s’appelle maintenant ForSwim

```
Salut,

MySWYM devient ForSwim. Rien ne change pour toi :
ton compte, tes séances et ton abonnement restent les mêmes.

Nouveau site : https://www.forswim.app
Les anciens liens myswym.app continuent de fonctionner.

Arthur
```

---

## Supabase auth (fait 11 oct. 2026 soir)

- [x] Site URL PROD = `https://www.forswim.app` (Arthur)
- [x] Sujets + HTML Confirm / Magic link / Recovery → ForSwim (agent via API)
- [x] Invite / change email / notifs password+email → sujets ForSwim
- [x] DEV : Site URL `https://staging.forswim.app` + mêmes templates brandés

Redirect URLs à garder : forswim + myswym + `myswym://auth/callback`.

---

## Suite optionnelle

### Stripe custom email

- [x] DNS collés (Arthur, 11 oct. 2026) ; validation Stripe en cours (jusqu’à ~72 h)
- [ ] Badge Verified dans Stripe → mails reçus / factures depuis `@forswim.app`

### iOS Store

- [x] Fichier prêt : `public/brand/app-store-icon-1024.png`
- [ ] Upload App Store Connect + « push TestFlight » quand tu veux

### Autre

- [ ] Instagram `@myswym.app` → nouveau handle (hors code)
- [ ] staging.myswym.app : **pas** de 301 (reste dual)
- [x] Articles blog PROD (+ DEV) : MySWYM → ForSwim dans `contenu`

---

## À faire toi (hors code) — post-renommage 11 oct.

1. [ ] **Vercel → Domains** : sur `www.myswym.app` / `myswym.app`, retirer toute redirection dashboard (302 globale) si encore présente ; laisser le projet servir les domaines pour que les 308 `vercel.json` (hors `/api/`) s’appliquent. **Après** merge P0-2.
2. [ ] **GitHub → Secrets → Actions** : ajouter `SUPABASE_ACCESS_TOKEN` (sinon la CI `supabase-deploy.yml` skip).
3. [ ] **Telegram** : webhook → `https://www.forswim.app/api/telegram/webhook`.
4. [ ] **Meta (Instagram)** : webhook → `https://www.forswim.app/api/instagram/webhook`.
5. [ ] **Strava** : Authorization Callback Domain = `www.forswim.app`.
6. [ ] **Vercel env + Supabase secrets** : `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_CONTACT_TO`, `APP_URL`, `LATEST_APP_VERSION`, `FORCE_UPDATE_MESSAGE` (P1-2).
7. [ ] **App Store Connect** : prix 8,99 / 59,99 + intro 7 j, puis soumettre build forswim.

## Reste code (lot P1, pas encore mergé)

- [ ] P1-1 regex IA Instagram (forswim + myswym)
- [ ] P1-2 `.env.local` / `.env.production.local` EMAIL_* (local seulement)
- [ ] P1-3 versions iOS / `APP_VERSION` / `LATEST_APP_VERSION` (attente décision Arthur)
- [ ] P1-4 sitemap statique périmé
- [ ] P1-6 supprimer `.audit-src.tar.gz`
