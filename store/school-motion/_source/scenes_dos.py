"""Dos (DOS1-DOS12) : 12 scènes. Fichiers dos-NN-slug.json.

Le nageur est sur le dos (roll ≈ 180), tête vers la droite. La tête reste fixe,
regard au plafond (head_roll = 180) pendant que les épaules roulent.
roll 180 − R : épaule A sortie (côté éloigné) ; roll 180 + R : épaule B sortie (côté caméra).
"""
import math

from motion_core import ArmSeq, C, F, K, Track

COURSE = 'dos'
PREFIX = 'dos'
STEP_PREFIX = 'DOS'

BACK = 180.0
FRONT = ((50, -3, 2), (112, 2, 0))       # bras devant dans l'axe de l'épaule
SIDE = ((-46, -6, 14), (-104, -8, 12))   # bras le long du corps


def phi1(p):
    p %= 1.0
    if 0.1 <= p <= 0.95:
        return math.sin(math.pi * (p - 0.1) / 0.85)
    return 0.0


def back_swim(Tc, n_cycles=2, R=45, dwell=0.0, breath_every=0):
    """Dos complet en opposition. dwell = fraction de cycle où les bras marquent l'arrêt
    (main entrée / main à la cuisse). breath_every : inspiration à la sortie de main A tous les n cycles."""
    T = Tc * n_cycles

    def warp(u):
        u %= 1.0
        d = dwell
        if d <= 0: return u
        if u < d: return 0.0
        if u < 0.5: return 0.5 * (u - d) / (0.5 - d)
        if u < 0.5 + d: return 0.5
        return 0.5 + 0.5 * (u - 0.5 - d) / (0.5 - d)

    def pa(t):
        u = t / Tc
        return math.floor(u) + warp(u)

    def pb(t):
        u = t / Tc + 0.5
        return math.floor(u) + warp(u)

    sc = dict(T=round(T, 3), A=F(pa), B=F(pb), modeA=lambda t: 'back', modeB=lambda t: 'back',
              roll=F(lambda t: BACK - R * (phi1(pa(t)) - phi1(pb(t)))), head_roll=C(BACK))
    if breath_every:
        keys = [(0, 0)]
        c = 0
        while c < n_cycles:
            t0 = Tc * (c + 0.5 + dwell)          # main A qui sort de l'eau
            keys += [(t0, 0), (t0 + 0.06 * Tc, 1), (t0 + 0.2 * Tc, 1), (t0 + 0.27 * Tc, 0)]
            c += breath_every
        keys.append((T, 0))
        sc['breath'] = Track(keys)
    return sc


def scenes():
    S = []

    # 1 · Dos sur le côté : un côté, puis l'autre (changement en fondu, pas d'échange enseigné)
    T = 4.0
    side_b = lambda t: (t % T) < T / 2          # 1re moitié : épaule B (côté caméra) sortie
    S.append(dict(slug='cote', title='Dos sur le côté', T=T,
                  roll=F(lambda t: BACK + 48 if side_b(t) else BACK - 48), head_roll=C(BACK),
                  armA=F(lambda t: FRONT if side_b(t) else SIDE),
                  armB=F(lambda t: SIDE if side_b(t) else FRONT),
                  dy=C(4), kick=C(0.8),
                  fade=K((0, 1), (1.78, 1), (1.95, 0), (2.05, 0), (2.22, 1), (3.78, 1), (3.95, 0), (4.0, 0)),
                  shift=0.25,
                  show='Sur le dos mais sur le côté : un bras devant dans l’axe, l’autre le long du corps, épaule haute hors de l’eau, tête fixe. Puis l’autre côté.'))

    # 2 · Tête immobile
    sc = back_swim(1.5, n_cycles=2, R=50)
    sc.update(slug='tete-immobile', title='Tête immobile',
              show='Nage complète : les épaules roulent d’un côté à l’autre, la tête et le regard ne bougent pas (regard au plafond).')
    S.append(sc)

    # 3 · Gainage : coulée dos courte, bras le long du corps
    S.append(dict(slug='gainage', title='Gainage', T=3.8,
                  coulee=dict(push_t0=0.35, push_dur=0.4, drag=1.2, kick_thrust=120), base_pitch=0,
                  roll=C(BACK), head_roll=C(BACK),
                  armA=ArmSeq([(0, 'side')]), armB=ArmSeq([(0, 'side')]),
                  kick=K((0, 0), (1.3, 0), (1.8, 0.6), (3.8, 0.6)),
                  dy=K((0, -22), (0.75, -22), (2.2, -2), (3.8, -2)),
                  fade=K((0, 0), (0.3, 1), (3.35, 1), (3.7, 0), (3.8, 0)), shift=0.32,
                  show='Coulée dos courte, bras le long du corps : torse et hanches d’un bloc, petits battements pour tenir la ligne.'))

    # 4 · Battement position idéale
    S.append(dict(slug='battement', title='Battement position idéale', T=3.0,
                  roll=C(BACK), head_roll=C(BACK), base_pitch=1.0,
                  armA=ArmSeq([(0, ((50, -2, -4), (112, -2, -14)))]),
                  armB=ArmSeq([(0, ((50, -2, -4), (112, -2, -14)))]),
                  kick=C(1.25), dy=C(2),
                  show='Bras tendus et serrés derrière la tête, tête posée sur les bras : battement depuis les hanches, genoux sous l’eau.'))

    # 5 · Dos à deux bras : deux arrêts (après l'entrée, aux cuisses + inspire)
    S.append(dict(slug='deux-bras', title='Dos à deux bras', T=3.7,
                  A=K((0, 0), (0.7, 0), (1.45, 0.5), (2.35, 0.5), (3.2, 1.0), (3.7, 1.0)),
                  B=K((0, 0), (0.7, 0), (1.45, 0.5), (2.35, 0.5), (3.2, 1.0), (3.7, 1.0)),
                  modeA=lambda t: 'back', modeB=lambda t: 'back',
                  roll=C(BACK), head_roll=C(BACK), kick=C(0.7),
                  breath=K((0, 0), (1.6, 0), (1.72, 1), (2.15, 1), (2.27, 0), (3.7, 0)),
                  show='Les deux bras entrent ensemble, arrêt ; traction jusqu’aux cuisses avec fouetté vers le bas, arrêt + inspiration ; retour bras tendus.'))

    # 6 · Battement costal
    S.append(dict(slug='costal', title='Battement costal', T=3.0,
                  roll=C(BACK + 50), head_roll=C(BACK),
                  armA=ArmSeq([(0, ((50, -3, 2), (112, 2, 0)))]),
                  armB=ArmSeq([(0, 'side')]),
                  kick=C(1.0), dy=C(4),
                  show='Sur le côté, regard au plafond : bras devant tendu, l’autre le long de la cuisse, épaule haute sortie. On bat sans rouler.'))

    # 7 · L'échange
    S.append(dict(slug='echange', title='L’échange', T=3.4,
                  A=K((0, 0), (1.0, 0), (1.65, 0.5), (2.75, 0.5), (3.4, 1.0)),
                  B=K((0, 0.5), (1.0, 0.5), (1.65, 1.0), (2.75, 1.0), (3.4, 1.5)),
                  modeA=lambda t: 'back', modeB=lambda t: 'back',
                  roll=K((0, BACK + 50), (1.0, BACK + 50), (1.65, BACK - 50), (2.75, BACK - 50), (3.4, BACK + 50)),
                  head_roll=C(BACK), kick=C(1.0), dy=C(3),
                  show='Battement costal, puis échange des deux bras en même temps : le bras devant s’enfonce et tire, l’autre revient tendu en arc vertical.'))

    # 8 · Vers la nage complète : arrêts qui raccourcissent
    st = 0.6
    stops = [0.45, 0.25, 0.1, 0.0]
    t = 0.0
    a_keys, b_keys, r_keys = [(0, 0)], [(0, 0.5)], [(0, BACK + 48)]
    pa, pb = 0.0, 0.5
    side = 1
    for s in stops:
        t += s
        a_keys.append((t, pa)); b_keys.append((t, pb)); r_keys.append((t, BACK + side * 48))
        t += st
        pa += 0.5; pb += 0.5; side = -side
        a_keys.append((t, pa)); b_keys.append((t, pb)); r_keys.append((t, BACK + side * 48))
    T8 = round(t, 2)
    S.append(dict(slug='vers-complete', title='Vers la nage complète', T=T8,
                  A=Track(a_keys), B=Track(b_keys), modeA=lambda t: 'back', modeB=lambda t: 'back',
                  roll=Track(r_keys), head_roll=C(BACK), kick=C(1.0),
                  show='Échanges avec un arrêt de plus en plus court, puis nage complète : l’épaule continue de sortir à chaque fin de poussée.'))

    # 9 · Prise d'eau et traction (un bras, l'autre devant ; bras tendu en éducatif)
    S.append(dict(slug='prise-eau', title='Prise d’eau et traction', T=3.4,
                  A=K((0, 0), (0.15, 0), (0.95, 0.5), (1.55, 1.0), (1.85, 1.0), (2.65, 1.5), (3.25, 2.0), (3.4, 2.0)),
                  modeA=lambda t: 'back_straight',
                  armB=ArmSeq([(0, ((50, -3, 2), (112, 4, 0)))]),
                  roll=K((0, BACK), (0.15, BACK), (0.95, BACK - 40), (1.55, BACK), (1.85, BACK), (2.65, BACK - 40),
                         (3.25, BACK), (3.4, BACK)),
                  head_roll=C(BACK), kick=C(0.9),
                  show='Un bras (l’autre devant) : la main entre sans ralentir, appuie d’abord vers le bas, puis vers l’extérieur, jusqu’à la cuisse.'))

    # 10 · Sync des bras : « entre / fouette », ralenti avec un léger temps marqué
    sc = back_swim(1.9, n_cycles=2, R=50, dwell=0.06)
    sc.update(slug='sync', title='Sync des bras',
              show='Une main entre au moment où l’autre finit son fouetté vers le bas : ce fouetté fait sortir l’épaule. Retour bras tendu au-dessus de l’épaule.')
    S.append(sc)

    # 11 · Respiration en dos
    sc = back_swim(1.6, n_cycles=2, R=45, breath_every=1)
    sc.update(slug='respiration', title='Respiration en dos',
              show='Inspiration par la bouche quand une main sort de l’eau, tête immobile ; pas de respiration restreinte en dos.')
    S.append(sc)

    # 12 · Dos qui tient : nage complète, petit arrêt d'échange encore présent
    sc = back_swim(1.6, n_cycles=2, R=48, dwell=0.04, breath_every=2)
    sc.update(slug='qui-tient', title='Dos qui tient',
              show='Nage complète avec un reste d’arrêt à l’échange : position et tête d’abord, coulées et arrivées soignées.')
    S.append(sc)

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
