# Catalogue i18n et contrôle au commit

Date : 5 oct. 2026. Statut : validé à l'oral, pas encore implémenté.

Le français est la source. Chaque phrase visible de l'app passe par `t("clé")`. Les autres langues viennent de `APP_LANGUAGES` dans `src/i18n/languages.js`. Ajouter une langue, c'est une entrée dans cette liste, puis les textes. Il n'y a pas de seconde liste.

Le contrôle bloque un commit qui ajoute une phrase française visible sans traduction. Le français déjà en dur est sur une liste de dettes et ne bloque pas.

## Déclencheur

Arthur valide un texte dans le chat. L'agent ajoute la clé française et toutes les autres langues dans le même changement. Le hook ne traduit pas et n'appelle aucune API.

## Sources

| Source | Rôle |
| --- | --- |
| `src/i18n/languages.js` | Seule liste de langues. |
| `src/i18n/locales/fr/*.json` | Source des phrases nouvelles. Namespaces actuels : `common`, `landing`, `settings`, `onboarding`. |
| `src/i18n/locales/<id>/*.json` | Traductions. Un fichier par namespace et par `id` de `APP_LANGUAGES`. |
| `src/i18n/app-copy.js` et `src/i18n/app-copy-extra.js` | Catalogue déjà en place. On n'y ajoute plus de clés. Le contrôle les lit quand même. |

`app-copy.js` importe `SUPPORTED_LANGS` depuis `languages.js`. La constante `LANGS` locale disparaît.

`nest()` ne recopie plus `en` ni `fr` quand une langue manque. `r()` dans `app-copy-extra.js` ne recopie plus l'anglais (`vals[i] ?? vals[1]`). Une langue absente reste une valeur vide, et le contrôle la refuse.

## Contrôle

Script : `scripts/i18n-check.mjs`. Commande : `npm run i18n:check`. Code de sortie 1 s'il y a au moins une violation. Chaque ligne affiche le fichier, la phrase, et le motif (`langue manquante : de`, `identique au français`, `placeholder`, `français en dur`).

Hook local : `scripts/git-hooks/pre-commit` appelle ce script. L'installation copie ce fichier vers `.git/hooks/pre-commit`. On ne change pas `git config`. L'agent lance `npm run i18n:check` avant un commit qui touche `src/` ou `src/i18n/`.

### Catalogue (toujours bloquant)

Pour chaque clé française, pour chaque `id` de `APP_LANGUAGES` sauf `fr` :

1. La valeur existe et n'est pas vide.
2. Elle n'est pas égale au français quand le français contient `à â ä é è ê ë ï î ô ù û ü ç œ` (ou la majuscule), un mot de la liste (connexion, retour, annuler, enregistrer, historique, paramètres, séance, nager, natation, bassin, matériel, objectif, niveau, semaine, aujourd'hui, continuer, réessayer), ou au moins deux mots.
3. Chaque jeton `{{nom}}` du français est présent, sans jeton en plus.
4. La valeur ne contient pas `—` (U+2014) ni `–` (U+2013).

Une chaîne entière identique est acceptée si elle est exactement l'un de : `MySWYM`, `mySWYM`, `Premium`, `T100`, `FAQ`, `OK`, `Apple`, `Google`, `Facebook`, `Strava`, `Garmin`.

Les 77 trous mesurés le 5 oct. 2026 sont corrigés dans le même commit que le script. Après ça, le catalogue n'a pas de liste de dettes.

Le contrôle lit les objets `ROWS` et `EXTRA_ROWS` avant le repli d'exécution.

### Français en dur (liste de dettes)

Scan de `src/**/*.{js,jsx,ts,tsx}`. Une chaîne littérale est une violation si elle contient un accent français de la liste ci-dessus, ou un mot de la liste de mots, sur au moins 4 caractères. `defaultValue` compte.

Ignorés :

- commentaires
- `*.test.js`, `*.test.ts`, `*.test.tsx`
- `src/lib/sports-engine/**`
- `src/lib/swim-banks/**`
- `src/lib/natation-sheet/**`
- `src/lib/swim-session-generator.js`
- `src/i18n/session-terms.js`
- `src/Blog.jsx`, `src/BlogPost.jsx`, `src/blogData.js`, `src/HomeBlogCarousel.jsx`
- `api/_lib/emails/**`
- `supabase/functions/welcome-email/**`

`src/i18n/i18n-baseline.json` liste les violations déjà présentes, par fichier + phrase exacte (pas par numéro de ligne).

- Phrase dans le scan et dans la liste : ok.
- Phrase dans le scan, absente de la liste : refus.
- Phrase dans la liste, absente du scan : refus, pour forcer à retirer la ligne quand le texte est traduit.

Les écrans de séance (`App.jsx`, `src/sheets/Session*.jsx`, `SessionLiveView.jsx`, etc.) sont scannés. Seul le moteur qui fabrique les séances est ignoré.

## Paquets

1. Script, hook, test, correction des clés manquantes, baseline générée. Le hook est ajouté dans ce commit, avec la baseline, pour que le commit passe.
2. Auth : `src/AuthScreen.jsx`.
3. Fiches : `src/sheets/**` hors moteur.
4. Accueil : `src/home/**`, `src/native/NativeWelcomeFork.jsx`, `src/app-shell/**`.
5. Séances à l'écran : `src/App.jsx` et les vues séance restantes dans `src/`.

Chaque paquet retire ses lignes de la baseline et ajoute les clés dans `locales/fr/` plus toutes les langues. Le français en dur hors de ces paquets reste sur la liste jusqu'à un paquet suivant. Il ne bloque pas un autre sujet.

## Hors de cette vague

Moteur de séances (`sports-engine`, banques, sheets natation, `session-terms`), blog, e-mails. Ils restent ignorés par le scan. Une vague suivante décidera de leur catalogue.

## Test

`scripts/i18n-check.test.mjs` sur des fixtures, pas sur le catalogue réel :

- clé manquante : refus
- copie française accentuée : refus
- `{{count}}` perdu ou ajouté : refus
- tiret long : refus
- `Premium` identique : ok
- littéral déjà dans la baseline : ok
- littéral nouveau : refus
- ligne de baseline devenue absente : refus
- fichier sous `sports-engine` : ignoré
- commentaire : ignoré

## Branche

Implémentation depuis le `develop` local, branche `feat/i18n-catalog-check`. Pas sur `feat/ios-apple-jws-verify`.
