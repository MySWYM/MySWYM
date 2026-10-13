# Bibliothèque éducatifs : motions par fiche

Un Lottie par éducatif de l'onglet Sheet « Éducatifs », qui montre le geste de **cette** fiche (champ « Comment on le fait »), pas une famille générique. Les fiches couvertes par une étape École au titre identique gardent la motion École (ex. « dos à deux bras » = `dos-05-deux-bras.json`). Les fiches livre ADC / AVC restent sur `public/school-motion/`.

- Moteur : `store/school-motion/_source/motion_core.py` (le même que les 70 motions École : nageur 3D projeté de profil, soft mist, 800 × 400, 30 fps, boucle, image 0 lisible).
- Scènes : `_source/scenes_library.py`, une par fiche. Le champ `todo` signale un point de consigne ambigu, à faire valider par Arthur.
- Fichiers : `sheet-<slug>.json` (slug stable depuis le nom de la fiche), copiés dans `public/library-motion/`.
- Branchement : `src/lib/library/library-motion-map.js` (généré) puis `resolveLibraryMotionUrl` dans `src/lib/library/motion.js`. Sans fichier, `motionUrl` reste `null` : pas de substitut.

Régénérer (Python 3, sans dépendance) :

```bash
node scripts/generate-library-motion-lotties.mjs
npm run test:library
```

Nouvelle fiche dans le Sheet : ajouter sa scène dans `scenes_library.py` (même `name` que la colonne Nom), puis relancer le script.
