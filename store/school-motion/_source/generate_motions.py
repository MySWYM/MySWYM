#!/usr/bin/env python3
"""
MySWYM · motions pédagogiques de l'école de nage (Lottie JSON, boucle).

Moteur : motion_core.py. Scènes : un module par cours (scenes_<cours>.py).

Usage :
    python3 generate_motions.py OUT_DIR                       # tous les cours SAUF crawl
    python3 generate_motions.py OUT_DIR --course dos,pap      # certains cours
    python3 generate_motions.py OUT_DIR --course pap --only 3,7
    python3 generate_motions.py OUT_DIR --png /tmp/planches   # + planches PNG (Pillow)
    python3 generate_motions.py OUT_DIR --course crawl        # crawl : explicite seulement
                                                              # (les 18 step-NN existent déjà)

Écrit aussi OUT_DIR/_index-all.json (tous les cours, crawl compris) :
    [{course, n, stepId, file, title, frames, seconds, show}, …]
Le crawl garde en plus son _index.json historique (réécrit seulement avec --course crawl).
"""
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import motion_core as core  # noqa: E402

COURSES = ['crawl', 'dos', 'virage', 'depart', 'pap', 'brasse']


def load(course):
    return importlib.import_module('scenes_%s' % course)


def file_name(mod, sc):
    return '%s-%02d-%s.json' % (mod.PREFIX, sc['n'], sc['slug'])


def index_entry(mod, sc):
    frames = int(round(round(sc['T'] * core.FPS)))
    return {'course': mod.COURSE, 'n': sc['n'], 'stepId': '%s%d' % (mod.STEP_PREFIX, sc['n']),
            'file': file_name(mod, sc), 'title': sc['title'], 'frames': frames,
            'seconds': round(frames / core.FPS, 3), 'show': sc['show']}


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        print(__doc__)
        sys.exit(1)
    out = args[0]

    def opt(name):
        return args[args.index(name) + 1] if name in args else None

    courses = opt('--course')
    courses = [c for c in COURSES if c != 'crawl'] if not courses or courses == 'all' else courses.split(',')
    only = [int(x) for x in opt('--only').split(',')] if opt('--only') else None
    png_dir = opt('--png')
    if png_dir:
        os.makedirs(png_dir, exist_ok=True)
    os.makedirs(out, exist_ok=True)

    for course in courses:
        mod = load(course)
        legacy = []
        for sc in mod.scenes():
            if only and sc['n'] not in only:
                continue
            fn = file_name(mod, sc)
            N, _ = core.write_scene(sc, out, fn, png_dir)
            legacy.append(dict(n=sc['n'], file=fn, title=sc['title'], frames=N, seconds=sc['T'], show=sc['show']))
        if course == 'crawl' and not only:
            with open(os.path.join(out, '_index.json'), 'w') as f:
                json.dump(legacy, f, ensure_ascii=False, indent=1)

    entries = []
    for course in COURSES:
        mod = load(course)
        entries += [index_entry(mod, sc) for sc in mod.scenes()]
    with open(os.path.join(out, '_index-all.json'), 'w') as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
