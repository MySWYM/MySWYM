#!/usr/bin/env python3
"""
Bibliothèque éducatifs : génère un Lottie par fiche Sheet (public/library-motion/sheet-<slug>.json).

Moteur partagé avec l'École : store/school-motion/_source/motion_core.py (même nageur, même DA).
Scènes : scenes_library.py (une par éducatif, consigne de la fiche).

Usage :
    python3 store/library-motion/_source/generate_library.py OUT_DIR [--only flèche,godille] [--png DIR]
Écrit aussi OUT_DIR/_index.json : [{id, name, nage, file, frames, seconds, show, todo}]
"""
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'school-motion', '_source'))

import motion_core as core  # noqa: E402
import scenes_library  # noqa: E402


def slug(text):
    s = unicodedata.normalize('NFD', str(text).lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def file_for(sc):
    return 'sheet-%s.json' % slug(sc['name'])


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        print(__doc__)
        sys.exit(1)
    out = args[0]
    only = None
    if '--only' in args:
        only = [x.strip() for x in args[args.index('--only') + 1].split(',')]
    png = args[args.index('--png') + 1] if '--png' in args else None
    os.makedirs(out, exist_ok=True)
    if png:
        os.makedirs(png, exist_ok=True)
    index = []
    for sc in scenes_library.scenes():
        fn = file_for(sc)
        if only and sc['name'] not in only and slug(sc['name']) not in only:
            continue
        N, _ = core.write_scene(sc, out, fn, png)
        index.append(dict(id=sc['id'], name=sc['name'], nage=sc['nage'], file=fn, frames=N,
                          seconds=round(N / core.FPS, 3), show=sc['show'], todo=sc.get('todo')))
    if not only:
        with open(os.path.join(out, '_index.json'), 'w') as f:
            json.dump(index, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
