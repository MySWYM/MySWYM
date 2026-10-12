# École de nage : motions pédagogiques (6 cours, 70 scènes)

Chaque étape de l'école de nage a sa propre boucle animée : crawl, dos, virage culbute, départ, papillon et brasse. Le contenu suit les fiches de `docs/natation-savoir/` (crawl `crawl-performant-anc.md`, dos `nager2-dos.md`, virage `crawl-performant-avc.md`, départ `crawl-performant-adc.md`, papillon `nager2-papillon.md`, brasse `nager2-brasse.md`). Les titres sont ceux des fichiers `src/lib/swim-school/*-track.js`.

Les scènes sont dessinées et calculées à partir des fiches reformulées. Aucune image de livre n'a été copiée ni décalquée.

Côté app :
- les JSON sont copiés dans `public/school-motion/` ;
- le branchement se fait dans `src/lib/swim-school/motion-scenes.js` (`LOTTIE_BY_STEP`, `LABEL_KEY_BY_STEP`).

## Format

| | |
|---|---|
| Format | **Lottie JSON** (bodymovin 5.7, calques de forme uniquement, sans image ni police) |
| Taille | 800 × 400 px, vue de côté |
| Cadence | 30 fps, la clé géométrique toutes les 2 images (interpolation linéaire) |
| Boucle | oui : l'image `op` est identique à l'image 0, donc `loop: true` suffit. Les scènes avec déplacement (coulées, virages, départs) se remettent en place par un court fondu |
| Image 0 | toujours une pose lisible, utilisable comme vignette ou en mode « réduire les animations » |
| Fond | « soft mist » clair (`#F4F9FD`) dans le calque **`bg-mist`**. Supprimer ou masquer ce calque donne un fond transparent |
| Poids | crawl : environ 4 Mo pour 18 fichiers. Autres cours : environ 11,6 Mo pour 52 fichiers (110 à 350 kB chacun). Le JSON se compresse environ 10× en gzip |

### Lire une scène

- **Bras et jambe côté caméra** : bleu foncé avec un liseré clair. **Côté opposé** : bleu pâle, derrière le tronc. Le passage d'un plan à l'autre montre le roulis, les vrilles et les rotations.
- **Lunettes** (pastille claire sur la tête) : elles indiquent où regarde le visage. En bas, le nageur est sur le ventre. En haut, il est sur le dos. Au centre de la tête, le visage est tourné vers nous.
- **Flèche cyan** vers la bouche : le moment de l'inspiration, seulement quand la fiche le permet.
- **Eau teintée** sous la surface : elle distingue ce qui passe dans l'air (retours aériens, envol) de ce qui reste dans l'eau.
- **Pointillés au fond** : ils indiquent l'avancement. Ils sont fixes quand c'est le nageur qui traverse l'image (virage, départ).
- **Accessoires** : mur à gauche (coulées) ou à droite (virages), bord ou plot (départs), cerceau (ADC4, ADC9), arcs de sifflet en haut à gauche (ADC10).

### Conventions par cours

- **Dos** : le nageur est sur le dos, tête à droite. La tête reste fixe et regarde le plafond pendant que les épaules roulent. Le retour se fait bras tendu en arc vertical.
- **Virage** : le mur est à droite. Le nageur arrive vers la droite, tourne (roulade avant, ou demi-tour sur le côté pour AVC2-3), pose les pieds au mur et repart vers la gauche. La caméra est fixe et légèrement dézoomée (0,74).
- **Départ** : le bord (ADC1-4) ou le plot (ADC5-10) est à gauche. La caméra est fixe et dézoomée (0,6 au bord, 0,52 au plot) pour montrer déséquilibre → poussée → envol → entrée → coulée (→ reprise).
- **Papillon** : deux attitudes (bascule, fesses à la surface ; redressement, inspiration à la sortie des coudes), deux battements de jambes par cycle, retour bras tendus juste au-dessus de l'eau.
- **Brasse** : écart des mains → rentrée sous la poitrine → relance vite. Le ciseau (regroupement, pieds en flexion et dehors, fouetté) est calé sur la relance, et l'inspiration se fait avec la relance.

### Calques (noms stables pour l'intégration)

Du haut vers le bas : `signal-*` (ADC10), `inspire-head`, `inspire-shaft`, `surface`, `water`, `hoop` (cerceau), `armA_near`, `armB_near`, `legA_near`, `legB_near`, `goggle`, `head`, `neck`, `shoulders`, `suit`, `torso`, `hips`, `legA_far`, `legB_far`, `armA_far`, `armB_far`, `block` (plot), `wall` (mur, bord), `floor`, `bg-mist`.

Couleurs : corps `#4A90C4`, membres proches `#1F5E92`, membres éloignés `#9CC4E2`, eau `#8CC8EC` à 30 %, surface `#6FB2DE`, inspiration / cerceau / signal `#2EA6DD`, plot `#C9DDEC`.

## Index

`_index-all.json` liste les 70 scènes : `{ course, n, stepId, file, title, frames, seconds, show }`. `_index.json` est l'ancien index du crawl seul, conservé tel quel.

## Les scènes

Format : Lottie JSON pour toutes. Chaque fichier boucle.

Les étapes 10, 11, 14 et 15 du crawl dépassent les 3-4 s visées. Le livre demande d'alterner les côtés, et le 3 temps impose 6 passages pour revenir au point de départ. Pour les autres cours, les boucles de 4 à 5,4 s viennent des départs et des virages, qui enchaînent plusieurs phases (approche, rotation, poussée, coulée, reprise).

### Crawl (ANC1–ANC18)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `step-01-coulee.json` | ANC1 · Coulée ventrale | 3,6 s | Poussée au mur, corps à plat et gainé, bras tendus devant : longue glisse sans battements. |
| `step-02-kick.json` | ANC2 · Coulée + petits battements | 3,8 s | Même coulée, puis petits battements serrés qui prolongent la glisse sans cabrer le corps. |
| `step-03-inspire-devant.json` | ANC3 · Inspirer tête devant, bras immobiles | 3,6 s | Battements, bras tendus immobiles ; la tête sort juste assez pour inspirer devant puis replonge. |
| `step-04-vrille-dos.json` | ANC4 · Demi-vrille, inspirer à plat dos | 4,0 s | Bras tendus devant, demi-vrille ventre → dos ; on attend d’être à plat dos pour inspirer, puis retour ventre. |
| `step-05-deux-bras.json` | ANC5 · Deux bras en même temps | 3,9 s | Traction + poussée des deux bras ensemble jusqu’aux cuisses, glisse, puis inspiration tête devant. |
| `step-06-un-bras-puis-autre.json` | ANC6 · Un bras, puis l’autre | 4,2 s | Un bras puis l’autre, avec un temps stable entre les deux ; inspiration tête devant après le 2e bras. |
| `step-07-retour-sous-eau.json` | ANC7 · Retour des bras sous l’eau | 4,0 s | Un bras puis l’autre, arrêt + inspiration devant, puis les deux bras reviennent ensemble sous l’eau. |
| `step-08-retour-aerien.json` | ANC8 · Retour aérien, un bras puis l’autre | 4,4 s | Deux tractions alternées, arrêt + inspiration, puis chaque bras revient par-dessus l’eau, coude haut. |
| `step-09-cycle-vrille-dos.json` | ANC9 · Cycle, puis inspirer sur le dos | 4,7 s | Un cycle complet avec retours aériens, puis demi-vrille : inspiration seulement à plat dos, bras devant. |
| `step-10-dos-bras-opposes.json` | ANC10 · Inspirer sur le dos, un bras devant / un derrière | 6,0 s | Un bras a fini sa poussée, l’autre reste devant : demi-vrille, inspiration dos dans cette opposition, puis fin du retour. Puis l’autre côté. |
| `step-11-rattrape-vrille-dos.json` | ANC11 · Rattrapé avant + vrille, inspirer sur le dos | 6,0 s | Un bras complet jusqu’à retrouver l’autre devant, vrille et inspiration à plat dos, retour ventre ; puis l’autre bras, l’autre côté. |
| `step-12-rattrape-avant-cote.json` | ANC12 · Rattrapé avant, inspirer sur le côté | 3,4 s | Rattrapé avant : après la poussée, quart de vrille et tête sur le côté pour une inspiration courte, puis retour devant. Un côté puis l’autre. |
| `step-13-rattrape-arriere-cote.json` | ANC13 · Rattrapé arrière, inspirer sur le côté | 3,5 s | Les mains se retrouvent derrière, aux cuisses : un bras fait retour + traction, inspiration côté 1 fois sur 2. |
| `step-14-rattrape-avant-3-temps.json` | ANC14 · Rattrapé avant, inspirer tous les 3 temps | 5,4 s | Rattrapé avant enchaîné, bras dissociés ; inspiration tous les 3 passages, une fois de chaque côté, hors poussée. |
| `step-15-rattrape-arriere-3-temps.json` | ANC15 · Rattrapé arrière, inspirer tous les 3 temps | 6,1 s | Même chose sans appui devant : les mains se retrouvent aux cuisses, inspiration tous les 3 passages. |
| `step-16-opposition-arret.json` | ANC16 · Opposition, arrêt, inspiration | 2,8 s | Un bras pousse pendant que l’autre revient, arrêt net, inspiration côté hors poussée ; puis l’autre côté. |
| `step-17-crawl-3-temps.json` | ANC17 · Crawl en opposition, inspirer tous les 3 temps | 3,7 s | C’est le crawl : poussée et retour liés, roulis latéral, inspiration courte tous les 3 temps (alternée). |
| `step-18-cycles.json` | ANC18 · Même nage, plus d’amplitude, moins de cycles | 5,1 s | Même crawl, cadence plus lente et main qui glisse devant : on avance plus par cycle (repère livre : 9 cycles / 25 m). |

### Dos (DOS1–DOS12)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `dos-01-cote.json` | DOS1 · Dos sur le côté | 4,0 s | Sur le dos mais sur le côté : un bras devant dans l’axe, l’autre le long du corps, épaule haute hors de l’eau, tête fixe. Puis l’autre côté. |
| `dos-02-tete-immobile.json` | DOS2 · Tête immobile | 3,0 s | Nage complète : les épaules roulent d’un côté à l’autre, la tête et le regard ne bougent pas (regard au plafond). |
| `dos-03-gainage.json` | DOS3 · Gainage | 3,8 s | Coulée dos courte, bras le long du corps : torse et hanches d’un bloc, petits battements pour tenir la ligne. |
| `dos-04-battement.json` | DOS4 · Battement position idéale | 3,0 s | Bras tendus et serrés derrière la tête, tête posée sur les bras : battement depuis les hanches, genoux sous l’eau. |
| `dos-05-deux-bras.json` | DOS5 · Dos à deux bras | 3,7 s | Les deux bras entrent ensemble, arrêt ; traction jusqu’aux cuisses avec fouetté vers le bas, arrêt + inspiration ; retour bras tendus. |
| `dos-06-costal.json` | DOS6 · Battement costal | 3,0 s | Sur le côté, regard au plafond : bras devant tendu, l’autre le long de la cuisse, épaule haute sortie. On bat sans rouler. |
| `dos-07-echange.json` | DOS7 · L’échange | 3,4 s | Battement costal, puis échange des deux bras en même temps : le bras devant s’enfonce et tire, l’autre revient tendu en arc vertical. |
| `dos-08-vers-complete.json` | DOS8 · Vers la nage complète | 3,2 s | Échanges avec un arrêt de plus en plus court, puis nage complète : l’épaule continue de sortir à chaque fin de poussée. |
| `dos-09-prise-eau.json` | DOS9 · Prise d’eau et traction | 3,4 s | Un bras (l’autre devant) : la main entre sans ralentir, appuie d’abord vers le bas, puis vers l’extérieur, jusqu’à la cuisse. |
| `dos-10-sync.json` | DOS10 · Sync des bras | 3,8 s | Une main entre au moment où l’autre finit son fouetté vers le bas : ce fouetté fait sortir l’épaule. Retour bras tendu au-dessus de l’épaule. |
| `dos-11-respiration.json` | DOS11 · Respiration en dos | 3,2 s | Inspiration par la bouche quand une main sort de l’eau, tête immobile ; pas de respiration restreinte en dos. |
| `dos-12-qui-tient.json` | DOS12 · Dos qui tient | 3,2 s | Nage complète avec un reste d’arrêt à l’échange : position et tête d’abord, coulées et arrivées soignées. |

### Virage culbute (AVC1–AVC10)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `virage-01-deux-mains-dos.json` | AVC1 · 2 mains, bascule, coulée dos | 4,6 s | On touche des deux mains, les jambes passent sous soi, tête en arrière et bras lancés en arrière : on repart en glisse sur le dos. |
| `virage-02-une-main-ventre.json` | AVC2 · 1 main, demi-tour ventre | 4,6 s | Une main touche, on se met sur le côté, la tête bascule latéralement et les bras aident le tour : on repart sur le ventre. |
| `virage-03-un-bras-air.json` | AVC3 · Un bras en l’air | 4,6 s | Même demi-tour : le bras du côté du tour revient sous l’eau, l’autre revient par-dessus l’eau. |
| `virage-04-coulee-reprise.json` | AVC4 · Coulée + reprise | 4,4 s | Inspiration avant le mur, puis apnée : poussée sur le ventre, coulée, et premier bras tout de suite, sans trou. |
| `virage-05-roulade.json` | AVC5 · Roulade sans mur | 4,3 s | Coulée, les deux bras poussent, arrêt, puis roulade avant : c’est le menton qui lance la rotation, pas les bras. |
| `virage-06-crawl-roulade.json` | AVC6 · Crawl, arrêt, roulade | 4,0 s | On nage, un bras s’arrête derrière, l’autre le rejoint : stop net. Puis roulade, tête très fléchie, et on repart sur le ventre. |
| `virage-07-pieds-au-mur.json` | AVC7 · Battements, pieds au mur | 4,4 s | Battements vers le mur, bras derrière : on choisit quand tourner, demi-roulade, pieds au mur genoux pliés, sur le dos. |
| `virage-08-crawl-pieds.json` | AVC8 · Crawl + pieds au mur | 4,4 s | Arrivée en crawl, rattrapé arrière, demi-roulade : on finit sur le dos, pieds posés au mur, genoux pliés, prêt à pousser. |
| `virage-09-poussee-dos.json` | AVC9 · Poussée dos + jambes | 5,0 s | Même virage, puis poussée sur le dos, épaules à plat : longue coulée et battements de dos. |
| `virage-10-virage-complet.json` | AVC10 · Virage entier + nage | 5,0 s | Nage, rattrapé, rotation, pieds, poussée sur le côté puis encore un quart de vrille : reprise en crawl. |

### Départ (ADC1–ADC10)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `depart-01-chute.json` | ADC1 · Chute avant du bord | 4,2 s | Debout au bord, bras tendus, tête rentrée, corps dur : on se laisse tomber sans pousser, jusqu’à entrer dans l’eau. |
| `depart-02-desequilibre.json` | ADC2 · Déséquilibre puis poussée | 4,2 s | D’abord on bascule, ensuite seulement les jambes poussent : plus d’envol, tête toujours entre les bras. |
| `depart-03-bras.json` | ADC3 · Action des bras | 4,2 s | Les bras descendent quand les jambes plient, ils remontent quand les jambes poussent ; à l’entrée, tête entre les bras. |
| `depart-04-cerceau.json` | ADC4 · Cerceau + coulée | 4,2 s | Même départ en visant un cerceau : on perce le trou sans le toucher, nuque pliée, corps dur, et on glisse loin. |
| `depart-05-depart-reprise.json` | ADC5 · Départ entier + reprise | 5,2 s | Poussée, entrée, coulée, puis battements et un premier bras : les phases s’enchaînent mais restent séparées. |
| `depart-06-agrippe.json` | ADC6 · Agrippé : tirer pour basculer | 4,2 s | Mains au plot : on tire, le corps bascule, tête rentrée, corps dur ; on vise l’entrée par les mains, pas par le ventre. |
| `depart-07-tete-relevee.json` | ADC7 · Agrippé + tête qui se relève | 4,2 s | Agrippé : au début de la bascule les jambes plient et la tête se lève, puis on rentre par la tête. |
| `depart-08-pieds-decales.json` | ADC8 · Pieds décalés | 4,2 s | Pieds décalés, mains libres : la jambe arrière bascule, l’avant pousse, les bras aident, et on rentre dans l’axe. |
| `depart-09-cerceau-reprise.json` | ADC9 · Cerceau + reprise | 5,2 s | Départ plot, on passe dans le cerceau sans le toucher, on glisse, puis on reprend la nage sans tout perdre. |
| `depart-10-signal.json` | ADC10 · Au signal | 5,4 s | Prêt, puis au coup de sifflet on part tout de suite : envol dur, coulée, reprise. |

### Papillon (PAP1–PAP10)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `pap-01-deux-attitudes.json` | PAP1 · Deux attitudes | 4,4 s | Bascule : tête et épaules plongent, fesses à la surface. Redressement : la tête remonte pendant la poussée, inspiration quand les coudes sortent. |
| `pap-02-canard.json` | PAP2 · Plongeon en canard | 3,8 s | La tête bascule vers le fond, les hanches montent par réaction, genoux tendus ; on se redresse et on enchaîne les canards. |
| `pap-03-bras-planche.json` | PAP3 · Bras simultanés (planche) | 3,8 s | Visage dans l’eau, jambes serrées immobiles : les deux bras poussent jusqu’aux cuisses, arrêt, retour sous l’eau, arrêt à l’entrée. |
| `pap-04-un-bras.json` | PAP4 · Papillon un bras | 4,2 s | Un bras, l’autre devant : à l’entrée, bascule tenue jusqu’à voir les fesses, puis traction et fouetté profond (deuxième attitude). |
| `pap-05-apnee.json` | PAP5 · Complet en apnée | 5,4 s | Départ du mur, arrêt prolongé bras devant, puis 3 mouvements souples sans inspirer : les hanches restent hautes. |
| `pap-06-entree.json` | PAP6 · Entrée des bras | 4,0 s | Les mains entrent serrées, presque à se toucher : ça laisse le temps de basculer et de sortir les hanches. |
| `pap-07-retour.json` | PAP7 · Fin de poussée et retour | 4,0 s | Près de la surface les mains se relâchent, un court instant, puis les bras passent tendus, juste au-dessus de l’eau. |
| `pap-08-tete-bras.json` | PAP8 · Tête et bras ensemble | 3,6 s | La tête plonge fort et vite : à l’entrée des mains, le visage regarde déjà le fond. Le redressement est plus progressif. |
| `pap-09-inspirer.json` | PAP9 · Où inspirer | 3,8 s | Inspiration quand les coudes sortent et que les mains relâchent, jamais sur l’appui ; le menton avance plus qu’il ne monte. |
| `pap-10-qui-tient.json` | PAP10 · Papillon qui tient | 2,9 s | Cycles enchaînés, inspiration tous les 2 temps ; priorité à la bascule et aux fesses qui remontent. |

### Brasse (BRA1–BRA10)

| Fichier | Étape | Durée / boucle | Ce que la scène montre |
|---|---|---|---|
| `brasse-01-ciseau.json` | BRA1 · Le ciseau d’abord | 3,2 s | Jambes seules, bras devant : talons vers les fesses, genoux pas plus larges que les hanches, puis ciseau qui pousse et retour vif. |
| `brasse-02-fouette.json` | BRA2 · Seul le fouetté pousse | 4,0 s | Ralenti sur les pieds : en flexion, tournés dehors (ça place), puis fouetté vers l’intérieur et le fond, pieds « en prière », relâchés. |
| `brasse-03-prisonnier.json` | BRA3 · Nage du prisonnier | 3,2 s | Mains dans le dos : seul le ciseau fait monter la tête pour inspirer. S’il ne pousse pas, la tête coule. |
| `brasse-04-deux-attitudes.json` | BRA4 · Deux attitudes | 4,0 s | Bascule (bras tendus devant, hanches hautes), puis redressement (mains qui rentrent, inspiration, relance) qui ne dure pas. |
| `brasse-05-bonnet.json` | BRA5 · Pause bonnet hors de l’eau | 3,8 s | Pendant la relance et l’allonge, le haut du bonnet reste hors de l’eau : pause stable, corps gainé. |
| `brasse-06-relance.json` | BRA6 · Relance des bras vite | 3,8 s | Les bras repartent devant très vite, puis un petit temps de glisse bras serrés, haut de la tête à la surface. |
| `brasse-07-prise-eau.json` | BRA7 · Prise d’eau puis fouetté des mains | 4,0 s | Les mains s’écartent (et descendent un peu) sans pousser, puis rentrent vers l’axe de plus en plus vite, coudes écartés, et filent devant. |
| `brasse-08-corps-plat.json` | BRA8 · Corps assez plat | 3,4 s | Petit dauphin seulement : les hanches remontent à la bascule, la tête monte au redressement, sans « montagnes russes ». |
| `brasse-09-inspirer.json` | BRA9 · Inspirer hors appui | 3,8 s | Pas d’inspiration quand les mains s’écartent : on inspire avec la relance des bras et le regroupement des jambes. |
| `brasse-10-sans-trou.json` | BRA10 · Bras puis jambes, sans trou | 4,2 s | Les jambes se regroupent pendant la relance des bras ; juste après le fouetté, nouvelle prise d’eau sans temps mort. |

## Rejouer

- **Aperçu rapide** : glisser un `.json` sur <https://lottiefiles.com/preview>.
- **Review Arthur (motion + consignes + notes OK/Faux)** : avec `npm run dev`, ouvrir  
  [http://localhost:5173/school-motion/review.html](http://localhost:5173/school-motion/review.html)  
  Régénérer les consignes : `node scripts/build-school-motion-review.mjs`
- **Motions seules, par cours** : `preview.html` (lit `_index-all.json`). En HTTP :
  ```bash
  cd store/school-motion && python3 -m http.server 8787
  # http://localhost:8787/review.html  ou  preview.html#pap
  ```
- **Web / React** : `lottie-web` (`loadAnimation({ renderer: 'svg', loop: true, autoplay: true, path })`), comme `src/school/SchoolMotion.jsx`. Pour `prefers-reduced-motion`, afficher l'image 0 (`goToAndStop(0, true)`).

## Régénérer / retoucher

### Silhouettes design (actuel, app)

Moteur pédagogique Python `_source/` perdu (jamais commit). En attendant, les 70 JSON sont des silhouettes soft mist :

```bash
node scripts/generate-school-step-lotties.mjs
```

Écrit `public/school-motion/` et `store/school-motion/`. Suffisant pour l’écran exercice ; pas un calque 1:1 des fiches livre.

### Moteur pédagogique (historique)

Le script était sans dépendance (Pillow seulement pour les planches PNG). Il était découpé ainsi :

| Fichier | Rôle |
|---|---|
| `_source/motion_core.py` | moteur : nageur 3D projeté, trajectoires de bras (crawl aérien / sous l'eau, dos, papillon, brasse), jambes (battement, ciseau, dauphin), ancrages (pieds au mur / au plot, mains au mur), caméra, accessoires, export Lottie |
| `_source/strokes_common.py` | cycles réutilisables : brasse, papillon |
| `_source/scenes_crawl.py` | 18 scènes crawl (fichiers `step-NN-…`) |
| `_source/scenes_dos.py`, `scenes_virage.py`, `scenes_depart.py`, `scenes_pap.py`, `scenes_brasse.py` | une scène par étape |
| `_source/generate_motions.py` | CLI |

```bash
python3 store/school-motion/_source/generate_motions.py store/school-motion                    # tous les cours sauf crawl
python3 store/school-motion/_source/generate_motions.py store/school-motion --course pap --only 3,7
python3 store/school-motion/_source/generate_motions.py /tmp/x --png /tmp/planches              # + planches PNG
python3 store/school-motion/_source/generate_motions.py /tmp/x --course crawl                   # crawl : seulement si demandé
cp store/school-motion/{dos,virage,depart,pap,brasse}-*.json public/school-motion/
```

Le crawl n'est régénéré que si on le demande explicitement. Le moteur découpé le reproduit à l'octet près, ce qui a été vérifié sur les 18 fichiers.

Pour retoucher une étape, on change ses clés dans `scenes_<cours>.py`. Chaque piste se donne en `(temps_s, valeur)` :
- `roll`, `bpitch` (rotation dans le plan, 180 = demi-tour), `pitch` (tête), `twist` ;
- `breath`, `kick`, `fade` ;
- `A` / `B` (phase des bras) ou `armA` / `armB` (séquence de poses `ArmSeq`) ;
- `legs` (poses de jambes) ;
- `anchors` (point du corps posé sur un repère).
