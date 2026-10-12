"""Papillon (PAP1-PAP10) : 10 scènes. Fichiers pap-NN-slug.json.

Deux attitudes : 1. bascule (tête et épaules plongent, fesses à la surface) ;
2. redressement (la tête remonte pendant la poussée, inspiration à la sortie des coudes).
Deux battements de jambes : à l'entrée des mains, puis en fin de poussée.
"""
import math

from motion_core import C, F, K, Track
from strokes_common import cyc, fly_tracks

COURSE = 'pap'
PREFIX = 'pap'
STEP_PREFIX = 'PAP'

FRONT = ((50, -3, 2), (112, -6, 0))


def scenes():
    S = []

    # 1 · Deux attitudes (lent, chaque attitude marquée)
    sc = fly_tracks(2.2, hold=0.32, pull_end=0.7, breath_cycles=(0, 1), n_cycles=2, att1=-13, att2=12)
    sc.update(T=4.4, slug='deux-attitudes', title='Deux attitudes',
              show='Bascule : tête et épaules plongent, fesses à la surface. Redressement : la tête remonte pendant la poussée, inspiration quand les coudes sortent.')
    S.append(sc)

    # 2 · Plongeon en canard (enchaîné, genoux tendus)
    Tc = 1.9
    S.append(dict(slug='canard', title='Plongeon en canard', T=2 * Tc,
                  armA=lambda t: FRONT, armB=lambda t: FRONT, kick=C(0),
                  legs=F(lambda t: ((cyc([(0, 0), (0.25, -12), (0.55, 4), (1, 0)], Tc)(t), 0),) * 2),
                  bpitch=F(cyc([(0, 0), (0.22, -34), (0.45, -10), (0.7, 16), (0.9, 4), (1, 0)], Tc)),
                  dy=F(cyc([(0, 0), (0.2, -10), (0.5, -62), (0.75, -30), (1, 0)], Tc)),
                  pitch=F(cyc([(0, 0), (0.15, -26), (0.45, -10), (0.7, 10), (1, 0)], Tc)),
                  thrust=lambda t: 220,
                  show='La tête bascule vers le fond, les hanches montent par réaction, genoux tendus ; on se redresse et on enchaîne les canards.'))

    # 3 · Bras simultanés (planche) : poussée jusqu'aux cuisses, arrêt, retour sous l'eau, arrêt à l'entrée
    p = K((0, 0), (0.5, 0), (1.5, 0.5), (2.2, 0.5), (3.2, 1.0), (3.8, 1.0))
    S.append(dict(slug='bras-planche', title='Bras simultanés (planche)', T=3.8,
                  A=p, B=p, modeA=lambda t: 'water', modeB=lambda t: 'water', kick=C(0),
                  legs=F(lambda t: ((0, 0), (0, 0))),
                  show='Visage dans l’eau, jambes serrées immobiles : les deux bras poussent jusqu’aux cuisses, arrêt, retour sous l’eau, arrêt à l’entrée.'))

    # 4 · Papillon un bras : à chaque entrée, première attitude tenue, fesses visibles avant de tirer
    sc = fly_tracks(2.1, hold=0.38, pull_end=0.72, one_arm=True, breath_cycles=(0, 1), n_cycles=2, att1=-13)
    sc.update(T=4.2, slug='un-bras', title='Papillon un bras',
              show='Un bras, l’autre devant : à l’entrée, bascule tenue jusqu’à voir les fesses, puis traction et fouetté profond (deuxième attitude).')
    S.append(sc)

    # 5 · Complet en apnée : départ du mur, arrêt prolongé bras devant, 3 mouvements sans inspirer
    Tc = 1.3
    sc = fly_tracks(Tc, hold=0.3, pull_end=0.66, breath_cycles=None)
    t0 = 1.2                                   # début des mouvements après la coulée
    base = {k: sc[k] for k in ('A', 'B', 'legs', 'bpitch', 'dy', 'pitch')}

    def after(k, rest):
        f = base[k]
        return F(lambda t: f(t - t0) if t0 <= t < t0 + 3 * Tc else rest(t))
    S.append(dict(slug='apnee', title='Complet en apnée', T=5.4,
                  coulee=dict(push_t0=0.3, push_dur=0.4, drag=0.6, kick_thrust=150), base_pitch=0,
                  A=after('A', lambda t: 0.0), B=after('B', lambda t: 0.0),
                  modeA=lambda t: 'fly', modeB=lambda t: 'fly',
                  legs=F(lambda t: base['legs'](t - t0) if t >= t0 else ((0, 0), (0, 0))),
                  bpitch=after('bpitch', lambda t: 0.0),
                  dy=F(lambda t: base['dy'](t - t0) if t0 <= t < t0 + 3 * Tc else (-20 + 18 * min(1, t / t0) if t < t0 else -2)),
                  pitch=after('pitch', lambda t: 0.0),
                  kick=K((0, 0), (t0, 0), (t0 + 0.1, 1), (5.4, 1)),
                  fade=K((0, 0), (0.25, 1), (4.95, 1), (5.3, 0), (5.4, 0)), shift=0.28,
                  show='Départ du mur, arrêt prolongé bras devant, puis 3 mouvements souples sans inspirer : les hanches restent hautes.'))

    # 6 · Entrée des bras (mains serrées, presque qui se touchent)
    sc = fly_tracks(2.0, hold=0.36, pull_end=0.7, breath_cycles=(0,), n_cycles=2)
    sc.update(T=4.0, slug='entree', title='Entrée des bras',
              show='Les mains entrent serrées, presque à se toucher : ça laisse le temps de basculer et de sortir les hanches.')
    S.append(sc)

    # 7 · Fin de poussée et retour : mains relâchées, court instant, bras tendus juste au-dessus de l'eau
    sc = fly_tracks(2.0, hold=0.2, pull_end=0.58, release=0.1, breath_cycles=(0,), n_cycles=2)
    sc.update(T=4.0, slug='retour', title='Fin de poussée et retour',
              show='Près de la surface les mains se relâchent, un court instant, puis les bras passent tendus, juste au-dessus de l’eau.')
    S.append(sc)

    # 8 · Tête et bras ensemble : bascule de tête forte et rapide, visage au fond dès l'entrée
    sc = fly_tracks(1.8, hold=0.22, pull_end=0.62, head_down=-34, breath_cycles=(0,), n_cycles=2)
    sc['pitch'] = F(cyc([(0, -34), (0.04, -34), (0.2, -30), (0.5, 0), (0.6, 26), (0.78, 26), (0.86, -10, 'in'),
                         (0.94, -34), (1, -34)], 1.8))
    sc.update(T=3.6, slug='tete-bras', title='Tête et bras ensemble',
              show='La tête plonge fort et vite : à l’entrée des mains, le visage regarde déjà le fond. Le redressement est plus progressif.')
    S.append(sc)

    # 9 · Où inspirer : à la sortie des coudes, menton qui avance
    sc = fly_tracks(1.9, hold=0.22, pull_end=0.62, head_up=22, breath_cycles=(0, 1), n_cycles=2)
    sc.update(T=3.8, slug='inspirer', title='Où inspirer',
              show='Inspiration quand les coudes sortent et que les mains relâchent, jamais sur l’appui ; le menton avance plus qu’il ne monte.')
    S.append(sc)

    # 10 · Papillon qui tient : tous les 2 temps
    sc = fly_tracks(1.45, hold=0.2, pull_end=0.6, breath_cycles=(0,), n_cycles=2)
    sc.update(T=2.9, slug='qui-tient', title='Papillon qui tient',
              show='Cycles enchaînés, inspiration tous les 2 temps ; priorité à la bascule et aux fesses qui remontent.')
    S.append(sc)

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
