-- Readiness V1 — disponibilité actuelle (questionnaire), pas un profil médical.
-- Colonne JSONB sur sport_profiles existante. RLS inchangée (auth.uid() = user_id).

alter table public.sport_profiles
  add column if not exists readiness_profile jsonb;

comment on column public.sport_profiles.readiness_profile is
  'Profil forme V1: activityLevel, swimmingRecency, currentFitness, recoveryQuality, trainingCaution. null = non renseigné.';
