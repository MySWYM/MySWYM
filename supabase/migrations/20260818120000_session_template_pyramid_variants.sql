-- pyramidVariants sur les blocs pyramide Gold (banque de contenu).
-- Une seule dimension réelle → restent sous le plafond 1000 m si elles passent le QG.

update public.session_templates
set blocks = jsonb_set(coalesce(blocks, '{}'::jsonb), '{pyramidVariants}', '["exercice"]'::jsonb),
    updated_at = now()
where slug = 'gold-pyramide-400-symetrique';

update public.session_templates
set blocks = jsonb_set(coalesce(blocks, '{}'::jsonb), '{pyramidVariants}', '["nage"]'::jsonb),
    updated_at = now()
where slug = 'gold-pyramide-4nages-fly-free';

update public.session_templates
set blocks = jsonb_set(coalesce(blocks, '{}'::jsonb), '{pyramidVariants}', '["exercice"]'::jsonb),
    updated_at = now()
where slug = 'gold-pyramide-600-pull-kick';
