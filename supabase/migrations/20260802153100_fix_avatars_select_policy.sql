-- Lint 0025_public_bucket_allows_listing
-- Bucket public `avatars` : les URL publiques suffisent pour afficher les images.
-- La policy SELECT permettait aussi de lister/enumerer tous les objets via l'API Storage.

drop policy if exists "Avatars are publicly readable" on storage.objects;
