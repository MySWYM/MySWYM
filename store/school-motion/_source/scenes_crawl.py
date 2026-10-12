"""Crawl (ANC1-ANC18) : 18 scènes. Fichiers step-NN-slug.json (ne pas renommer)."""
import math

from motion_core import C, F, K, Track

COURSE = 'crawl'
PREFIX = 'step'
STEP_PREFIX = 'ANC'


def strokes_rattrape(order, avant=True, pull=0.32, rec=0.34, gap=0.08, stop=0.5,
                     roll_pull=48, roll_breath=64, lead=0.1):
    """Construit une séquence de rattrapé (avant ou arrière).
    order : liste de (bras 'A'/'B', inspire 0/1)."""
    t = lead
    p = {'A': 0.0 if avant else 0.5, 'B': 0.0 if avant else 0.5}
    keys = {'A': [(0, p['A'])], 'B': [(0, p['B'])]}
    roll, tw, br, tr = [(0, 0)], [(0, 0)], [(0, 0)], [(0, 0)]

    def breath(t, sgn):
        tw.extend([(t, 0), (t + 0.12, sgn * 28), (t + stop - 0.1, sgn * 28), (t + stop + 0.04, 0)])
        br.extend([(t + 0.08, 0), (t + 0.16, 1), (t + stop - 0.12, 1), (t + stop - 0.04, 0)])
        tr.extend([(t, 0), (t + 0.12, 1), (t + stop - 0.08, 1), (t + stop + 0.04, 0)])

    for arm, inspire in order:
        sgn = 1 if arm == 'A' else -1
        k = keys[arm]
        p0 = p[arm]
        rp = roll_breath if inspire else roll_pull
        if avant:
            k.extend([(t, p0), (t + pull, p0 + 0.5)])
            roll.extend([(t, 0), (t + pull, sgn * rp)])
            t += pull
            if inspire:
                breath(t, sgn)
                t += stop
            k.extend([(t, p0 + 0.5), (t + rec, p0 + 1.0)])
            roll.extend([(t, sgn * rp), (t + rec, 0)])
            t += rec + gap
        else:
            k.extend([(t, p0), (t + rec, p0 + 0.5)])
            roll.extend([(t, 0), (t + rec * 0.5, sgn * 30), (t + rec, 0)])
            t += rec
            k.extend([(t, p0 + 0.5), (t + pull, p0 + 1.0)])
            roll.extend([(t, 0), (t + pull, sgn * rp)])
            t += pull
            if inspire:
                breath(t, sgn)
                t += stop
            roll.extend([(t, sgn * rp), (t + 0.18, 0)])
            t += 0.18 + gap
        p[arm] = p0 + 1.0
    T = round(t + 0.06, 2)
    return dict(T=T, A=Track(keys['A']), B=Track(keys['B']), roll=Track(roll),
                twist=Track(tw), breath=Track(br), trough=Track(tr))


def crawl(Tc, R=50, glide=0.0, n_cycles=3):
    """Crawl en opposition, inspiration tous les 3 temps."""
    T = Tc * n_cycles

    def warp(u):
        u %= 1.0
        if glide <= 0: return u
        if u < glide: return 0.04 * u / glide
        return 0.04 + 0.96 * (u - glide) / (1 - glide)

    def pa(t):
        u = t / Tc
        return math.floor(u) + warp(u)

    def pb(t):
        u = t / Tc + 0.5
        return math.floor(u) + warp(u)

    def phi1(p):
        p %= 1.0
        if 0.1 <= p <= 0.95:
            return math.sin(math.pi * (p - 0.1) / 0.85)
        return 0.0

    roll = F(lambda t: R * (phi1(pa(t)) - phi1(pb(t))))
    # inspiration côté A (≈ fin de poussée A, cycle 1) puis côté B 1,5 cycle plus tard
    def win(t0):
        return [(t0 - 0.12 * Tc, 0), (t0, 1), (t0 + 0.10 * Tc, 1), (t0 + 0.20 * Tc, 0)]
    tA = Tc * (0.47 + 0.6 * glide)
    tB = tA + 1.5 * Tc
    tw = [(0, 0)] + [(t, v * 30) for t, v in win(tA)] + [(t, -v * 30) for t, v in win(tB)] + [(T, 0)]
    def bwin(t0):
        return [(t0 - 0.02 * Tc, 0), (t0 + 0.03 * Tc, 1), (t0 + 0.09 * Tc, 1), (t0 + 0.13 * Tc, 0)]
    br = [(0, 0)] + bwin(tA) + bwin(tB) + [(T, 0)]
    tr = [(0, 0)] + win(tA) + win(tB) + [(T, 0)]
    return dict(T=round(T, 3), A=F(pa), B=F(pb), roll=roll, twist=Track(tw), breath=Track(br),
                trough=Track(tr))


def scenes():
    S = []

    # 1 · Coulée ventrale
    S.append(dict(slug='coulee', title='Coulée ventrale', T=3.6,
                  coulee=dict(push_t0=0.35, push_dur=0.4, drag=0.85, kick_thrust=0), base_pitch=0,
                  kick=C(0), dy=K((0, -26), (0.75, -26), (3.0, -20), (3.6, -20)),
                  fade=K((0, 0), (0.3, 1), (3.15, 1), (3.5, 0), (3.6, 0)), shift=0.32,
                  show='Poussée au mur, corps à plat et gainé, bras tendus devant : longue glisse sans battements.'))

    # 2 · Coulée + petits battements
    S.append(dict(slug='kick', title='Coulée + petits battements', T=3.8,
                  coulee=dict(push_t0=0.35, push_dur=0.4, drag=1.1, kick_thrust=150), base_pitch=0,
                  kick=K((0, 0), (1.25, 0), (1.7, 0.8), (3.8, 0.8)),
                  dy=K((0, -26), (0.75, -26), (1.6, -16), (2.6, -6), (3.8, -6)),
                  fade=K((0, 0), (0.3, 1), (3.35, 1), (3.7, 0), (3.8, 0)), shift=0.32,
                  show='Même coulée, puis petits battements serrés qui prolongent la glisse sans cabrer le corps.'))

    # 3 · Inspire tête devant, bras immobiles
    S.append(dict(slug='inspire-devant', title='Inspirer tête devant, bras immobiles', T=3.6,
                  pitch=K((0, 0), (1.1, 0), (1.6, 40), (2.25, 40), (2.75, 0), (3.6, 0)),
                  bpitch=K((0, 0), (1.1, 0), (1.6, 4), (2.25, 4), (2.75, 0), (3.6, 0)),
                  dy=K((0, 0), (1.1, 0), (1.6, 3), (2.25, 3), (2.75, 0), (3.6, 0)),
                  breath=K((0, 0), (1.55, 0), (1.72, 1), (2.15, 1), (2.3, 0), (3.6, 0)),
                  show='Battements, bras tendus immobiles ; la tête sort juste assez pour inspirer devant puis replonge.'))

    # 4 · Demi-vrille, inspire à plat dos
    S.append(dict(slug='vrille-dos', title='Demi-vrille, inspirer à plat dos', T=4.0,
                  roll=K((0, 0), (0.7, 0), (1.6, 180), (2.75, 180), (3.6, 0), (4.0, 0)),
                  breath=K((0, 0), (1.85, 0), (1.98, 1), (2.45, 1), (2.58, 0), (4.0, 0)),
                  show='Bras tendus devant, demi-vrille ventre → dos ; on attend d’être à plat dos pour inspirer, puis retour ventre.'))

    # 5 · Deux bras ensemble
    S.append(dict(slug='deux-bras', title='Deux bras en même temps', T=3.9,
                  A=K((0, 0), (0.55, 0), (1.3, 0.5), (3.72, 0.5), (3.9, 1.0)),
                  B=K((0, 0), (0.55, 0), (1.3, 0.5), (3.72, 0.5), (3.9, 1.0)),
                  modeA=lambda t: 'water', modeB=lambda t: 'water',
                  pitch=K((0, 0), (1.75, 0), (2.15, 40), (2.65, 40), (3.0, 0), (3.9, 0)),
                  bpitch=K((0, 0), (1.75, 0), (2.15, 4), (2.65, 4), (3.0, 0), (3.9, 0)),
                  dy=K((0, 0), (1.75, 0), (2.15, 3), (2.65, 3), (3.0, 0), (3.9, 0)),
                  breath=K((0, 0), (2.1, 0), (2.25, 1), (2.55, 1), (2.68, 0), (3.9, 0)),
                  fade=K((0, 0), (0.3, 1), (3.35, 1), (3.68, 0), (3.9, 0)), shift=0.3,
                  show='Traction + poussée des deux bras ensemble jusqu’aux cuisses, glisse, puis inspiration tête devant.'))

    # 6 · Un bras puis l'autre
    S.append(dict(slug='un-bras-puis-autre', title='Un bras, puis l’autre', T=4.2,
                  A=K((0, 0), (0.45, 0), (1.1, 0.5), (4.0, 0.5), (4.2, 1.0)),
                  B=K((0, 0), (1.45, 0), (2.1, 0.5), (4.0, 0.5), (4.2, 1.0)),
                  modeA=lambda t: 'water', modeB=lambda t: 'water',
                  roll=K((0, 0), (0.45, 0), (1.0, 14), (1.35, 0), (1.45, 0), (2.0, -14), (2.35, 0), (4.2, 0)),
                  pitch=K((0, 0), (2.3, 0), (2.7, 40), (3.15, 40), (3.45, 0), (4.2, 0)),
                  bpitch=K((0, 0), (2.3, 0), (2.7, 4), (3.15, 4), (3.45, 0), (4.2, 0)),
                  dy=K((0, 0), (2.3, 0), (2.7, 3), (3.15, 3), (3.45, 0), (4.2, 0)),
                  breath=K((0, 0), (2.65, 0), (2.78, 1), (3.05, 1), (3.18, 0), (4.2, 0)),
                  fade=K((0, 0), (0.3, 1), (3.62, 1), (3.95, 0), (4.2, 0)), shift=0.3,
                  show='Un bras puis l’autre, avec un temps stable entre les deux ; inspiration tête devant après le 2e bras.'))

    # 7 · Retour sous l'eau
    S.append(dict(slug='retour-sous-eau', title='Retour des bras sous l’eau', T=4.0,
                  A=K((0, 0), (0.25, 0), (0.85, 0.5), (2.5, 0.5), (3.3, 1.0), (4.0, 1.0)),
                  B=K((0, 0), (0.95, 0), (1.55, 0.5), (2.5, 0.5), (3.3, 1.0), (4.0, 1.0)),
                  modeA=lambda t: 'water', modeB=lambda t: 'water',
                  roll=K((0, 0), (0.25, 0), (0.75, 12), (0.95, 0), (1.45, -12), (1.65, 0), (4.0, 0)),
                  pitch=K((0, 0), (1.6, 0), (1.95, 40), (2.25, 40), (2.5, 0), (4.0, 0)),
                  bpitch=K((0, 0), (1.6, 0), (1.95, 4), (2.25, 4), (2.5, 0), (4.0, 0)),
                  dy=K((0, 0), (1.6, 0), (1.95, 3), (2.25, 3), (2.5, 0), (4.0, 0)),
                  breath=K((0, 0), (1.9, 0), (2.0, 1), (2.18, 1), (2.28, 0), (4.0, 0)),
                  show='Un bras puis l’autre, arrêt + inspiration devant, puis les deux bras reviennent ensemble sous l’eau.'))

    # 8 · Retour aérien
    S.append(dict(slug='retour-aerien', title='Retour aérien, un bras puis l’autre', T=4.4,
                  A=K((0, 0), (0.2, 0), (0.75, 0.5), (2.45, 0.5), (3.1, 1.0), (4.4, 1.0)),
                  B=K((0, 0), (0.9, 0), (1.45, 0.5), (3.25, 0.5), (3.9, 1.0), (4.4, 1.0)),
                  roll=K((0, 0), (2.45, 0), (2.75, 34), (3.15, 0), (3.25, 0), (3.55, -34), (3.95, 0), (4.4, 0)),
                  pitch=K((0, 0), (1.55, 0), (1.88, 40), (2.12, 40), (2.38, 0), (4.4, 0)),
                  bpitch=K((0, 0), (1.55, 0), (1.88, 4), (2.12, 4), (2.38, 0), (4.4, 0)),
                  dy=K((0, 0), (1.55, 0), (1.88, 3), (2.12, 3), (2.38, 0), (4.4, 0)),
                  breath=K((0, 0), (1.82, 0), (1.92, 1), (2.08, 1), (2.18, 0), (4.4, 0)),
                  show='Deux tractions alternées, arrêt + inspiration, puis chaque bras revient par-dessus l’eau, coude haut.'))

    # 9 · Cycle + demi-vrille + inspire dos
    S.append(dict(slug='cycle-vrille-dos', title='Cycle, puis inspirer sur le dos', T=4.7,
                  A=K((0, 0), (0.15, 0), (0.65, 0.5), (1.25, 0.5), (1.8, 1.0), (4.7, 1.0)),
                  B=K((0, 0), (0.7, 0), (1.2, 0.5), (1.85, 0.5), (2.4, 1.0), (4.7, 1.0)),
                  roll=K((0, 0), (1.25, 0), (1.5, 32), (1.82, 0), (1.85, 0), (2.1, -32), (2.42, 0), (2.5, 0),
                         (3.15, 180), (3.85, 180), (4.55, 0), (4.7, 0)),
                  breath=K((0, 0), (3.25, 0), (3.36, 1), (3.7, 1), (3.8, 0), (4.7, 0)),
                  show='Un cycle complet avec retours aériens, puis demi-vrille : inspiration seulement à plat dos, bras devant.'))

    # 10 · Inspire dos, un bras devant / un derrière
    S.append(dict(slug='dos-bras-opposes', title='Inspirer sur le dos, un bras devant / un derrière', T=6.0,
                  A=K((0, 0), (0.15, 0), (0.75, 0.5), (2.35, 0.5), (2.85, 1.0), (6.0, 1.0)),
                  B=K((0, 0), (3.15, 0), (3.75, 0.5), (5.35, 0.5), (5.85, 1.0), (6.0, 1.0)),
                  roll=K((0, 0), (0.15, 0), (0.75, 45), (1.3, 180), (1.95, 180), (2.35, 50), (2.85, 0),
                         (3.15, 0), (3.75, -45), (4.3, -180), (4.95, -180), (5.35, -50), (5.85, 0), (6.0, 0)),
                  breath=K((0, 0), (1.4, 0), (1.5, 1), (1.82, 1), (1.92, 0),
                           (4.4, 0), (4.5, 1), (4.82, 1), (4.92, 0), (6.0, 0)),
                  show='Un bras a fini sa poussée, l’autre reste devant : demi-vrille, inspiration dos dans cette opposition, puis fin du retour. Puis l’autre côté.'))

    # 11 · Rattrapé avant + vrille + inspire dos
    S.append(dict(slug='rattrape-vrille-dos', title='Rattrapé avant + vrille, inspirer sur le dos', T=6.0,
                  A=K((0, 0), (0.1, 0), (0.62, 0.5), (1.2, 1.0), (6.0, 1.0)),
                  B=K((0, 0), (3.1, 0), (3.62, 0.5), (4.2, 1.0), (6.0, 1.0)),
                  roll=K((0, 0), (0.1, 0), (0.62, 42), (1.2, 0), (1.3, 0), (1.9, 180), (2.35, 180), (2.95, 0),
                         (3.1, 0), (3.62, -42), (4.2, 0), (4.3, 0), (4.9, -180), (5.35, -180), (5.95, 0), (6.0, 0)),
                  breath=K((0, 0), (1.95, 0), (2.05, 1), (2.28, 1), (2.36, 0),
                           (4.95, 0), (5.05, 1), (5.28, 1), (5.36, 0), (6.0, 0)),
                  show='Un bras complet jusqu’à retrouver l’autre devant, vrille et inspiration à plat dos, retour ventre ; puis l’autre bras, l’autre côté.'))

    # 12 · Rattrapé avant + inspire côté
    sc = strokes_rattrape([('A', 1), ('B', 1)], avant=True, pull=0.5, rec=0.55, gap=0.15, stop=0.42,
                          roll_breath=62, lead=0.12)
    sc.update(slug='rattrape-avant-cote', title='Rattrapé avant, inspirer sur le côté',
              show='Rattrapé avant : après la poussée, quart de vrille et tête sur le côté pour une inspiration courte, puis retour devant. Un côté puis l’autre.')
    S.append(sc)

    # 13 · Rattrapé arrière + inspire côté (1 fois sur 2)
    sc = strokes_rattrape([('A', 1), ('B', 0)], avant=False, pull=0.5, rec=0.55, gap=0.2, stop=0.45,
                          roll_breath=62, roll_pull=42, lead=0.12)
    sc.update(slug='rattrape-arriere-cote', title='Rattrapé arrière, inspirer sur le côté',
              show='Les mains se retrouvent derrière, aux cuisses : un bras fait retour + traction, inspiration côté 1 fois sur 2.')
    S.append(sc)

    # 14 · Rattrapé avant, 3 temps
    sc = strokes_rattrape([('A', 0), ('B', 0), ('A', 1), ('B', 0), ('A', 0), ('B', 1)], avant=True,
                          pull=0.32, rec=0.34, gap=0.08, stop=0.42, lead=0.08)
    sc.update(slug='rattrape-avant-3-temps', title='Rattrapé avant, inspirer tous les 3 temps',
              show='Rattrapé avant enchaîné, bras dissociés ; inspiration tous les 3 passages, une fois de chaque côté, hors poussée.')
    S.append(sc)

    # 15 · Rattrapé arrière, 3 temps
    sc = strokes_rattrape([('A', 0), ('B', 0), ('A', 1), ('B', 0), ('A', 0), ('B', 1)], avant=False,
                          pull=0.3, rec=0.34, gap=0.04, stop=0.42, lead=0.06)
    sc.update(slug='rattrape-arriere-3-temps', title='Rattrapé arrière, inspirer tous les 3 temps',
              show='Même chose sans appui devant : les mains se retrouvent aux cuisses, inspiration tous les 3 passages.')
    S.append(sc)

    # 16 · Opposition + arrêt + inspire
    st, sp = 0.72, 0.62
    t1 = 0.12
    t2 = t1 + st
    t3 = t2 + sp
    t4 = t3 + st
    T16 = round(t4 + sp, 2)
    S.append(dict(slug='opposition-arret', title='Opposition, arrêt, inspiration', T=T16,
                  A=K((0, 0), (t1, 0), (t2, 0.5), (t3, 0.5), (t4, 1.0), (T16, 1.0)),
                  B=K((0, 0.5), (t1, 0.5), (t2, 1.0), (t3, 1.0), (t4, 1.5), (T16, 1.5)),
                  roll=K((0, -55), (t1, -55), (t2, 55), (t3, 55), (t4, -55), (T16, -55)),
                  twist=K((0, 0), (t2, 0), (t2 + 0.12, 28), (t3 - 0.12, 28), (t3, 0),
                          (t4, 0), (t4 + 0.12, -28), (T16 - 0.12, -28), (T16, 0)),
                  breath=K((0, 0), (t2 + 0.1, 0), (t2 + 0.18, 1), (t3 - 0.16, 1), (t3 - 0.08, 0),
                           (t4 + 0.1, 0), (t4 + 0.18, 1), (T16 - 0.16, 1), (T16 - 0.08, 0), (T16, 0)),
                  trough=K((0, 0), (t2, 0), (t2 + 0.12, 1), (t3 - 0.1, 1), (t3, 0),
                           (t4, 0), (t4 + 0.12, 1), (T16 - 0.1, 1), (T16, 0)),
                  show='Un bras pousse pendant que l’autre revient, arrêt net, inspiration côté hors poussée ; puis l’autre côté.'))

    # 17 · Crawl en opposition, inspire 3 temps
    sc = crawl(1.25, R=50)
    sc.update(slug='crawl-3-temps', title='Crawl en opposition, inspirer tous les 3 temps',
              floor_speed=100 / 1.25,
              show='C’est le crawl : poussée et retour liés, roulis latéral, inspiration courte tous les 3 temps (alternée).')
    S.append(sc)

    # 18 · Amplitude / moins de cycles
    sc = crawl(1.7, R=55, glide=0.2)
    sc.update(slug='cycles', title='Même nage, plus d’amplitude, moins de cycles',
              floor_speed=150 / 1.7,
              show='Même crawl, cadence plus lente et main qui glisse devant : on avance plus par cycle (repère livre : 9 cycles / 25 m).')
    S.append(sc)

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
