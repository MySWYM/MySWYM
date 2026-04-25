// ── Articles de blog ──────────────────────────────────────────────────────
export const POSTS = [
  {
    slug: "programme-natation-triathlon",
    title: "Programme natation pour triathlon : comment vraiment progresser",
    description: "Découvre comment structurer ton entraînement natation pour le triathlon — phases de préparation, séances CSS, travail au seuil et gestion de l'effort en open water.",
    category: "Triathlon",
    date: "15 avril 2025",
    readingTime: "8 min",
    coverColor: "#FF6B35",
    intro: "La natation, c'est souvent le segment le plus stressant du triathlon — surtout pour les débutants. Pourtant, avec une préparation structurée, c'est aussi celui où on peut grappiller le plus de temps sans s'épuiser. Voici comment bâtir un programme efficace.",
    sections: [
      {
        h2: "Pourquoi la plupart des triathlètes s'entraînent mal en natation",
        content: `La majorité des triathlètes font la même erreur : ils nagent "confortablement" — ni trop vite, ni trop lentement — sans jamais vraiment travailler les zones d'intensité. Résultat : une progression lente, des séances monotones, et un segment natation subi plutôt que maîtrisé.

Un programme efficace repose sur **3 types de séances distinctes** : endurance, seuil et technique. Chacune a un rôle précis dans ta progression. Les mélanger ou les ignorer, c'est laisser de la performance sur la table.`,
      },
      {
        h2: "Les 3 types de séances indispensables",
        content: `**Endurance (Z1/Z2)** — C'est le socle. Ces séances longues à allure conversation construisent ta capacité aérobie. Pour un triathlon olympique, vise 2 à 3 séances d'endurance par semaine en phase de base. Format type : 8×200m à allure régulière avec 20" de récupération.

**Seuil (Z3/Z4)** — C'est ici que tu progresses vraiment. Le travail au seuil, aussi appelé CSS (Critical Swim Speed), te permet de tenir une allure élevée sur la distance de course. Format type : 6×200m à ton allure CSS avec départ à la montre.

**Technique** — Souvent négligée, la technique est pourtant le meilleur "dopant légal" en natation. Un nageur technique moins puissant battra toujours un nageur fort mais inefficace sur 1 500m. 10 minutes de drill par séance suffisent pour progresser en quelques semaines.`,
      },
      {
        h2: "La structure d'une semaine type (3 séances)",
        content: `Voici comment répartir tes 3 séances natation pour le triathlon :

**Lundi — Endurance fondamentale**
Échauffement 300m · 8×200m Z2 allure régulière · 4×50m pull-buoy · Retour au calme 200m

**Mercredi — Seuil / CSS**
Échauffement 300m + 4×25m accélérations · 6×150m allure CSS — vise tes meilleurs temps constants · 4×50m battements · Retour au calme 200m

**Vendredi — Technique + négatifs splits**
Échauffement 200m NL + 200m éducatifs · 6×100m catch-up drill / DPS · 6×150m NL — 1re moitié retenu, 2e moitié accéléré · Retour au calme 200m

Cette répartition crée de la variété, évite la monotonie, et couvre les 3 filières énergétiques.`,
      },
      {
        h2: "Comment calculer ta CSS (Critical Swim Speed)",
        content: `La CSS, c'est l'allure que tu peux tenir sur 1 500m. Pour la calculer précisément, fais un test simple :

1. Nage 400m à fond, note ton temps (ex : 6'40")
2. Récupère 10 minutes
3. Nage 200m à fond, note ton temps (ex : 3'00")

**CSS = (temps 400m − temps 200m) / 200** = (400 − 180) / 200 = **1.1 s/m** = **1'50"/100m**

Avec MySWYM, tu renseignes ton meilleur 100m NL et l'app calcule automatiquement tes zones d'entraînement. Chaque séance t'affiche l'allure exacte à viser.`,
      },
      {
        h2: "Les phases d'un plan triathlon complet",
        content: `Un plan triathlon de 12 à 20 semaines se structure en 4 phases :

**Phase de base (semaines 1-6)** — Construction aérobie. Volume élevé, intensité modérée. C'est le moment de travailler la technique et d'augmenter progressivement les distances.

**Phase de développement (semaines 7-12)** — Introduction du travail au seuil. Les séances CSS entrent en force. Le volume reste élevé, mais l'intensité monte.

**Phase de pic (semaines 13-16)** — Séances spécifiques à la distance de course. Travail de vitesse, simulation de la sortie de l'eau après effort physique.

**Affûtage (2-3 dernières semaines)** — Réduction du volume de 40%. On maintient quelques accélérations par séance pour garder la réactivité musculaire. L'entraînement est fait — le corps a juste besoin de se régénérer.`,
      },
      {
        h2: "La natation en eau libre : ce qui change",
        content: `Le bassin et l'eau libre, c'est deux mondes différents. Voici ce à quoi tu dois te préparer spécifiquement :

**Le sight (lever la tête)** — En bassin, les lignes de fond te guident. En eau libre, tu dois lever la tête toutes les 6-8 tractions pour te repérer. Intègre cet exercice en bassin : toutes les 2 longueurs, lève les yeux avant de respirer.

**Le départ massif** — Les premières centaines de mètres d'un triathlon sont chaotiques. Entraîne-toi à partir fort sur 100m pour simuler le coup de fouet du départ, puis revenir à ton allure de croisière.

**La combinaison** — Elle te fait flotter plus haut et va plus vite. Mais elle gêne la rotation des épaules. Entraîne-toi avec elle avant la course.

**La gestion thermique** — L'eau froide affecte la respiration les premières minutes. Habitue-toi en nageant les premières longueurs à fond avant de trouver ton rythme.`,
      },
    ],
    cta: {
      title: "Lance ton plan triathlon maintenant",
      text: "MySWYM génère ton programme natation complet — Sprint, Olympique, Half ou Ironman. Séances structurées, allures personnalisées, progression semaine par semaine.",
      button: "Créer mon plan triathlon",
    },
  },

  {
    slug: "comment-reussir-bnssa",
    title: "Comment réussir le BNSSA : le programme natation complet",
    description: "Tout ce qu'il faut savoir pour préparer les épreuves de natation du BNSSA — 100m sauvetage, 250m palmes, apnée dynamique et remorquage. Plan d'entraînement inclus.",
    category: "Diplômes",
    date: "8 avril 2025",
    readingTime: "9 min",
    coverColor: "#FFD700",
    intro: "Le BNSSA (Brevet National de Sécurité et de Sauvetage Aquatique) est le diplôme de référence pour surveiller des nageurs. Ses épreuves de natation sont exigeantes — apnée, remorquage, vitesse — et nécessitent une préparation spécifique. Voici comment aborder chaque épreuve.",
    sections: [
      {
        h2: "Les épreuves natation du BNSSA",
        content: `Le BNSSA comprend plusieurs épreuves aquatiques éliminatoires. Deux sont particulièrement techniques :

**Le 100m de sauvetage** — Parcours : 25m NL → immersion (15m en apnée au fond) → virage mur → 15m apnée retour → 25m remorquage du mannequin en position dorsale. À réaliser sans équipement, en tenue réglementaire.

**Le 250m palmes/masque/tuba** — 250m nage équipée, en bassin, sans contrainte de temps (mais à réaliser en continu). L'objectif est de démontrer l'endurance et la maîtrise des équipements.

Ces deux épreuves s'accompagnent de plongeons, de techniques de sauvetage à la surface, et d'une épreuve de condition physique générale.`,
      },
      {
        h2: "L'apnée dynamique : la clé du 100m sauvetage",
        content: `C'est souvent l'épreuve qui fait le plus peur. Pourtant, l'apnée dynamique s'entraîne comme n'importe quelle autre compétence natation.

**Comment la travailler ?**

Commence par des immersions courtes : plonge au fond du bassin et parcours 10m, puis 12m, puis 15m progressivement. L'objectif du BNSSA est 15m en immersion complète, sans appui sur le fond, sans pied.

**Les erreurs à éviter :**
- Hyperventiler avant l'apnée (dangereux et contre-productif)
- Regarder vers le haut (brise l'alignement hydrodynamique)
- Poser les pieds ou les mains sur le fond

**La bonne technique :** Une bonne ventilation normale (pas excessive), une entrée dans l'eau en torpedo gainée, les bras le long du corps ou en flèche. L'expiration se fait en montant, jamais en descendant.

Travaille 3 à 4 séries d'apnées par séance de BNSSA, avec 2 minutes de récupération entre chaque. La qualité prime sur la quantité.`,
      },
      {
        h2: "Le remorquage : technique et endurance",
        content: `Remorquer un mannequin de 8kg sur 25m après avoir fait 50m de nage, c'est épuisant. La technique permet de compenser l'effort.

**La position dorsale** — Le mannequin est maintenu en position dorsale, visage hors de l'eau, bras sous ses aisselles et mains croisées sur sa poitrine. Tu nages sur le dos avec un battement de jambes puissant.

**Tes bras** — Ils propulsent en battage latéral sur les côtés, sans sortir de l'eau. Le mouvement est compact et régulier.

**Les clés pour tenir :** Commence par t'entraîner sans mannequin, puis avec un partenaire (plus léger), puis avec le mannequin réglementaire. La progression est indispensable.

Dans un programme sérieux, prévois 3 à 6 longueurs de remorquage par séance en fin de préparation.`,
      },
      {
        h2: "Le 250m palmes/masque/tuba : endurance et maîtrise",
        content: `Cette épreuve est souvent sous-estimée. Nager 250m équipé sans s'arrêter demande une endurance spécifique et une bonne maîtrise des équipements.

**S'équiper correctement :**
- Palmes courtes (type mono-palme ou palmes courtes de natation)
- Masque bien ajusté, pas de fuites
- Tuba fixe (pas de valve de purge)

**L'erreur principale :** Se focaliser sur la vitesse. L'épreuve est jugée en continu — la priorité, c'est de ne pas s'arrêter. Adopte une allure régulière dès le départ.

**L'entraînement :** Intègre des séries de 4×50m équipé, puis 2×100m, puis 1×200m progressivement. La coordination palmes/tuba change ton équilibre dans l'eau et demande une adaptation.`,
      },
      {
        h2: "Plan type de préparation BNSSA — 8 semaines",
        content: `Voici comment structurer tes 8 dernières semaines avant les épreuves :

**Semaines 1-2 : Base**
2 séances par semaine. Endurance NL + premières apnées courtes (10m). Prise en main de l'équipement (palmes/masque).

**Semaines 3-4 : Construction**
3 séances par semaine. Apnées à 12m. Remorquage avec partenaire. 2×100m équipé.

**Semaines 5-6 : Spécifique**
3 séances par semaine. Simulation complète du 100m sauvetage (sans chronométrage). Apnées à 15m. Remorquage mannequin 2×25m.

**Semaines 7-8 : Affûtage**
Simulations chronométrées. Réduction du volume. Confiance mentale.

Dans MySWYM, le plan BNSSA intègre automatiquement ces phases avec les séances détaillées (apnée, remorquage, simulation de parcours) à ton niveau et ta fréquence.`,
      },
      {
        h2: "Les erreurs les plus fréquentes des candidats BNSSA",
        content: `**Arriver sans avoir nagé en eau libre** — Le BNSSA se passe en bassin, mais certains éléments (visibilité réduite, eau plus froide) peuvent surprendre. S'entraîner dans des conditions variées aide.

**Sous-estimer la fatigue cumulée** — Les épreuves se succèdent le même jour. Si tu peux enchaîner 100m sauvetage + 250m palmes + épreuves physiques en une session, tu es prêt.

**Négliger la technique** — Beaucoup de candidats préparent le BNSSA uniquement en volume. Mais 30 minutes de travail technique par semaine (apnée, remorquage, position dorsale) valent plus que 2 heures de nage non spécifique.

**Paniquer en apnée** — Le stress consomme l'oxygène. Les candidats qui ratent l'apnée le font souvent par stress, pas par manque de capacité physique. Simule les conditions en entraînement pour apprivoiser la pression.`,
      },
    ],
    cta: {
      title: "Prépare ton BNSSA avec un plan structuré",
      text: "MySWYM génère un plan de préparation BNSSA complet — apnée dynamique, remorquage, simulation de parcours 100m et 250m palmes. Séances progressives adaptées à ta date d'examen.",
      button: "Créer mon plan BNSSA",
    },
  },

  {
    slug: "plan-natation-debutant",
    title: "Plan natation débutant : 8 semaines pour nager sans s'arrêter",
    description: "Tu reprends la natation ou tu débutes ? Ce plan progressif de 8 semaines te permet de nager 1 000m sans t'arrêter, avec des séances détaillées adaptées aux débutants.",
    category: "Débutants",
    date: "2 avril 2025",
    readingTime: "7 min",
    coverColor: "#0A84FF",
    intro: "Reprendre la natation après des années d'arrêt — ou commencer pour la première fois — c'est intimidant. On arrive au bassin, on fait quelques longueurs, et on s'essoufle déjà. Pourtant, avec une progression bien structurée, n'importe qui peut nager 1 000m sans s'arrêter en 8 semaines.",
    sections: [
      {
        h2: "Pourquoi tu t'essouffles en natation (et comment arrêter)",
        content: `La natation est le seul sport où tu dois gérer ta respiration en apnée partielle. À vélo ou en courant, tu peux respirer quand tu veux. En natation, tu as 2 à 3 secondes par cycle pour inspirer — et si tu ratesça, tu paniques, tu relèves la tête, et tout s'effondre.

**L'erreur principale des débutants** : ils nagent trop vite et paniquent dès que ça brûle. Ils forcent alors, nagent encore plus vite, et finissent par s'arrêter au bout de 25m.

La solution est contre-intuitive : **nage plus lentement**. Vraiment. Une allure où tu pourrais tenir une courte conversation. Si tu souffles, tu vas trop vite. C'est aussi simple que ça.`,
      },
      {
        h2: "Les 3 erreurs techniques qui épuisent les débutants",
        content: `**1. La tête trop haute** — Si ta tête dépasse à la surface, tes hanches plongent et ton corps crée une résistance énorme. Maintiens ton regard vers le fond du bassin, et lève la tête uniquement pour respirer.

**2. Les jambes qui coulent** — Des jambes qui battent dans tous les sens sans propulser drainent ton énergie. Les battements doivent être compacts (talons à la surface, pas de mouvement des genoux excessif) et souples.

**3. Pas de coulée après les virages** — Chaque poussée de mur bien réalisée te donne 3 à 5 mètres gratuits. Profites-en : glisse en torpedo gainée avant de reprendre tes bras. Tu économises de l'énergie et tu vas plus vite.`,
      },
      {
        h2: "Structure d'une séance pour débutant",
        content: `Une séance bien construite, même courte, fait plus de progrès qu'une session longue et anarchique.

**L'échauffement (10-15%)** — Ne saute pas dedans à fond. Fais 2 longueurs tranquilles pour sentir l'eau, ajuster ta respiration, t'allonger. Ton corps doit trouver le bon alignement avant d'augmenter l'effort.

**Le corps de séance (70-75%)** — Des séries courtes avec des récupérations. Pour un débutant : 6×50m avec 15" de récupération plutôt qu'un 300m continu. Même distance totale, mais beaucoup moins d'essoufflement et plus de qualité.

**Le retour au calme (10-15%)** — 2 longueurs sur le dos très lentement. C'est aussi précieux que l'échauffement pour la régénération musculaire.`,
      },
      {
        h2: "Le plan semaine par semaine",
        content: `**Semaines 1-2 : Trouver son eau**
Objectif : nager 400m en séance, sans s'arrêter dans les séries courtes.
Format type : 6×50m NL — R15" — si tu souffles c'est trop vite · 4×50m dos crawlé — R10" · Retour au calme

**Semaines 3-4 : Construire l'endurance**
Objectif : enchaîner des 100m sans s'arrêter.
Format type : 4×100m NL — D3'30" — allure conversation · 4×50m pull-buoy — R15" · Retour au calme

**Semaines 5-6 : Allonger les séries**
Objectif : tenir 200m sans s'arrêter.
Format type : 3×200m NL — D5'00" — respiration toutes les 3 tractions · 4×50m battements planche · Retour au calme

**Semaines 7-8 : Le 1 000m**
Objectif : enchaîner 1 000m en une seule séance.
Format type : 2×400m NL — R30" — tu t'arrêtes pour boire, pas pour souffler · 200m récupération dos

À la fin de la semaine 8, la plupart des débutants peuvent nager 1 000m en continu. Certains y arrivent dès la semaine 6.`,
      },
      {
        h2: "La technique en priorité : les éducatifs incontournables",
        content: `On progresse 2x plus vite avec 10 minutes de technique par séance qu'en nageant aveuglément.

**Battements planche** — Corps horizontal, planche tendue devant, regard au fond. Sens tes jambes propulser, pas seulement se fatiguer. Si tu coulons, tes hanches sont trop basses.

**Pull-buoy** — Le pull-buoy entre les jambes te libère du battement et te force à travailler les bras seuls. Idéal pour sentir la prise d'eau et comprendre comment les épaules propulsent.

**Fist drill** — Nage avec les poings fermés. Tu ne peux plus te servir de tes mains — seulement de tes avant-bras. Quand tu rouvres les mains, la prise d'eau semble soudainement immense.

**Dos crawlé** — Nager sur le dos t'apprend l'alignement latéral et la rotation des épaules. Ce que tu travailles sur le dos se transfère directement au crawl.`,
      },
      {
        h2: "Combien de séances par semaine pour progresser ?",
        content: `**2 séances par semaine** — C'est le minimum pour progresser. En dessous, le corps "oublie" les sensations entre les séances et tu pars de zéro à chaque fois.

**3 séances par semaine** — L'idéal pour un débutant. Tu progresseras visiblement de semaine en semaine.

**4 séances par semaine ou plus** — Attention à la récupération. Le corps a besoin de temps pour intégrer les nouvelles sensations. Trop nager en faisant les mêmes erreurs peut ancrer de mauvaises habitudes.

La régularité prime sur le volume. 2 séances bien construites de 45 minutes valent largement mieux qu'une longue séance chaotique par semaine.`,
      },
    ],
    cta: {
      title: "Génère ton plan débutant personnalisé",
      text: "MySWYM crée un programme natation adapté à ton niveau, ton bassin et ta disponibilité. Chaque séance est détaillée — tu sais exactement quoi faire dans l'eau.",
      button: "Créer mon plan débutant",
    },
  },
];
