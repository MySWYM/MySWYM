# Checklist Arthur — ForSwim (max autonomie)

Mis à jour : 11 oct. 2026 (soir).

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

### Stripe custom email (toi, Dashboard)

Settings → Customer emails → custom domain `forswim.app` → ajouter chez OVH **exactement** les TXT/CNAME affichés (ownership + Mail From + DKIM).  
DMARC déjà OK : `v=DMARC1; p=none;` (ne pas mettre Stripe dans le TXT `_dmarc`).

### iOS Store

- [x] Fichier prêt : `public/brand/app-store-icon-1024.png`
- [ ] Upload App Store Connect + « push TestFlight » quand tu veux

### Autre

- [ ] Instagram `@myswym.app` → nouveau handle (hors code)
- [ ] staging.myswym.app : **pas** de 301 (reste dual)
- [x] Articles blog PROD (+ DEV) : MySWYM → ForSwim dans `contenu`
