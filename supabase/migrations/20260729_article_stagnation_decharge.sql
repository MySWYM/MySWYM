-- Article du 29 juillet 2026 : stagnation & semaines de décharge
insert into public.articles (titre, slug, extrait, contenu, categorie, image_url, date_publication, published)
values (
  'Tu stagnes en natation ? Ce que ta semaine d''entraînement oublie',
  'stagner-natation-semaine-decharge',
  'Toujours la même allure, jamais de vraie récup, volume qui monte sans pause : voilà pourquoi beaucoup de nageurs plafonnent. Voici comment structurer ta semaine — et pourquoi ralentir te fait progresser.',
  E'Tu nages régulièrement. Tu fais tes longueurs. Tu as même l''impression de « bien travailler ». Et pourtant, ton 100 m ne bouge plus. Ton 400 m non plus. La séance te semble toujours aussi dure — ou pire, de plus en plus plate.

Ce n''est presque jamais un problème de motivation. C''est un problème de **structure**. La plupart des nageurs loisirs et triathlètes s''entraînent dans une zone grise : ni assez facile pour récupérer, ni assez exigeante pour progresser. Et ils oublient l''outil le plus sous-estimé de la progression : **la semaine de décharge**.

## Le piège de la zone grise

Imagine une échelle d''effort de 1 à 10. Beaucoup de nageurs passent 80 % de leur temps entre 5 et 7 — « un peu soutenu », « j''ai travaillé », « j''ai bien sué ».

Le souci : à cette intensité, tu accumules de la fatigue sans créer le stimulus clair qui force le corps à s''adapter. Tu n''es pas assez lent pour construire ton endurance profonde. Tu n''es pas assez rapide pour améliorer ton seuil ou ta vitesse.

En coaching, on parle de **polarisation** : la majorité du volume doit être vraiment facile (allure conversation, zone Z1/Z2), et une petite part vraiment exigeante (seuil, VO2, vitesse). Le milieu — cette zone grise — doit rester rare.

**Si toutes tes séances se ressemblent**, tu stagnes. Pas parce que tu n''en fais pas assez. Parce que tu en fais toujours *pareil*.

## Une semaine qui progresse a plusieurs rôles

Avec 2 à 4 séances par semaine, chaque créneau doit avoir une intention claire. Exemple type à 3 séances :

**Séance A — Endurance / foncier**
Allure vraiment facile. Tu dois pouvoir penser à autre chose, voire parler entre deux respirations. Objectif : volume propre, technique stable, récupération active. C''est le socle — et souvent la séance qu''on néglige en la nageant trop vite.

**Séance B — Qualité (seuil ou vitesse)**
Là, tu travailles. Séries contrôlées, départs à la montre, allures cibles. L''effort est soutenu mais **régulier** : on cherche la constance des temps, pas l''explosion sur la première longueur.

**Séance C — Technique + volume modéré**
Éducatifs courts, puis nage appliquée. Pas deux blocs de battements d''affilée. Pas une séance entière d''éducatifs non plus — MySWYM privilégie l''application (jambes, crawl propre), pas l''école de natation.

Cette variété crée le contraste dont le corps a besoin. Sans contraste, pas d''adaptation.

## Pourquoi monter le volume… puis le baisser

Progresser, ce n''est pas nager plus chaque semaine sans fin. Une règle simple et durable : **ne pas augmenter le volume de plus d''environ 10 % d''une semaine à l''autre**. Au-delà, le risque de fatigue et de dégradation technique explose.

Mais même avec une montée progressive, le corps a besoin de **fenêtres de récupération**. C''est le rôle des semaines de décharge : environ toutes les 4 semaines, on baisse nettement le volume (souvent autour de −30 %), tout en gardant un peu d''intensité légère pour ne pas « s''éteindre ».

Pendant une décharge, tu ne « perds » pas ta forme. Tu **absorbes** le travail des semaines précédentes. Les adaptations (capillarisation, économie de nage, tolérance au seuil) se consolident quand la charge baisse — pas uniquement quand elle monte.

Les signes que tu as besoin d''une décharge :
- tes temps de série dérivent alors que l''allure te semble « normale »
- tu arrives déjà fatigué à l''échauffement
- la motivation chute sans raison claire
- tu stagnes depuis 3–4 semaines malgré l''assiduité

## Ce qu''une bonne décharge n''est pas

Ce n''est **pas** une semaine zéro. Arrêter totalement, puis repartir à fond, crée un yo-yo inutile.

Ce n''est **pas** non plus « nager moins mais plus vite ». La décharge réduit surtout le **volume** et la densité. Tu peux garder quelques touches de qualité courtes, mais l''idée n''est pas de transformer la semaine en test chronométré.

Et ce n''est **pas** de la paresse. Les nageurs qui progressent le plus longtemps sont souvent ceux qui osent ralentir au bon moment.

## Comment appliquer ça dès demain

1. **Classe tes 2 ou 3 prochaines séances** : laquelle est vraiment facile ? laquelle est vraiment dure ? Si tu ne sais pas répondre, tu es probablement en zone grise.
2. **Sur l''endurance, force-toi à ralentir.** Si tu termines essoufflé une séance « facile », elle n''était pas facile.
3. **Sur la qualité, vise la régularité.** Mieux vaut 6×100 m à temps constants qu''une première série brillante suivie d''un effondrement.
4. **Planifie une décharge** toutes les 3 à 4 semaines : −25 à −35 % de volume, même structure de séance, intensité modérée.
5. **Mesure.** Un 100 m ou un 400 m de référence toutes les 4–6 semaines te dit si la structure marche — pas le ressenti du jour.

## Le lien avec un plan structuré

Faire ça à la main, c''est possible… jusqu''à ce que la vie s''en mêle. Une séance sautée, une semaine chargée, et la polarisation disparaît.

C''est exactement ce qu''un plan bien construit automatise : des rôles de séance distincts, une montée de volume raisonnable, des décharges intégrées, et des allures adaptées à **ton** 100 m — pas à un nageur moyen imaginaire.

Si tu stagnes, la question n''est souvent pas « est-ce que je nage assez ? ». C''est : **est-ce que ma semaine a encore un sens ?**',
  'Conseils entraînement',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
  '2026-07-29T10:00:00Z',
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
