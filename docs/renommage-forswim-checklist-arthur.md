# Checklist Arthur — ForSwim (max autonomie)

Mis à jour : 11 oct. 2026.

## Fait par l’agent (sans toi)

- [x] Marque ForSwim dans le code / i18n / légal / e-mails (display name)
- [x] CORS dual `*.forswim.app` + `*.myswym.app`
- [x] Vercel : `forswim.app` → `www.forswim.app` (301), `www.forswim.app` prod
- [x] Vercel : `staging.forswim.app` lié à la branche `staging`
- [x] Site prod : https://www.forswim.app répond
- [x] Site staging : https://staging.forswim.app répond (DNS OVH OK)
- [x] Supabase redirects (Arthur) PROD + DEV
- [x] `myswym.app` / `staging.myswym.app` inchangés (pas de 301 global encore)

---

## Toi — Supabase (fait si tu as collé les redirects)

### PROD (nageurs) — prioritaire

Auth → URL Configuration → **ajouter** :

```
https://www.forswim.app/**
https://forswim.app/**
```

**Garder :**

```
https://www.myswym.app/**
https://myswym.app/**
myswym://auth/callback
```

Site URL PROD : laisse `https://www.myswym.app` pour l’instant.

Email templates : MySWYM → ForSwim (sujets prêts ci-dessous).

### DEV (`ccsazffeyeybjnlvnppa`) — recette / USB

Auth → Redirect URLs → **ajouter** :

```
http://localhost:5173/**
http://127.0.0.1:5173/**
https://staging.myswym.app/**
https://staging.forswim.app/**
myswym://auth/callback
```

Site URL DEV : laisse localhost ou `https://staging.myswym.app`.

### Sujets e-mail auth (PROD + DEV)

| Template | Subject |
| --- | --- |
| Confirm signup | Confirme ton compte ForSwim |
| Reset password | Réinitialise ton mot de passe ForSwim |
| Magic Link | Ton lien ForSwim |
| Invite user | Invitation ForSwim |
| Change email | Confirme ton nouvel e-mail ForSwim |

---

## Apple / Google

- [x] Services ID `app.myswym.ios.web` + domains www + return URLs myswym + forswim
- [x] Code `APPLE_REDIRECT_URI` → `https://www.forswim.app/app`

**Supabase PROD** → Auth → Providers → Apple → Client IDs (si pas déjà) :

```
app.myswym.ios,app.myswym.ios.web
```

**Google** OAuth → JavaScript origins, **ajouter** (si pas fait) :

```
https://www.forswim.app
https://forswim.app
https://staging.forswim.app
```

---

## Resend / mail

- [x] Domaine `forswim.app` vérifié (Arthur, 11 oct. 2026)
- [x] Défauts code `EMAIL_FROM` → `ForSwim <noreply@forswim.app>`
- [x] `contact@forswim.app` (OVH) → reply-to / inbox / copy produit
- [ ] `support@forswim.app` quand la boîte existe (encore `support@myswym.app`)

---

## Com (prêt à poster quand tu veux)

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

## Cutover 301 (code prêt, déployer)

- [x] `vercel.json` : host `www.myswym.app` + `myswym.app` → `https://www.forswim.app/:path*` (301)
- [x] API iOS + reset mail → `www.forswim.app`
- [ ] **Déployer en prod** (merge staging → main / deploy) pour activer le 301
- [x] `EMAIL_FROM` @forswim.app (défauts code ; vérifier aussi Vercel env)
- [ ] staging.myswym.app : **pas** de 301 (reste en dual)

Google : tu as forswim en origins. Optionnel : rajouter `https://www.myswym.app` jusqu’au deploy du 301.
