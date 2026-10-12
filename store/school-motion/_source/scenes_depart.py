"""Départ crawl (ADC1-ADC10) : 10 scènes. Fichiers depart-NN-slug.json.

Bord ou plot à gauche, l'eau à droite. Caméra fixe dézoomée (0,6 au bord, 0,52 au plot) pour voir toute la trajectoire :
déséquilibre → poussée → envol → entrée « dans le trou » → coulée → reprise.
Les orteils restent posés au bord / au plot par ancrage jusqu'à l'impulsion ; ensuite le centre du corps
suit une trajectoire relative (envol balistique puis freinage dans l'eau).
"""
import math

from motion_core import SURF, ArmSeq, C, F, K, Track, ease, kick_angles

COURSE = 'depart'
PREFIX = 'depart'
STEP_PREFIX = 'ADC'

CAM_EDGE = dict(zoom=0.6, fx=0.0, fy=SURF, Fx=70.0, Fy=250.0)
CAM_BLOCK = dict(zoom=0.52, fx=0.0, fy=SURF, Fx=80.0, Fy=262.0)
EDGE_H = 40.0        # bord du bassin : 40 px monde au-dessus de l'eau
BLOCK_H = 125.0      # plot


def flight(t_rel, vx, vy, t_entry, g=2000.0, k=2.6, depth=150.0, rise=110.0):
    """Déplacement relatif (dx, dy-haut) du centre du corps après l'impulsion."""
    if t_rel <= 0:
        return 0.0, 0.0
    if t_rel <= t_entry:
        return vx * t_rel, vy * t_rel - 0.5 * g * t_rel * t_rel
    xe, ye = vx * t_entry, vy * t_entry - 0.5 * g * t_entry * t_entry
    s = t_rel - t_entry
    v_in = vx
    dx = xe + v_in / k * (1 - math.exp(-k * s))
    dyw = ye - depth * (1 - math.exp(-3.2 * s)) + rise * ease(s / 1.6, 'cos')
    return dx, dyw


def place_hoop(sc):
    """Place le cerceau là où la tête passe à la profondeur du centre du cerceau (trajectoire simulée)."""
    import copy
    import motion_core as core
    probe = copy.copy(sc)
    probe['props'] = [p for p in sc['props'] if p['kind'] != 'hoop']
    cache = core.prepare(probe)
    z, fx, fy, Fx, Fy = core.cam_params(probe, 0)
    hoop = [p for p in sc['props'] if p['kind'] == 'hoop'][0]
    prev = None
    t = 0.0
    while t < probe['T']:
        hx, hy = core.frame_prims(probe, t, cache)['head'][1]
        wx, wy = fx + (hx - Fx) / z, fy + (hy - Fy) / z
        if prev and prev[1] < hoop['y'] <= wy:
            hoop['x'] = wx
            break
        prev = (wx, wy)
        t += 1.0 / core.FPS


def dive(slug, title, show, start='edge', push=True, arms_swing=False, head_rise=False, hoop=False,
         reprise=False, signal=False, track=False, T=None):
    """Construit une scène de départ.
    start : 'edge' (debout au bord, bras tendus) | 'block' (debout sur le plot) | 'grab' (agrippé)."""
    on_block = start in ('block', 'grab')
    top = SURF - (BLOCK_H if on_block else EDGE_H)
    toe_target = (0.0, top)
    t0 = 0.45 if not signal else 0.9          # fin de la pose de départ
    if start == 'edge' and not arms_swing:
        t_tip, t_push = t0 + 0.75, t0 + 0.75   # chute pure jusqu'à ~25° sous l'horizontale
    else:
        t_tip, t_push = t0 + 0.35, t0 + 0.65
    t_rel = t_push if push and start != 'edge' or arms_swing else t_tip
    if start == 'edge' and push and not arms_swing:
        t_tip, t_rel = t0 + 0.5, t0 + 0.75
    t_entry = 0.42 if on_block else (0.3 if push else 0.22)
    vx = 900 if on_block else (720 if push else 380)
    vy = 260 if on_block else (180 if push else -40)
    T = T or (5.2 if reprise else 4.2)

    # ---- orientation du corps
    if start == 'grab':
        b0, b1 = -58.0, -60.0
        legs0 = (132, 34)
        arms0 = 'grab'
    elif arms_swing:
        b0, b1 = 62.0, 30.0
        legs0 = (58, 92)
        arms0 = 'swing_back'
    elif start == 'block':
        b0, b1 = 55.0, 25.0
        legs0 = (50, 80)
        arms0 = 'down'
    else:
        b0, b1 = 90.0, 45.0 if push else 90.0
        legs0 = (18, 30) if push else (0, 0)
        arms0 = 'front'
    rel_angle = (-6.0 if start == 'grab' else -8.0) if on_block else (-10.0 if push else -30.0)
    entry_angle = -38.0
    bp = [(0, b0), (t0, b0)]
    if start == 'edge' and not push:
        bp += [(t_rel, rel_angle, 'in')]
    else:
        bp += [(t_tip, b1, 'out'), (t_rel, rel_angle)]
    bp += [(t_rel + t_entry, entry_angle), (t_rel + t_entry + 0.5, -6), (t_rel + t_entry + 1.2, 4), (T, 0)]

    # ---- jambes : pose de départ → extension à l'impulsion → battements dans la coulée
    a_k = [(0, legs0[0]), (t_tip, legs0[0], 'in'), (t_rel, 0)] if push else [(0, legs0[0]), (T, legs0[0])]
    k_k = [(0, legs0[1]), (t_tip, legs0[1], 'in'), (t_rel, 0)] if push else [(0, legs0[1]), (T, legs0[1])]
    if not push:
        a_k, k_k = [(0, 0)], [(0, 0)]
    kick_on = t_rel + t_entry + 0.8
    a_tr, k_tr = Track(a_k), Track(k_k)
    w_kick = K((0, 0), (kick_on, 0), (kick_on + 0.3, 1))
    legs_b = None
    if track:                                  # pieds décalés : jambe B en arrière, qui bascule en premier
        legs_b = (Track([(0, 22), (t0, 22), (t_tip, 0), (t_rel, 0)]), Track([(0, 50), (t0, 50), (t_tip, 10), (t_rel, 0)]))

    def legs_f(t):
        th = 2 * math.pi * 2.4 * t
        w = w_kick(t)
        out = []
        for i, ph in enumerate((0.0, math.pi)):
            ka, kk = kick_angles(th + ph, 1.0)
            a, k = (a_tr(t), k_tr(t)) if (i == 0 or not legs_b) else (legs_b[0](t), legs_b[1](t))
            out.append((a * (1 - w) + ka * w, k * (1 - w) + kk * w))
        return tuple(out)

    # ---- bras
    if start == 'grab':
        arms = [(0, 'grab'), (t0, 'grab'), (t_tip, 'chest'), (t_rel, 'front')]
    elif arms_swing:
        arms = [(0, 'front'), (t0 * 0.4, 'front'), (t0, 'swing_back'), (t_tip, 'swing_back'), (t_rel, 'front')]
    elif start == 'block':
        arms = [(0, 'down'), (t0, 'down'), (t_tip, 'swing_back'), (t_rel, 'front')]
    else:
        arms = [(0, 'front')]
    if arms_swing and start == 'edge':
        pass
    armA = list(arms)
    if reprise:
        t_s = t_rel + t_entry + 1.55
        armA += [(t_s, ('p', 0.0, 'air')), (t_s + 0.5, ('p', 0.5, 'air')), (t_s + 0.95, ('p', 1.0, 'air'))]
    # ---- tête : rentrée entre les bras (option : se lève au début de la bascule, puis rentre)
    if head_rise:
        pitch = K((0, -10), (t0, -10), (t0 + 0.2, 45), (t_tip + 0.05, 45), (t_rel, -14), (T, 0))
    elif start == 'grab':
        pitch = K((0, -16), (t_rel + t_entry + 0.6, -14), (T, 0))
    else:
        pitch = K((0, -12), (t_rel + t_entry + 0.6, -12), (T, 0))

    def xw_f(t):
        return flight(t - t_rel, vx, vy, t_entry)[0]

    def dy_f(t):
        return flight(t - t_rel, vx, vy, t_entry)[1]

    props = [dict(kind='block', x=0.0, top=top)] if on_block else [dict(kind='deck', x=0.0, h=EDGE_H)]
    if hoop:
        props.append(dict(kind='hoop', x=0.0, y=SURF + 58, r=58))   # x calé par place_hoop()
    fade_out = T - 0.45
    sc = dict(T=T, slug=slug, title=title, show=show, cam=CAM_BLOCK if on_block else CAM_EDGE, props=props,
              xw=F(xw_f), dy=F(dy_f), bpitch=Track(bp), base_pitch=0.0,
              legs=F(legs_f), armA=ArmSeq(armA), armB=ArmSeq(arms), pitch=pitch, kick=C(0),
              anchors=[dict(part='toeA', target=toe_target, t0=0.0, t1=t_rel, ramp=0.0)],
              floor_fn=lambda t: 0.0,
              fade=K((0, 1), (fade_out, 1), (T - 0.08, 0), (T, 0)), shift=T - 0.08 + 0.0)
    if hoop:
        place_hoop(sc)
    if signal:
        sc['signal'] = K((0, 0), (t0 - 0.12, 0), (t0 - 0.06, 1), (t0 + 0.35, 1), (t0 + 0.5, 0))
    sc['shift'] = 0.15
    sc['fade'] = K((0, 0), (0.12, 1), (fade_out, 1), (T - 0.05, 0), (T, 0))
    return sc


def scenes():
    S = [
        dive('chute', 'Chute avant du bord', start='edge', push=False,
             show='Debout au bord, bras tendus, tête rentrée, corps dur : on se laisse tomber sans pousser, jusqu’à entrer dans l’eau.'),
        dive('desequilibre', 'Déséquilibre puis poussée', start='edge', push=True,
             show='D’abord on bascule, ensuite seulement les jambes poussent : plus d’envol, tête toujours entre les bras.'),
        dive('bras', 'Action des bras', start='edge', push=True, arms_swing=True,
             show='Les bras descendent quand les jambes plient, ils remontent quand les jambes poussent ; à l’entrée, tête entre les bras.'),
        dive('cerceau', 'Cerceau + coulée', start='edge', push=True, arms_swing=True, hoop=True,
             show='Même départ en visant un cerceau : on perce le trou sans le toucher, nuque pliée, corps dur, et on glisse loin.'),
        dive('depart-reprise', 'Départ entier + reprise', start='block', push=True, reprise=True,
             show='Poussée, entrée, coulée, puis battements et un premier bras : les phases s’enchaînent mais restent séparées.'),
        dive('agrippe', 'Agrippé : tirer pour basculer', start='grab', push=True,
             show='Mains au plot : on tire, le corps bascule, tête rentrée, corps dur ; on vise l’entrée par les mains, pas par le ventre.'),
        dive('tete-relevee', 'Agrippé + tête qui se relève', start='grab', push=True, head_rise=True,
             show='Agrippé : au début de la bascule les jambes plient et la tête se lève, puis on rentre par la tête.'),
        dive('pieds-decales', 'Pieds décalés', start='block', push=True, track=True,
             show='Pieds décalés, mains libres : la jambe arrière bascule, l’avant pousse, les bras aident, et on rentre dans l’axe.'),
        dive('cerceau-reprise', 'Cerceau + reprise', start='block', push=True, hoop=True, reprise=True,
             show='Départ plot, on passe dans le cerceau sans le toucher, on glisse, puis on reprend la nage sans tout perdre.'),
        dive('signal', 'Au signal', start='grab', push=True, reprise=True, signal=True, T=5.4,
             show='Prêt, puis au coup de sifflet on part tout de suite : envol dur, coulée, reprise.'),
    ]
    for i, s in enumerate(S, 1):
        s['n'] = i
    return S
