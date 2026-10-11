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

### iOS Store / prochain TestFlight

- [x] Fichier prêt : `public/brand/app-store-icon-1024.png`
- [x] `Products.storekit` : 8,99 + intro 7 j ; paywall save 44 % ; cartes binôme soft mist + i18n
- [ ] **Toi ASC** : prix 8,99 / 59,99 + offre intro 7 j sur les SKUs `app.myswym.ios.premium.*`
- [ ] « push TestFlight » quand tu veux (build + WhatToTest déjà prêts)

### Autre

- [ ] Instagram `@myswym.app` → nouveau handle (hors code)
- [ ] staging.myswym.app : **pas** de 301 (reste dual)
- [x] Articles blog PROD (+ DEV) : MySWYM → ForSwim dans `contenu`

---

## Versions iOS (11 oct. 2026)

- [x] Dernière sortie : build **39** / marketing `1.0.1`
- [x] Piste en cours : marketing **1.1**, build courant **41** (Xcode + vite + `DEFAULT_LATEST`)
- [x] `MIN_SUPPORTED_APP_VERSION` inchangé (`1.0.0`)
- [ ] Toi Vercel : `LATEST_APP_VERSION=1.1` au déploiement de la 1.1
- [ ] « push TestFlight » quand tu veux la build 41

## À faire toi (hors code) — post-renommage 11 oct.

1. [ ] **Vercel → Domains** : retirer redirect dashboard myswym si encore là (après deploy P0-2).
2. [ ] **GitHub → Secrets** : `SUPABASE_ACCESS_TOKEN`
3. [ ] **Telegram** : webhook → `https://www.forswim.app/api/telegram/webhook`
4. [ ] **Meta** : webhook → `https://www.forswim.app/api/instagram/webhook`
5. [ ] **Strava** : callback domain = `www.forswim.app`
6. [ ] **Vercel + Supabase** : `EMAIL_FROM`, `EMAIL_REPLY_TO`, `APP_URL`, `LATEST_APP_VERSION=1.1`
7. [ ] **ASC** : prix 8,99 / 59,99 + intro 7 j, puis build forswim
