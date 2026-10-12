"""Virage culbute crawl (AVC1-AVC10) : 10 scènes. Fichiers virage-NN-slug.json.

Mur à droite. Le nageur arrive vers la droite ; après le tour il repart vers la gauche.
bpitch −180 = roulade avant (sur le dos, tête à gauche) ; roll 180 + bpitch 180 = ventre, tête à gauche.
Les pieds se posent au mur par ancrage (toeA → mur), puis la poussée part de là.
"""
import math

from motion_core import SURF, ArmSeq, C, F, K, Track, kick_angles

COURSE = 'virage'
PREFIX = 'virage'
STEP_PREFIX = 'AVC'

WALL = 820.0
CAM = dict(zoom=0.74, fx=400.0, fy=SURF, Fx=380.0, Fy=SURF + 20)
FEET = (WALL, SURF + 66)          # pieds au mur, sous l'eau
HANDS = (WALL, SURF + 14)         # mains au mur


def legs_mix(kick_amp, a_tr, k_tr, w_tr, hz=2.4):
    """Battements (kick_amp) fondus vers une pose de jambes (a, k) pilotée par w."""
    def f(t):
        th = 2 * math.pi * hz * t
        w = w_tr(t)
        out = []
        for ph in (0.0, math.pi):
            ka, kk = kick_angles(th + ph, kick_amp(t))
            out.append((ka * (1 - w) + a_tr(t) * w, kk * (1 - w) + k_tr(t) * w))
        return tuple(out)
    return F(f)


def base(T, **kw):
    sc = dict(T=T, cam=CAM, props=[dict(kind='wall_right', x=WALL, fade=False)], kick=C(0))
    sc.update(kw)
    return sc


def crawl_arms(t0, strokes, dur, end='thigh'):
    """Approche en crawl : `strokes` mouvements alternés A/B, chacun de durée dur, à partir de t0.
    Fin : rattrapé arrière (les deux mains aux cuisses) si end == 'thigh'."""
    a = [(0, ('p', 0.0, 'air'))]
    b = [(0, ('p', 0.5, 'air'))]
    pa, pb = 0.0, 0.5
    t = t0
    for i in range(strokes):
        a.append((t, ('p', pa, 'air'))); b.append((t, ('p', pb, 'air')))
        t += dur
        pa += 0.5; pb += 0.5
        a.append((t, ('p', pa, 'air'))); b.append((t, ('p', pb, 'air')))
    return a, b, t


def side_turn(slug, title, b_mode, show):
    """Demi-tour sur le côté (AVC2-3) : une main au mur, sur le côté, rotation dans le plan, poussée."""
    T = 4.6
    rec = [(0, 'thigh'), (1.5, ('p', 0.5, b_mode)), (2.3, ('p', 1.0, b_mode))]
    return base(T, slug=slug, title=title,
                xw=K((0, 470), (1.0, WALL - 175), (2.85, WALL - 175), (4.6, WALL - 600, 'out')),
                armA=ArmSeq([(0, 'front'), (1.0, 'wall'), (1.5, 'wall'), (2.1, 'front')]),
                armB=ArmSeq(rec),
                roll=K((0, 0), (1.05, 0), (1.45, 90), (2.85, 90), (3.4, 180), (T, 180)),
                bpitch=K((0, 0), (1.5, 0), (2.3, 180), (T, 180)),
                legs=legs_mix(K((0, 1), (1.0, 0.6), (1.2, 0)),
                              K((0, 0), (1.1, 0), (1.6, 100), (2.45, 90), (2.85, 0)),
                              K((0, 0), (1.1, 0), (1.6, 125), (2.45, 115), (2.85, 0)),
                              K((0, 0), (1.0, 0), (1.2, 1))),
                twist=K((0, 0), (1.05, 0), (1.45, 20), (2.0, 20), (2.4, 0)),
                breath=K((0, 0), (1.45, 0), (1.5, 1), (1.85, 1), (1.9, 0)),
                dy=K((0, 0), (1.2, 0), (1.6, 4), (2.3, -36), (2.85, -36), (4.6, -16)),
                anchors=[dict(part='handA', target=HANDS, t0=0.85, t1=1.5, ramp=0.15),
                         dict(part='toeA', target=FEET, t0=2.1, t1=2.85, ramp=0.3)],
                fade=K((0, 0), (0.25, 1), (4.15, 1), (4.5, 0), (T, 0)), shift=0.3, show=show)


def flip_turn(slug, title, approach, push, show):
    """Culbute (AVC7-10) : approche (battements bras derrière, ou crawl + rattrapé arrière),
    demi-roulade avant, pieds au mur sur le dos ; option poussée dos ou poussée + vrille + crawl."""
    T = 4.4 if push is None else 5.0
    tf = 1.75                                   # début de la roulade
    k = dict(T=T, slug=slug, title=title, show=show)
    if approach == 'kick':
        k['armA'] = ArmSeq([(0, 'thigh'), (tf + 0.55, ('p', 0.5, 'water')), (tf + 1.1, ('p', 1.0, 'water'))])
        k['armB'] = ArmSeq([(0, 'thigh'), (tf + 0.55, ('p', 0.5, 'water')), (tf + 1.1, ('p', 1.0, 'water'))])
        roll = [(0, 0)]
    else:
        k['armA'] = ArmSeq([(0, ('p', 0.0, 'air')), (0.15, ('p', 0.0, 'air')), (0.95, ('p', 1.0, 'air')),
                            (1.0, ('p', 0.0, 'air')), (1.55, ('p', 0.5, 'air')), (tf + 0.55, ('p', 0.5, 'water')),
                            (tf + 1.1, ('p', 1.0, 'water'))])
        k['armB'] = ArmSeq([(0, ('p', 0.0, 'air')), (0.95, ('p', 0.0, 'air')), (1.5, ('p', 0.5, 'air')),
                            (tf + 0.55, ('p', 0.5, 'water')), (tf + 1.1, ('p', 1.0, 'water'))])
        roll = [(0, 0), (0.15, 0), (0.55, 40), (0.95, 0), (1.25, -30), (1.55, 20), (tf, 0)]
    t_feet = tf + 0.85
    xw = [(0, 420), (tf, WALL - 230), (tf + 0.8, WALL - 210)]
    legs_a = [(0, 0), (tf - 0.05, 0), (tf + 0.35, 105), (tf + 0.8, 100), (t_feet + 0.2, 80)]
    legs_k = [(0, 0), (tf - 0.05, 0), (tf + 0.35, 125), (tf + 0.8, 120), (t_feet + 0.2, 100)]
    roll_end = 0
    if push is None:
        anchors = [dict(part='toeA', target=FEET, t0=t_feet - 0.25, t1=T, ramp=0.3)]
        fade = K((0, 0), (0.25, 1), (T - 0.45, 1), (T - 0.1, 0), (T, 0))
        dy = [(0, 0), (tf, 0), (tf + 0.5, -34), (T, -34)]
    else:
        tp = t_feet + 0.5                        # poussée
        anchors = [dict(part='toeA', target=FEET, t0=t_feet - 0.25, t1=tp + 0.35, ramp=0.3)]
        legs_a += [(tp, 80), (tp + 0.35, 0)]
        legs_k += [(tp, 100), (tp + 0.35, 0)]
        xw += [(tp + 0.35, WALL - 210), (T, WALL - 700, 'out')]
        dy = [(0, 0), (tf, 0), (tf + 0.5, -34), (tp + 0.35, -34), (T, -10)]
        fade = K((0, 0), (0.25, 1), (T - 0.45, 1), (T - 0.1, 0), (T, 0))
        if push == 'twist':
            roll += [(tp, 0), (tp + 0.35, 90), (tp + 0.8, 180), (T, 180)]
            k['armA'].k.append((tp + 1.0, ('p', 0.0, 'air'), 'cos'))
            k['armA'].k.append((tp + 1.55, ('p', 0.5, 'air'), 'cos'))
            k['armA'].k.append((tp + 2.0, ('p', 1.0, 'air'), 'cos'))
            k['armA'].k.sort(key=lambda x: x[0])
            dy = [(0, 0), (tf, 0), (tf + 0.5, -34), (tp + 0.35, -34), (tp + 1.1, -6), (T, -4)]
    k.update(xw=Track(xw), roll=Track(roll), bpitch=K((0, 0), (tf, 0), (tf + 0.8, -180), (T, -180)),
             legs=legs_mix(K((0, 1), (tf - 0.2, 1), (tf, 0), *([(T - 1.2, 0), (T - 0.9, 1)] if push else [])),
                           Track(legs_a), Track(legs_k),
                           K((0, 0), (tf - 0.15, 0), (tf, 1), *([(T - 1.3, 1), (T - 1.0, 0)] if push else []))),
             pitch=K((0, 0), (tf - 0.1, 0), (tf + 0.1, -50), (tf + 0.6, -50), (tf + 0.9, 0)),
             dy=Track(dy), anchors=anchors, fade=fade, shift=0.3)
    return base(**k)


def scenes():
    S = []

    # 1 · 2 mains, bascule, coulée dos
    T = 4.6
    S.append(base(T, slug='deux-mains-dos', title='2 mains, bascule, coulée dos',
                  xw=K((0, 470), (1.0, WALL - 175), (3.3, WALL - 175), (4.6, WALL - 560, 'out')),
                  armA=ArmSeq([(0, 'front'), (1.0, 'wall'), (1.9, 'wall'), (2.4, 'front')]),
                  armB=ArmSeq([(0, 'front'), (1.0, 'wall'), (1.9, 'wall'), (2.4, 'front')]),
                  legs=legs_mix(K((0, 1), (1.0, 0.6), (1.2, 0)), K((0, 0), (1.1, 0), (1.7, 105), (2.5, 80), (2.95, 70), (3.3, 0)),
                                K((0, 0), (1.1, 0), (1.7, 125), (2.5, 100), (2.95, 95), (3.3, 0)),
                                K((0, 0), (1.0, 0), (1.2, 1))),
                  bpitch=K((0, 0), (1.15, 0), (1.9, 70), (2.5, 180), (4.6, 180)),
                  dy=K((0, 0), (1.2, 0), (1.9, 6), (2.6, -40), (3.3, -40), (4.6, -18)),
                  pitch=K((0, 0), (1.9, 0), (2.2, 30), (2.6, 0)),
                  anchors=[dict(part='handA', target=HANDS, t0=0.85, t1=1.9, ramp=0.15),
                           dict(part='toeA', target=FEET, t0=2.35, t1=3.3, ramp=0.3)],
                  fade=K((0, 0), (0.25, 1), (4.15, 1), (4.5, 0), (4.6, 0)), shift=0.3,
                  show='On touche des deux mains, les jambes passent sous soi, tête en arrière et bras lancés en arrière : on repart en glisse sur le dos.'))

    # 2 · 1 main, demi-tour sur le côté, coulée ventre (bras sous l'eau)
    S.append(side_turn(slug='une-main-ventre', title='1 main, demi-tour ventre', b_mode='water',
                       show='Une main touche, on se met sur le côté, la tête bascule latéralement et les bras aident le tour : on repart sur le ventre.'))

    # 3 · Un bras en l'air
    S.append(side_turn(slug='un-bras-air', title='Un bras en l’air', b_mode='air',
                       show='Même demi-tour : le bras du côté du tour revient sous l’eau, l’autre revient par-dessus l’eau.'))

    # 4 · Coulée + reprise : pieds au mur, poussée ventre, glisse, puis 1er bras sans trou
    T = 4.4
    S.append(base(T, slug='coulee-reprise', title='Coulée + reprise',
                  xw=K((0, WALL - 150), (0.8, WALL - 150), (2.4, WALL - 520, 'out'), (4.4, WALL - 740)),
                  roll=C(180), bpitch=C(180),
                  armA=ArmSeq([(0, 'front'), (2.2, ('p', 0.0, 'air')), (2.65, ('p', 0.5, 'air')), (3.15, ('p', 1.0, 'air'))]),
                  armB=ArmSeq([(0, 'front'), (2.65, ('p', 0.0, 'air')), (3.1, ('p', 0.5, 'air')), (3.6, ('p', 1.0, 'air'))]),
                  legs=legs_mix(K((0, 0), (1.5, 0), (1.8, 1)), K((0, 95), (0.45, 95), (0.8, 0)),
                                K((0, 115), (0.45, 115), (0.8, 0)), K((0, 1), (1.4, 1), (1.7, 0))),
                  dy=K((0, -44), (0.8, -44), (2.2, -6), (4.4, -4)),
                  anchors=[dict(part='toeA', target=FEET, t0=0.0, t1=0.8, ramp=0.0)],
                  fade=K((0, 0), (0.25, 1), (3.95, 1), (4.3, 0), (4.4, 0)), shift=0.26,
                  show='Inspiration avant le mur, puis apnée : poussée sur le ventre, coulée, et premier bras tout de suite, sans trou.'))

    # 5 · Roulade sans mur
    T = 4.3
    S.append(dict(slug='roulade', title='Roulade sans mur', T=T,
                  A=K((0, 0), (0.45, 0), (1.15, 0.5), (2.85, 0.5), (3.6, 1.0), (T, 1.0)),
                  B=K((0, 0), (0.45, 0), (1.15, 0.5), (2.85, 0.5), (3.6, 1.0), (T, 1.0)),
                  modeA=lambda t: 'water', modeB=lambda t: 'water',
                  bpitch=K((0, 0), (1.6, 0), (2.7, -360), (T, -360)),
                  legs=legs_mix(K((0, 1), (1.4, 1), (1.6, 0), (3.0, 0), (3.4, 1)),
                                K((0, 0), (1.55, 0), (1.9, 105), (2.45, 105), (2.85, 0)),
                                K((0, 0), (1.55, 0), (1.9, 125), (2.45, 125), (2.85, 0)),
                                K((0, 0), (1.45, 0), (1.6, 1), (2.85, 1), (3.0, 0))),
                  pitch=K((0, 0), (1.5, 0), (1.7, -45), (2.5, -45), (2.8, 0)),
                  dy=K((0, 0), (1.6, 0), (2.15, -30), (2.8, 0)),
                  thrust=F(lambda t: (420 if 0.5 <= t <= 1.15 else 0) + (60 if t < 1.5 or t > 3.2 else 0)),
                  show='Coulée, les deux bras poussent, arrêt, puis roulade avant : c’est le menton qui lance la rotation, pas les bras.'))

    # 6 · Crawl, arrêt, roulade
    T = 4.0
    S.append(dict(slug='crawl-roulade', title='Crawl, arrêt, roulade', T=T,
                  A=K((0, 0), (0.1, 0), (0.95, 1.0), (1.35, 1.0), (1.75, 1.5), (3.15, 1.5), (3.75, 2.0), (T, 2.0)),
                  B=K((0, 0), (0.95, 0), (1.35, 0.5), (3.15, 0.5), (3.75, 1.0), (T, 1.0)),
                  modeA=F(lambda t: 'water' if t > 3.0 else 'air'), modeB=F(lambda t: 'water' if t > 3.0 else 'air'),
                  roll=K((0, 0), (0.1, 0), (0.5, 40), (0.95, 0), (1.35, -30), (1.75, 30), (2.0, 0)),
                  bpitch=K((0, 0), (2.0, 0), (3.0, -360), (T, -360)),
                  legs=legs_mix(K((0, 1), (1.8, 1), (2.0, 0), (3.3, 0), (3.6, 1)),
                                K((0, 0), (1.95, 0), (2.3, 105), (2.8, 105), (3.15, 0)),
                                K((0, 0), (1.95, 0), (2.3, 125), (2.8, 125), (3.15, 0)),
                                K((0, 0), (1.85, 0), (2.0, 1), (3.15, 1), (3.3, 0))),
                  pitch=K((0, 0), (1.9, 0), (2.1, -50), (2.8, -50), (3.1, 0)),
                  dy=K((0, 0), (2.0, 0), (2.5, -30), (3.1, 0)),
                  breath=K((0, 0), (0.5, 0), (0.55, 1), (0.75, 1), (0.8, 0)),
                  twist=K((0, 0), (0.42, 0), (0.55, 26), (0.75, 26), (0.9, 0)),
                  thrust=F(lambda t: (300 if t < 1.75 else 0) + (60 if t < 1.9 or t > 3.4 else 0)),
                  show='On nage, un bras s’arrête derrière, l’autre le rejoint : stop net. Puis roulade, tête très fléchie, et on repart sur le ventre.'))

    # 7 · Battements vers le mur, pieds au mur
    S.append(flip_turn(slug='pieds-au-mur', title='Battements, pieds au mur', approach='kick', push=None,
                       show='Battements vers le mur, bras derrière : on choisit quand tourner, demi-roulade, pieds au mur genoux pliés, sur le dos.'))

    # 8 · Crawl + pieds au mur
    S.append(flip_turn(slug='crawl-pieds', title='Crawl + pieds au mur', approach='crawl', push=None,
                       show='Arrivée en crawl, rattrapé arrière, demi-roulade : on finit sur le dos, pieds posés au mur, genoux pliés, prêt à pousser.'))

    # 9 · Poussée dos + jambes
    S.append(flip_turn(slug='poussee-dos', title='Poussée dos + jambes', approach='crawl', push='back',
                       show='Même virage, puis poussée sur le dos, épaules à plat : longue coulée et battements de dos.'))

    # 10 · Virage entier + nage
    S.append(flip_turn(slug='virage-complet', title='Virage entier + nage', approach='crawl', push='twist',
                       show='Nage, rattrapé, rotation, pieds, poussée sur le côté puis encore un quart de vrille : reprise en crawl.'))

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
