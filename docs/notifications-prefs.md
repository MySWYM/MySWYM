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

Master iOS : permission système (Réglages iPhone). Sans master, les toggles push sont grisés.

## Technique

1. `user_metadata.notification_prefs` (`src/lib/notification-prefs.js`)
2. Filtre locales : `sync-local-notifications.js` + `notifyBadgeEarned`
3. Filtre APNs : `api/_lib/push/notify-user.ts` (`category: buddy|support|…`)
4. UI : `IosNotificationsPanel` dans `src/profile/IosSettings.jsx`
