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
        content: `Le BNSSA comprend trois épreuves aquatiques éliminatoires :

**Épreuve 1 — 100m sauvetage (temps limite : 2'40")** — Parcours : 25m NL → immersion (15m en apnée au fond) → virage mur → 15m apnée retour → 25m remorquage du mannequin en position dorsale. À réaliser sans équipement, en tenue réglementaire. En cas d'examen de rattrapage, le temps limite est porté à 3'00".

**Épreuve 2 — 250m palmes/masque/tuba (temps limite : 4'20")** — 250m nage équipée en bassin, à réaliser en continu. L'objectif est de démontrer endurance et maîtrise des équipements dans le temps imparti.

**Épreuve 3 — Assistance à personne en difficulté (pas de temps limite)** — Le jury évalue la qualité de l'intervention, la sécurité du sauveteur et la prise en charge de la victime. Il n'y a pas de chrono imposé : c'est la prestation globale qui est notée.

Ces trois épreuves sont éliminatoires et se déroulent le même jour.`,
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
- Palmes courtes type nageur ou palmes de plongée/sauveteur de la marque Mares
- Masque bien ajusté, sans fuite — vérifie l'étanchéité à sec avant
- Tuba fixe, sans valve de purge (réglementaire BNSSA)

**L'erreur principale :** Se focaliser sur la vitesse. L'épreuve est chronométrée (4'20" maxi) mais la priorité reste de finir en continu, sans s'arrêter. Adopte une allure régulière dès le départ — un départ trop rapide finit en crampe ou en panique à mi-parcours.

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

**Nage avec palmes** — Les palmes compensent les jambes et te libèrent l'esprit pour te concentrer sur le haut du corps. Tu ressens immédiatement mieux la rotation des épaules et la prise d'eau — et ton corps reste horizontal sans effort. Indispensable pour les débutants.

**Tuba frontal** — Le tuba frontal élimine la contrainte de respiration. Tu peux nager en gardant la tête dans l'axe en permanence et sentir ton alignement tête-hanches-pieds sans jamais te tordre le cou. Parfait pour travailler la technique bras à bras sans interruption.

**Dos à 2 bras simultanés** — Nage sur le dos avec les deux bras qui tirent en même temps (comme un papillon mais sur le dos). Cet éducatif développe la conscience de la prise d'eau dorsale, le gainage du buste et la symétrie des appuis. Ce que tu corriges ici se transfère directement à ton crawl.

**3 mouvements crawl / 3 mouvements dos** — Alterne 3 tractions crawl puis 3 tractions dos en continu, sans t'arrêter. La transition force ton corps à réajuster l'alignement à chaque changement et t'apprend à varier les prises d'appui. Excellent pour casser la monotonie et sentir les différences de propulsion entre les deux nages.`,
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

  {
    slug: "depart-interval-natation",
    title: "D1'45\" : c'est quoi un départ à la montre en natation ?",
    description: "Tu vois D1'45\" dans ton programme et tu ne sais pas quoi faire ? On t'explique comment lire l'horloge de bassin, pourquoi on n'utilise pas la montre pour les récups, et comment nager comme un vrai nageur.",
    category: "Débutants",
    date: "27 avril 2025",
    readingTime: "5 min",
    coverColor: "#0A84FF",
    intro: "Tu regardes ton programme, tu lis \"8×100m NL — D1'45\" — et tu te demandes ce que ça veut dire. C'est quoi ce D ? Pourquoi pas juste dire \"récupère 15 secondes\" ? La réponse change ta façon de t'entraîner — et te rapproche de la façon dont s'entraînent vraiment les nageurs.",
    sections: [
      {
        h2: "D1'45\" : départ toutes les 1 minute 45 secondes",
        content: `**D1'45\"** signifie : tu pars (ou repars) toutes les 1 minute et 45 secondes. C'est ce qu'on appelle un **départ à la montre** — ou plus précisément, un départ à l'horloge de bassin.

Concrètement, si tu nages 100m en 1'30\", tu as **15 secondes de récupération** avant de repartir. Si tu nages en 1'38\", tu n'as plus que 7 secondes. Si un jour tu nages en 1'50\", tu attends le départ suivant.

**Pourquoi ce système plutôt qu'une récup fixe ?**

Parce qu'il récompense la performance. Plus tu nages vite, plus tu récupères. Plus tu travailles, plus ton intervalle devient confortable. C'est un outil de progression intégré directement dans la séance — et c'est aussi ce qui te donne une référence objective sur ta forme du jour.`,
      },
      {
        h2: "L'horloge de bassin : ton meilleur ami",
        content: `Dans chaque bassin, il y a une grande horloge ronde avec une aiguille rouge (parfois verte) qui tourne. Elle fait un tour complet en **60 secondes**. C'est l'outil de référence de tout nageur sérieux.

**Comment l'utiliser :**

Tu n'as pas besoin de partir à un moment précis. Tu regardes où est l'aiguille au moment de ton départ, et tu repars quand elle revient exactement à la même position — ou après 1'45\" si le départ est à 1'45\".

Par exemple : tu pars quand l'aiguille est sur le **12**. Tu reviens au mur. Tu repars quand elle est revenue sur le **12** (après 1 tour complet = 1 min), ou sur le **9** si tu attends 1'45\", ou sur le **6** pour 1'30\".

**Le truc du nageur confirmé :** il ne regarde jamais sa montre pendant les séries. Il jette un œil à l'horloge en arrivant au mur, voit où est l'aiguille, et sait instinctivement s'il est dans les temps ou non.`,
      },
      {
        h2: "La montre : utile, mais pas pour les récups",
        content: `Beaucoup de débutants font la même erreur : ils utilisent la montre pour gérer leurs récupérations. Ils appuient sur "tour" à chaque arrivée au mur, regardent le temps, attendent 15 secondes, et repartent. Ça marche, mais **ça casse le rythme** et ça te déconnecte du bassin.

**La bonne façon d'utiliser la montre :**

Lance-la au premier départ de la série. Arrête-la après la dernière répétition. C'est tout.

La montre te sert pour **3 choses utiles** :
— **Strava** — garder un historique propre de tes kilomètres, voir ta progression dans le temps
— **Connaître ta moyenne** — même si légèrement faussée par les pauses entre séries, c'est une bonne indication de ton rythme global
— **Savoir où tu en es dans la distance** — "j'ai nagé 1 800m, il me reste 400m" — la montre gère ça pour toi

Mais pendant les séries, **laisse l'horloge de bassin faire son travail**. C'est elle qui donne le tempo. La montre, c'est pour après.`,
      },
      {
        h2: "Pourquoi les vrais nageurs se fient à l'aiguille",
        content: `Dans un club, personne ne regarde sa montre pendant les séries. Tout le monde garde un œil sur l'horloge de bassin. Pourquoi ?

**Parce que c'est plus précis, plus fluide, et plus formateur.** L'horloge ne ment pas — si tu arrives au mur et que l'aiguille est déjà passée, tu as des questions à te poser sur ton allure. Si tu as 20 secondes d'avance, tu sais que tu es allé trop vite sur cette rep.

Avec le temps, tu développes une **conscience interne de l'allure**. Tu sais à 5 secondes près combien tu vas mettre sur un 100m. C'est ça, nager avec intelligence.

**Le processus d'apprentissage :**

1. Au début : regarder l'horloge à chaque arrivée et compter les secondes
2. Après quelques séances : estimer le temps avant même d'arriver au mur
3. À terme : sentir si tu es dans les temps dès le premier virage

Ce n'est pas une compétence innée — c'est simplement le résultat de regarder l'horloge systématiquement pendant quelques mois.`,
      },
      {
        h2: "Résumé pratique pour ta prochaine séance",
        content: `**Avant de sauter dans l'eau :**
Repère l'horloge de bassin. Note la position de l'aiguille rouge.

**Au départ de ta première répétition :**
Démarre ta montre. Pars quand tu es prêt.

**À chaque arrivée au mur :**
Regarde l'aiguille. Mémorise sa position. Repars quand elle revient au même point (ou au point correspondant à ton intervalle).

**À la fin de la série :**
Arrête ta montre. Note le temps total si tu veux. Récupère entre les séries à ta guise.

**Ce qu'il faut retenir :**
— D1'45\" = tu repars toutes les 1'45\" (ton temps de nage + ta récup)
— L'horloge de bassin = ton chrono de référence pendant les séries
— La montre = ton outil pour Strava, la distance et ta moyenne globale
— Plus tu nages vite, plus tu récupères — c'est la beauté du départ à la montre`,
      },
    ],
    cta: {
      title: "Ton programme avec intervalles calculés pour toi",
      text: "MySWYM calcule automatiquement tes intervalles de départ selon ton niveau et ton meilleur 100m. Tu n'as plus qu'à regarder l'horloge et nager.",
      button: "Créer mon programme",
    },
  },

  {
    slug: "glossaire-natation",
    title: "Glossaire natation : tous les termes de l'app expliqués",
    description: "NL, CSS, Z2, pull-buoy, coulée, seuil… Tu débutes et tu ne comprends pas la moitié des termes de tes séances ? Ce glossaire t'explique tout, simplement.",
    category: "Débutants",
    date: "27 avril 2025",
    readingTime: "6 min",
    coverColor: "#00C48C",
    intro: "Tu ouvres ton plan d'entraînement et tu lis : \"6×100m NL — D1'45\" — Z2 — pull-buoy en récup\". C'est du chinois ? Normal. La natation a son propre vocabulaire. Ce glossaire regroupe tous les termes que tu croiseras dans MySWYM, expliqués clairement.",
    sections: [
      {
        h2: "Les nages et les abréviations",
        content: `**NL — Nage Libre**
La nage libre, c'est le crawl. Techniquement, tu peux nager n'importe quel style en "nage libre", mais tout le monde utilise le crawl parce que c'est la nage la plus rapide. Quand tu vois NL, tu nages crawl.

**Dos**
Le dos crawlé. Tu nages sur le dos, les bras alternés, la tête dans l'eau. Souvent utilisé en retour au calme ou en récupération active entre les séries.

**Brasse**
Les deux bras et les deux jambes en simultané, en position frontale. Plus lente que le crawl, souvent utilisée pour les phases de récupération.

**4 nages**
Enchaînement dans l'ordre : papillon → dos → brasse → crawl. Utilisé dans certaines séances techniques.

**Battements / planche**
Nage avec une planche tenue à bout de bras, seules les jambes travaillent. L'objectif : travailler le fouet des chevilles et l'alignement du corps.

**Pull-buoy**
Un flotteur en forme de 8 coincé entre les cuisses. Il soutient les jambes pour que seuls les bras travaillent. Excellent pour sentir la prise d'eau et travailler les appuis sans se fatiguer en bas.`,
      },
      {
        h2: "Les zones d'intensité (Z1 à Z5)",
        content: `Les zones d'intensité te disent à quelle vitesse nager. Elles sont calculées à partir de ton meilleur 100m.

**Z1 — Très facile** · Allure récupération. Tu pourrais tenir une conversation. Utilisée en échauffement et retour au calme.

**Z2 — Endurance** · Allure "longue durée". Tu respires normalement, tu peux tenir des heures. C'est la zone de base de l'entraînement.

**Z3 — Tempo / Seuil bas** · Effort soutenu mais gérable. Tu peux tenir sur 20-30 minutes. Tu commences à te concentrer sur ta respiration.

**Z4 — Seuil / CSS** · Allure que tu peux tenir sur 1 500m environ. Ça commence à faire mal. C'est la zone la plus importante pour progresser.

**Z5 — Vitesse max** · Effort maximal sur des courtes distances (25-50m). Tu vas à fond, la récupération est longue entre les répétitions.`,
      },
      {
        h2: "La CSS — Vitesse Critique de Nage",
        content: `**CSS** (Critical Swim Speed) est l'allure-seuil entre ce que tu peux tenir longtemps et ce qui devient vraiment difficile. C'est l'équivalent en natation de la VMA en course à pied.

Pour la calculer : fais un 400m à fond, récupère 10 minutes, fais un 200m à fond. La CSS = (temps 400m − temps 200m) / 200.

**Pourquoi c'est important ?** Parce que c'est l'allure à laquelle tu progresses le plus vite. Travailler régulièrement à ta CSS améliore ta capacité à tenir une allure élevée sur les longues distances.

Dans MySWYM, tu renseignes ton meilleur 100m et l'app calcule automatiquement ta CSS et tes zones d'intensité.`,
      },
      {
        h2: "Les structures de séance",
        content: `**Échauffement**
Les premières longueurs à faible intensité (Z1-Z2). Le corps met 5 à 10 minutes pour trouver son rythme en natation. Ne saute jamais l'échauffement.

**Corps de séance**
La partie principale : séries, intensités variées selon l'objectif du jour.

**Retour au calme**
2 à 4 longueurs très lentes à la fin. Élimine les déchets métaboliques et aide la récupération. Souvent en dos ou en brasse.

**Répétitions (reps)**
Le nombre de fois que tu répètes un effort. "8×100m" = 8 répétitions de 100m.

**Séries**
Un ensemble de répétitions avec le même objectif. Séparées par une récupération plus longue que les récups entre reps.`,
      },
      {
        h2: "Les récupérations",
        content: `**R15" / R30" / R2'**
La lettre R suivie d'un temps = récupération fixe. Tu arrives au mur, tu attends exactement ce temps, tu repars.

**D1'45" — Départ toutes les 1'45"**
Le système professionnel. Tu pars (ou repars) toutes les 1 minute 45 secondes. Si tu nages en 1'30", tu récupères 15 secondes. Si tu nages en 1'38", tu récupères 7 secondes. Le chrono de référence, c'est l'horloge de bassin — pas ta montre. Plus tu vas vite, plus tu récupères. C'est l'outil de progression intégré dans la séance.

**Récupération active**
Tu ne t'arrêtes pas complètement entre les efforts — tu nages doucement (souvent pull-buoy ou dos) pour garder le sang qui circule.`,
      },
      {
        h2: "Les exercices techniques (drills)",
        content: `**Coulée / Torpedo**
La position hydrodynamique après un départ ou un virage : bras tendus devant la tête, corps gainé, pieds serrés. Chaque poussée de mur donne 3 à 5 mètres gratuits si tu glisses bien. Un classique des nageurs confirmés que les débutants oublient souvent.

**Fist drill**
Nager les poings fermés. Force à sentir l'avant-bras comme surface de propulsion, pas seulement la main. Excellent pour améliorer la prise d'eau.

**Catch-up drill**
Attendre que le bras avant soit revenu avant de lancer le suivant. Améliore la coordination et l'allongement.

**DPS — Distance Par Stroke (distance par coup de bras)**
Essayer de faire le plus de distance possible par traction. Force à s'allonger, à glisser, à être efficace plutôt que de mouliner.

**Négatif split**
Nager la deuxième moitié d'une distance plus vite que la première. Entraîne le contrôle du rythme et évite les départs trop rapides.`,
      },
      {
        h2: "Les termes de la séance type",
        content: `**"à bloc"** → effort maximal, donne tout

**"à l'aise"** → allure confortable, tu ne forces pas

**"progressif"** → tu accélères tout au long de la longueur ou de la série

**"régulier"** → toutes les répétitions au même tempo, pas de départ rapide / arrivée lente

**"à fond de la 3e"** → lâche tout sur la 3e répétition (ex : quand les séries sont en 3 blocs)

**"fouet des chevilles"** → battement de jambes efficace : souple, rapide, partant de la hanche, pas du genou

**"coude haut"** → lors de la traction, garder le coude plus haut que la main pour une meilleure prise d'eau

**"rotation des épaules"** → le corps tourne légèrement à chaque bras. La rotation permet une meilleure amplitude et moins de fatigue.

**"torpille gainée"** → corps parfaitement aligné, abdos contractés, pas de déhanchement`,
      },
    ],
    cta: {
      title: "Maintenant que tu parles nageur…",
      text: "MySWYM génère un programme complet avec tous ces termes en contexte. Chaque séance est détaillée — tu sais exactement quoi faire, pourquoi, et à quelle intensité.",
      button: "Créer mon programme",
    },
  },
];
