"""Brasse (BRA1-BRA10) : 10 scènes. Fichiers brasse-NN-slug.json.

Cycle (q de 0 à 1) : écart des mains → rentrée sous la poitrine (coudes écartés) → relance vite devant ;
jambes : regroupement calé sur la relance, placement des pieds (flexion, dehors), fouetté, glisse.
Inspiration avec la relance des bras et le regroupement des jambes (jamais sur l'appui).
"""
from motion_core import ArmSeq, C, F, K
from strokes_common import BREAST_LEGS, breast_tracks, cyc

COURSE = 'brasse'
PREFIX = 'brasse'
STEP_PREFIX = 'BRA'

FRONT = ((50, -3, 2), (112, -6, 0))

# ciseau seul : regroupement → placement → fouetté → glisse (q réparti sur tout le cycle)
KICK_ONLY = [
    (0.00, (0, 0, 0, 8)),
    (0.10, (0, 0, 0, 8)),
    (0.40, (45, 115, 10, 78)),
    (0.50, (42, 110, 30, 88)),
    (0.66, (2, 6, 0, 30)),
    (0.74, (0, 0, 0, 8)),
    (1.00, (0, 0, 0, 8)),
]
KICK_SLOW = [
    (0.00, (0, 0, 0, 8)),
    (0.08, (0, 0, 0, 8)),
    (0.36, (45, 115, 10, 78)),
    (0.44, (42, 110, 30, 88)),
    (0.56, (42, 110, 30, 88)),       # temps marqué : pieds placés, rien ne pousse encore
    (0.72, (2, 6, 0, 34)),          # fouetté → pieds « en prière »
    (0.78, (2, 4, 0, 34)),
    (0.86, (0, 0, 0, 8)),           # relâchés
    (1.00, (0, 0, 0, 8)),
]


def kick_scene(Tc, legs_keys, whip=(0.50, 0.66), **kw):
    comps = [cyc([(q, v[i]) for q, v in legs_keys], Tc) for i in range(4)]

    def legs_f(t):
        v = tuple(c(t) for c in comps)
        return v, v
    q_whip0, q_whip1 = whip

    def thrust(t):
        q = (t / Tc) % 1.0
        return 560 if q_whip0 <= q <= q_whip1 else 0
    sc = dict(legs=F(legs_f), thrust=thrust, kick=C(0),
              armA=lambda t: FRONT, armB=lambda t: FRONT)
    sc.update(kw)
    return sc


def scenes():
    S = []

    # 1 · Le ciseau d'abord
    sc = kick_scene(1.6, KICK_ONLY, T=3.2)
    sc.update(slug='ciseau', title='Le ciseau d’abord',
              show='Jambes seules, bras devant : talons vers les fesses, genoux pas plus larges que les hanches, puis ciseau qui pousse et retour vif.')
    S.append(sc)

    # 2 · Seul le fouetté pousse
    sc = kick_scene(2.0, KICK_SLOW, whip=(0.56, 0.72), T=4.0)
    sc.update(slug='fouette', title='Seul le fouetté pousse',
              show='Ralenti sur les pieds : en flexion, tournés dehors (ça place), puis fouetté vers l’intérieur et le fond, pieds « en prière », relâchés.')
    S.append(sc)

    # 3 · Nage du prisonnier : mains dans le dos, la tête monte grâce au ciseau
    Tc = 1.6
    sc = kick_scene(Tc, KICK_ONLY, T=3.2,
                    armA=lambda t: ((-34, 18, 26), (-86, 24, -12)), armB=lambda t: ((-34, 18, 26), (-86, 24, -12)),
                    base_pitch=8.0,
                    pitch=F(cyc([(0, 30), (0.5, 22), (0.72, 34), (0.9, 34), (1, 30)], Tc)),
                    dy=F(cyc([(0, 2), (0.5, -3), (0.72, 6), (0.9, 6), (1, 2)], Tc)),
                    breath=F(cyc([(0, 0), (0.7, 0), (0.75, 1), (0.9, 1), (0.95, 0), (1, 0)], Tc)))
    sc.update(slug='prisonnier', title='Nage du prisonnier',
              show='Mains dans le dos : seul le ciseau fait monter la tête pour inspirer. S’il ne pousse pas, la tête coule.')
    S.append(sc)

    # 4 · Deux attitudes
    sc = breast_tracks(2.0, flat=1.4)
    sc.update(T=4.0, slug='deux-attitudes', title='Deux attitudes',
              show='Bascule (bras tendus devant, hanches hautes), puis redressement (mains qui rentrent, inspiration, relance) qui ne dure pas.')
    S.append(sc)

    # 5 · Pause bonnet hors de l'eau
    sc = breast_tracks(1.9, head_up=24, flat=0.6)
    sc.update(T=3.8, slug='bonnet', title='Pause bonnet hors de l’eau',
              dy=F(cyc([(0, 5), (0.36, 5), (0.42, 8), (0.55, 8), (0.7, 5), (1, 5)], 1.9)),
              pitch=F(cyc([(0, 12), (0.36, 12), (0.42, 26), (0.55, 26), (0.66, 12), (1, 12)], 1.9)),
              show='Pendant la relance et l’allonge, le haut du bonnet reste hors de l’eau : pause stable, corps gainé.')
    S.append(sc)

    # 6 · Relance des bras vite
    sc = breast_tracks(1.9, timing=dict(out=(0.0, 0.30), ins=(0.30, 0.44), shoot=(0.44, 0.50)))
    sc.update(T=3.8, slug='relance', title='Relance des bras vite',
              show='Les bras repartent devant très vite, puis un petit temps de glisse bras serrés, haut de la tête à la surface.')
    S.append(sc)

    # 7 · Prise d'eau puis fouetté des mains
    sc = breast_tracks(2.0, timing=dict(out=(0.0, 0.38), ins=(0.38, 0.48), shoot=(0.48, 0.57)))
    sc.update(T=4.0, slug='prise-eau', title='Prise d’eau puis fouetté des mains',
              show='Les mains s’écartent (et descendent un peu) sans pousser, puis rentrent vers l’axe de plus en plus vite, coudes écartés, et filent devant.')
    S.append(sc)

    # 8 · Corps assez plat
    sc = breast_tracks(1.7, flat=0.5, head_up=24)
    sc.update(T=3.4, slug='corps-plat', title='Corps assez plat',
              show='Petit dauphin seulement : les hanches remontent à la bascule, la tête monte au redressement, sans « montagnes russes ».')
    S.append(sc)

    # 9 · Inspirer hors appui
    sc = breast_tracks(1.9)
    sc.update(T=3.8, slug='inspirer', title='Inspirer hors appui',
              show='Pas d’inspiration quand les mains s’écartent : on inspire avec la relance des bras et le regroupement des jambes.')
    S.append(sc)

    # 10 · Bras puis jambes, sans trou
    sc = breast_tracks(1.4, timing=dict(out=(0.0, 0.28), ins=(0.28, 0.42), shoot=(0.42, 0.55)))
    sc.update(T=4.2, slug='sans-trou', title='Bras puis jambes, sans trou',
              show='Les jambes se regroupent pendant la relance des bras ; juste après le fouetté, nouvelle prise d’eau sans temps mort.')
    S.append(sc)

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
