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

## Suite maintenant (toi, ~5 min) — Supabase PROD

### 1. Site URL

Auth → URL Configuration → **Site URL** :

```
https://www.forswim.app
```

(avant : `https://www.myswym.app`)

Garder en Redirect URLs :

```
https://www.forswim.app/**
https://forswim.app/**
https://www.myswym.app/**
https://myswym.app/**
myswym://auth/callback
```

### 2. Sujets e-mails auth (PROD + DEV)

| Template | Subject |
| --- | --- |
| Confirm signup | Confirme ton compte ForSwim |
| Reset password | Réinitialise ton mot de passe ForSwim |
| Magic Link | Ton lien ForSwim |
| Invite user | Invitation ForSwim |
| Change email | Confirme ton nouvel e-mail ForSwim |

Dans chaque template HTML : remplacer « MySWYM » visible par « ForSwim » si encore présent.

### 3. DEV (optionnel)

Site URL DEV : `https://staging.forswim.app` (ou laisser localhost).

---

## Plus tard (optionnel)

- [ ] Stripe Dashboard → custom email domain (TXT + CNAME Stripe ; DMARC = `v=DMARC1; p=none;` suffit)
- [ ] TestFlight / icône App Store Connect 1024 (quand tu dis « push TestFlight »)
- [ ] Instagram `@myswym.app` → nouveau handle (hors code)
- [ ] staging.myswym.app : **pas** de 301 (reste dual)
