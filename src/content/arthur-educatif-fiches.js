/**
 * Fiches pédagogiques Arthur pour éducatifs *existants* validés.
 * Affichage uniquement, ne change pas la sélection / volumes / formats.
 * Les 11 ajouts `arthur_*` sont absents volontairement (pas de sélection auto).
 * Source : tableur revue pédagogique / educatifs-arthur-contexte.json
 * Généré mécaniquement, ne pas inventer de pédagogie.
 */

/** @typedef {{
 *  id: string,
 *  name: string,
 *  utility: string,
 *  instructions: string,
 *  level: string,
 *  equipment: string,
 *  notes: string,
 * }} ArthurEducatifFiche
 */

/** @type {Record<string, ArthurEducatifFiche>} */
export const ARTHUR_EDUCATIF_FICHES = {
  "ui_catalog_poings_fermes": {"id": "ui_catalog_poings_fermes", "name": "Poings fermés", "utility": "Développer le rôle propulsif des avant-bras, améliorer les sensations de résistance et repérer les pertes d’appui pendant la traction.", "instructions": "Nager en crawl avec les poings fermés, sans crisper les mains. Conserver une nage fluide et des battements réguliers. Chercher à prendre appui avec les avant-bras pour compenser la diminution de la surface des mains.", "level": "Régulier, sportif et performant", "equipment": "", "notes": "Accélérer progressivement le mouvement sous l’eau. Lors du retour en nage complète, observer la différence de sensations et d’efficacité avec les mains ouvertes.", "garder": "oui"},
  "ui_catalog_progressif": {"id": "ui_catalog_progressif", "name": "Progressif", "utility": "Faire monter progressivement l’intensité et préparer le nageur avant une série de vitesse, d’allure ou une série exigeante.", "instructions": "Nager en augmentant progressivement la vitesse sur une distance définie, sans partir immédiatement à l’intensité maximale.", "level": "Tous niveaux, avec une prescription adaptée", "equipment": "", "notes": "Ce n’est pas un éducatif technique. Il sert à remettre le nageur en action après une phase relâchée ou une récupération active.", "garder": "oui mais c'est pas un éducatif, c'est un exercice de séance"},
  "nouveau_brasse_opposition": {"id": "nouveau_brasse_opposition", "name": "Brasse en opposition", "utility": "Prendre conscience de ses automatismes et développer la coordination ainsi que la dissociation entre les bras et les jambes.", "instructions": "Nager en brasse en gardant immobiles un bras et la jambe opposée : par exemple le bras gauche et la jambe droite. Réaliser le mouvement avec l’autre bras et l’autre jambe, puis changer éventuellement de côté.", "level": "sportif et performant", "equipment": "", "notes": "Veiller à conserver une opposition croisée : bras gauche avec jambe droite immobiles, ou bras droit avec jambe gauche immobiles.", "garder": "oui"},
  "educatif_apnee_controlee": {"id": "educatif_apnee_controlee", "name": "Apnée contrôlée", "utility": "Améliorer l’hydrodynamisme, la gestion de l’expiration, le relâchement musculaire et le maintien du gainage.", "instructions": "Partir du mur et nager en crawl, lentement et sans prendre d’inspiration, sur la distance prévue. Rester relâché et conserver un gainage stable sans céder à la panique. Utiliser uniquement sur les nages crawl et papillon (très rare)", "level": "Sportif et performant", "equipment": "", "notes": "La distance est choisie en fonction du niveau et de la capacité du nageur à rester relâché.", "garder": "Oui"},
  "educatif_jambes_crawl": {"id": "educatif_jambes_crawl", "name": "Battements de crawl", "utility": "Travailler le cardio avec un exercice accessible, tout en développant la propulsion des jambes. Cette propulsion devient particulièrement importante en sprint.", "instructions": "Se déplacer en utilisant principalement les battements de jambes en crawl.", "level": "Tous niveaux, avec prescriptions adaptées", "equipment": "", "notes": "Le battement simple demande peu de maîtrise technique et permet de produire un effort cardiovasculaire. Les variations de profondeur transforment l’exercice en travail éducatif.", "garder": "Oui, comme exercice de jambes."},
  "educatif_crawl_immerge": {"id": "educatif_crawl_immerge", "name": "Crawl immergé", "utility": "Travailler la propulsion des jambes, le gainage et la recherche d’une position profilée sous l’eau.", "instructions": "S’immerger à une profondeur définie, puis nager en crawl sous l’eau comme en surface. Utiliser des battements très propulsifs et conserver un corps aussi profilé que possible afin de limiter la résistance de l’eau. Remonter avant de manquer de souffle.", "level": "Performant uniquement", "equipment": "palmes", "notes": "Les palmes sont obligatoires. L’objectif maximal proposé est de parcourir 25 mètres, mais le nageur doit remonter plus tôt si nécessaire.", "garder": "Oui, très rarement en phase deload dans un cycle pour ajouter du fun"},
  "nouveau_crawl_polo": {"id": "nouveau_crawl_polo", "name": "Crawl polo", "utility": "Développer une propulsion continue et une coordination adaptée à la vitesse. Pour les triathlètes et les nageurs en eau libre, travailler également l’orientation vers l’avant et automatiser ce geste avant son utilisation en situation réelle.", "instructions": "Nager en crawl avec la tête fixe hors de l’eau et le regard dirigé vers l’avant. Maintenir des battements rapides et supprimer les temps morts entre les bras : lorsqu’une main entre dans l’eau, l’autre se trouve presque au niveau de la cuisse.", "level": "Prioritaire pour les triathlètes et les nageurs en eau libre ; niveau : sportif et performant", "equipment": "", "notes": "La tête doit rester fixe hors de l’eau. Son maintien dépend de battements fréquents et de l’absence de temps mort entre les bras. Les pratiquants de triathlon et d’eau libre doivent rencontrer cet exercice plus souvent que les autres nageurs.", "garder": "oui"},
  "educatif_crawl_rattrape": {"id": "educatif_crawl_rattrape", "name": "Crawl rattrapé", "utility": "Associer la respiration au mouvement des bras et travailler leur synchronisation.", "instructions": "Garder un bras tendu devant pendant que l’autre réalise un mouvement complet de crawl. Attendre que les deux mains se rejoignent ( attention à garder les bras dans l'axe de l'épaule, on se superpose pas les mains) devant avant de commencer le mouvement avec l’autre bras. Pour respirer, tourner la tête sur le côté dès le début du mouvement du bras, puis remettre le visage dans l’eau avant son retour vers l’avant.", "level": "Tous les niveaux", "equipment": "pull-buoy", "notes": "Le pull-buoy permet de se concentrer sur les bras et la respiration. Pendant l’inspiration, conserver approximativement la moitié du visage dans l’eau. Le bras opposé reste tendu devant et les mains doivent se rejoindre après chaque mouvement, y compris lorsqu’on respire.", "garder": "Oui"},
  "nouveau_crawl_envers": {"id": "nouveau_crawl_envers", "name": "Crawl à l’envers", "utility": "Améliorer le gainage, prendre conscience des automatismes habituels et développer la coordination.", "instructions": "Nager en réalisant les mouvements de bras dans le sens inverse du crawl habituel. Effectuer la poussée sous l’eau avec le dos de la main.", "level": "Performant", "equipment": "", "notes": "Exercice difficile demandant une forte attention à la coordination.", "garder": "oui"},
  "educatif_un_bras": {"id": "educatif_un_bras", "name": "Crawl à un bras", "utility": "Intégrer la respiration dans la rotation du corps, conserver une position horizontale et améliorer l’efficacité de la propulsion du bras.", "instructions": "Garder un bras immobile le long du corps et nager uniquement avec l’autre. Allonger le bras actif devant en engageant l’épaule sous l’eau. Inspirer sur le côté grâce à la rotation du corps, sans prendre appui vers le bas. Replacer le visage dans l’eau, puis pousser l’eau vers l’arrière. Laisser le corps tourner de l’autre côté pour faciliter le retour aérien du bras.", "level": "Nageurs déjà à l’aise en crawl ; donc sportif et au delas", "equipment": "", "notes": "Il est conseillé de maîtriser auparavant le costal jambes. À l’inspiration, le bras actif reste allongé devant et relâché. Rechercher une résistance de l’eau dans la main dès le début de l’appui vers l’arrière.", "garder": "Oui"},
  "nouveau_doigts_surface": {"id": "nouveau_doigts_surface", "name": "Doigts à la surface", "utility": "Favoriser le relâchement du bras pendant le retour aérien, créer une courte phase de récupération et maintenir le retour près de l’axe du corps.", "instructions": "Nager tranquillement en relâchant le bras pendant son retour aérien. Après la poussée sous l’eau, dégager l’épaule et le bras tout en laissant le bout des doigts au contact de l’eau. Effleurer la surface jusqu’au point d’entrée de la main, dans l’axe de l’épaule.", "level": "Régulier, sportif et performant", "equipment": "", "notes": "Le nageur doit pouvoir effleurer la surface tranquillement à chaque mouvement, y compris du côté de la respiration. Une accélération ou une perte de contact peut révéler une difficulté d’équilibre, de position ou de respiration.", "garder": "oui"},
  "educatif_entree_main": {"id": "educatif_entree_main", "name": "Entrée de main alignée", "utility": "Prendre conscience du placement de la main à l’entrée dans l’eau et améliorer la précision du geste.", "instructions": "Nager lentement en regardant légèrement devant, de manière exceptionnelle, pour observer l’entrée de la main dans l’eau. La main entre dans l’axe de l’épaule, le plus loin possible devant, et avant le coude.", "level": "Débutant et régulier en priorité", "equipment": "", "notes": "Le regard légèrement dirigé vers l’avant est propre à cet exercice d’observation. Il ne constitue pas la position habituelle de nage.", "garder": "Oui"},
  "educatif_fleche": {"id": "educatif_fleche", "name": "Flèche", "utility": "Apprendre à glisser, améliorer l’équilibre et réduire la résistance de l’eau. Cette position sert de base aux différentes nages.", "instructions": "Pousser sur le mur avec les deux pieds, puis maintenir le corps tendu et aligné. Les bras sont serrés contre les oreilles, avec une main posée sur l’autre, et la tête reste rentrée dans l’alignement du corps.", "level": "Découverte et régulier ; à adapter aux autres niveaux.", "equipment": "tuba", "notes": "Commencer jambes immobiles pour tester la glisse. Il est ensuite possible d’ajouter de petits battements pour terminer la longueur sans perdre l’alignement. Respiration de face ou sur le côté ; tuba conseillé.", "garder": "Oui"},
  "educatif_grand_chien": {"id": "educatif_grand_chien", "name": "Grand chien", "utility": "Améliorer la qualité des appuis, l’amplitude de la traction jusqu’à la poussée et la stabilité du corps.", "instructions": "Allongé sur le ventre, commencer un bras loin devant et pousser l’eau jusqu’à la cuisse. Ramener ensuite le bras sous l’eau, près du corps, puis alterner avec l’autre bras sans retour aérien.", "level": "régulier, adaptable à tous niveaux avec une vitesse lente et une consigne simple.", "equipment": "tuba", "notes": "La tête peut rester hors de l’eau ou la respiration s’effectuer de face ou sur le côté. Le retour sous-marin doit rester discret et serré. Tubas conseillé pour les découvertes et possible pour les autres niveaux", "garder": "oui"},
  "nouveau_jet_eau": {"id": "nouveau_jet_eau", "name": "Jet d’eau", "utility": "Exagérer et renforcer la fin de poussée afin d’éviter d’interrompre trop tôt le mouvement propulsif.", "instructions": "À la fin de chaque mouvement sous l’eau, pousser fortement jusqu’au bout et projeter un petit jet d’eau derrière la main avant de commencer le retour aérien.", "level": "Tous", "equipment": "", "notes": "Le jet d’eau doit apparaître derrière la main avant le retour aérien. L’effort doit être nettement ressenti au niveau du triceps.", "garder": "oui"},
  "educatif_nage_economique": {"id": "educatif_nage_economique", "name": "Nage économique", "utility": "Inciter le nageur à mieux glisser, à rechercher une position efficace et à améliorer l’efficacité de chaque traction. Le comptage l’aide à rester concentré sur la qualité de sa nage.", "instructions": "Nager normalement en crawl en comptant chaque coup de bras. Chercher à parcourir la longueur avec le plus petit nombre possible de coups de bras, puis essayer de réduire progressivement ce nombre au fil des longueurs.", "level": "Régulier, sportif et performant", "equipment": "", "notes": "Comparer les résultats sur une même distance. La diminution du nombre de coups de bras doit provenir d’une meilleure glisse et de tractions plus efficaces.", "garder": "Oui"},
  "educatif_petit_chien": {"id": "educatif_petit_chien", "name": "Petit chien", "utility": "Isoler et améliorer la prise d’appui du crawl. L’objectif est de sentir la résistance de l’eau dès le début de traction et d’apprendre à orienter main et avant-bras vers l’arrière pour créer de la propulsion.", "instructions": "En crawl, garde les deux bras sous l’eau et alterne des appuis courts. Dès le début du mouvement, place la main et l’avant-bras face vers l’arrière, doigts orientés vers le fond. Fléchis le coude tout en gardant le haut du bras proche de la surface. Ramène ensuite le bras vers l’avant sous l’eau, sans dépasser la verticale sous l’épaule.", "level": "régulier, adaptable à tous niveaux avec une vitesse lente et une consigne simple.", "equipment": "tuba", "notes": "Sans matériel. Peut être réalisé avec le regard légèrement vers l’avant pour observer les mains, mais cette variante relève le buste : l’utiliser seulement pour comprendre le placement. Critère de réussite : sentir un appui solide et une légère propulsion malgré le mouvement court. Tubas conseillé pour les découvertes et possible pour les autres niveaux", "garder": "Oui"},
  "educatif_respiration_par_temps": {"id": "educatif_respiration_par_temps", "name": "Respiration par temps", "utility": "Travailler le contrôle du souffle et de l’expiration, la tolérance à l’effort ainsi que le maintien du gainage et de l’alignement lorsque les inspirations s’espacent.", "instructions": "Nager en crawl en augmentant progressivement le nombre de mouvements de bras entre deux inspirations : respirer tous les 3 mouvements, puis tous les 5, puis tous les 7 et éventuellement tous les 9. Une descente en 7-5-3 peut être ajoutée.", "level": "Régulier, sportif et performant", "equipment": "", "notes": "Expirer progressivement sous l’eau et maintenir une nage relâchée. La descente de la pyramide est optionnelle.", "garder": "Oui"},
  "educatif_roulis": {"id": "educatif_roulis", "name": "Roulis", "utility": "Apprendre à dissocier la rotation du corps des mouvements de la tête, maintenir l’équilibre horizontal et utiliser le roulis pour respirer sans relever le menton.", "instructions": "Avancer en battements, les bras le long du corps et le regard fixé vers le fond. Tourner le corps d’un seul bloc pour sortir une épaule tandis que l’autre reste immergée, proche du menton. Garder la tête immobile, maintenir la position au moins trois secondes, puis alterner de l’autre côté.", "level": "Tous mais potentiellement difficile", "equipment": "", "notes": "Ne pas dépasser 90° de rotation. L’épaule immergée ne doit pas franchir l’axe du corps. Le corps tourne autour de son axe tandis que la tête reste fixe, sauf pendant la variante respiratoire. Rechercher le relâchement des deux côtés.", "garder": "Oui"},
  "educatif_six_battements_par_roulis": {"id": "educatif_six_battements_par_roulis", "name": "Six battements par roulis", "utility": "Synchroniser les battements, le gainage et la rotation du corps afin d’améliorer le roulis en crawl.", "instructions": "Se maintenir allongé et stable sur un côté. Réaliser six battements rapides et réguliers, puis effectuer un mouvement de bras pour faire basculer ensemble les épaules et les hanches de l’autre côté. Se stabiliser et recommencer.", "level": "régulier, adaptable à tous niveaux avec une vitesse lente et une consigne simple.", "equipment": "palmes", "notes": "Garder le corps allongé, sans cambrer ni serpenter. La position exacte des bras reste à préciser. Avec des palmes surtout ça rend l'exo fun", "garder": "Oui"},
  "educatif_toucher_cuisse": {"id": "educatif_toucher_cuisse", "name": "Toucher cuisse", "utility": "Augmenter l’amplitude du mouvement et éviter d’interrompre la poussée trop tôt.", "instructions": "Nager en crawl normalement. À chaque passage de bras, terminer la poussée sous l’eau jusqu’à la cuisse et la toucher avec le pouce avant de commencer le retour aérien.", "level": "régulier, adaptable à tous niveaux avec une vitesse lente et une consigne simple.", "equipment": "pull-buoy, tuba", "notes": "Chercher à toucher la cuisse le plus loin possible vers l’arrière, sans dégrader la position du corps. Pull-buoy et/ou tuba.", "garder": "Oui"},
  "educatif_jambes_dos": {"id": "educatif_jambes_dos", "name": "Battements de dos", "utility": "Selon la séance, travailler les jambes d’une manière différente ou proposer une phase de relâchement et de récupération active.", "instructions": "Se déplacer sur le dos uniquement grâce aux battements de jambes.", "level": "Adaptable selon la prescription", "equipment": "", "notes": "Ce contenu doit rester disponible dans les séances, mais ne doit pas être présenté comme un éducatif technique.", "garder": "Oui, comme exercice et non comme éducatif."},
  "nouveau_dos_soldat": {"id": "nouveau_dos_soldat", "name": "Dos soldat", "utility": "Travailler la coordination des bras et varier l’entraînement.", "instructions": "Les bras restent au-dessus de la surface. Vous devez continuellement effectuer des mouvements opposés avec vos deux bras, l'un allant de l'avant vers l'arrière et l'autre de l'arrière vers l'avant. C'est un petit éducatif de coordination qui vous permettra de varier votre entraînement.", "level": "sportif et performant", "equipment": "", "notes": "Les deux bras restent toujours au-dessus de la surface. L’avancement dépend entièrement des jambes : les battements doivent être continus et énergiques.", "garder": "oui"},
  "nouveau_dos_deux_bras": {"id": "nouveau_dos_deux_bras", "name": "Dos à deux bras", "utility": "Prise d’appui et travail de traction des bras en dos (mouvement symétrique).", "instructions": "Pause de 2 secondes au-dessus de la tête. Terminer le mouvement jusqu’aux cuisses en les claquant. Prise d’appui et travail de traction.", "level": "Découverte (éducatif disponible) ; débutant et régulier.", "equipment": "", "notes": "Éducatif disponible au niveau découverte. En récupération active, le générateur pourra proposer uniquement 100 m ou 200 m dos à deux bras. Affichage nageur : « facile, sans forcer », ne jamais afficher « souple » ni « Z1 ». Pas d’autres distances, matériel, récupérations ou variantes pour l’instant.", "garder": "Oui comme éducatif"},
  "educatif_godille": {"id": "educatif_godille", "name": "Godille", "utility": "Améliorer la prise d’eau, la qualité des appuis et les sensations de propulsion avec la main et l’avant-bras. Éviter que le bras traverse l’eau sans créer d’appui efficace.", "instructions": "Allongé sur le ventre, effectuer de petits balayages continus avec les mains et les avant-bras. Orienter les paumes pour sentir la résistance de l’eau et maintenir un appui, sans chercher d’abord à avancer vite.", "level": "Régulier, sportif et performant", "equipment": "", "notes": "Garder le corps gainé et allongé, avec le regard vers le fond. Les trois positions de godille ciblent des phases différentes du mouvement de bras.", "garder": "Oui"},
  "nouveau_rattrape_vertical": {"id": "nouveau_rattrape_vertical", "name": "Rattrapé vertical", "utility": "Travailler le rythme du mouvement de bras, l’accélération de la propulsion et l’enchaînement immédiat du retour aérien. Développer également les battements nécessaires au maintien de la position horizontale.", "instructions": "Nager sur le dos en faisant agir les bras l’un après l’autre. Un bras reste tendu à la verticale, hors de l’eau, pendant que l’autre réalise son mouvement. Après une prise d’appui relativement lente, accélérer la propulsion sous l’eau et enchaîner immédiatement le retour aérien, sans arrêt à la cuisse, jusqu’à rejoindre la position verticale. Alterner ensuite les bras.", "level": "sportif et performant", "equipment": "", "notes": "Chaque mouvement s’achève lorsque le bras rejoint la verticale, à mi-chemin du retour aérien. Les battements doivent être suffisamment propulsifs pour soutenir la position.", "garder": "oui"},
  "nouveau_ondule_tete": {"id": "nouveau_ondule_tete", "name": "Ondule-tête", "utility": "Amplifier l’ondulation et ressentir comment les mouvements de la tête et des épaules se transmettent à l’ensemble du corps.", "instructions": "Garder les bras le long du corps. Inspirer en regardant vers l’avant, puis rentrer complètement la tête en rapprochant le menton de la poitrine. Faire entrer le visage dans l’eau par le haut du front afin d’engager le haut du corps sous la surface. Laisser le bassin remonter, puis redresser progressivement la tête pour revenir vers la surface et inspirer de nouveau.", "level": "Tous niveaux, avec une preference pour régulier et découverte", "equipment": "", "notes": "Expirer sous l’eau afin de pouvoir inspirer dès le retour à la surface. La vitesse n’est pas prioritaire : rechercher surtout une ondulation ample.", "garder": "oui"},
  "nouveau_papillon_baleine": {"id": "nouveau_papillon_baleine", "name": "Papillon baleine", "utility": "Apprendre à déclencher l’ondulation par la bascule du haut du corps et mieux ressentir la transmission du mouvement de la poitrine vers les hanches et les jambes.", "instructions": "Réaliser un mouvement de papillon en plongeant nettement sous la surface après chaque inspiration. Pendant le retour aérien, ramener les deux bras tendus vers l’avant. À leur entrée dans l’eau, orienter la poitrine, les bras et la tête vers le bas pour créer une bascule du haut du corps. Se laisser descendre, puis effectuer une ou plusieurs ondulations pour remonter.", "level": "Tous niveaux, avec une preference pour régulier et découverte", "equipment": "", "notes": "Pendant l’apprentissage, la tête accompagne volontairement la bascule pour amplifier le mouvement. Le rythme reste lent et non précipité. Pour revenir ensuite au papillon normal, orienter progressivement les bras vers l’avant plutôt que vers le fond.", "garder": "oui"},
  "nouveau_pousse_tete": {"id": "nouveau_pousse_tete", "name": "Pousse-tête", "utility": "Coordonner la traction des bras avec le redressement et l’immersion de la tête. Apprendre à créer une ondulation naturelle du corps sans la provoquer uniquement par une action forcée des jambes.", "instructions": "Partir allongé à la surface, les bras devant, la tête immergée et le regard vers le fond. Réaliser une traction complète jusqu’aux cuisses en redressant progressivement la tête pour inspirer. Dès la fin de la traction, engager la tête sous l’eau en rapprochant le menton de la poitrine, comme pour faire passer tout le corps sous une ligne. Ramener seulement ensuite les bras devant, sous l’eau et le long du corps.", "level": "Tous niveaux, avec une prescription adaptée", "equipment": "", "notes": "Éviter les actions volontaires des jambes pendant la traction et juste après. Si le nageur descend profondément, quelques ondulations peuvent l’aider à retrouver la surface et la position initiale.", "garder": "oui"},
};

/** Correspondances fiables catalogue UI → id Arthur. */
export const CATALOG_ID_TO_ARTHUR_ID = {
  "fleche": "educatif_fleche",
  "rattrape": "educatif_crawl_rattrape",
  "godille": "educatif_godille",
  "poings_fermes": "ui_catalog_poings_fermes",
  "crawl_polo": "nouveau_crawl_polo",
  "un_bras": "educatif_un_bras",
  "amplitude": "educatif_nage_economique",
  "progressif": "ui_catalog_progressif",
  "doigts_trainants": "nouveau_doigts_surface",
};

/** Patterns de matching (éducatifs existants Arthur), du plus spécifique au plus large. */
export const ARTHUR_EDUCATIF_MATCHERS = [
  { id: "educatif_petit_chien", match: [new RegExp("petit\\s*chien", "i")] },
  { id: "educatif_grand_chien", match: [new RegExp("grand\\s*chien", "i")] },
  { id: "educatif_toucher_cuisse", match: [new RegExp("toucher\\s*cuisse", "i")] },
  { id: "educatif_six_battements_par_roulis", match: [new RegExp("six\\s*battements|6\\s*battements", "i")] },
  { id: "educatif_crawl_immerge", match: [new RegExp("crawl\\s*immerg", "i")] },
  { id: "educatif_apnee_controlee", match: [new RegExp("apn[e\u00e9]e\\s*contr[o\u00f4]l", "i")] },
  { id: "educatif_respiration_par_temps", match: [new RegExp("respiration\\s*par\\s*temps|3T\\s*/\\s*5T|3T/5T/7T", "i")] },
  { id: "nouveau_doigts_surface", match: [new RegExp("doigts?\\s*[a\u00e0]\\s*la\\s*surface|doigts?\\s*tra[i\u00ee]n", "i")] },
  { id: "nouveau_dos_deux_bras", match: [new RegExp("dos\\s*[a\u00e0]\\s*deux\\s*bras", "i")] },
  { id: "nouveau_rattrape_vertical", match: [new RegExp("rattrap[e\u00e9]\\s*vertical", "i")] },
  { id: "nouveau_brasse_opposition", match: [new RegExp("brasse\\s*en\\s*opposition", "i")] },
  { id: "nouveau_crawl_envers", match: [new RegExp("crawl\\s*[a\u00e0]\\s*l['\u2019]?envers", "i")] },
  { id: "nouveau_dos_soldat", match: [new RegExp("dos\\s*soldat", "i")] },
  { id: "nouveau_crawl_polo", match: [new RegExp("crawl\\s*polo|\\bpolo\\b", "i")] },
  { id: "nouveau_jet_eau", match: [new RegExp("jet\\s*d['\u2019]?eau", "i")] },
  { id: "nouveau_ondule_tete", match: [new RegExp("ondule[\\s-]*t[e\u00ea]te", "i")] },
  { id: "nouveau_papillon_baleine", match: [new RegExp("papillon\\s*baleine", "i")] },
  { id: "nouveau_pousse_tete", match: [new RegExp("pousse[\\s-]*t[e\u00ea]te", "i")] },
  { id: "educatif_crawl_rattrape", match: [new RegExp("rattrap[e\u00e9](?!\\s*cuisse)(?!\\s*vertical)|catch[\\s-]*up", "i")] },
  { id: "educatif_jambes_crawl", match: [new RegExp("jambes?\\s*(de\\s*)?crawl|battements?\\s*(de\\s*)?crawl", "i")] },
  { id: "educatif_jambes_dos", match: [new RegExp("jambes?\\s*(de\\s*)?dos|battements?\\s*(de\\s*)?dos", "i")] },
  { id: "educatif_nage_economique", match: [new RegExp("nage\\s*[e\u00e9]conomique|\\bamplitude\\b|dps\\b|distance\\s*par\\s*cycle", "i")] },
  { id: "educatif_entree_main", match: [new RegExp("entr[e\u00e9]e\\s*de\\s*main|croisements?", "i")] },
  { id: "educatif_un_bras", match: [new RegExp("un\\s*bras|1\\s*bras|bras\\s*altern", "i")] },
  { id: "ui_catalog_poings_fermes", match: [new RegExp("poings?\\s*ferm", "i")] },
  { id: "ui_catalog_progressif", match: [new RegExp("progressif", "i")] },
  { id: "educatif_godille", match: [new RegExp("godille", "i")] },
  { id: "educatif_roulis", match: [new RegExp("\\broulis\\b", "i")] },
  { id: "educatif_fleche", match: [new RegExp("fl[e\u00e8]che", "i")] },
];

export function getArthurEducatifFiche(id) {
  if (!id) return null;
  return ARTHUR_EDUCATIF_FICHES[id] || null;
}

/**
 * Applique la fiche Arthur sur un éducatif catalogue (champs d’affichage seulement).
 * @param {object} educatif
 * @param {ArthurEducatifFiche} fiche
 */
export function applyArthurFicheToEducatif(educatif, fiche) {
  if (!educatif || !fiche) return educatif;
  return {
    ...educatif,
    name: fiche.name || educatif.name,
    shortDescription: fiche.utility || educatif.shortDescription,
    objective: fiche.utility || educatif.objective,
    cue: fiche.instructions || educatif.cue,
    level: fiche.level || null,
    equipment: fiche.equipment || null,
    ficheSource: "arthur",
    arthurId: fiche.id,
  };
}

export function educatifFromArthurFiche(fiche, { match = [] } = {}) {
  if (!fiche) return null;
  return {
    id: fiche.id,
    name: fiche.name,
    shortDescription: fiche.utility || "",
    objective: fiche.utility || "",
    cue: fiche.instructions || "",
    mistakes: [],
    videoUrl: null,
    thumbUrl: null,
    match,
    level: fiche.level || null,
    equipment: fiche.equipment || null,
    ficheSource: "arthur",
    arthurId: fiche.id,
  };
}

/**
 * Match direct sur les fiches Arthur existantes (hors `arthur_*`).
 */
export function matchArthurEducatif(text) {
  const t = String(text || "");
  if (!t.trim()) return null;
  for (const m of ARTHUR_EDUCATIF_MATCHERS) {
    if (m.match.some((re) => re.test(t))) {
      const fiche = getArthurEducatifFiche(m.id);
      if (!fiche) continue;
      return educatifFromArthurFiche(fiche, { match: m.match });
    }
  }
  return null;
}
