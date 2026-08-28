# Egress Supabase (`user_plans`)

Le quota Free « Egress » compte les **données sorties** (surtout `plans_json`), pas la taille DB/storage.

## Déjà en place

- Meta `updated_at` d’abord ; blob JSON seulement si remote **nettement** plus récent (`REMOTE_NEWER_EPSILON_MS`).
- Skip upsert si empreinte inchangée (`plansPersistFingerprint`).
- Debounce autosave 3s ; sync visibility max 1× / 60s.
- Upsert sans colonnes legacy `plan` / `profile`.

## Si le quota saute encore

1. Regarder Usage → Egress (pas Database Size).
2. Upgrade Pro le temps du cycle + continuer d’alléger.
3. Plus tard : plans plus compacts / sync partielle (chantier plus gros).
