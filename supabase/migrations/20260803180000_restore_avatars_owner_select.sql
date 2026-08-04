-- Upsert / INSERT…RETURNING sur storage.objects exige une policy SELECT.
-- La policy publique a été retirée (lint listing) ; sans SELECT propriétaire,
-- l'upload d'avatar échoue silencieusement → photo perdue au refresh.
-- Le bucket reste public : les URL /object/public/… continuent de servir l'image.

create policy "Users can read own avatar"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
