# Checklist Arthur — ForSwim (max autonomie)

Mis à jour : 11 oct. 2026 (correctifs post-renommage P0+P1).

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
- [x] P0 : PR #145 (`fix/post-renommage-p0`) paywall + `/api/` hors 308 + no-undef
- [x] P0-3 : Edge Functions redéployées à la main (CORS forswim OK)
- [x] P1-1 : regex IA Instagram forswim+myswym (`fix/post-renommage-p1`)
- [x] P1-2 : `.env.local` / `.env.production.local` EMAIL_* → ForSwim (local)
- [x] P1-4 : `public/sitemap.xml` + `scripts/build-sitemap.mjs` supprimés (plugin Vite = source)
- [x] P1-6 : `.audit-src.tar.gz` supprimé

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
- [ ] Facebook / LinkedIn / App Store slug `myswym` (comptes externes, P1-5 signalés)
- [ ] `admin@myswym.app` (volontairement inchangé)
- [ ] staging.myswym.app : **pas** de 301 (reste dual)
- [x] Articles blog PROD (+ DEV) : MySWYM → ForSwim dans `contenu`

---

## À faire toi (hors code)

1. [ ] Vercel Domains : retirer redirect dashboard myswym si encore là (**après** merge P0-2)
2. [ ] GitHub secret `SUPABASE_ACCESS_TOKEN`
3. [ ] Telegram webhook → `https://www.forswim.app/api/telegram/webhook`
4. [ ] Meta webhook → `https://www.forswim.app/api/instagram/webhook`
5. [ ] Strava callback domain = `www.forswim.app`
6. [ ] Vercel + Supabase secrets : `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_CONTACT_TO`, `APP_URL`, `LATEST_APP_VERSION`, `FORCE_UPDATE_MESSAGE`
7. [ ] ASC : prix 8,99 / 59,99 + intro 7 j, puis build forswim

## STOP / décision Arthur

- [ ] **P1-3** : quelle version fait foi ? Xcode `1.1` (build 40/41), `vite` `1.0.1`, prod `/api/app-version` `1.0.0` — aligner puis pousser staging après ta réponse. Ne pas toucher `MIN_SUPPORTED_APP_VERSION`.
