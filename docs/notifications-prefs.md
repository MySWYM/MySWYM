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

États UI (alignés Réglages iPhone) :
- **iOS denied** : bandeau + CTA « Ouvrir Réglages » (jamais de faux « activées »).
- **iOS prompt** : CTA « Activer » → popup système.
- **iOS granted** : switch MySWYM (opt-in local) + catégories si ON.
`active` = OS `granted` **et** opt-in MySWYM. Resync au retour app (Réglages → ON → heal).

Popup Apple (système) : à la fermeture du celebrate de la **1ʳᵉ séance validée sur cet iPhone**
(`myswym_ios_first_session_${userId}`), pas la 1ʳᵉ séance du compte (web→iOS inclus).

## Technique

1. `user_metadata.notification_prefs` (`src/lib/notification-prefs.js`)
2. Filtre locales : `sync-local-notifications.js` + `notifyBadgeEarned`
3. Filtre APNs : `api/_lib/push/notify-user.ts` (`category: buddy|support|…`)
4. UI : `IosNotificationsPanel` dans `src/profile/IosSettings.jsx`
