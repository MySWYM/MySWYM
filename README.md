# MySWYM : plan d'entraînement natation personnalisé

**MySWYM** compose tes séances de natation à partir de 3 questions : objectif, niveau, fréquence.

Nager pour progresser, triathlon, eau libre, prépa diplôme (dont BNSSA). Plan structuré, prêt avant d'entrer dans l'eau. Essai Premium 7 jours, sans carte.

**Site :** [www.myswym.app](https://www.myswym.app) · **FR :** [www.myswym.app/fr](https://www.myswym.app/fr)

[Créer mon plan](https://www.myswym.app/fr) · [Tarifs](https://www.myswym.app/fr/tarifs) · [Comment ça marche](https://www.myswym.app/fr/comment-ca-marche) · [Blog natation](https://www.myswym.app/fr/blog) · [FAQ](https://www.myswym.app/fr/faq)

---

## Pour qui

MySWYM s'adresse aux nageurs qui savent déjà nager et veulent un **plan d'entraînement natation** clair, pas une séance au hasard.

| Objectif | Exemples |
| --- | --- |
| Nager / progresser | Endurance, technique, allures, volume régulier |
| Triathlon | Distance S, M, L, Ironman : la partie natation |
| Eau libre | Prépa open water, gestion d'allure |
| Diplômes | Prépa BNSSA et autres formats de sauvetage |

Bassin 25 m ou 50 m. Matériel optionnel (pull-buoy, planche, palmes, tuba). Jusqu'à 5 séances par semaine.

## Comment ça marche

1. Tu indiques ton objectif, ton niveau et ta fréquence.
2. Ton plan est calculé tout de suite, avec des règles d'entraînement (volumes, structure, allures). Pas d'IA qui invente une séance.
3. Chaque séance a une structure coach : échauffement, corps, retour au calme, plus un conseil concret.
4. Trop dur, trop facile, séance loupée : tu donnes un retour, le plan s'adapte.

## Ce qui est inclus

- Plan calé sur l'objectif, le niveau et la date d'événement
- 6 formats d'effort : endurance, seuil, vitesse, technique, pyramide, récup
- Allures et départs à partir de ton 100 m (quand tu l'as)
- Adaptation après feedback
- Suivi, badges, Strava, plusieurs objectifs en parallèle (Premium)

## Tarifs

Essai Premium **7 jours, sans carte**. Ensuite les séances se mettent en pause jusqu'à un abonnement.

- **9,99 €/mois** sans engagement
- **4,99 €/mois** sur 12 mois
- **52,99 €/an** en une fois

Détail : [myswym.app/fr/tarifs](https://www.myswym.app/fr/tarifs)

## Pages publiques

Le produit se range sous [www.myswym.app](https://www.myswym.app) (EN) et [www.myswym.app/fr](https://www.myswym.app/fr).

| FR | EN |
| --- | --- |
| [Accueil](https://www.myswym.app/fr) | [Home](https://www.myswym.app/) |
| [Comment ça marche](https://www.myswym.app/fr/comment-ca-marche) | [How it works](https://www.myswym.app/how-it-works) |
| [Tarifs](https://www.myswym.app/fr/tarifs) | [Pricing](https://www.myswym.app/pricing) |
| [FAQ](https://www.myswym.app/fr/faq) | [FAQ](https://www.myswym.app/faq) |
| [Avis](https://www.myswym.app/fr/avis) | [Reviews](https://www.myswym.app/reviews) |
| [Blog](https://www.myswym.app/fr/blog) | [Blog](https://www.myswym.app/blog) |
| [Contact](https://www.myswym.app/fr/contact) | [Contact](https://www.myswym.app/contact) |

Articles utiles :

- [Plan natation débutant](https://www.myswym.app/fr/blog/plan-natation-debutant)
- [Programme natation triathlon](https://www.myswym.app/fr/blog/programme-natation-triathlon)
- [Comment réussir le BNSSA](https://www.myswym.app/fr/blog/comment-reussir-bnssa)
- [Personnalisation 100 m](https://www.myswym.app/fr/blog/personnalisation-100m-natation)
- [Glossaire natation](https://www.myswym.app/fr/blog/glossaire-natation)

## Stack

App web React + Vite, i18n FR/EN, API Vercel, auth et data Supabase, paiements Stripe. App iOS via Capacitor.

```bash
npm install
npm run dev
