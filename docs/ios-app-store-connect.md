# Fiche App Store Connect : MySWYM iPhone

Prêt à coller. Ne pas uploader ni soumettre la review tant qu’Arthur n’a pas dit **push TestFlight** puis **pousse sur iOS**.

Binary : iPhone only (`TARGETED_DEVICE_FAMILY = 1`). Pas de screenshots iPad.

## 1. Informations app

| Champ | Valeur |
| --- | --- |
| Nom | MySWYM |
| Sous-titre (30 car.) | Plan natation personnalisé |
| Bundle ID | `app.myswym.ios` |
| SKU | `myswym-ios` |
| Catégorie principale | Santé et forme |
| Catégorie secondaire | Sports |
| Langue principale | Français |
| URL support | https://www.myswym.app |
| URL marketing | https://www.myswym.app |
| Politique de confidentialité | https://www.myswym.app/politique-confidentialite |
| CGU | https://www.myswym.app/cgu |
| CGV | https://www.myswym.app/cgv |
| Copyright | 2026 Arthur Noël |
| Contact review | Arthur Noël · contact@myswym.app |

Mots-clés (100 car. max, 93 ici) :

```
natation,nage,triathlon,entrainement,coach,piscine,seance,plan,eau libre,crawl,nageur,ironman
```

Texte promotionnel (optionnel, 170 car.) :

```
Objectif, niveau, fréquence : MySWYM compose tes séances de natation. Essai 7 jours sans carte, puis 6,99 €/mois ou 59,99 €/an via l’App Store.
```

## 2. Description (FR)

```
MySWYM compose tes séances de natation. Objectif, niveau, fréquence : tu as un plan structuré, prêt pour le bassin.

Pour qui
Nager en piscine, triathlon, eau libre, prépa diplôme. Du débutant au nageur confirmé.

Ce que tu trouves dans l’app
• Des séances claires : échauffement, corps, retour au calme, plus un conseil coach
• Un plan qui s’adapte après ton feedback
• Tes allures si tu connais ton T100
• Une photo de profil, tes stats, et Buddy pour trouver un nageur près de toi (optionnel)

Essai et abonnement
7 jours d’essai offerts à la création du compte, sans carte. Ensuite les séances se mettent en pause jusqu’à un abonnement.

Sur l’iPhone : 6,99 €/mois sans engagement, ou 59,99 €/an. Paiement et résiliation via ton Apple ID (Réglages → Apple ID → Abonnements). L’accès reste actif jusqu’à la fin de la période déjà payée.

MySWYM n’est pas un dispositif médical et ne pose aucun diagnostic. Entraîne-toi selon ta forme. Eau libre : ne nage jamais seul.

Compte réservé aux personnes de 18 ans révolus.
```

Nouveautés (v1.0) :

```
Première version iPhone : plan, séances, essai 7 jours sans carte, et abonnement App Store.
```

## 3. Screenshots iPhone (6,9")

Obligatoire : au moins 1, viser 5 à 8. Formats : 1320×2868, 1290×2796 ou 1260×2736, portrait, PNG ou JPEG. Un jeu 6,9" suffit : Apple réduit pour les plus petits iPhones.

Prendre sur un iPhone réel (USB, `npm run cap:sync` puis Run), **compte Premium**, pas de données perso d’Arthur (prénom fictif, pas d’e-mail visible).

Ordre suggéré :

1. Accueil : séance du jour
2. Détail de séance (échauffement / corps / retour)
3. Semaine / plan
4. Analyse ou historique
5. Paywall IAP (prix 6,99 € / 59,99 € visibles)
6. Profil (photo optionnelle)

Pas d’iPad. Pas d’admin. Pas de simulateur si le rendu glass / safe area diffère.

## 4. Confidentialité App Store (nutrition label)

Doit coller au manifeste `ios/App/App/PrivacyInfo.xcprivacy`. Tracking Apple (ATT / IDFA) : **non**. Sur iOS natif la bannière cookies n’est pas affichée : PostHog reste opt-out. Les événements funnel internes (Supabase) restent. Pas de pub croisée.

Cocher **lié à l’identité**, **pas utilisé pour le suivi**, usages ci-dessous.

| Type | Usages | Détail produit |
| --- | --- | --- |
| Adresse e-mail | Fonctionnalités de l’app | Compte |
| Nom | Fonctionnalités de l’app | Prénom |
| Numéro de téléphone | Fonctionnalités de l’app | Buddy, après consentement |
| Identifiant utilisateur | Fonctionnalités de l’app | Compte Supabase |
| Photos | Fonctionnalités de l’app | Avatar |
| Santé | Fonctionnalités de l’app | Blessure / FC, consentement art. 9, facultatif |
| Forme et activité | Fonctionnalités + personnalisation | Plans, séances, feedback |
| Autre contenu utilisateur | Fonctionnalités de l’app | Bio, notes, messages Buddy |
| Historique des achats | Fonctionnalités de l’app | Statut Premium (Apple / web) |
| Assistance client | Fonctionnalités de l’app | Support in-app |
| Interactions avec le produit | Fonctionnalités + analytics | PostHog si cookies acceptés |
| Données de plantage | Fonctionnalités + analytics | Erreurs UI, PostHog si cookies acceptés |

Ne **pas** cocher : publicité, IDFA, localisation GPS, contacts, microphone.

Données de santé : jamais envoyées à PostHog (liste bloquée côté app).

## 5. Âge

Questionnaire contenu (aucune case violence / sexe / alcool / web non filtré) :

- Contenu généré par les utilisateurs : **oui** (avatar, bio Buddy, messages, notes)
- Filtrage / signalement / blocage : **oui** (Buddy : signalements, blocage, seuil de suspension)
- L’app n’est pas « Pour les enfants »

Résultat attendu : **12+**.

Le compte in-app exige **18 ans révolus** (case d’inscription). Ne pas forcer un rating store 17+ juste pour ça : 12+ décrit le contenu, 18 ans est une règle d’usage.

## 6. Comptes review

Sans ça, Apple ouvre un compte vide et refuse (Guideline 2.1).

Créer **deux** comptes web (même backend que l’app), mot de passe à coller dans App Store Connect seulement, **pas** dans git.

1. **Essai** (moins de 7 jours avant la soumission)
   - Compte tout neuf, essai actif
   - Sert à voir l’onboarding et les séances pendant l’essai
2. **Premium web** (Stripe, abonnement réel)
   - Sert à voir le catalogue complet, l’adaptation, le paywall « déjà Premium »
   - Plus sûr que l’essai : la review Apple peut durer plus de 7 jours

Coller dans « Notes de révision » (anglais, les reviewers le lisent) :

```
Demo accounts (same backend as the iPhone app):

1) Trial (7-day cardless trial, created just before submission)
Email: [ESSAI]
Password: [À COLLER ICI]

2) Premium (web Stripe subscription, full plans)
Email: [PREMIUM]
Password: [À COLLER ICI]

Sign in: open the app → Connexion (or /connexion).

Subscriptions: 6.99 EUR/month or 59.99 EUR/year via In-App Purchase. The 7-day trial is MySWYM’s own trial (no Apple ID card). After trial, workouts pause until a subscription.

Health data is optional (injury / heart rate) and is not a medical device. Skip health consent if you prefer. Buddy matching is optional.

This binary is iPhone only.
```

## 7. Autres cases ASC

- Chiffrement : **non exempté au-delà d’HTTPS** (`ITSAppUsesNonExemptEncryption = false`). Répondre Non à l’export compliance standard.
- Publicité IDFA : **non**. Pas d’ATT.
- Compte in-app : **oui**. Suppression du compte : **oui** (Réglages / profil).
- IAP : abonnements auto-renouvelables mensuel + annuel déjà prévus côté StoreKit. Vérifier que les produits App Store Connect ont le même ID que le code : `app.myswym.ios.premium.monthly` et `app.myswym.ios.premium.annual`.

## 8. Check photo de profil (USB, pas TestFlight)

Après `npm run cap:sync` + Run sur l’iPhone : Profil → Changer la photo.

- Bibliothèque : le système peut demander l’accès photos. La phrase Info.plist doit apparaître, pas de crash.
- Appareil photo : idem avec la phrase caméra.
- Si iOS 14+ passe par le sélecteur PHPicker, la permission photothèque peut ne pas s’afficher : normal, tant que ça ne crashe pas.
