"""Bibliothèque éducatifs (onglet Sheet « Éducatifs ») : un Lottie par fiche.

Chaque scène illustre la consigne de SA fiche (« Comment on le fait ») avec le moteur des motions École
(store/school-motion/_source/motion_core.py) : même nageur 3D projeté, même DA soft mist.
Les fiches déjà couvertes par une étape École au titre identique (ex. « dos à deux bras » = DOS5) n'ont pas
de doublon ici. `todo` = point de consigne ambigu à faire valider par Arthur (motion minimale et claire).
"""
import math

from motion_core import ArmSeq, C, F, K, Track, kick_angles
from scenes_crawl import crawl, strokes_rattrape
from scenes_dos import BACK, phi1
from strokes_common import BREAST_LEGS, breast_tracks, cyc, fly_tracks

FRONT = ((50, -3, 2), (112, -6, 0))
SIDE = ((-46, -6, 14), (-104, -8, 12))          # bras le long du corps, mains vers les cuisses
OVERHEAD_A = ((50, -2, -4), (112, -2, -14))     # bras serrés derrière la tête (dos), main sur main
FLECHE_A = ((50, -2, -6), (112, -2, -16))       # flèche : une main sur l'autre
FLECHE_B = ((50, -6, -6), (112, -9, -16))


def fs(v, T):
    """Vitesse du fond arrondie pour que la boucle retombe sur un multiple de pointillé (50 px)."""
    n = max(1, round(v * T / 50.0))
    return n * 50.0 / T


def swim(Tc, n, R=45, mode='air', breath=None, hip_k=None):
    """Crawl en opposition continu. breath : None | 'A' (côté A à chaque cycle)."""
    T = Tc * n
    pa = F(lambda t: t / Tc)
    pb = F(lambda t: t / Tc + 0.5)
    roll = F(lambda t: R * (phi1(t / Tc) - phi1(t / Tc + 0.5)))
    sc = dict(T=round(T, 3), A=pa, B=pb, modeA=lambda t: mode, modeB=lambda t: mode, roll=roll,
              floor_speed=fs(85 / Tc * 1.25, T))
    if hip_k is not None:
        sc['hip_roll'] = F(lambda t: roll(t) * hip_k)
    if breath == 'A':
        win = [(0, 0), (0.37, 0), (0.47, 1), (0.57, 1), (0.67, 0), (1, 0)]
        tw = [(0, 0), (0.35, 0), (0.47, 28), (0.6, 28), (0.72, 0), (1, 0)]
        sc['breath'] = F(cyc(win, Tc))
        sc['twist'] = F(cyc(tw, Tc))
        sc['trough'] = F(cyc(win, Tc))
    return sc


def scenes():
    S = []

    def add(fid, name, nage, show, sc, todo=None):
        sc.update(id=fid, title=name, name=name, nage=nage, show=show)
        if todo:
            sc['todo'] = todo
        S.append(sc)

    # ───────── crawl ─────────
    Tc1 = 1.6
    sc = dict(T=2 * Tc1, A=F(lambda t: t / Tc1), B=F(lambda t: t / Tc1 + 0.5),
              modeA=lambda t: 'short', modeB=lambda t: 'short',
              roll=F(lambda t: 12 * math.sin(2 * math.pi * t / Tc1)), kick=C(0.8), floor_speed=fs(55, 2 * Tc1))
    add('sheet:petit chien', 'petit chien', 'crawl',
        'Bras alternés sous l’eau, traction courte qui s’arrête sous l’épaule, la main revient devant sans sortir ; rythme lent.', sc)

    Tc2 = 2.0
    sc = dict(T=2 * Tc2, A=F(lambda t: t / Tc2), B=F(lambda t: t / Tc2 + 0.5),
              modeA=lambda t: 'water', modeB=lambda t: 'water',
              roll=F(lambda t: 18 * math.sin(2 * math.pi * (t / Tc2 - 0.3))), kick=C(0.8), floor_speed=fs(60, 2 * Tc2))
    add('sheet:grand chien', 'grand chien', 'crawl',
        'Bras alternés sous l’eau, grande traction jusqu’à la cuisse puis retour sous l’eau, les mains ne sortent jamais ; rythme lent.', sc)

    add('sheet:flèche', 'flèche', 'crawl',
        'Poussée forte au mur, corps tendu et aligné, bras serrés une main sur l’autre, tête rentrée ; quand la glisse ralentit, petits battements sans casser la flèche.',
        dict(T=3.8, coulee=dict(push_t0=0.35, push_dur=0.4, drag=1.1, kick_thrust=140), base_pitch=0,
             armA=lambda t: FLECHE_A, armB=lambda t: FLECHE_B, pitch=C(-8),
             kick=K((0, 0), (1.7, 0), (2.1, 0.7), (3.8, 0.7)),
             dy=K((0, -24), (0.75, -24), (1.8, -14), (2.8, -6), (3.8, -6)),
             fade=K((0, 0), (0.3, 1), (3.35, 1), (3.7, 0), (3.8, 0)), shift=0.32))

    sc = strokes_rattrape([('A', 1), ('B', 0), ('A', 0), ('B', 1)], avant=True, pull=0.4, rec=0.42, gap=0.14,
                          stop=0.36, roll_breath=60, roll_pull=46)
    sc['floor_speed'] = fs(80, sc['T'])
    add('sheet:crawl rattrapé', 'crawl rattrapé', 'crawl',
        'Une main attend devant dans l’axe de l’épaule pendant que l’autre fait tout son trajet ; elles se retrouvent devant avant le mouvement suivant, sans couper la glisse.',
        sc)

    # toucher cuisse : un bras devant, l'autre à la cuisse, sur le côté ; respiration sur le côté ; on inverse
    sw = 0.6
    hold = 1.2
    T = 2 * (hold + sw)
    add('sheet:toucher cuisse', 'toucher cuisse', 'crawl',
        'Sur le côté : un bras tendu devant, l’autre le long de la cuisse, inspiration sur le côté sans lever la tête ; puis un mouvement pour inverser.',
        dict(T=T,
             A=K((0, 0.5), (hold, 0.5), (hold + sw, 1.0), (2 * hold + sw, 1.0), (T, 1.5)),
             B=K((0, 0.0), (hold, 0.0), (hold + sw, 0.5), (2 * hold + sw, 0.5), (T, 1.0)),
             roll=K((0, 60), (hold, 60), (hold + sw, -60), (2 * hold + sw, -60), (T, 60)),
             twist=K((0, 0), (0.25, 0), (0.4, 26), (0.85, 26), (1.0, 0),
                     (hold + sw + 0.25, 0), (hold + sw + 0.4, -26), (hold + sw + 0.85, -26), (hold + sw + 1.0, 0)),
             breath=K((0, 0), (0.38, 0), (0.46, 1), (0.8, 1), (0.88, 0)),
             trough=K((0, 0), (0.3, 0), (0.42, 1), (0.85, 1), (0.98, 0),
                      (hold + sw + 0.3, 0), (hold + sw + 0.42, 1), (hold + sw + 0.85, 1), (hold + sw + 0.98, 0)),
             kick=C(1.0), floor_speed=fs(70, T)))

    # six battements par roulis : 6 battements (3 cycles de jambes) sur un côté, un mouvement, 6 de l'autre
    hold, sw = 1.25, 0.625
    T = 2 * (hold + sw)
    roll6 = K((0, 50), (hold, 50), (hold + sw, -50), (2 * hold + sw, -50), (T, 50))
    add('sheet:six battements par roulis', 'six battements par roulis', 'crawl',
        'Six battements sur un côté, un mouvement de bras, six battements de l’autre : hanches et épaules tournent ensemble, regard vers le fond.',
        dict(T=T,
             A=K((0, 0.5), (hold, 0.5), (hold + sw, 1.0), (2 * hold + sw, 1.0), (T, 1.5)),
             B=K((0, 0.0), (hold, 0.0), (hold + sw, 0.5), (2 * hold + sw, 0.5), (T, 1.0)),
             roll=roll6, hip_roll=F(lambda t: roll6(t) * 0.95), kick=C(1.2), kick_hz=3 / hold,
             twist=K((0, 0), (0.2, 0), (0.32, 26), (0.62, 26), (0.74, 0)),
             breath=K((0, 0), (0.3, 0), (0.37, 1), (0.58, 1), (0.65, 0)),
             trough=K((0, 0), (0.22, 0), (0.32, 1), (0.62, 1), (0.72, 0)),
             floor_speed=fs(70, T)))

    # crawl à un bras : A travaille, B reste devant ; puis on inverse
    Tc3 = 1.5
    T = 2 * Tc3

    def pa1(t):
        return min(t, Tc3) / Tc3

    def pb1(t):
        return max(0.0, t - Tc3) / Tc3
    add('sheet:crawl à un bras', 'crawl à un bras', 'crawl',
        'Un bras nage, l’autre reste tendu devant sans couler ; les hanches tournent du côté du bras qui rame. Puis l’autre bras.',
        dict(T=T, A=F(pa1), B=F(pb1),
             roll=F(lambda t: 50 * phi1(pa1(t)) if t < Tc3 else -50 * phi1(pb1(t))),
             hip_roll=F(lambda t: 0.9 * (50 * phi1(pa1(t)) if t < Tc3 else -50 * phi1(pb1(t)))),
             twist=K((0, 0), (0.58, 0), (0.72, 26), (0.95, 26), (1.08, 0)),
             breath=K((0, 0), (0.7, 0), (0.76, 1), (0.92, 1), (0.98, 0)),
             trough=K((0, 0), (0.62, 0), (0.72, 1), (0.95, 1), (1.05, 0)),
             kick=C(1.0), floor_speed=fs(70, T)))

    # crawl immergé : tout le corps sous l'eau, palmes, mouvements amples, pas de recherche d'air
    Tc4 = 2.0
    sc = dict(T=2 * Tc4, A=F(lambda t: t / Tc4), B=F(lambda t: t / Tc4 + 0.5),
              modeA=lambda t: 'water', modeB=lambda t: 'water',
              roll=F(lambda t: 22 * math.sin(2 * math.pi * (t / Tc4 - 0.3))), dy=C(-95), base_pitch=0,
              foot_len=36.0, kick=C(1.3), kick_hz=1.5, floor_speed=fs(70, 2 * Tc4))
    add('sheet:crawl immergé', 'crawl immergé', 'crawl',
        'Crawl entièrement sous l’eau, avec palmes : traction ample jusqu’à la cuisse, corps aligné, sans chercher l’air au milieu de la longueur.',
        sc, todo='Retour des bras : sous l’eau (le retour aérien est impossible en immersion). À valider.')

    # godille : petits huit des mains devant, pas de grand cycle de bras, jambes immobiles (pull-buoy)
    w = 2 * math.pi * (4 / 3.0)

    def scull(side):
        def f(t):
            ph = w * t + (0 if side > 0 else math.pi * 0.0)
            return ((44, -16, 10), (96 + 14 * math.sin(ph), -30 + 11 * math.sin(2 * ph), 4 + 12 * math.cos(ph)))
        return F(f)
    add('sheet:godille', 'godille', 'crawl, dos',
        'Mains devant, elles dessinent de petits huit pour avancer, sans grand cycle de bras ; corps allongé, jambes immobiles.',
        dict(T=3.0, armA=scull(1), armB=scull(-1), kick=C(0), legs=F(lambda t: ((0, 0), (0, 0))),
             floor_speed=fs(35, 3.0)),
        todo='Position des mains (devant la tête ici) et variante dos pieds en avant à préciser.')

    # roulis : rotation exagérée, épaule du bras qui rame hors de l'eau, hanches et épaules ensemble
    sc = crawl(1.4, R=72)
    sc['hip_roll'] = F(lambda t, r=sc['roll']: r(t) * 0.95)
    sc['floor_speed'] = fs(90, sc['T'])
    add('sheet:roulis', 'roulis', 'crawl',
        'Crawl avec une rotation exagérée : l’épaule du bras qui rame sort de l’eau, hanches et épaules tournent ensemble, regard vers le fond.', sc)

    # minimum de coup de bras : grande glisse, chaque traction complète, plus de distance par cycle
    sc = crawl(1.7, R=55, glide=0.3)
    sc['floor_speed'] = fs(165 / 1.7, sc['T'])
    add('sheet:minimum de coup de bras', 'minimum de coup de bras', 'crawl',
        'Le moins de mouvements possible : chaque traction va au bout, la main glisse devant avant la suivante, on avance loin par cycle sans accélérer.',
        sc)

    # entrée de main alignée : rattrapé lent, la main pique devant l'épaule, glisse avant la traction
    sc = strokes_rattrape([('A', 0), ('B', 0)], avant=True, pull=0.5, rec=0.7, gap=0.36, roll_pull=40)
    sc['floor_speed'] = fs(60, sc['T'])
    add('sheet:entrée de main alignée', 'entrée de main alignée', 'crawl',
        'Retour lent puis entrée de la main devant l’épaule, doigts qui piquent vers le fond ; la glisse précède toujours la traction.',
        sc, todo='Le croisement (main au milieu de la tête) ne se voit pas de profil : une vue de dessus serait plus juste.')

    # doigts à la surface : retour aérien coude haut, les doigts frôlent l'eau
    sc = swim(1.6, 2, R=48, mode='drag', breath='A')
    add('sheet:doigts à la surface', 'doigts à la surface', 'crawl',
        'Pendant le retour aérien, le coude reste haut et les doigts frôlent la surface jusqu’à l’entrée de la main.', sc)

    # crawl polo : tête hors de l'eau, regard devant, battements qui portent le buste
    Tc5 = 1.2
    sc = dict(T=3 * Tc5, A=F(lambda t: t / Tc5), B=F(lambda t: t / Tc5 + 0.5),
              roll=F(lambda t: 26 * (phi1(t / Tc5) - phi1(t / Tc5 + 0.5))),
              pitch=C(48), base_pitch=9.0, dy=C(7), kick=C(1.4), floor_speed=fs(85, 3 * Tc5))
    add('sheet:crawl polo', 'crawl polo', 'crawl',
        'Crawl la tête hors de l’eau, regard devant : les battements portent le buste, le bas du dos ne se cambre pas.', sc)

    # crawl à l'envers : rattrapé à la cuisse
    sc = strokes_rattrape([('A', 1), ('B', 0), ('A', 0), ('B', 1)], avant=False, pull=0.4, rec=0.42, gap=0.1,
                          stop=0.36, roll_breath=60, roll_pull=44)
    sc['floor_speed'] = fs(75, sc['T'])
    add('sheet:crawl à l’envers', 'crawl à l’envers', 'crawl',
        'Rattrapé à la cuisse : la main attend le long de la jambe jusqu’à ce que l’autre la rejoigne ; les mains ne se retrouvent jamais devant la tête.',
        sc)

    # jet d'eau : fin de traction, la main sort près de la cuisse en envoyant un petit jet vers l'arrière
    Tc6 = 1.5
    sc = swim(Tc6, 2, R=46, breath='A')

    def splash(t):
        qa = (t / Tc6) % 1.0
        qb = (t / Tc6 + 0.5) % 1.0
        def amt(q):
            return math.sin(math.pi * (q - 0.48) / 0.14) if 0.48 <= q <= 0.62 else 0.0
        return ('A', amt(qa)) if amt(qa) > 0 else ('B', amt(qb))
    sc['splash'] = F(splash)
    add('sheet:jet d’eau', 'jet d’eau', 'crawl',
        'En fin de traction, la main quitte l’eau près de la cuisse en envoyant un petit jet vers l’arrière : la preuve que l’appui est allé au bout.',
        sc)

    # ───────── dos ─────────
    add('sheet:battements de dos', 'battements de dos', 'dos',
        'Sur le dos surtout aux jambes : battements qui partent de la cuisse, genoux sous l’eau, hanches hautes.',
        dict(T=3.0, roll=C(BACK), head_roll=C(BACK), base_pitch=0.0, dy=C(4),
             armA=lambda t: OVERHEAD_A, armB=lambda t: OVERHEAD_A,
             legs=F(lambda t: tuple((10 * math.sin(2 * math.pi * 2.0 * t + ph), 9 * (0.5 - 0.5 * math.sin(2 * math.pi * 2.0 * t + ph)))
                                    for ph in (0.0, math.pi))),
             thrust=lambda t: 120, kick=C(0)),
        todo='Bras derrière la tête ici ; avec planche, elle se tient sur la poitrine ou les genoux.')

    Tc7 = 1.4
    T = 2 * Tc7

    def pv(t, first):
        # bras « piquet » à la verticale (p = 0,75) ; l'autre fait un tour complet (0,75 → 1,75)
        u = t / Tc7
        if first:
            return 0.75 + min(u, 1.0)
        return 0.75 + max(0.0, u - 1.0)
    add('sheet:rattrapé vertical', 'rattrapé vertical', 'dos',
        'En dos, un bras reste à la verticale, doigts vers le ciel, pendant que l’autre rame ; les épaules tournent autour de ce piquet. Puis on inverse.',
        dict(T=T, A=F(lambda t: pv(t, False)), B=F(lambda t: pv(t, True)),
             modeA=lambda t: 'back', modeB=lambda t: 'back', head_roll=C(BACK),
             roll=F(lambda t: BACK - 48 * (phi1(pv(t, False)) - phi1(pv(t, True)))),
             kick=C(1.1), foot_len=34.0, floor_speed=fs(60, T)))

    add('sheet:dos soldat', 'dos soldat', 'dos',
        'Sur le dos, bras le long du corps, mains vers les cuisses : on avance aux jambes, ventre vers le plafond, bassin qui ne coule pas.',
        dict(T=3.0, roll=C(BACK), head_roll=C(BACK), base_pitch=0.0, dy=C(3),
             armA=lambda t: SIDE, armB=lambda t: SIDE, kick=C(1.0), floor_speed=fs(55, 3.0)))

    # ───────── brasse ─────────
    T = 5.4
    t_pull, t_rec, t_rise = 1.35, 2.55, 3.15
    legs_b = [cyc([(q, v[i]) for q, v in BREAST_LEGS], 1.0) for i in range(4)]

    def kick_at(t0, dur=1.0):
        def f(t):
            q = 0.35 + (t - t0) / dur * 0.65
            if q < 0.35 or q > 1.0:
                return (0, 0, 0, 8)
            return tuple(c(q) for c in legs_b)
        return f
    k1 = kick_at(t_rec - 0.35, 0.9)
    k2 = kick_at(4.05, 0.9)
    add('sheet:doubles coulées', 'doubles coulées', 'brasse',
        'Poussée au mur et glisse, puis une coulée de brasse sous l’eau (bras jusqu’aux cuisses, glisse, retour et ciseau) avant de remonter nager ; on n’inspire pas trop tôt.',
        dict(T=T, coulee=dict(push_t0=0.3, push_dur=0.4, drag=0.9, kick_thrust=260), base_pitch=0,
             armA=ArmSeq([(0, 'front'), (t_pull, ('p', 0.0, 'water')), (t_pull + 0.55, ('p', 0.5, 'water')),
                          (t_rec, ('p', 0.5, 'water')), (t_rec + 0.55, ('p', 1.0, 'water')),
                          (3.7, ('p', 0.0, 'breast')), (4.5, ('p', 1.0, 'breast'))]),
             armB=ArmSeq([(0, 'front'), (t_pull, ('p', 0.0, 'water')), (t_pull + 0.55, ('p', 0.5, 'water')),
                          (t_rec, ('p', 0.5, 'water')), (t_rec + 0.55, ('p', 1.0, 'water')),
                          (3.7, ('p', 0.0, 'breast')), (4.5, ('p', 1.0, 'breast'))]),
             legs=F(lambda t: (lambda v: (v, v))(k1(t) if t < 3.5 else k2(t))),
             kick=K((0, 0), (t_pull, 0), (t_pull + 0.3, 1), (t_pull + 0.6, 0.2), (t_rec, 0.1), (t_rec + 0.35, 0.9),
                    (t_rec + 0.6, 0.2), (4.0, 0.4), (4.4, 0.6), (T, 0.3)),
             dy=K((0, -30), (t_rec, -30), (t_rise + 0.5, -2), (T, 0)),
             pitch=K((0, -6), (3.95, -6), (4.15, 30), (4.4, 30), (4.6, 0)),
             bpitch=K((0, 0), (t_rise, 0), (t_rise + 0.4, 6), (3.9, 2), (4.15, 6), (4.4, 6), (4.7, 0)),
             breath=K((0, 0), (4.12, 0), (4.18, 1), (4.36, 1), (4.42, 0)),
             fade=K((0, 0), (0.25, 1), (4.95, 1), (5.3, 0), (T, 0)), shift=0.28),
        todo='Interprété comme : coulée de poussée puis coulée de brasse (bras + ciseau) sous l’eau. À valider.')

    legs_opp = [(0.00, (0, 0, 0, 8)), (0.46, (0, 0, 0, 8)), (0.62, (45, 115, 10, 78)), (0.67, (42, 110, 30, 88)),
                (0.82, (2, 6, 0, 30)), (0.88, (0, 0, 0, 8)), (1.00, (0, 0, 0, 8))]
    sc = breast_tracks(2.1, timing=dict(out=(0.0, 0.18), ins=(0.18, 0.28), shoot=(0.28, 0.38)), legs_keys=legs_opp)
    sc.update(T=4.2)
    add('sheet:brasse en opposition', 'brasse en opposition', 'brasse',
        'Bras et jambes ne poussent jamais ensemble : on tire bras pendant que les jambes restent allongées, court alignement, puis ciseau bras tendus devant.',
        sc)

    # ───────── papillon ─────────
    sc = fly_tracks(1.8, hold=0.2, pull_end=0.6, breath_cycles=(0,), n_cycles=2, att1=-14, att2=12, head_up=24)
    for k in ('A', 'B', 'modeA', 'modeB'):
        sc.pop(k, None)
    sc.update(T=3.6, armA=lambda t: SIDE, armB=lambda t: SIDE)
    add('sheet:papillon baleine', 'papillon baleine', 'papillon',
        'Bras le long du corps, on avance en ondulant : la tête sort puis plonge, la vague parcourt le corps jusqu’aux pieds, sans cycle de bras.',
        sc)

    Tc8 = 1.6
    legs_pt = [cyc([(0, 0), (0.45, 0), (0.6, -6), (0.75, 14), (0.9, 4), (1, 0)], Tc8),
               cyc([(0, 0), (0.45, 0), (0.6, 30), (0.75, 0), (0.9, 6), (1, 0)], Tc8)]
    add('sheet:pousse-tête', 'pousse-tête', 'papillon',
        'La vague part de la tête : le sommet du crâne pousse vers l’avant et un peu vers le fond, la poitrine puis les hanches suivent, les pieds ne donnent pas le départ.',
        dict(T=2 * Tc8, armA=lambda t: SIDE, armB=lambda t: SIDE, kick=C(0),
             legs=F(lambda t: ((legs_pt[0](t), legs_pt[1](t)),) * 2),
             pitch=F(cyc([(0, 0), (0.12, -24), (0.35, -10), (0.6, 8), (0.85, 0), (1, 0)], Tc8)),
             bpitch=F(cyc([(0, 0), (0.2, -4), (0.38, -12), (0.62, 6), (0.85, 2), (1, 0)], Tc8)),
             dy=F(cyc([(0, 0), (0.35, -8), (0.65, 2), (1, 0)], Tc8)),
             thrust=lambda t: 140),
        todo='Bras le long du corps supposés (la fiche ne le précise pas).')

    Tc9 = 1.0
    add('sheet:ondule-tête', 'ondule-tête', 'papillon',
        'La tête fait un petit « oui » continu, elle plonge puis revient, et le corps copie cette oscillation jusqu’aux pieds, sans à-coup.',
        dict(T=3 * Tc9, armA=lambda t: SIDE, armB=lambda t: SIDE, kick=C(0),
             legs=F(lambda t: ((7 * math.sin(2 * math.pi * (t / Tc9 - 0.35)),
                                10 * (0.5 - 0.5 * math.sin(2 * math.pi * (t / Tc9 - 0.35)))),) * 2),
             pitch=F(lambda t: 13 * math.sin(2 * math.pi * t / Tc9)),
             bpitch=F(lambda t: 6 * math.sin(2 * math.pi * (t / Tc9 - 0.15))),
             dy=F(lambda t: 3 * math.sin(2 * math.pi * (t / Tc9 - 0.2))),
             thrust=lambda t: 120),
        todo='Bras le long du corps supposés (la fiche ne le précise pas).')

    Tc10 = 3.0
    pam = cyc([(0, 0.0), (0.52, 0.0), (0.68, 0.14), (0.74, 0.14), (0.9, 0.0), (1, 0.0)], Tc10)
    und = Tc10 / 2.0
    add('sheet:amorce', 'amorce', 'papillon',
        'Deux ondulations bras devant, puis les mains entament seulement le début de l’appui papillon et reviennent : on cherche le premier appui, pas le cycle entier.',
        dict(T=Tc10, A=F(pam), B=F(pam), modeA=lambda t: 'fly', modeB=lambda t: 'fly', kick=C(0),
             legs=F(lambda t: ((6 * math.sin(2 * math.pi * (t / (und / 2) - 0.35)) if t < und else 2,
                                12 * (0.5 - 0.5 * math.sin(2 * math.pi * (t / (und / 2) - 0.35))) if t < und else 4),) * 2),
             pitch=F(lambda t: 12 * math.sin(2 * math.pi * t / (und / 2)) if t < und else 0),
             bpitch=F(lambda t: 6 * math.sin(2 * math.pi * (t / (und / 2) - 0.15)) if t < und else -4),
             dy=F(cyc([(0, 0), (0.5, 0), (0.7, -3), (0.9, 0), (1, 0)], Tc10)),
             thrust=lambda t: 110))

    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
