# Smoke staging MySWYM

Checklist manuelle après chaque merge vers `staging` (téléphone réel + desktop).  
Base : https://staging.myswym.app

## Avant

- [ ] Deploy Vercel staging vert
- [ ] Hard refresh (ou Version Gate « Mettre à jour »)
- [ ] Compte essai/premium de test prêt

## 1. Auth & déconnexion

- [ ] `/connexion` affiche l’écran login (pas le questionnaire)
- [ ] Connexion OK → `/app` avec plan ou Programme
- [ ] **Déconnexion** → URL `/connexion` (pas `/app` / quiz)
- [ ] Recharger `/connexion` déconnecté → reste sur login

## 2. Plan & sync

- [ ] Ouvrir Accueil + Programme : séances visibles
- [ ] Valider / marquer une séance → reste après refresh
- [ ] Mettre l’onglet en arrière-plan 30s → revenir : plan intact
- [ ] (Optionnel) 2ᵉ appareil : progression la plus récente gagne

## 3. Génération / Loading

- [ ] Changer fréquence programme → Loading puis retour Programme
- [ ] Si erreur réseau simulée : toast, **pas** Loading infini (>25s)

## 4. Navigation mobile

- [ ] Scroller bas de page → changer d’onglet → **en haut**
- [ ] Re-tap onglet actif → remonte en haut
- [ ] Fermer feedback séance → scroll OK

## 5. Conversion / checkout

- [ ] Ouvrir paywall → Stripe test → **Cancel** → plan aperçu encore là + modal
- [ ] Success (si test) → Premium / toast OK

## 6. Buddy (si Premium hors essai)

- [ ] Onglet Binômes visible après ≥1 séance
- [ ] Profil : numéro + consentements
- [ ] Envoi OTP : message clair si réseau KO
- [ ] Code faux → erreur lisible ; code OK → « Numéro vérifié »

## PostHog (consent analytics ON)

Filtrer events staging :

| Event | Quand |
| --- | --- |
| `ui_error` | Crash boundary / window / promise / buddy OTP |
| `generation_failed` | Timeout Loading / échec generate |

Props utiles : `context`, `reason`, `error_kind` (jamais email / téléphone / notes).

## E2E auto

Une fois : `npx playwright install chromium`

```bash
npm run test:e2e
# ou contre staging :
npm run test:e2e:staging
```
