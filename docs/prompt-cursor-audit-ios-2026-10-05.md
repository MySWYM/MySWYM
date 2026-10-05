# Prompt Cursor — corrections audit iOS (5 oct. 2026, build 33)

Tu es dans le repo MySWYM (Capacitor iOS + Supabase edge functions + API Vercel).
Corrige les bugs ci-dessous **un par un, dans l'ordre**. Après chaque bug : lance les tests concernés (`npm run test:native`, tests Deno de `supabase/functions/_shared`), montre-moi le diff, et attends mon OK avant de passer au suivant. Ne touche à rien d'autre. Ne bump pas le build iOS.

## Bug 1 — CRITIQUE : vérification des reçus Apple contournable
Fichier : `supabase/functions/_shared/apple-jws.ts` (`verifyAppleJws`).
Problème : on vérifie seulement que la chaîne x5c remonte à une racine Apple. Aucun contrôle des OID, de basicConstraints, de la longueur de chaîne ni des dates. Avec un certificat de développeur Apple quelconque, on peut forger un JWS accepté par `apple-iap-sync` (Premium gratuit) et par `apple-iap-webhook`.
À faire :
- exiger `x5c.length === 3` (feuille, intermédiaire, racine) ;
- la racine doit être une racine Apple connue (empreinte SHA-256 déjà listée) ;
- l'intermédiaire doit avoir l'extension OID `1.2.840.113635.100.6.2.1` et être CA (basicConstraints) ;
- la feuille doit avoir l'extension OID `1.2.840.113635.100.6.11.1` ;
- vérifier les dates de validité des certificats (à la date `signedDate` du payload, comme fait Apple) ;
- supprimer le chemin `anyTrusted` (une racine Apple au milieu de la chaîne ne doit rien valider).
Ajoute des tests : chaîne valide acceptée ; chaîne de 2 certs refusée ; feuille sans l'OID StoreKit refusée.

## Bug 2 — Achat payé mais pas Premium si la synchro serveur échoue
Fichiers : `ios/App/App/AppleIapPlugin.swift` (`purchase`), `src/lib/native-iap.js`.
Problème : `transaction.finish()` est appelé AVANT que `apple-iap-sync` ait enregistré l'achat. Si le réseau coupe, l'utilisateur a payé, la transaction est close, il n'est pas Premium.
À faire : ne plus appeler `finish()` dans `purchase`. Retourner `transactionId` au JS. Ajouter une méthode plugin `finish({ transactionId })` que le JS appelle seulement après succès de `syncAppleJws`. Les transactions non finies seront redélivrées par StoreKit (voir bug 3).

## Bug 3 — Achats différés jamais liés au compte
Fichiers : `AppleIapPlugin.swift` (`load`, `Transaction.updates`), `src/native/bootstrap-native.js` ou `App.jsx`.
Problème : le plugin émet `transactionUpdated` (Ask to Buy approuvé, paiement PENDING finalisé, achat sur un autre appareil, code promo) mais aucun listener JS n'existe. Ces achats sont finis sans jamais être synchronisés.
À faire :
- dans `Transaction.updates`, ne plus appeler `finish()` ; émettre l'événement avec `retainUntilConsumed: true` et inclure `transactionId` ;
- côté JS, au démarrage quand une session existe : écouter `transactionUpdated` → `syncAppleJws(jws)` → puis `finish(transactionId)` ;
- passer `appAccountToken` = UUID de l'utilisateur Supabase dans `product.purchase(options: [.appAccountToken(uuid)])`, et dans `apple-iap-webhook`, si `findUserIdByOriginalTx` ne trouve rien, retrouver l'utilisateur via `appAccountToken`.

## Bug 4 — Jeton push partagé entre comptes sur le même iPhone
Fichiers : `api/_lib/push/http.ts` (event `register_token`), `src/App.jsx` (`handleSignOut`, `handleDeleteAccount`, révocation via heartbeat).
Problème : le même token APNs reste lié à l'ancien compte après déconnexion ou changement de compte → le téléphone reçoit les notifs (binôme, support) de plusieurs comptes.
À faire :
- dans `register_token` : supprimer ce token pour tous les `user_id` différents de l'utilisateur courant avant l'upsert ;
- à la déconnexion (normale ET révocation distante) : supprimer la ligne `device_push_tokens` de CET appareil (token lu via `AppBadge.getApnsToken`) avant `signOut`.

## Bug 5 — Couper les notifs sur un iPhone les coupe partout
Fichier : `src/lib/native-push.js` (`disableNativeNotifications`).
Problème : `delete().eq("user_id", uid)` supprime les tokens de tous les appareils.
À faire : filtrer aussi sur le token de l'appareil courant.

## Bug 6 — Notifications locales non annulées à la déconnexion
Appeler `cancelMySwymLocalNotifications()` dans `handleSignOut` et dans la révocation distante (heartbeat `force_logout` / `revoked`). Mutualiser : la révocation distante doit passer par le même nettoyage que `handleSignOut` (cache identité, push, notifs locales).

## Bug 7 — Lien de retour traité deux fois au démarrage (À VÉRIFIER d'abord)
Fichier : `src/native/bootstrap-native.js` (`installNativeOAuthReturn`).
Hypothèse : au lancement à froid, `App.getLaunchUrl()` ET l'événement `appUrlOpen` traitent la même URL → le code PKCE / Strava est échangé deux fois, le 2e échoue et affiche une erreur. Ajoute d'abord un log pour confirmer, puis dédupliquer (Set des URLs déjà traitées).

## Bug 8 — Strava : pas de vrai `state` anti-détournement
Fichier : `src/lib/native-strava.js`.
`state` est fixe (`strava_connect_ios`). Générer un state aléatoire, le stocker localement, le vérifier au retour (`completeNativeStravaFromUrl`) et dans `handoffStravaIosIfNeeded` (garder le préfixe pour détecter iOS, ex. `strava_connect_ios.<nonce>`).

## Bug 9 — OAuth : jetons de session acceptés dans le lien de retour
Fichier : `src/lib/native-oauth.js` (`completeNativeOAuthFromUrl`).
Le client est en PKCE, mais un lien `myswym://auth/callback#access_token=…&refresh_token=…` connecte l'utilisateur sur n'importe quel compte. N'accepter que `code`. Vérifier avant que le flux « mot de passe oublié » marche bien avec `code` seul.

## Bug 10 — Appel réseau push à chaque séance cochée
Fichier : `src/App.jsx`, effet vers la ligne 9675 (dépend de `plan`).
Sortir `registerNativePush()` de cet effet (le garder au login et au changement de préférence). Garder `syncLocalNotificationsFromState` dépendant de `plan`.

## Petits points (en dernier)
- `Info.plist` : retirer `UISceneStoryboardFile` de la config de scène (le SceneDelegate crée déjà sa fenêtre et son bridge). Tester que l'app démarre normalement.
- `Info.plist` : `UIRequiredDeviceCapabilities` `armv7` → `arm64`.
- `apple-iap-webhook` : vérifier que l'environnement de la notification (Sandbox/Production) correspond à celui attendu.

À la fin : ajoute une entrée datée dans le changelog/docs habituel et liste ce qui doit être testé sur un vrai iPhone (achat sandbox, Restaurer, Ask to Buy, changement de compte avec push, connexion Google et Strava à froid).
