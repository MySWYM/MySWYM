"""
MySWYM · moteur des motions école (toutes nages).

Nageur schématique modélisé en 3D (épaules, hanches, bras avec coude, jambes avec
genou), projeté de profil, exporté en Lottie (calques de forme). Les scènes de
chaque cours vivent dans scenes_<cours>.py ; ce module ne contient que le moteur.

Repère corps : x = vers la tête, y = côté dos, z = vers l'extérieur du côté A.
roll   : rotation autour de l'axe du corps (0 = ventre, 180 = dos, + = côté A vers le haut).
bpitch : rotation dans le plan de l'image (+ = tête qui monte ; 180 = demi-tour).
Le monde est en « px écran » (surface à y = SURF) ; une caméra optionnelle
(zoom constant + cadrage) transforme le monde en écran.
"""
import json
import math
import os

FPS = 30
KF_STEP = 2          # une clé géométrique toutes les 2 images (interpolation linéaire entre)
W, H = 800, 400
SURF = 168.0         # y monde de la surface
CX = 415.0           # x écran du centre du corps (scènes sur place)
BODY_DEPTH = 12.0    # axe du corps sous la surface (px)
FLOOR_Y = 382.0
DASH, GAP = 22.0, 28.0
DASH_PERIOD = DASH + GAP

# gabarit (px)
SH_HALF, HIP_HALF, TORSO = 17.0, 11.0, 118.0
UPPER, FORE, HAND = 50.0, 44.0, 16.0
THIGH, SHIN, FOOT = 66.0, 60.0, 18.0
NECK, HEAD_R = 30.0, 19.0

COL = {
    'bg': '#F4F9FD', 'floor': '#BBD8EC', 'wall': '#DCEAF4',
    'body': '#4A90C4', 'suit': '#2F74AA', 'limb': '#1F5E92', 'far': '#9CC4E2', 'halo': '#F4F9FD',
    'goggle': '#F1F9FF', 'water': '#8CC8EC', 'surface': '#6FB2DE', 'puff': '#2EA6DD',
    'block': '#C9DDEC', 'hoop': '#2EA6DD',
}
WATER_OPACITY = 30
W_ARM, W_LEG, W_TORSO, W_BAR = 11.0, 13.0, 30.0, 22.0
GENERATOR_TAG = 'MySWYM generate_motions.py'


# ───────────────────────── outils ─────────────────────────
def rad(d): return d * math.pi / 180.0
def add(a, b): return tuple(x + y for x, y in zip(a, b))
def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def mul(a, s): return tuple(x * s for x in a)
def norm(a):
    l = math.sqrt(sum(x * x for x in a)) or 1.0
    return tuple(x / l for x in a)


def ease(u, kind):
    u = 0.0 if u < 0 else 1.0 if u > 1 else u
    if kind == 'lin': return u
    if kind == 'in': return u * u
    if kind == 'out': return 1 - (1 - u) ** 2
    return 0.5 - 0.5 * math.cos(math.pi * u)


class Track:
    """Clés (t, v[, ease vers la suivante]) ; ease par défaut = cosinus."""
    def __init__(self, keys, default='cos'):
        ks = [(k[0], k[1], k[2] if len(k) > 2 else default) for k in keys]
        self.k = sorted(ks, key=lambda x: x[0])

    def __call__(self, t):
        k = self.k
        if t <= k[0][0]: return k[0][1]
        for i in range(len(k) - 1):
            t0, v0, e = k[i]
            t1, v1, _ = k[i + 1]
            if t <= t1:
                if t1 <= t0: return v1
                return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0), e)
        return k[-1][1]


def C(v): return Track([(0, v)])
def K(*keys, ease_='cos'): return Track(list(keys), ease_)


class F:
    """Fonction du temps utilisable comme piste."""
    def __init__(self, f): self.f = f
    def __call__(self, t): return self.f(t)


# ───────────────────────── bras ─────────────────────────
# p ∈ [0,1) : 0 = bras tendu devant, 0.5 = main à la cuisse (fin de poussée).
# Points (p, coude, cible main) dans le repère épaule : x avant, y dos, z vers l'extérieur.
PULL = [
    (0.00, (50, -3, 2), (112, -6, 0)),
    (0.12, (46, -16, 6), (92, -42, -2)),
    (0.25, (28, -34, 10), (26, -80, -10)),
    (0.38, (-14, -34, 10), (-52, -62, -4)),
    (0.50, (-46, -10, 10), (-104, -16, 8)),
]
REC_AIR = [
    (0.60, (-48, 22, 12), (-68, -12, 10)),
    (0.72, (-30, 40, 14), (4, 14, 16)),
    (0.85, (30, 42, 10), (68, 24, 8)),
    (0.94, (50, 14, 4), (106, 2, 2)),
]
REC_WATER = [
    (0.62, (-32, -30, 14), (-14, -58, 4)),
    (0.75, (-6, -34, 12), (38, -44, 0)),
    (0.88, (32, -18, 6), (86, -24, 0)),
]


def _arc(p0, p1, n, f):
    """n points intermédiaires d'un arc paramétré f(u) (u ∈ ]0,1[)."""
    out = []
    for i in range(1, n + 1):
        u = i / (n + 1)
        e, h = f(u)
        out.append((p0 + (p1 - p0) * u, e, h))
    return out


# Dos : traction (corps sur le dos, y+ = vers le fond), retour bras tendu en arc vertical.
BACK_PULL = [
    (0.00, (52, 6, 8), (112, 10, 6)),
    (0.10, (48, 22, 14), (98, 40, 18)),
    (0.24, (20, 44, 30), (18, 64, 46)),
    (0.38, (-20, 32, 26), (-60, 46, 22)),
    (0.50, (-46, 10, 10), (-104, 16, 6)),
]
BACK_REC = _arc(0.5, 1.0, 5, lambda u: (
    (-52 * math.cos(math.pi * u), -52 * math.sin(math.pi * u), 4 + 4 * math.sin(math.pi * u)),
    (-110 * math.cos(math.pi * u), -110 * math.sin(math.pi * u), 6 + 6 * math.sin(math.pi * u))))
# Dos éducatif : traction bras tendu, profonde (appui vers le bas puis vers l'extérieur).
BACK_STRAIGHT_PULL = [(0.00, (52, 6, 8), (112, 10, 6))] + _arc(0.0, 0.5, 4, lambda u: (
    (52 * math.cos(math.pi * u), 34 * math.sin(math.pi * u) + 6, 8 + 20 * math.sin(math.pi * u)),
    (110 * math.cos(math.pi * u), 72 * math.sin(math.pi * u) + 8, 6 + 44 * math.sin(math.pi * u)))) + \
    [(0.50, (-46, 10, 10), (-104, 16, 6))]
# Papillon : traction type crawl (symétrique), retour bras tendus juste au-dessus de l'eau, sur le côté.
FLY_REC = _arc(0.5, 1.0, 5, lambda u: (
    (-50 * math.cos(math.pi * u), 8 + 14 * math.sin(math.pi * u), 8 + 42 * math.sin(math.pi * u)),
    (-106 * math.cos(math.pi * u), 10 + 26 * math.sin(math.pi * u), 8 + 92 * math.sin(math.pi * u))))
# Brasse : écart (prise d'eau), rentrée sous la poitrine coudes écartés, relance devant.
BREAST = [
    (0.00, (50, -3, 4), (112, -6, 2)),
    (0.22, (46, -8, 22), (94, -22, 48)),
    (0.42, (32, -14, 40), (58, -48, 44)),
    (0.56, (18, -24, 38), (30, -58, 10)),
    (0.68, (12, -30, 24), (40, -32, 0)),
    (0.84, (34, -14, 8), (86, -14, 0)),
]

ARM_PATHS = {
    'air': PULL + REC_AIR,
    'water': PULL + REC_WATER,
    'back': BACK_PULL + BACK_REC,
    'back_straight': BACK_STRAIGHT_PULL + BACK_REC,
    'fly': PULL + FLY_REC,
    'breast': BREAST,
}

# Poses fixes (coude, cible main) — repère épaule, z vers l'extérieur.
POSES = {
    'front': ((50, -3, 2), (112, -6, 0)),            # bras tendus devant (flèche)
    'thigh': ((-46, -10, 10), (-104, -16, 8)),        # le long des cuisses
    'side': ((-46, -6, 14), (-104, -8, 12)),         # le long du corps, un peu écarté
    'back_hands': ((-34, 18, 26), (-86, 24, -12)),    # mains dans le dos (nage du prisonnier)
    'swing_back': ((-40, 24, 14), (-96, 50, 10)),    # bras lancés derrière (élan)
    'down': ((4, -50, 10), (6, -110, 8)),            # bras vers le ventre (vers le bas si penché)
    'grab': ((-6, -50, 12), (-30, -104, 6)),          # mains vers les pieds (agrippé au plot)
    'chest': ((-4, -34, 18), (30, -40, 0)),           # mains sous la poitrine
    'wall': ((48, -14, 4), (108, -22, 2)),            # bras tendus devant, un peu bas (touche au mur)
    'up_out': ((10, -46, 40), (16, -100, 60)),        # bras écartés vers le haut (dos, bascule)
}


def cr(p0, p1, p2, p3, u):
    u2, u3 = u * u, u * u * u
    return tuple(0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3)
                 for a, b, c, d in zip(p0, p1, p2, p3))


def arm_targets(p, mode):
    pts = ARM_PATHS[mode]
    n = len(pts)
    p = p % 1.0
    knots = [q[0] for q in pts] + [1.0]
    i = 0
    for i in range(n):
        if knots[i] <= p < knots[i + 1]:
            break
    u = (p - knots[i]) / (knots[i + 1] - knots[i])
    idx = [(i - 1) % n, i, (i + 1) % n, (i + 2) % n]
    e = cr(*[pts[j][1] for j in idx], u)
    h = cr(*[pts[j][2] for j in idx], u)
    return e, h


def arm_chain_eh(side, e, h):
    e = (e[0], e[1], e[2] * side)
    h = (h[0], h[1], h[2] * side)
    s = (TORSO / 2, 0.0, side * SH_HALF)
    el = mul(norm(e), UPPER)
    fd = norm(sub(h, el))
    wr = add(el, mul(fd, FORE))
    tip = add(wr, mul(fd, HAND))
    return [s, add(s, el), add(s, wr), add(s, tip)]


def arm_chain(side, p, mode):
    e, h = arm_targets(p, mode)
    return arm_chain_eh(side, e, h)


def _eh(spec):
    """spec = nom de pose | (coude, main) | ('p', valeur, mode)."""
    if isinstance(spec, str):
        return POSES[spec]
    if spec[0] == 'p':
        return arm_targets(spec[1], spec[2])
    return spec


class ArmSeq:
    """Séquence de bras : clés (t, spec[, ease]). Entre deux clés ('p', v, mode) du même mode,
    on suit la trajectoire de nage ; sinon on fond linéairement coude et main d'une pose à l'autre."""
    def __init__(self, keys, default='cos'):
        self.k = sorted([(k[0], k[1], k[2] if len(k) > 2 else default) for k in keys], key=lambda x: x[0])

    def __call__(self, t):
        k = self.k
        if t <= k[0][0]: return _eh(k[0][1])
        for i in range(len(k) - 1):
            t0, s0, e = k[i]
            t1, s1, _ = k[i + 1]
            if t <= t1:
                u = ease((t - t0) / (t1 - t0), e) if t1 > t0 else 1.0
                if (not isinstance(s0, str) and not isinstance(s1, str) and s0[0] == 'p' and s1[0] == 'p'
                        and s0[2] == s1[2]):
                    return arm_targets(s0[1] + (s1[1] - s0[1]) * u, s0[2])
                (e0, h0), (e1, h1) = _eh(s0), _eh(s1)
                return (tuple(a + (b - a) * u for a, b in zip(e0, e1)),
                        tuple(a + (b - a) * u for a, b in zip(h0, h1)))
        return _eh(k[-1][1])


# ───────────────────────── jambes ─────────────────────────
def leg_chain(side, a_deg, k_deg, ab_deg=0.0, foot_deg=8.0):
    """a = flexion de hanche (+ = genou vers le ventre), k = flexion du genou (talon vers les fesses),
    ab = rotation de la jambe autour de l'axe du corps (+ = talons vers l'extérieur, genoux dedans),
    foot = angle du pied par rapport au tibia (8 = pointé, ~80 = pied en flexion)."""
    hp = (-TORSO / 2, 0.0, side * HIP_HALF)
    a = rad(a_deg)
    kn = (-THIGH * math.cos(a), -THIGH * math.sin(a), 0)
    b = a - rad(k_deg)
    an = add(kn, (-SHIN * math.cos(b), -SHIN * math.sin(b), 0))
    c = b + rad(foot_deg)
    to = add(an, (-FOOT * math.cos(c), -FOOT * math.sin(c), 0))
    if ab_deg:
        al = rad(ab_deg) * side
        ca, sa = math.cos(al), math.sin(al)
        kn, an, to = [(v[0], v[1] * ca - v[2] * sa, v[1] * sa + v[2] * ca) for v in (kn, an, to)]
    return [hp, add(hp, kn), add(hp, an), add(hp, to)]


def kick_angles(theta, amp):
    a = 6 * amp * math.sin(theta)
    k = 12 * amp * (0.5 - 0.5 * math.sin(theta))
    return a, k


# ───────────────────────── projection ─────────────────────────
def rot(P, phi, th):
    x, y, z = P
    c, s = math.cos(rad(phi)), math.sin(rad(phi))
    y2, z2 = y * c + z * s, -y * s + z * c
    ct, st = math.cos(rad(th)), math.sin(rad(th))
    return (x * ct - y2 * st, x * st + y2 * ct, z2)


def project(P, pose):
    x, y, z = rot(P, pose['roll'], pose['bpitch'])
    return (pose['cx'] + x, SURF + BODY_DEPTH - pose['dy'] - y, z)


SWIMMER_PRIMS = ('armA_far', 'armA_near', 'armB_far', 'armB_near', 'legA_far', 'legA_near', 'legB_far',
                 'legB_near', 'torso', 'suit', 'shoulders', 'hips', 'neck', 'head', 'goggle',
                 'inspire', 'inspire_shaft')


def _swimmer(sc, t, cache, pose, fade):
    kamp = sc['kick'](t)
    th = 2 * math.pi * sc['kick_f'] * t
    if sc.get('coulee') and cache['ext'](t) < 1.0:
        e = cache['ext'](t)
        la = lb = (75 * (1 - e), 125 * (1 - e))
    elif 'legs' in sc:
        la, lb = sc['legs'](t)
    else:
        la = kick_angles(th, kamp)
        lb = kick_angles(th + math.pi, kamp)

    limbs = {
        'armA': arm_chain_eh(+1, *sc['armA'](t)) if 'armA' in sc else arm_chain(+1, sc['A'](t), sc['modeA'](t)),
        'armB': arm_chain_eh(-1, *sc['armB'](t)) if 'armB' in sc else arm_chain(-1, sc['B'](t), sc['modeB'](t)),
        'legA': leg_chain(+1, *la),
        'legB': leg_chain(-1, *lb),
    }
    ar = abs(pose['roll'])
    if 'hip_roll' in sc:
        pose_h = dict(pose, roll=sc['hip_roll'](t))
    else:
        hk = 0.62 + 0.38 * ease((ar - 60) / 90.0, 'cos')
        pose_h = dict(pose, roll=pose['roll'] * hk)      # le bassin roule moins que les épaules
    prims = {}
    for name, pts in limbs.items():
        sp = [project(p, pose_h if name.startswith('leg') else pose) for p in pts]
        if name.startswith('leg'):
            near = sp[0][2] >= 0          # jambe : côté décidé par la hanche (pas de clignotement au battement)
        else:
            near = sum(p[2] for p in sp[1:]) / (len(sp) - 1) >= 0
        xy = [(p[0], p[1]) for p in sp]
        prims[name + '_far'] = ('path', xy, 0 if near else fade)
        prims[name + '_near'] = ('path', xy, fade if near else 0)

    shc = project((TORSO / 2, 0, 0), pose)
    hpc = project((-TORSO / 2, 0, 0), pose)
    suit_end = project((-TORSO / 2 + 30, 0, 0), pose)
    sa = project((TORSO / 2, 0, SH_HALF), pose)
    sb = project((TORSO / 2, 0, -SH_HALF), pose)
    ha = project((-TORSO / 2, 0, HIP_HALF), pose_h)
    hb = project((-TORSO / 2, 0, -HIP_HALF), pose_h)
    prims['torso'] = ('path', [hpc[:2], shc[:2]], fade)
    prims['suit'] = ('path', [hpc[:2], suit_end[:2]], fade)
    prims['shoulders'] = ('path', [sa[:2], sb[:2]], fade)
    prims['hips'] = ('path', [ha[:2], hb[:2]], fade)

    psi = sc['pitch'](t)
    tw = sc['twist'](t)
    if 'head_roll' in sc:                      # tête stable dans le monde (dos : regard au plafond)
        tw = tw + sc['head_roll'](t) - pose['roll']
    head = project((TORSO / 2 + NECK * math.cos(rad(psi)), NECK * math.sin(rad(psi)), 0), pose)
    prims['neck'] = ('path', [shc[:2], head[:2]], fade)
    prims['head'] = ('circle', head[:2], fade)
    n0 = (math.sin(rad(psi)), -math.cos(rad(psi)), 0.0)
    n1 = rot(n0, tw, 0)                      # rotation de la tête autour de l'axe du corps
    n = rot(n1, pose['roll'], pose['bpitch'])
    gx, gy = head[0] + 0.62 * HEAD_R * n[0], head[1] - 0.62 * HEAD_R * n[1]
    prims['goggle'] = ('circle', (gx, gy), fade if n[2] > -0.25 else 0)
    d = norm((n[0], max(n[1], 0.0) + 0.8))
    px, py = head[0] + 1.5 * HEAD_R * d[0], head[1] - 1.5 * HEAD_R * d[1]
    br = sc['breath'](t) * fade
    # flèche « inspire » : de l'extérieur vers la bouche
    ux, uy = d[0], -d[1]                      # direction écran sortante
    tipx, tipy = px - 2 * ux, py - 2 * uy
    tailx, taily = tipx + 16 * ux, tipy + 16 * uy
    lx, ly = -uy, ux
    prims['inspire'] = ('path', [(tipx + 7 * ux + 5 * lx, tipy + 7 * uy + 5 * ly), (tipx, tipy),
                                 (tipx + 7 * ux - 5 * lx, tipy + 7 * uy - 5 * ly)], br)
    prims['inspire_shaft'] = ('path', [(tipx, tipy), (tailx, taily)], br)
    return prims, sp_parts(limbs, pose, pose_h)


def sp_parts(limbs, pose, pose_h):
    """Points monde utiles pour l'ancrage (pieds au mur / au plot, mains au mur)."""
    out = {}
    for side in 'AB':
        leg = [project(p, pose_h) for p in limbs['leg' + side]]
        arm = [project(p, pose) for p in limbs['arm' + side]]
        out['toe' + side], out['ankle' + side], out['knee' + side] = leg[3][:2], leg[2][:2], leg[1][:2]
        out['hand' + side] = arm[3][:2]
    return out


def _shift(prims, dx, dy):
    for k in SWIMMER_PRIMS:
        kind, v, op = prims[k]
        if kind == 'circle':
            prims[k] = (kind, (v[0] + dx, v[1] + dy), op)
        else:
            prims[k] = (kind, [(x + dx, y + dy) for x, y in v], op)


# ───────────────────────── accessoires (monde) ─────────────────────────
def prop_shapes(sc, t, fade):
    """Accessoires en coordonnées monde : mur à droite, plot, bord, cerceau, signal (écran)."""
    out = {}
    for pr in sc.get('props', []):
        kind = pr['kind']
        op = fade if pr.get('fade', True) else 1
        if kind == 'wall_right':
            x = pr['x']
            out['wall'] = ('poly', [(x, SURF - 26), (x + 90, SURF - 26), (x + 90, SURF + 700), (x, SURF + 700)], op)
        elif kind == 'wall_left':
            x = pr['x']
            out['wall'] = ('poly', [(x - 90, SURF - 26), (x, SURF - 26), (x, SURF + 700), (x - 90, SURF + 700)], op)
        elif kind == 'block':
            x, top = pr['x'], pr['top']          # x = bord avant du plot, top = y monde du dessus
            out['block'] = ('poly', [(x - 150, SURF - 20), (x - 150, top - 6), (x - 8, top - 18), (x + 4, top - 14),
                                     (x - 4, top + 14), (x - 60, top + 30), (x - 60, SURF - 20)], op)
            out['wall'] = ('poly', [(x - 400, SURF - 20), (x - 30, SURF - 20), (x - 30, SURF + 700),
                                    (x - 400, SURF + 700)], op)
        elif kind == 'deck':
            x = pr['x']                           # bord du bassin (plage) : dessus à SURF - h
            h = pr.get('h', 40)
            out['wall'] = ('poly', [(x - 500, SURF - h), (x, SURF - h), (x, SURF + 700), (x - 500, SURF + 700)], op)
        elif kind == 'hoop':
            cx, cy, r = pr['x'], pr['y'], pr.get('r', 46)
            pts = [(cx + 0.28 * r * math.cos(2 * math.pi * i / 18), cy + r * math.sin(2 * math.pi * i / 18))
                   for i in range(18)]
            out['hoop'] = ('ring', pts, op)
    if 'signal' in sc:                            # coup de sifflet : arcs en haut à gauche (écran)
        s = sc['signal'](t)
        arcs = []
        for r in (14, 24):
            arcs.append([(46 + r * math.cos(rad(a)), 46 + r * math.sin(rad(a))) for a in range(-50, 51, 20)])
        out['signal1'] = ('screen_path', arcs[0], s)
        out['signal2'] = ('screen_path', arcs[1], s)
        out['signal_dot'] = ('screen_path', [(38, 46), (41, 46)], s)
    return out


# ───────────────────────── caméra ─────────────────────────
def cam_params(sc, t):
    cam = sc.get('cam')
    if not cam:
        return None
    fx = cam['fx'](t) if callable(cam['fx']) else cam['fx']
    return cam['zoom'], fx, cam['fy'], cam['Fx'], cam['Fy']


def _cam_xy(x, y, cp):
    z, fx, fy, Fx, Fy = cp
    return (Fx + z * (x - fx), Fy + z * (y - fy))


# ───────────────────────── ancrages ─────────────────────────
def _raw_parts(sc, t, cache):
    pose = {'roll': sc['roll'](t), 'bpitch': sc['bpitch'](t) + sc.get('base_pitch', 3.0), 'dy': sc['dy'](t),
            'cx': cache['cx'](t)}
    return _swimmer(sc, t, cache, pose, 1.0)[1]


def anchor_delta(sc, t, cache):
    """Ancrages successifs : un point du corps (toeA, handA…) posé sur une cible monde pendant [t0, t1]
    (entrée en douceur sur `ramp`). Après t1, le décalage est figé : les pistes xw/dy décrivent alors
    le déplacement relatif (poussée, envol…)."""
    dx = dy = 0.0
    memo = sc.setdefault('_anchor_memo', {})
    for i, a in enumerate(sc['anchors']):
        if t < a['t0']:
            break
        if t > a['t1']:
            if i not in memo:
                p = _raw_parts(sc, a['t1'], cache)[a['part']]
                tx, ty = a['target'](a['t1']) if callable(a['target']) else a['target']
                memo[i] = (tx - (p[0] + dx), ty - (p[1] + dy))
            dx, dy = dx + memo[i][0], dy + memo[i][1]
            continue
        p = _raw_parts(sc, t, cache)[a['part']]
        tx, ty = a['target'](t) if callable(a['target']) else a['target']
        ramp = a.get('ramp', 0.15)
        w = ease((t - a['t0']) / ramp, 'cos') if ramp > 0 else 1.0
        if i in memo:
            del memo[i]
        return dx + w * (tx - (p[0] + dx)), dy + w * (ty - (p[1] + dy))
    return dx, dy


# ───────────────────────── scène → images ─────────────────────────
def frame_prims(sc, t, cache):
    """Retourne les primitives d'une image."""
    pose = {
        'roll': sc['roll'](t), 'bpitch': sc['bpitch'](t) + sc.get('base_pitch', 3.0), 'dy': sc['dy'](t),
        'cx': cache['cx'](t),
    }
    fade = sc['fade'](t)
    prims, parts = _swimmer(sc, t, cache, pose, fade)
    if 'anchors' in sc:
        dx, dy = anchor_delta(sc, t, cache)
        if dx or dy:
            _shift(prims, dx, dy)
    cp = cam_params(sc, t)
    if cp:
        z = cp[0]
        for k in SWIMMER_PRIMS:
            kind, v, op = prims[k]
            if kind == 'circle':
                prims[k] = (kind, _cam_xy(v[0], v[1], cp), op)
            else:
                prims[k] = (kind, [_cam_xy(x, y, cp) for x, y in v], op)
        surf_y = _cam_xy(0, SURF, cp)[1]
    else:
        surf_y = SURF
    head = prims['head'][1]

    # surface + eau
    trough = sc['trough'](t) * 9.0
    ripple_m = sc['ripple_m']
    pts = []
    for i in range(0, 21):
        x = i * 40.0
        y = surf_y + 1.3 * math.sin(2 * math.pi * (x / 100.0 + ripple_m * t / sc['T']))
        y += trough * math.exp(-((x - head[0]) / 34.0) ** 2)
        pts.append((x, y))
    prims['surface'] = ('path', pts, 1)
    prims['water'] = ('poly', pts + [(W, H), (0, H)], 1)
    prims['floor_off'] = ('scalar', cache['floor'](t), 1)
    if sc.get('coulee'):
        wx = cache['wall'](t)
        prims['wall'] = ('poly', [(wx - 60, SURF - 26), (wx, SURF - 26), (wx, H), (wx - 60, H)], fade)
    for k, (kind, v, op) in prop_shapes(sc, t, fade).items():
        if kind == 'screen_path':
            prims[k] = ('path', v, op)
        else:
            vv = [_cam_xy(x, y, cp) for x, y in v] if cp else v
            prims[k] = ('poly' if kind == 'poly' else 'ring', vv, op)
    return prims


# ───────────────────────── vitesse / sol ─────────────────────────
def sim_floor(sc):
    """Déplacement du fond (traits au sol) : propulsion bras + jambes, traînée."""
    T = sc['T']
    if sc.get('floor_speed'):
        sp = sc['floor_speed']
        return lambda t: sp * t
    dt = 1.0 / (FPS * 4)
    v = 0.0
    n = int(round(T / dt))
    hist = []
    for loop in range(4):
        x = 0.0
        hist = []
        for i in range(n + 1):
            t = i * dt
            if 'thrust' in sc:
                thrust = sc['thrust'](t)
            else:
                thrust = 70 * sc['kick'](t)
                for arm in ('A', 'B'):
                    p0, p1 = sc[arm](t), sc[arm](t + dt)
                    dp = (p1 - p0) / dt
                    if dp > 0 and 0.08 <= (p0 % 1.0) <= 0.5:
                        thrust += 520 * dp
            hist.append(x)
            v += (thrust - 1.6 * v) * dt
            x += v * dt
    total = hist[-1]
    k = max(2, round(total / DASH_PERIOD))
    scale = k * DASH_PERIOD / total if total > 0 else 0

    def f(t):
        i = min(n, max(0, int(round(t / dt))))
        return hist[i] * scale
    return f


def coulee_motion(sc):
    """Poussée au mur puis glisse (crawl 1-2) : extension, x monde, caméra."""
    cfg = sc['coulee']
    T = sc['T']
    t0, dur = cfg['push_t0'], cfg['push_dur']
    wall_x = 34.0

    def ext(t):
        if t <= t0: return 0.0
        return min(1.0, (t - t0) / dur)

    def footback(e):
        pts = leg_chain(1, 75 * (1 - e), 125 * (1 - e))
        return -TORSO / 2 - pts[-1][0]          # distance horizontale hanche→orteil (>0)

    x_start = wall_x + TORSO / 2 + footback(0.0)
    x_end = wall_x + TORSO / 2 + footback(1.0)

    def x_push(t):
        u = ext(t)
        return x_start + (x_end - x_start) * u * u   # accélération pendant l'extension

    t1 = t0 + dur
    v0 = 2 * (x_end - x_start) / dur
    dt = 1.0 / (FPS * 4)
    n = int(round(T / dt)) + 2
    xs = []
    x, v = x_push(t1), v0
    for i in range(n):
        t = i * dt
        if t <= t1:
            xs.append(x_push(t))
        else:
            xs.append(x)
            thrust = cfg['kick_thrust'] * sc['kick'](t)
            v += (thrust - cfg['drag'] * v) * dt
            x += v * dt

    def X(t):
        return xs[min(len(xs) - 1, int(round(t / dt)))]

    def cam(t):
        return max(0.0, X(t) - CX)

    end = cam(T)
    rem = math.ceil(end / DASH_PERIOD) * DASH_PERIOD - end

    def floor(t):
        extra = rem * ease((t - (T - 0.35)) / 0.35, 'cos') if t > T - 0.35 else 0.0
        return cam(t) + extra

    return {
        'ext': ext,
        'cx': lambda t: X(t) - cam(t),
        'wall': lambda t: wall_x - cam(t),
        'floor': floor,
    }


def world_motion(sc):
    """Scènes à déplacement monde (virage, départ…) : x monde du corps + caméra éventuelle.
    Le fond défile avec la caméra ; à la fin de boucle on recale sur un multiple de pointillé."""
    T = sc['T']
    cam = sc.get('cam')
    z = cam['zoom'] if cam else 1.0
    if cam and callable(cam['fx']):
        base = cam['fx'](0)
        raw = lambda t: z * (cam['fx'](t) - base)
    else:
        raw = sc.get('floor_fn') or sim_floor(sc)
    end = raw(T)
    rem = round(end / DASH_PERIOD) * DASH_PERIOD - end
    lead = 0.35

    def floor(t):
        extra = rem * ease((t - (T - lead)) / lead, 'cos') if t > T - lead else 0.0
        return raw(t) + extra
    return {'cx': sc['xw'], 'floor': floor, 'ext': lambda t: 1.0}


def prepare(sc):
    sc['T'] = round(sc['T'] * FPS) / FPS        # période = nombre entier d'images
    T = sc['T']
    for key, dv in (('roll', 0), ('bpitch', 0), ('dy', 0), ('pitch', 0), ('twist', 0),
                    ('breath', 0), ('trough', 0), ('kick', 1), ('fade', 1)):
        sc.setdefault(key, C(dv))
    sc.setdefault('A', C(0))
    sc.setdefault('B', C(0))
    sc.setdefault('modeA', lambda t: 'air')
    sc.setdefault('modeB', lambda t: 'air')
    sc['kick_f'] = sc.get('kick_hz') and max(1, round(T * sc['kick_hz'])) / T or max(1, round(T * 2.2)) / T
    sc['ripple_m'] = max(1, round(T / 1.4))
    if sc.get('coulee'):
        cache = coulee_motion(sc)
    elif 'xw' in sc:
        cache = world_motion(sc)
    else:
        cache = {'cx': lambda t: CX, 'floor': sc.get('floor_fn') or sim_floor(sc), 'ext': lambda t: 1.0}
    return cache


# ───────────────────────── export Lottie ─────────────────────────
def hex_rgba(h):
    h = h.lstrip('#')
    return [round(int(h[i:i + 2], 16) / 255, 4) for i in (0, 2, 4)] + [1]


def r1(v): return round(v, 1)


def static(v): return {'a': 0, 'k': v}


TR = {'ty': 'tr', 'p': static([0, 0]), 'a': static([0, 0]), 's': static([100, 100]), 'r': static(0),
      'o': static(100), 'sk': static(0), 'sa': static(0), 'nm': 'Transform'}

LIN_I, LIN_O = {'x': [1], 'y': [1]}, {'x': [0], 'y': [0]}


def path_val(pts, closed=False):
    z = [[0, 0] for _ in pts]
    return {'c': closed, 'v': [[r1(x), r1(y)] for x, y in pts], 'i': z, 'o': [[0, 0] for _ in pts]}


def anim(vals, times, hold=False, wrap=lambda v: v):
    """vals[i] à l'image times[i] ; compresse les valeurs identiques successives."""
    if all(v == vals[0] for v in vals):
        return {'a': 0, 'k': wrap(vals[0])}
    k = []
    last = None
    for i, (t, v) in enumerate(zip(times, vals)):
        nxt = vals[i + 1] if i + 1 < len(vals) else None
        if hold:
            if v != last:
                k.append({'t': t, 's': wrap(v), 'h': 1})
            last = v
        else:
            if v == last and nxt == v:
                continue
            k.append({'t': t, 's': wrap(v), 'i': LIN_I, 'o': LIN_O})
            last = v
    return {'a': 1, 'k': k}


def shape_layer(ind, name, items, op_frames, opacity):
    return {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'sr': 1,
            'ks': {'o': opacity, 'r': static(0), 'p': static([0, 0, 0]), 'a': static([0, 0, 0]),
                   's': static([100, 100, 100])},
            'ao': 0, 'shapes': [{'ty': 'gr', 'nm': name, 'it': items + [TR]}],
            'ip': 0, 'op': op_frames, 'st': 0, 'bm': 0}


def stroke(color, w, op=100):
    return {'ty': 'st', 'c': static(hex_rgba(color)), 'o': static(op), 'w': static(w), 'lc': 2, 'lj': 2,
            'ml': 4, 'nm': 'Stroke'}


def fill(color, op=100):
    return {'ty': 'fl', 'c': static(hex_rgba(color)), 'o': static(op), 'r': 1, 'nm': 'Fill'}


def build_lottie(sc, frames, name):
    """frames : liste (t_frame, prims) pour t_frame = 0..N (N inclus = boucle)."""
    N = frames[-1][0]
    times = [f[0] for f in frames]
    geo_idx = [i for i, f in enumerate(frames) if f[0] % KF_STEP == 0 or f[0] == N]
    gt = [times[i] for i in geo_idx]
    zoom = sc['cam']['zoom'] if sc.get('cam') else 1

    def zw(w):                                  # épaisseurs mises à l'échelle de la caméra
        return w if zoom == 1 else round(w * zoom, 2)

    def series(name, idx=None, part=1):
        ids = geo_idx if idx is None else idx
        return [frames[i][1][name][part] for i in ids]

    def opacity_of(name):
        vals = [round(frames[i][1][name][2] * 100) for i in range(len(frames))]
        return anim([[v] for v in vals], times, hold=True)

    def path_layer(name, color, width, closed=False, kind='stroke', op_static=None, halo=0):
        vals = [path_val(p, closed) for p in series(name)]
        sh = {'ty': 'sh', 'nm': 'Path', 'ks': anim(vals, gt, wrap=lambda v: [v] if False else v)}
        # les clés de forme attendent s = [path]
        if sh['ks']['a'] == 1:
            for k in sh['ks']['k']:
                k['s'] = [k['s']]
        style = stroke(color, width) if kind == 'stroke' else fill(color, op_static or 100)
        if halo:
            return [sh, style, stroke(COL['halo'], width + halo, 70)]
        return [sh, style]

    def circle_items(name, r, color, ring=False):
        vals = [[r1(x), r1(y)] for x, y in series(name)]
        el = {'ty': 'el', 'nm': 'Ellipse', 'd': 1, 'p': anim(vals, gt), 's': static([2 * r, 2 * r])}
        if el['p']['a'] == 1:
            for k in el['p']['k']:
                k['i'] = {'x': 1, 'y': 1}
                k['o'] = {'x': 0, 'y': 0}
        return [el, stroke(color, 2.5) if ring else fill(color)]

    layers = []  # du bas vers le haut

    def push(name, items, opacity):
        layers.append((name, items, opacity))

    push('bg-mist', [{'ty': 'rc', 'nm': 'Rect', 'd': 1, 'p': static([W / 2, H / 2]), 's': static([W, H]),
                      'r': static(0)}, fill(COL['bg'])], static(100))
    # sol : pointillés qui défilent (repère d'avancement)
    offs = [r1(frames[i][1]['floor_off'][1]) for i in geo_idx]
    floor_st = stroke(COL['floor'], 6)
    floor_st['lc'] = 1
    floor_st['d'] = [{'n': 'd', 'nm': 'dash', 'v': static(DASH)}, {'n': 'g', 'nm': 'gap', 'v': static(GAP)},
                     {'n': 'o', 'nm': 'offset', 'v': anim([[o] for o in offs], gt)}]
    push('floor', [{'ty': 'sh', 'nm': 'Path', 'ks': static(path_val([(-100, FLOOR_Y), (W + 100, FLOOR_Y)]))},
                   floor_st], static(100))
    p0 = frames[0][1]
    if sc.get('coulee') or 'wall' in p0:
        push('wall', path_layer('wall', COL['wall'], 0, closed=True, kind='fill'), opacity_of('wall'))
    if 'block' in p0:
        push('block', path_layer('block', COL['block'], 0, closed=True, kind='fill'), opacity_of('block'))
    for nm in ('armB_far', 'armA_far'):
        push(nm, path_layer(nm, COL['far'], zw(W_ARM)), opacity_of(nm))
    for nm in ('legB_far', 'legA_far'):
        push(nm, path_layer(nm, COL['far'], zw(W_LEG)), opacity_of(nm))
    push('hips', path_layer('hips', COL['body'], zw(W_BAR)), opacity_of('hips'))
    push('torso', path_layer('torso', COL['body'], zw(W_TORSO)), opacity_of('torso'))
    push('suit', path_layer('suit', COL['suit'], zw(W_TORSO + 1)), opacity_of('suit'))
    push('shoulders', path_layer('shoulders', COL['body'], zw(W_BAR)), opacity_of('shoulders'))
    push('neck', path_layer('neck', COL['body'], zw(14)), opacity_of('neck'))
    push('head', circle_items('head', zw(HEAD_R), COL['body']), opacity_of('head'))
    push('goggle', [{'ty': 'el', 'nm': 'Ellipse', 'd': 1,
                     'p': circle_items('goggle', 1, COL['goggle'])[0]['p'],
                     's': static([12, 8] if zoom == 1 else [round(12 * zoom, 1), round(8 * zoom, 1)])},
                    fill(COL['goggle'])], opacity_of('goggle'))
    for nm in ('legA_near', 'legB_near'):
        push(nm, path_layer(nm, COL['limb'], zw(W_LEG), halo=4), opacity_of(nm))
    for nm in ('armA_near', 'armB_near'):
        push(nm, path_layer(nm, COL['limb'], zw(W_ARM), halo=4), opacity_of(nm))
    if 'hoop' in p0:
        push('hoop', path_layer('hoop', COL['hoop'], 3, closed=True), opacity_of('hoop'))
    push('water', path_layer('water', COL['water'], 0, closed=True, kind='fill', op_static=WATER_OPACITY),
         static(100))
    push('surface', path_layer('surface', COL['surface'], 3), static(100))
    push('inspire-shaft', path_layer('inspire_shaft', COL['puff'], 3), opacity_of('inspire_shaft'))
    push('inspire-head', path_layer('inspire', COL['puff'], 3), opacity_of('inspire'))
    if 'signal1' in p0:
        for nm in ('signal1', 'signal2', 'signal_dot'):
            push(nm.replace('_', '-'), path_layer(nm, COL['puff'], 3.5), opacity_of(nm))

    out_layers = []
    for i, (lname, items, opacity) in enumerate(reversed(layers), 1):
        out_layers.append(shape_layer(i, lname, items, N, opacity))
    return {'v': '5.7.4', 'fr': FPS, 'ip': 0, 'op': N, 'w': W, 'h': H,
            'nm': name, 'ddd': 0, 'assets': [], 'layers': out_layers,
            'markers': [], 'meta': {'g': GENERATOR_TAG}}


def render_scene(sc):
    cache = prepare(sc)
    T = sc['T']
    N = int(round(T * FPS))
    shift = sc.get('shift', 0.0)        # l'image 0 montre une pose lisible (pas un fondu)
    floor_T = cache['floor'](T)
    frames = []
    for f in range(N + 1):
        tt = f / FPS + shift
        wraps = int(tt / T + 1e-9)
        t = tt - wraps * T
        pr = frame_prims(sc, t, cache)
        pr['floor_off'] = ('scalar', pr['floor_off'][1] + wraps * floor_T, 1)   # pas de saut
        frames.append((f, pr))
    return N, frames


# ───────────────────────── contrôle PNG ─────────────────────────
def draw_png(prims, scale=1, zoom=1.0):
    from PIL import Image, ImageDraw
    s = scale
    img = Image.new('RGBA', (W * s, H * s), COL['bg'])
    d = ImageDraw.Draw(img)

    def line(pts, color, w, op):
        if op <= 0: return
        w = w * zoom
        P = [(x * s, y * s) for x, y in pts]
        d.line(P, fill=color, width=max(1, int(w * s)), joint='curve')
        r = w * s / 2
        for x, y in (P[0], P[-1]):
            d.ellipse((x - r, y - r, x + r, y + r), fill=color)

    off = prims['floor_off'][1] % DASH_PERIOD
    x = -100 - off
    while x < W + 100:
        d.line([((x) * s, FLOOR_Y * s), ((x + DASH) * s, FLOOR_Y * s)], fill=COL['floor'], width=6 * s)
        x += DASH_PERIOD
    for nm, col in (('wall', COL['wall']), ('block', COL['block'])):
        if nm in prims and prims[nm][2] > 0:
            d.polygon([(a * s, b * s) for a, b in prims[nm][1]], fill=col)
    for nm in ('armB_far', 'armA_far', 'legB_far', 'legA_far'):
        line(prims[nm][1], COL['far'], W_ARM if 'arm' in nm else W_LEG, prims[nm][2])
    line(prims['hips'][1], COL['body'], W_BAR, prims['hips'][2])
    line(prims['torso'][1], COL['body'], W_TORSO, prims['torso'][2])
    line(prims['suit'][1], COL['suit'], W_TORSO + 1, prims['suit'][2])
    line(prims['shoulders'][1], COL['body'], W_BAR, prims['shoulders'][2])
    line(prims['neck'][1], COL['body'], 14, prims['neck'][2])
    hx, hy = prims['head'][1]
    hr = HEAD_R * zoom
    if prims['head'][2] > 0:
        d.ellipse(((hx - hr) * s, (hy - hr) * s, (hx + hr) * s, (hy + hr) * s), fill=COL['body'])
    if prims['goggle'][2] > 0:
        gx, gy = prims['goggle'][1]
        d.ellipse(((gx - 6 * zoom) * s, (gy - 4 * zoom) * s, (gx + 6 * zoom) * s, (gy + 4 * zoom) * s),
                  fill=COL['goggle'])
    for nm in ('legA_near', 'legB_near', 'armA_near', 'armB_near'):
        if prims[nm][2] > 0:
            wd = W_ARM if 'arm' in nm else W_LEG
            line(prims[nm][1], '#C9DDEC', wd + 4, 1)
            line(prims[nm][1], COL['limb'], wd, 1)
    if 'hoop' in prims and prims['hoop'][2] > 0:
        pts = prims['hoop'][1]
        d.line([(a * s, b * s) for a, b in pts + pts[:1]], fill=COL['hoop'], width=3 * s)
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    wc = tuple(int(COL['water'][i:i + 2], 16) for i in (1, 3, 5))
    od.polygon([(a * s, b * s) for a, b in prims['water'][1]], fill=wc + (int(255 * WATER_OPACITY / 100),))
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)
    line(prims['surface'][1], COL['surface'], 3 / zoom, 1)
    if prims['inspire'][2] > 0.05:
        line(prims['inspire_shaft'][1], COL['puff'], 3 / zoom, 1)
        line(prims['inspire'][1], COL['puff'], 3 / zoom, 1)
    for nm in ('signal1', 'signal2', 'signal_dot'):
        if nm in prims and prims[nm][2] > 0.05:
            line(prims[nm][1], COL['puff'], 3.5 / zoom, 1)
    return img


def write_scene(sc, out_dir, fn, png_dir=None):
    """Rend une scène, écrit le JSON, renvoie l'entrée d'index."""
    N, frames = render_scene(sc)
    data = build_lottie(sc, frames, fn[:-5])
    with open(os.path.join(out_dir, fn), 'w') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
    print('%-40s %3d frames  %.2fs  %6.1f kB' % (fn, N, N / FPS, os.path.getsize(os.path.join(out_dir, fn)) / 1024))
    if png_dir:
        from PIL import Image
        zoom = sc['cam']['zoom'] if sc.get('cam') else 1.0
        picks = [int(N * k / 12) for k in range(12)]
        tiles = [draw_png(frames[i][1], zoom=zoom).convert('RGB').resize((400, 200)) for i in picks]
        sheet = Image.new('RGB', (1200, 800), 'white')
        for j, im in enumerate(tiles):
            sheet.paste(im, ((j % 3) * 400, (j // 3) * 200))
        sheet.save(os.path.join(png_dir, 'sheet-%s.png' % fn[:-5]))
    return N, frames
