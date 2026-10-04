# Préférences notifications MySWYM

Panneau **Profil → Réglages → Notifications** : onglets Push · E-mail.

## Produit

| Section | Comportement |
| --- | --- |
| Compte / sécurité | Toujours actif (pas de toggle) |
| Essai / facturation | Toujours actif (locales soft_premium, checkout) |
| Entraînement | séance, série/reprise, badges |
| Social | binômes, support |
| Produit | actus push, conseils / avis |
| E-mail Actus | = `newsletter_opt_in` + `notification_prefs.email.news` |

Activation : 1 CTA « Activer les notifications ». Si iOS a déjà autorisé, réactive sans popup.
Si iOS a refusé : CTA « Ouvrir Réglages ». Catégories visibles seulement une fois activées.
Opt-out MySWYM (switch « Notifications activées ») ≠ permission iOS.

## Technique

1. `user_metadata.notification_prefs` (`src/lib/notification-prefs.js`)
2. Filtre locales : `sync-local-notifications.js` + `notifyBadgeEarned`
3. Filtre APNs : `api/_lib/push/notify-user.ts` (`category: buddy|support|…`)
4. UI : `IosNotificationsPanel` dans `src/profile/IosSettings.jsx`
