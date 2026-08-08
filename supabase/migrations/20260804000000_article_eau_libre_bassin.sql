-- Article du 4 août 2026 : préparer l'eau libre depuis le bassin
insert into public.articles (titre, slug, extrait, contenu, categorie, image_url, date_publication, published)
values (
  'Eau libre : 7 choses à travailler en bassin avant ta première sortie',
  'eau-libre-preparer-bassin',
  'Pas de ligne noire, pas de mur, parfois du froid et du monde : l''eau libre change tout. Voici 7 compétences à installer en bassin pour arriver prêt — sans improvisation le jour J.',
  E'Tu nages bien en bassin. Tu connais tes allures. Et pourtant, la première sortie en lac ou en mer te met dans le rouge en trois minutes : orientation perdue, rythme cassé, panique légère à la respiration.

Ce n''est pas que tu es « mauvais ». C''est que **le bassin te ment un peu**. Lignes noires, murs, eau calme, température stable : tout est balisé. En eau libre, tu dois reconstruire ces repères toi-même.

Bonne nouvelle : la plupart des compétences utiles se travaillent **avant**, en bassin. Voici les 7 priorités.

## 1. Le sighting (lever la tête pour viser)

En eau libre, tu n''as pas de ligne au fond. Tu dois lever les yeux régulièrement pour viser une bouée, une rive, un arbre.

**En bassin :** toutes les 6 à 8 tractions, lève juste assez la tête pour regarder devant, puis reviens à ta respiration habituelle. Garde les hanches hautes : le piège classique, c''est de lever trop haut et de faire plonger les jambes.

Objectif : un coup d''œil rapide, pas une pause touristique. Plus le geste est économique, moins tu perds de vitesse.

## 2. Nager droit sans ligne

Même avec le sighting, beaucoup de nageurs zigzaguent. Cause fréquente : une traction plus forte d''un côté, ou une rotation asymétrique.

**En bassin :** ferme les yeux 8 à 12 mètres (si la ligne est libre et sécurisée), puis rouvre et regarde où tu es. Répète. Tu découvres vite ton « biais » naturel.

Corrige ensuite en conscience : traction plus symétrique, rotation plus égale, regard qui revient au centre après chaque respiration.

## 3. Respirer des deux côtés (bilatéral)

Le vent, les vagues, le soleil, un nageur à ta gauche : parfois tu ne peux respirer que d''un côté. Si tu n''as qu''une option, tu es fragile.

**En bassin :** alterne 3-3 (respiration tous les 3 coups) sur des séries de 50 ou 100 m. Ce n''est pas obligatoire en permanence, mais tu dois pouvoir le tenir sans paniquer ni casser ton rythme.

## 4. Partir fort… puis trouver ton allure

En triathlon ou en départ groupé, les premières minutes sont chaotiques. Beaucoup partent trop vite, puis explosent.

**En bassin :** travaille des négatifs ou des « départ rapide + croisière ». Exemple : 4×100 m — 25 m un cran au-dessus, puis 75 m à ton allure cible. Tu apprends à digérer l''emballement sans tout cramer.

En eau libre comme en plan structuré, la régularité bat le sprint suicidaire.

## 5. Tolérer l''inconfort des premières minutes

L''eau froide coupe le souffle. La combinaison compresses. Le stress monte. Ce n''est pas forcément un problème cardio — c''est souvent un problème **d''adaptation**.

**En bassin :** commence parfois ta séance par 100–200 m un peu plus soutenus après un mini-échauffement, pour simuler ce « premier choc ». Entraîne-toi aussi à allonger l''expiration dans l''eau : une expiration complète calme mieux qu''une inspiration forcée.

Si tu as une combinaison, fais au moins 2–3 séances avec avant une course. Les épaules et la flottaison changent vraiment.

## 6. Garder une technique simple sous fatigue

En eau libre, la technique « parfaite » du bassin se dégrade vite : tu vises, tu cogues, tu stresses. Ce qu''il te faut, c''est une nage **robuste** : bon appui, rythme stable, battements utiles sans surrégime.

**En bassin :** privilégie des éducatifs courts puis de la nage appliquée — pas une séance entière de drills. Travaille plutôt des séries où tu maintiens le même nombre de coups par longueur quand tu fatigues. La constance vaut mieux que le geste Instagram.

## 7. Savoir ce que tu vises (allure / effort)

Sans chrono mur, beaucoup nagent « à la sensation »… et la sensation ment sous adrénaline.

**En bassin :** apprends tes zones. Qu''est-ce qu''une Z2 vraiment facile pour toi ? Une allure seuil tenable ? Si tu connais ton 100 m et tes allures cibles, tu peux retrouver ces sensations dehors : respiration contrôlée, pression d''eau familière, rythme de traction stable.

Le jour J, tu ne cherches pas un record absolu dès la première bouée. Tu cherches **ton** rythme de course.

## Mini-plan d''intégration (2 semaines)

**Séance 1 — Sighting + bilatéral**
Échauffement 300 m · 8×50 m sighting toutes les 6–8 tractions · 6×100 m respiration 3-3 · Retour au calme 200 m

**Séance 2 — Droiture + départ contrôlé**
Échauffement 300 m · 6×50 m yeux fermés (sécurisé) · 6×100 m (25 m vite / 75 m croisière) · Retour au calme 200 m

**Séance 3 — Volume facile + combinaison (si tu en as une)**
Longue séance Z1/Z2, technique propre, zéro zone grise. L''objectif est d''arriver en eau libre frais mentalement, pas cramé.

Répète ce cycle, puis fais une vraie sortie courte en eau libre (20–30 min) pour coller les pièces.

## Le jour de ta première sortie

Choisis un spot simple, avec peu de courant si possible. Pars avec quelqu''un. Fixe un repère large (pas un détail minuscule). Accepte que la première fois soit un peu chaotique : le but n''est pas la perf, c''est **d''apprendre le milieu**.

Ensuite seulement, tu pourras empiler de la distance et de la précision.

L''eau libre ne se « devine » pas. Elle se prépare — et une bonne partie de cette préparation se fait entre deux murs, séance après séance.',
  'Eau libre',
  'https://images.unsplash.com/photo-1502680390469-be75c6c57660?w=1200&q=80',
  '2026-08-04T10:00:00Z',
  true
)
on conflict (slug) do update set
  titre = excluded.titre,
  extrait = excluded.extrait,
  contenu = excluded.contenu,
  categorie = excluded.categorie,
  image_url = excluded.image_url,
  date_publication = excluded.date_publication,
  published = true,
  updated_at = now();
