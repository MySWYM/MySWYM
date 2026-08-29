// ── Articles de blog ──────────────────────────────────────────────────────
export const POSTS = [
  {
    slug: "personnalisation-100m-natation",
    title: "Pourquoi ton meilleur 100m change tout à ton entraînement",
    description: "Un seul temps suffit pour que ton plan devienne vraiment le tien. Départs calculés à la seconde, zones d'intensité réelles, allures cibles : voici comment ton 100m personnalise chaque séance.",
    category: "Entraînement",
    date: "27 avril 2025",
    readingTime: "7 min",
    coverColor: "#0A84FF",
    intro: "La plupart des applications de natation te donnent un programme. MySWYM t'en donne un qui te ressemble. La différence tient à un seul chiffre : ton meilleur 100m. Voici pourquoi ce temps change absolument tout à la qualité de ton entraînement.",
    sections: [
      {
        h2: "Le problème des programmes génériques",
        content: `Imagine deux nageurs : Marie, 100m en 1'20", et Thomas, 100m en 2'10". Si on leur donne le même programme, \"6×100m, récup 20 secondes\", que se passe-t-il ?

Marie finit chaque 100m en 1'20" et n'a que 20 secondes pour récupérer. Elle repart avant d'être prête. Sa séance vire à l'accumulation de fatigue, elle dégrade sa technique, et elle risque de finir à plat.

Thomas, lui, finit en 2'10". Avec 20 secondes de récup, son départ toutes les 2'30" lui laisse largement le temps de souffler. Il récupère trop, la séance n'est pas assez stimulante pour progresser.

**Le même programme, deux expériences opposées.** C'est pour ça que le 100m est la clef de voûte d'un plan intelligent.`,
      },
      {
        h2: "Comment ton 100m est utilisé pour chaque séance",
        content: `Ton meilleur 100m NL est ta vitesse de référence, ce qu'on appelle en natation ton **allure de base**. À partir de là, chaque zone d'intensité est calculée par un coefficient :

**Zone facile (Z1/Z2), coefficient ×1,35**
Si tu nages le 100m en 1'30" (90 secondes), ton allure en Z1/Z2 est 90 × 1,35 = **2'01"/100m**. C'est l'allure à laquelle tu peux nager longtemps, tenir une conversation, construire ton endurance sans te cramer.

**Zone seuil / CSS (Z3/Z4), coefficient ×1,08**
Même exemple : 90 × 1,08 = **1'37"/100m**. C'est ton seuil anaérobie, l'allure la plus rapide que tu peux tenir sur une longue distance. Travailler juste en dessous ou au niveau de cette zone, c'est là que la vraie progression se fait.

**Zone sprint (Z5/Z6), coefficient ×0,95**
90 × 0,95 = **1'25"/100m**. Effort maximal sur des répétitions courtes (25m, 50m). Cette zone travaille ta puissance et ta vitesse de pointe.

**Sans ton 100m**, ces chiffres sont calculés par niveau déclaré (débutant, intermédiaire, avancé), ça marche, mais c'est une estimation. **Avec ton 100m**, c'est ta physiologie réelle qui pilote ton entraînement.`,
      },
      {
        h2: "Les départs à la montre : un exemple concret",
        content: `Prenons une séance seuil classique : **8×100m à allure CSS**.

**Sans ton 100m renseigné (niveau \"intermédiaire\") :**
Départ toutes les 1'55", c'est la valeur moyenne pour ce niveau.

**Avec ton 100m à 1'30" :**
Allure CSS calculée = 1'37"/100m. Temps de nage estimé = 1'37". On ajoute 15" de récupération. Départ toutes les **1'55"**, ça coïncide ici.

**Avec ton 100m à 1'15" :**
Allure CSS = 1'21". Récup 15". Départ toutes les **1'40"**, soit 15 secondes de moins. Sur 8 répétitions, la différence est énorme en termes de densité de travail.

**Avec ton 100m à 2'00" :**
Allure CSS = 2'10". Récup 15". Départ toutes les **2'25"**. Si on t'avait laissé sur 1'55", tu aurais nagé trop vite ou pas eu le temps de récupérer.

C'est ce grain de précision qui sépare un entraînement qui progresse d'un entraînement qui fatigue.`,
      },
      {
        h2: "Comment mesurer ton meilleur 100m",
        content: `Pas besoin de conditions parfaites. Voici le protocole simple :

**1. Choisis le bon moment**
En milieu de séance, après un bon échauffement (400m minimum). Jamais en début de séance les muscles froids, jamais en fin si tu es épuisé.

**2. L'échauffement spécifique**
200m facile + 4×25m progressifs (le dernier quasi à fond). Tu dois arriver prêt à partir fort dès le premier mètre.

**3. Le 100m**
Départ du bord (pas plongé, ça fausse le résultat). Nage à effort maximal mais **régulier**, beaucoup de nageurs partent trop vite sur les 25 premiers mètres et s'effondrent. L'objectif : que tes 4 longueurs soient les plus régulières possible.

**4. Note le temps**
Arrête le chrono au toucher du mur. C'est ton 100m de référence.

**Astuce :** refais ce test toutes les 6 semaines. Si tu as progressé, mets à jour ton temps dans MySWYM : tes départs seront automatiquement recalculés et ton plan s'adaptera à ta nouvelle forme.`,
      },
      {
        h2: "Pourquoi ça change aussi ton endurance (pas juste les sprints)",
        content: `On imagine souvent que personnaliser les allures, ça ne sert que pour les séances intensives. C'est faux, c'est peut-être encore plus important pour l'endurance.

**Trop d'entraînement se fait dans la \"zone grise\"** : ni assez lent pour être vraiment récupérateur, ni assez vite pour être vraiment stimulant. C'est la zone où beaucoup de nageurs passent 80% de leur temps, sans le savoir, et qui explique les plateaux de progression.

Quand ton allure Z1/Z2 est correctement calculée à partir de ton 100m, tu évites ce piège. Tes séances d'endurance sont **vraiment faciles**, ce qui permet à ton corps de récupérer, de consolider les adaptations des séances intensives, et de revenir plus fort.

C'est le principe de la **polarisation de l'entraînement** : 80% des séances très faciles, 20% très intenses. Mais pour que ça marche, il faut savoir où est \"très facile\" pour toi spécifiquement, pas pour un nageur hypothétique de ton niveau.`,
      },
      {
        h2: "Et si je ne connais pas mon 100m ?",
        content: `Pas de panique. MySWYM fonctionne aussi sans, les allures sont estimées par niveau (débutant, intermédiaire, avancé). Tu auras un bon programme.

Mais si tu veux aller plus loin, voici comment faire ton premier test rapidement :

**Option 1, Test bassin** : La prochaine fois que tu vas nager, intègre 3×100m à fond dans ta séance avec 5 minutes de récup entre chaque. Prends la moyenne des 3. C'est une bonne estimation de ton meilleur 100m en conditions d'entraînement.

**Option 2, Estimation depuis un test récent** : Tu as nagé une compétition ou un chrono récemment ? Sur 50m, multiplie ton temps par 2,1 pour estimer ton 100m. Sur 200m, divise par 2,3.

Renseigne ce temps dans ton profil MySWYM et tes séances s'ajustent immédiatement. Pas besoin de régénérer ton plan, le calcul est automatique.`,
      },
    ],
    cta: {
      title: "Personnalise ton plan maintenant",
      text: "Renseigne ton meilleur 100m dans ton profil et vois tes zones d'intensité calculées en temps réel. Tes séances s'adaptent immédiatement.",
      button: "Ouvrir mon profil",
    },
  },
  {
    slug: "programme-natation-triathlon",
    title: "Programme natation pour triathlon : comment vraiment progresser",
    description: "Découvre comment structurer ton entraînement natation pour le triathlon, phases de préparation, séances CSS, travail au seuil et gestion de l'effort en open water.",
    category: "Triathlon",
    date: "15 avril 2025",
    readingTime: "8 min",
    coverColor: "#FF6B35",
    intro: "La natation, c'est souvent le segment le plus stressant du triathlon, surtout pour les débutants. Pourtant, avec une préparation structurée, c'est aussi celui où on peut grappiller le plus de temps sans s'épuiser. Voici comment bâtir un programme efficace.",
    sections: [
      {
        h2: "Pourquoi la plupart des triathlètes s'entraînent mal en natation",
        content: `La majorité des triathlètes font la même erreur : ils nagent "confortablement", ni trop vite, ni trop lentement, sans jamais vraiment travailler les zones d'intensité. Résultat : une progression lente, des séances monotones, et un segment natation subi plutôt que maîtrisé.

Un programme efficace repose sur **3 types de séances distinctes** : endurance, seuil et technique. Chacune a un rôle précis dans ta progression. Les mélanger ou les ignorer, c'est laisser de la performance sur la table.`,
      },
      {
        h2: "Les 3 types de séances indispensables",
        content: `**Endurance (Z1/Z2)**, C'est le socle. Ces séances longues à allure conversation construisent ta capacité aérobie. Pour un triathlon olympique, vise 2 à 3 séances d'endurance par semaine en phase de base. Format type : 8×200m à allure régulière avec 20" de récupération.

**Seuil (Z3/Z4)**, C'est ici que tu progresses vraiment. Le travail au seuil, aussi appelé CSS (Critical Swim Speed), te permet de tenir une allure élevée sur la distance de course. Format type : 6×200m à ton allure CSS avec départ à la montre.

**Technique**, Souvent négligée, la technique est pourtant le meilleur "dopant légal" en natation. Un nageur technique moins puissant battra toujours un nageur fort mais inefficace sur 1 500m. 10 minutes de drill par séance suffisent pour progresser en quelques semaines.`,
      },
      {
        h2: "La structure d'une semaine type (3 séances)",
        content: `Voici comment répartir tes 3 séances natation pour le triathlon :

**Lundi, Endurance fondamentale**
Échauffement 300m · 8×200m Z2 allure régulière · 4×50m pull-buoy · Retour au calme 200m

**Mercredi, Seuil / CSS**
Échauffement 300m + 4×25m accélérations · 6×150m allure CSS, vise tes meilleurs temps constants · 4×50m battements · Retour au calme 200m

**Vendredi, Technique + négatifs splits**
Échauffement 200m NL + 200m éducatifs · 6×100m catch-up drill / DPS · 6×150m NL, 1re moitié retenu, 2e moitié accéléré · Retour au calme 200m

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

**Phase de base (semaines 1-6)**, Construction aérobie. Volume élevé, intensité modérée. C'est le moment de travailler la technique et d'augmenter progressivement les distances.

**Phase de développement (semaines 7-12)**, Introduction du travail au seuil. Les séances CSS entrent en force. Le volume reste élevé, mais l'intensité monte.

**Phase de pic (semaines 13-16)**, Séances spécifiques à la distance de course. Travail de vitesse, simulation de la sortie de l'eau après effort physique.

**Affûtage (2-3 dernières semaines)**, Réduction du volume de 40%. On maintient quelques accélérations par séance pour garder la réactivité musculaire. L'entraînement est fait, le corps a juste besoin de se régénérer.`,
      },
      {
        h2: "La natation en eau libre : ce qui change",
        content: `Le bassin et l'eau libre, c'est deux mondes différents. Voici ce à quoi tu dois te préparer spécifiquement :

**Le sight (lever la tête)**, En bassin, les lignes de fond te guident. En eau libre, tu dois lever la tête toutes les 6-8 tractions pour te repérer. Intègre cet exercice en bassin : toutes les 2 longueurs, lève les yeux avant de respirer.

**Le départ massif**, Les premières centaines de mètres d'un triathlon sont chaotiques. Entraîne-toi à partir fort sur 100m pour simuler le coup de fouet du départ, puis revenir à ton allure de croisière.

**La combinaison**, Elle te fait flotter plus haut et va plus vite. Mais elle gêne la rotation des épaules. Entraîne-toi avec elle avant la course.

**La gestion thermique**, L'eau froide affecte la respiration les premières minutes. Habitue-toi en nageant les premières longueurs à fond avant de trouver ton rythme.`,
      },
    ],
    cta: {
      title: "Lance ton plan triathlon maintenant",
      text: "MySWYM génère ton programme natation complet, Sprint, Olympique, Half ou Ironman. Séances structurées, allures personnalisées, progression semaine par semaine.",
      button: "Créer mon plan triathlon",
    },
  },

  {
    slug: "comment-reussir-bnssa",
    title: "Comment réussir le BNSSA : le programme natation complet",
    description: "Tout ce qu'il faut savoir pour préparer les épreuves de natation du BNSSA, 100m sauvetage, 250m palmes, apnée dynamique et remorquage. Plan d'entraînement inclus.",
    category: "Diplômes",
    date: "8 avril 2025",
    readingTime: "9 min",
    coverColor: "#FFD700",
    intro: "Le BNSSA (Brevet National de Sécurité et de Sauvetage Aquatique) est le diplôme de référence pour surveiller des nageurs. Ses épreuves de natation sont exigeantes, apnée, remorquage, vitesse, et nécessitent une préparation spécifique. Voici comment aborder chaque épreuve.",
    sections: [
      {
        h2: "Les épreuves natation du BNSSA",
        content: `Le BNSSA comprend trois épreuves aquatiques éliminatoires :

**Épreuve 1, 100m sauvetage (temps limite : 2'40")**, Parcours : 25m NL → immersion (15m en apnée au fond) → virage mur → 15m apnée retour → 25m remorquage du mannequin en position dorsale. À réaliser sans équipement, en tenue réglementaire. En cas d'examen de rattrapage, le temps limite est porté à 3'00".

**Épreuve 2, 250m palmes/masque/tuba (temps limite : 4'20")**, 250m nage équipée en bassin, à réaliser en continu. L'objectif est de démontrer endurance et maîtrise des équipements dans le temps imparti.

**Épreuve 3, Assistance à personne en difficulté (pas de temps limite)**, Le jury évalue la qualité de l'intervention, la sécurité du sauveteur et la prise en charge de la victime. Il n'y a pas de chrono imposé : c'est la prestation globale qui est notée.

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

**La position dorsale**, Le mannequin est maintenu en position dorsale, visage hors de l'eau, bras sous ses aisselles et mains croisées sur sa poitrine. Tu nages sur le dos avec un battement de jambes puissant.

**Tes bras**, Ils propulsent en battage latéral sur les côtés, sans sortir de l'eau. Le mouvement est compact et régulier.

**Les clés pour tenir :** Commence par t'entraîner sans mannequin, puis avec un partenaire (plus léger), puis avec le mannequin réglementaire. La progression est indispensable.

Dans un programme sérieux, prévois 3 à 6 longueurs de remorquage par séance en fin de préparation.`,
      },
      {
        h2: "Le 250m palmes/masque/tuba : endurance et maîtrise",
        content: `Cette épreuve est souvent sous-estimée. Nager 250m équipé sans s'arrêter demande une endurance spécifique et une bonne maîtrise des équipements.

**S'équiper correctement :**
- Palmes courtes type nageur ou palmes de plongée/sauveteur de la marque Mares
- Masque bien ajusté, sans fuite, vérifie l'étanchéité à sec avant
- Tuba fixe, sans valve de purge (réglementaire BNSSA)

**L'erreur principale :** Se focaliser sur la vitesse. L'épreuve est chronométrée (4'20" maxi) mais la priorité reste de finir en continu, sans s'arrêter. Adopte une allure régulière dès le départ, un départ trop rapide finit en crampe ou en panique à mi-parcours.

**L'entraînement :** Intègre des séries de 4×50m équipé, puis 2×100m, puis 1×200m progressivement. La coordination palmes/tuba change ton équilibre dans l'eau et demande une adaptation.`,
      },
      {
        h2: "Plan type de préparation BNSSA, 8 semaines",
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
        content: `**Arriver sans avoir nagé en eau libre**, Le BNSSA se passe en bassin, mais certains éléments (visibilité réduite, eau plus froide) peuvent surprendre. S'entraîner dans des conditions variées aide.

**Sous-estimer la fatigue cumulée**, Les épreuves se succèdent le même jour. Si tu peux enchaîner 100m sauvetage + 250m palmes + épreuves physiques en une session, tu es prêt.

**Négliger la technique**, Beaucoup de candidats préparent le BNSSA uniquement en volume. Mais 30 minutes de travail technique par semaine (apnée, remorquage, position dorsale) valent plus que 2 heures de nage non spécifique.

**Paniquer en apnée**, Le stress consomme l'oxygène. Les candidats qui ratent l'apnée le font souvent par stress, pas par manque de capacité physique. Simule les conditions en entraînement pour apprivoiser la pression.`,
      },
    ],
    cta: {
      title: "Prépare ton BNSSA avec un plan structuré",
      text: "MySWYM génère un plan de préparation BNSSA complet, apnée dynamique, remorquage, simulation de parcours 100m et 250m palmes. Séances progressives adaptées à ta date d'examen.",
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
    intro: "Reprendre la natation après des années d'arrêt, ou commencer pour la première fois, c'est intimidant. On arrive au bassin, on fait quelques longueurs, et on s'essoufle déjà. Pourtant, avec une progression bien structurée, n'importe qui peut nager 1 000m sans s'arrêter en 8 semaines.",
    sections: [
      {
        h2: "Pourquoi tu t'essouffles en natation (et comment arrêter)",
        content: `La natation est le seul sport où tu dois gérer ta respiration en apnée partielle. À vélo ou en courant, tu peux respirer quand tu veux. En natation, tu as 2 à 3 secondes par cycle pour inspirer, et si tu ratesça, tu paniques, tu relèves la tête, et tout s'effondre.

**L'erreur principale des débutants** : ils nagent trop vite et paniquent dès que ça brûle. Ils forcent alors, nagent encore plus vite, et finissent par s'arrêter au bout de 25m.

La solution est contre-intuitive : **nage plus lentement**. Vraiment. Une allure où tu pourrais tenir une courte conversation. Si tu souffles, tu vas trop vite. C'est aussi simple que ça.`,
      },
      {
        h2: "Les 3 erreurs techniques qui épuisent les débutants",
        content: `**1. La tête trop haute**, Si ta tête dépasse à la surface, tes hanches plongent et ton corps crée une résistance énorme. Maintiens ton regard vers le fond du bassin, et lève la tête uniquement pour respirer.

**2. Les jambes qui coulent**, Des jambes qui battent dans tous les sens sans propulser drainent ton énergie. Les battements doivent être compacts (talons à la surface, pas de mouvement des genoux excessif) et souples.

**3. Pas de coulée après les virages**, Chaque poussée de mur bien réalisée te donne 3 à 5 mètres gratuits. Profites-en : glisse en torpedo gainée avant de reprendre tes bras. Tu économises de l'énergie et tu vas plus vite.`,
      },
      {
        h2: "Structure d'une séance pour débutant",
        content: `Une séance bien construite, même courte, fait plus de progrès qu'une session longue et anarchique.

**L'échauffement (10-15%)**, Ne saute pas dedans à fond. Fais 2 longueurs tranquilles pour sentir l'eau, ajuster ta respiration, t'allonger. Ton corps doit trouver le bon alignement avant d'augmenter l'effort.

**Le corps de séance (70-75%)**, Des séries courtes avec des récupérations. Pour un débutant : 6×50m avec 15" de récupération plutôt qu'un 300m continu. Même distance totale, mais beaucoup moins d'essoufflement et plus de qualité.

**Le retour au calme (10-15%)**, 2 longueurs sur le dos très lentement. C'est aussi précieux que l'échauffement pour la régénération musculaire.`,
      },
      {
        h2: "Le plan semaine par semaine",
        content: `**Semaines 1-2 : Trouver son eau**
Objectif : nager 400m en séance, sans s'arrêter dans les séries courtes.
Format type : 6×50m NL, R15", si tu souffles c'est trop vite · 4×50m dos crawlé, R10" · Retour au calme

**Semaines 3-4 : Construire l'endurance**
Objectif : enchaîner des 100m sans s'arrêter.
Format type : 4×100m NL, D3'30", allure conversation · 4×50m pull-buoy, R15" · Retour au calme

**Semaines 5-6 : Allonger les séries**
Objectif : tenir 200m sans s'arrêter.
Format type : 3×200m NL, D5'00", respiration toutes les 3 tractions · 4×50m battements planche · Retour au calme

**Semaines 7-8 : Le 1 000m**
Objectif : enchaîner 1 000m en une seule séance.
Format type : 2×400m NL, R30", tu t'arrêtes pour boire, pas pour souffler · 200m récupération dos

À la fin de la semaine 8, la plupart des débutants peuvent nager 1 000m en continu. Certains y arrivent dès la semaine 6.`,
      },
      {
        h2: "La technique en priorité : les éducatifs incontournables",
        content: `On progresse 2x plus vite avec 10 minutes de technique par séance qu'en nageant aveuglément.

**Nage avec palmes**, Les palmes compensent les jambes et te libèrent l'esprit pour te concentrer sur le haut du corps. Tu ressens immédiatement mieux la rotation des épaules et la prise d'eau, et ton corps reste horizontal sans effort. Indispensable pour les débutants.

**Tuba frontal**, Le tuba frontal élimine la contrainte de respiration. Tu peux nager en gardant la tête dans l'axe en permanence et sentir ton alignement tête-hanches-pieds sans jamais te tordre le cou. Parfait pour travailler la technique bras à bras sans interruption.

**Dos à 2 bras simultanés**, Nage sur le dos avec les deux bras qui tirent en même temps (comme un papillon mais sur le dos). Cet éducatif développe la conscience de la prise d'eau dorsale, le gainage du buste et la symétrie des appuis. Ce que tu corriges ici se transfère directement à ton crawl.

**3 mouvements crawl / 3 mouvements dos**, Alterne 3 tractions crawl puis 3 tractions dos en continu, sans t'arrêter. La transition force ton corps à réajuster l'alignement à chaque changement et t'apprend à varier les prises d'appui. Excellent pour casser la monotonie et sentir les différences de propulsion entre les deux nages.`,
      },
      {
        h2: "Combien de séances par semaine pour progresser ?",
        content: `**2 séances par semaine**, C'est le minimum pour progresser. En dessous, le corps "oublie" les sensations entre les séances et tu pars de zéro à chaque fois.

**3 séances par semaine**, L'idéal pour un débutant. Tu progresseras visiblement de semaine en semaine.

**4 séances par semaine ou plus**, Attention à la récupération. Le corps a besoin de temps pour intégrer les nouvelles sensations. Trop nager en faisant les mêmes erreurs peut ancrer de mauvaises habitudes.

La régularité prime sur le volume. 2 séances bien construites de 45 minutes valent largement mieux qu'une longue séance chaotique par semaine.`,
      },
    ],
    cta: {
      title: "Génère ton plan débutant personnalisé",
      text: "MySWYM crée un programme natation adapté à ton niveau, ton bassin et ta disponibilité. Chaque séance est détaillée, tu sais exactement quoi faire dans l'eau.",
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
    intro: "Tu regardes ton programme, tu lis \"8×100m NL, D1'45\", et tu te demandes ce que ça veut dire. C'est quoi ce D ? Pourquoi pas juste dire \"récupère 15 secondes\" ? La réponse change ta façon de t'entraîner, et te rapproche de la façon dont s'entraînent vraiment les nageurs.",
    sections: [
      {
        h2: "D1'45\" : départ toutes les 1 minute 45 secondes",
        content: `**D1'45\"** signifie : tu pars (ou repars) toutes les 1 minute et 45 secondes. C'est ce qu'on appelle un **départ à la montre**, ou plus précisément, un départ à l'horloge de bassin.

Concrètement, si tu nages 100m en 1'30\", tu as **15 secondes de récupération** avant de repartir. Si tu nages en 1'38\", tu n'as plus que 7 secondes. Si un jour tu nages en 1'50\", tu attends le départ suivant.

**Pourquoi ce système plutôt qu'une récup fixe ?**

Parce qu'il récompense la performance. Plus tu nages vite, plus tu récupères. Plus tu travailles, plus ton intervalle devient confortable. C'est un outil de progression intégré directement dans la séance, et c'est aussi ce qui te donne une référence objective sur ta forme du jour.`,
      },
      {
        h2: "L'horloge de bassin : ton meilleur ami",
        content: `Dans chaque bassin, il y a une grande horloge ronde avec une aiguille rouge (parfois verte) qui tourne. Elle fait un tour complet en **60 secondes**. C'est l'outil de référence de tout nageur sérieux.

**Comment l'utiliser :**

Tu n'as pas besoin de partir à un moment précis. Tu regardes où est l'aiguille au moment de ton départ, et tu repars quand elle revient exactement à la même position, ou après 1'45\" si le départ est à 1'45\".

Par exemple : tu pars quand l'aiguille est sur le **12**. Tu reviens au mur. Tu repars quand elle est revenue sur le **12** (après 1 tour complet = 1 min), ou sur le **9** si tu attends 1'45\", ou sur le **6** pour 1'30\".

**Le truc du nageur confirmé :** il ne regarde jamais sa montre pendant les séries. Il jette un œil à l'horloge en arrivant au mur, voit où est l'aiguille, et sait instinctivement s'il est dans les temps ou non.`,
      },
      {
        h2: "La montre : utile, mais pas pour les récups",
        content: `Beaucoup de débutants font la même erreur : ils utilisent la montre pour gérer leurs récupérations. Ils appuient sur "tour" à chaque arrivée au mur, regardent le temps, attendent 15 secondes, et repartent. Ça marche, mais **ça casse le rythme** et ça te déconnecte du bassin.

**La bonne façon d'utiliser la montre :**

Lance-la au premier départ de la série. Arrête-la après la dernière répétition. C'est tout.

La montre te sert pour **3 choses utiles** :
, **Strava**, garder un historique propre de tes kilomètres, voir ta progression dans le temps
, **Connaître ta moyenne**, même si légèrement faussée par les pauses entre séries, c'est une bonne indication de ton rythme global
, **Savoir où tu en es dans la distance**, "j'ai nagé 1 800m, il me reste 400m", la montre gère ça pour toi

Mais pendant les séries, **laisse l'horloge de bassin faire son travail**. C'est elle qui donne le tempo. La montre, c'est pour après.`,
      },
      {
        h2: "Pourquoi les vrais nageurs se fient à l'aiguille",
        content: `Dans un club, personne ne regarde sa montre pendant les séries. Tout le monde garde un œil sur l'horloge de bassin. Pourquoi ?

**Parce que c'est plus précis, plus fluide, et plus formateur.** L'horloge ne ment pas, si tu arrives au mur et que l'aiguille est déjà passée, tu as des questions à te poser sur ton allure. Si tu as 20 secondes d'avance, tu sais que tu es allé trop vite sur cette rep.

Avec le temps, tu développes une **conscience interne de l'allure**. Tu sais à 5 secondes près combien tu vas mettre sur un 100m. C'est ça, nager avec intelligence.

**Le processus d'apprentissage :**

1. Au début : regarder l'horloge à chaque arrivée et compter les secondes
2. Après quelques séances : estimer le temps avant même d'arriver au mur
3. À terme : sentir si tu es dans les temps dès le premier virage

Ce n'est pas une compétence innée, c'est simplement le résultat de regarder l'horloge systématiquement pendant quelques mois.`,
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
, D1'45\" = tu repars toutes les 1'45\" (ton temps de nage + ta récup)
, L'horloge de bassin = ton chrono de référence pendant les séries
, La montre = ton outil pour Strava, la distance et ta moyenne globale
, Plus tu nages vite, plus tu récupères, c'est la beauté du départ à la montre`,
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
    description: "RAC, godilles, grand chien, Z2, D1'45\", rattrapé, flèche… Tu débutes et tu ne comprends pas la moitié des termes de tes séances ? Ce glossaire t'explique tout, simplement.",
    category: "Débutants",
    date: "8 août 2026",
    readingTime: "8 min",
    coverColor: "#00C48C",
    intro: "Tu ouvres ton plan et tu lis : \"400m Cr/Dos (Z1), 8×50 : 25m grand chien · 25m normal, 6×100m D1'45\" (Z3), 200m RAC\". C'est du chinois ? Normal. La natation a son propre vocabulaire. Ce glossaire regroupe les termes que tu croises dans MySWYM, expliqués clairement.",
    sections: [
      {
        h2: "Les nages et les abréviations",
        content: `**Cr / NL, Crawl / Nage libre**
Dans MySWYM tu verras surtout **Cr** (crawl). NL = nage libre : techniquement n'importe quel style, mais en pratique c'est du crawl, la nage la plus rapide.

**Dos**
Dos crawlé : sur le dos, bras alternés. Souvent en départ, récup ou retour au calme.

**Brasse**
Bras et jambes simultanés, face vers le bas. Plus lente ; utile en récupération.

**4 nages**
Ordre olympique : papillon → dos → brasse → crawl. Présent surtout en séances techniques / bassin (pas le cœur des plans eau libre / triathlon).

**Battements / planche**
Planche à bout de bras, jambes seules. Objectif : fouet des chevilles et alignement du corps.`,
      },
      {
        h2: "Le matériel",
        content: `**Pull-buoy**
Flotteur en forme de 8 entre les cuisses. Les jambes flottent → tu travailles surtout les bras et la prise d'eau.

**Palmes**
Accélèrent le battement et aident la glisse / le roulis. Souvent associées aux éducatifs.

**Plaquettes**
Plaques sur les mains pour forcer l'appui. Utilisées sur certaines séries (pas sur le roulis : là, palmes uniquement).

**Tuba frontal**
Tuba devant le visage : tu nages sans tourner la tête pour respirer. Utile en découverte pour sentir la glisse (souvent avec palmes).

**Planche**
Pour les séries jambes.

À retenir : **jamais pull-buoy + palmes** en même temps, incompatible.`,
      },
      {
        h2: "Les zones d'intensité (Z1 à Z4)",
        content: `Les zones disent à quelle vitesse nager. Dans MySWYM elles sont calculées à partir de ton **T100** (meilleur temps sur 100 m crawl), pas d'un test 400/200.

**Z1, Très facile** · Récup / départ / fin. Tu pourrais parler. Souvent écrit « facile » au niveau découverte.

**Z2, Endurance** · Allure longue durée. Base de l'entraînement.

**Z3, Tempo / seuil bas** · Effort soutenu mais régulier. Tu tiens ~20-30 min.

**Z4, Seuil / qualité** · Allure exigeante (proche de ce que tu tiens sur ~1 500 m). Qualité > volume.

Les tags du type **(Z2 @01:45-01:55)** (Premium) = plage d'allure cible pour 100 m, dérivée de ton T100.`,
      },
      {
        h2: "T100 et allures",
        content: `**T100**
Ton temps de référence sur 100 m crawl (départ dans l'eau). C'est la seule donnée d'allure demandée par MySWYM : l'app en déduit Z1–Z4 et les plages \`@mm:ss\`.

**CSS (Critical Swim Speed)**
Concept classique d'allure-seuil (équivalent VMA en course). Tu peux la mesurer avec un 400 m + 200 m à fond, mais **dans l'app on ne te demande pas ce test** : on s'appuie sur le T100 pour rester simple et cohérent avec tes séances.`,
      },
      {
        h2: "La structure d'une séance MySWYM",
        content: `Chaque séance suit le même ordre coach :

**1. Départ** (~Z1)
Mise en route : Cr/Dos, godilles, parfois palmes. Pas de sprint.

**2. Technique**
Un focus du jour (roulis, rattrapé, jambes, grand chien, flèche…).

**3. Corps**
Le bloc physio (endurance, seuil, vitesse, eau libre…) selon la phase du plan.

**4. Fin / RAC, Retour Au Calme**
Nage très facile pour finir. **RAC** = retour au calme. Souvent dos, au choix, ou « le plus lent possible ».

**Répétitions**
« 8×100m » = 8 fois 100 m.

**Séries**
Groupe de reps avec le même objectif ; récup plus longue entre séries qu'entre reps.`,
      },
      {
        h2: "Les récupérations",
        content: `**R15" / R30" / R2'**
Récupération fixe : tu touches le mur, tu attends exactement ce temps, tu repars. Au niveau découverte, l'app peut écrire « repos 15 s » à la place.

**D1'45", Départ toutes les 1'45"**
Tu repars toutes les 1 min 45 s (horloge de bassin). Si tu nages en 1'30", tu récupères 15" ; si tu nages en 1'38", tu récupères 7". Plus tu vas vite, plus tu récupères. (Premium : intervalles en \`D…\` ; gratuit : souvent \`R…\`.)

**Récupération active**
Tu continues de nager doucement entre les efforts (dos, pull-buoy…) au lieu de t'arrêter complètement.`,
      },
      {
        h2: "Les éducatifs (exercices techniques)",
        content: `**Godilles**
Petits mouvements de mains (scapulling) pour sentir l'appui sur l'eau, souvent en départ ou en fin. Ventral ou dorsal.

**Flèche**
Poussée de mur + glisse bras tendus, tête entre les bras, avant de nager. Sensations de glisse (surtout découverte).

**Grand chien**
Traction large, bras qui restent sous l'eau. Sensations d'appui, rythme lent.

**Petit chien**
Même idée, amplitude plus courte / plus près du corps. Moins fréquent que le grand chien.

**Rattrapé**
Le bras avant attend (dans l'axe des épaules) avant que l'autre ne parte. Coordination et allongement, pas « les mains qui se touchent ».

**Roulis**
Rotation du corps (épaule qui sort de l'eau). Souvent avec palmes, sans plaquettes.

**Coulée**
Position hydrodynamique après poussée / virage : bras devant, corps gainé. Quelques mètres « gratuits » si tu glisses bien.

**Sighting**
En eau libre / triathlon : relever brièvement la tête pour viser (bouée, repère) sans casser toute la nage.

**Négatif split**
Deuxième moitié plus rapide que la première, contrôle du rythme.

**DPS, Distance Par Stroke**
Maximiser la distance par coup de bras : allongement et efficacité plutôt que moulinage.`,
      },
      {
        h2: "Les termes de la séance type",
        content: `**"à bloc"** → effort maximal

**"à l'aise" / "facile"** → confortable, tu ne forces pas

**"progressif"** → tu accélères sur la longueur ou la série

**"régulier"** → mêmes temps sur toutes les reps

**"souple" / "relâché"** → très facile, récup active

**"à fond de la 3e"** → max sur la 3e rep (souvent dans un bloc en 3)

**"fouet des chevilles"** → battement souple depuis la hanche, pas du genou

**"coude haut"** → coude au-dessus de la main pendant la traction

**"rotation des épaules"** → le corps tourne à chaque bras (roulis)

**"torpille gainée"** → aligné, abdos contractés, pas de déhanchement`,
      },
    ],
    cta: {
      title: "Maintenant que tu parles nageur…",
      text: "MySWYM génère un programme complet avec tous ces termes en contexte. Chaque séance est détaillée, tu sais exactement quoi faire, pourquoi, et à quelle intensité.",
      button: "Créer mon programme",
    },
  },
];
