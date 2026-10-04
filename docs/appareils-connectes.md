# Appareils connectés MySWYM

Modèle fini : voir et révoquer les sessions web / iPhone depuis **Profil → Paramètres → Mes données → Appareils connectés**.

## Produit

| Élément | Comportement |
| --- | --- |
| Liste | Appareils actifs (`revoked_at` null), tri `last_seen_at` |
| Carte | Icône plateforme, libellé (iPhone / Chrome…), pays + IP si dispo, badge « Appareil actuel » |
| Déconnecter un | Marque `revoked_at` ; si c’est l’appareil courant → logout local |
| Déconnecter les autres | Révoque toutes les lignes sauf la courante + `admin.signOut(uid, 'others')` best-effort |
| Déconnecter tous | Révoque tout + `admin.signOut(uid, 'global')` → logout client |

## Technique

1. Table `public.user_devices` (migration `20261004120000_user_devices.sql`)
2. Edge Function `manage-devices` : `heartbeat` | `list` | `revoke` | `revoke_others` | `revoke_all`
3. Client `src/lib/user-devices.js` : clé `localStorage` `myswym_device_key_v1`
4. Heartbeat au login app (`App.jsx`) : si `force_logout` → `signOut`
5. UI : `IosDevicesPanel` dans `src/profile/IosSettings.jsx`, entrée depuis Mes données

## Déploiement

```bash
# Migration + function (prod)
supabase db push   # ou pipeline CI migrations
supabase functions deploy manage-devices
```

Sans la function déployée, l’UI affiche une erreur claire (pas de crash).

## Limites acceptées

- Révocation d’un appareil **distant** : effective au prochain heartbeat (ou dès `signOut others/global` si GoTrue le supporte).
- Pas d’ATT / pas de tracking : IP + pays uniquement pour l’écran sécurité du titulaire du compte.
- Pas de liste GoTrue native : registre MySWYM = source de vérité UI.
