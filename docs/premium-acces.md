# Accès Premium ForSwim

Décisions du 12 octobre 2026. Les séances, `PLAN_VERSION` et les identifiants Stripe / App Store ne changent pas ici.

## Règle

- Essai 7 jours avec carte, une fois par compte (`trial_used`). Web : Stripe. iOS : offre d'introduction App Store.
- Prix : 8,99 €/mois ou 59,99 €/an, identiques sur le web et l'iPhone.
- Sans essai ni abonnement : les séances sont en pause.
- Les binômes sont réservés à un abonnement payé. L'essai ne les ouvre pas.
- Compte anonyme iOS : quiz, plan, paiement, app, puis enregistrement du compte.

## Ce que le code fait

- Apple `offerType` 1 encore couvert = statut `trial`, et `trial_used` passe à vrai. Le renouvellement redevient `active`.
- Le paywall ne dit « gratuit » qu'après la réponse StoreKit, et seulement si l'identifiant Apple est encore éligible.
- Lier Apple sur un anonyme réutilise le même `user.id`. Si la transaction est sur un autre anonyme, elle est transférée. Un vrai compte déjà lié répond 409.
- `has_paid_access` bloque l'annuaire, la demande et les téléphones. Répondre, annuler, bloquer et signaler restent ouverts.
- Fin d'essai non résiliée : l'abonnement démarre, les séances continuent. La pause n'est dite que si l'essai est résilié.
- La fiche essai (J-2, une fois) propose l'annuel ou la gestion. Pas de nouveau checkout pendant l'essai. Un essai Stripe est annulé avant d'enregistrer un achat Apple.
- Retour Stripe : le gel reste fermé le temps de la synchro, 30 secondes au plus.
- Une empreinte de carte déjà liée à un autre compte annule l'essai Stripe tout de suite. Apple n'est pas concerné.

## À appliquer à la main

- Migration `20261012150000_buddy_paid_access.sql`
- Migration `20261012180000_trial_card_fingerprints.sql`
- Les fonctions Edge partent avec le merge vers `main`, pas depuis l'agent.
- Manual linking Supabase : si c'est coupé, le client retombe sur la connexion Apple classique.
- Portail Stripe : le passage mensuel vers annuel se fait dans le portail.
- App Store Connect : intro 7 jours sur les deux produits.
- Resend : `trial.ending_soon` est transactionnel, pas un consentement newsletter.

## Non testé sur appareil

- iPhone sandbox (intro éligible, intro déjà utilisée, restore autre compte, fiche J-2).
- Manual linking désactivé sur le projet Supabase.
- Les migrations ne sont pas appliquées.
- Retour Stripe live et seconde carte identique.
