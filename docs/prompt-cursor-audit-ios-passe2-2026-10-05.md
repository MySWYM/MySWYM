# Prompt Cursor — audit iOS, 2e passe (5 oct. 2026, après commit e9d91dc)

Corrige un point à la fois, montre le diff, lance `npm run test:native`, attends mon OK. Ne touche à rien d'autre.

## 1 — RÉGRESSION : « Mot de passe oublié » cassé sur iPhone
`completeNativeOAuthFromUrl` (src/lib/native-oauth.js) n'accepte plus que `code`. Or le reset iOS passe par `api/contact.ts` → `admin.auth.admin.generateLink({ type: "recovery" })`, qui renvoie vers `myswym://auth/callback?reset=1#access_token=…&refresh_token=…&type=recovery` (flux implicite, pas de `code`). Résultat : NATIVE_OAUTH_NO_CREDENTIALS, l'utilisateur ne peut plus changer son mot de passe.
Fix recommandé : dans `api/contact.ts`, ne plus envoyer `action_link` mais construire `myswym://auth/callback?reset=1&token_hash=<data.properties.hashed_token>&type=recovery` (et l'équivalent web `/app?reset=1&token_hash=…&type=recovery`). Dans `completeNativeOAuthFromUrl`, si `token_hash` + `type=recovery` → `supabase.auth.verifyOtp({ token_hash, type: "recovery" })`. Ne pas réintroduire `setSession` avec des jetons venus de l'URL. Ajouter un test.

## 2 — Déconnexion : le jeton push se réenregistre tout seul
`deleteThisDevicePushToken` appelle `readCachedNativeToken()`, qui commence par `AppBadge.replayApnsToken()`. Le replay déclenche le listener `registration` → `upsertDeviceToken` → POST register_token, en parallèle du delete. Le jeton est souvent réinscrit pour l'utilisateur qui se déconnecte, et le téléphone continue de recevoir ses push.
Fix : lire le jeton avec `AppBadge.getApnsToken()` seulement (pas de replay) dans le chemin de suppression ; ajouter un drapeau `signingOut` qui fait ignorer le listener `registration` jusqu'au prochain SIGNED_IN. Même chose dans `disableNativeNotifications`.

## 3 — Bouton Google/Facebook bloqué si on ferme Safari
Dans `AuthScreen.jsx` (`startOAuth` natif), si l'utilisateur ferme la feuille Safari (« OK ») sans se connecter, aucun événement n'arrive : `busy` reste à "google"/"facebook", tous les boutons restent sur « Redirection… ». Fix : écouter `Browser.addListener("browserFinished")` pendant le flux et faire `setBusy(null)` si aucun `myswym:native-oauth-done` n'est arrivé.

## 4 — Achat Apple rejeté en boucle
Si `apple-iap-sync` répond 409 « déjà lié à un autre compte », la transaction n'est jamais finie : StoreKit la renvoie à chaque lancement et l'app rappelle le serveur à chaque fois. Fix : sur ce 409 précis (ajouter un `code` côté serveur, ex. `apple_tx_other_account`), finir la transaction quand même et afficher un message clair.
Aussi : après un achat dont la synchro échoue (réseau), proposer « Réessayer » qui rejoue `syncThenFinish` avec le même jws au lieu d'un simple message d'erreur (sinon l'utilisateur attend le prochain lancement).

## 5 — Webhook Apple : utilisateur supprimé
Si `appAccountToken` pointe vers un compte supprimé, `getUserById` renvoie null → throw → 400 → Apple renvoie la notification en boucle. Répondre 200 `{ received: true, linked: false }` dans ce cas.

## 6 — Petit
- Lint : `src/AuthScreen.jsx:46` exporte une fonction depuis un fichier composant (react-refresh/only-export-components). Déplacer l'export dans un fichier lib.
- Révocation à distance (App.jsx ~8850) : appelle `signOut` sans `setScreen("auth")` / `navigate("/connexion")` comme `handleSignOut`. Mutualiser dans une seule fonction.
