"""Constructeurs de cycles réutilisés par plusieurs cours (papillon, brasse, virage, départ)."""
import math

from motion_core import F, ease


def cyc(keys, Tc, offset=0.0):
    """Piste périodique : keys = [(q, v[, ease])] avec q ∈ [0, 1], répétée tous les Tc secondes."""
    ks = [(k[0], k[1], k[2] if len(k) > 2 else 'cos') for k in keys]

    def f(t):
        q = ((t - offset) / Tc) % 1.0
        for i in range(len(ks) - 1):
            q0, v0, e = ks[i]
            q1, v1, _ = ks[i + 1]
            if q <= q1:
                return v0 if q1 <= q0 else v0 + (v1 - v0) * ease((q - q0) / (q1 - q0), e)
        return ks[-1][1]
    return f


def cycle_index(t, Tc, offset=0.0):
    return int(math.floor((t - offset) / Tc + 1e-9))


def per_cycle(Tc, on_cycles, keys, n_cycles, offset=0.0):
    """Piste active seulement pour certains cycles (ex. inspiration 1 cycle sur 2)."""
    base = cyc(keys, Tc, offset)
    return lambda t: base(t) if (cycle_index(t, Tc, offset) % n_cycles) in on_cycles else 0.0


# ───────────── brasse ─────────────
# Jambes : (flexion hanche, flexion genou, rotation talons dehors, angle du pied)
BREAST_LEGS = [
    (0.00, (0, 0, 0, 8)),
    (0.35, (0, 0, 0, 8)),
    (0.58, (45, 115, 10, 78)),     # regroupement : talons vers les fesses, genoux pas plus larges que les hanches
    (0.64, (42, 110, 30, 88)),     # placement : pieds en flexion, tournés dehors
    (0.80, (2, 6, 0, 30)),         # fouetté vers l'intérieur et le fond, pieds « en prière »
    (0.86, (0, 0, 0, 8)),          # relâchés, tendus
    (1.00, (0, 0, 0, 8)),
]


def breast_tracks(Tc, timing=None, legs=None, flat=1.0, head_up=30, breath_cycles=None, n_cycles=1,
                  arms=True, kick=True, legs_keys=None):
    """Brasse : bras (mode 'breast'), ciseau, deux attitudes, inspiration à la relance."""
    tm = dict(out=(0.0, 0.30), ins=(0.30, 0.45), shoot=(0.45, 0.58))
    tm.update(timing or {})
    a0, a1 = tm['out']; b0, b1 = tm['ins']; c0, c1 = tm['shoot']
    p_keys = [(0, 0.0), (a0, 0.0), (a1, 0.42, 'out'), (b1, 0.68, 'in'), (c1, 1.0, 'out'), (1.0, 1.0)]
    if not arms:
        p_keys = [(0, 0.0), (1.0, 0.0)]
    pc = cyc(p_keys, Tc)
    lk = legs_keys or BREAST_LEGS
    comps = [cyc([(q, v[i]) for q, v in lk], Tc) for i in range(4)]
    if not kick:
        comps = [lambda t: 0, lambda t: 0, lambda t: 0, lambda t: 8]

    def legs_f(t):
        v = tuple(c(t) for c in comps)
        return v, v

    up = (b0 + 0.06, c0 + 0.04)            # redressement : fin de rentrée des mains + relance
    sc = dict(A=F(pc), B=F(pc), modeA=lambda t: 'breast', modeB=lambda t: 'breast', legs=F(legs_f),
              pitch=F(cyc([(0, 0), (up[0] - 0.08, 0), (up[0], head_up), (up[1], head_up), (c1 + 0.04, 0), (1, 0)], Tc)),
              bpitch=F(cyc([(0, -2 * flat), (up[0] - 0.1, 0), (up[0], 7 * flat), (up[1], 7 * flat),
                            (c1 + 0.1, -3 * flat), (1, -2 * flat)], Tc)),
              dy=F(cyc([(0, 0), (up[0] - 0.1, 0), (up[0], 4), (up[1], 4), (c1 + 0.1, -2 * flat), (1, 0)], Tc)),
              kick=lambda t: 0)
    br = [(0, 0), (up[0] - 0.01, 0), (up[0] + 0.03, 1), (up[1] - 0.02, 1), (up[1] + 0.03, 0), (1, 0)]
    if breath_cycles is None:
        sc['breath'] = F(cyc(br, Tc))
    else:
        sc['breath'] = F(per_cycle(Tc, breath_cycles, br, n_cycles))

    def thrust(t):
        q = (t / Tc) % 1.0
        th = 0.0
        if arms and b0 <= q <= b1: th += 420
        if kick and 0.64 <= q <= 0.80: th += 520
        return th
    sc['thrust'] = thrust
    return sc


# ───────────── papillon ─────────────
FLY_LEGS = [   # (flexion hanche, flexion genou) — deux battements : à l'entrée et en fin de poussée
    (0.00, (4, 28)),
    (0.12, (16, 0)),
    (0.30, (4, 16)),
    (0.48, (6, 30)),
    (0.60, (16, 0)),
    (0.80, (4, 10)),
    (1.00, (4, 28)),
]


def fly_tracks(Tc, hold=0.2, pull_end=0.6, breath_cycles=(0,), n_cycles=1, one_arm=False, head_down=-20,
               head_up=26, att1=-10, att2=10, kick=True, release=0.0, arm_mode='fly'):
    """Papillon : entrée, première attitude (bascule, fesses hautes), traction, deuxième attitude
    (redressement, inspiration à la sortie des coudes), retour bras tendus juste au-dessus de l'eau."""
    rec0 = pull_end + release
    p_keys = [(0, 0.0), (hold, 0.05), (pull_end, 0.5), (rec0, 0.5), (1.0, 1.0)]
    pc = cyc(p_keys, Tc)
    a = cyc([(q, v[0]) for q, v in FLY_LEGS], Tc)
    k = cyc([(q, v[1]) for q, v in FLY_LEGS], Tc)

    def legs_f(t):
        v = (a(t), k(t)) if kick else (0, 0)
        return v, v

    sc = dict(A=F(pc), modeA=lambda t: arm_mode, legs=F(legs_f), kick=lambda t: 0,
              bpitch=F(cyc([(0, att1 * 0.6), (0.12, att1), (hold + 0.05, att1), (pull_end - 0.08, att2),
                            (rec0 + 0.08, att2), (0.92, 0), (1, att1 * 0.6)], Tc)),
              dy=F(cyc([(0, -2), (0.15, -5), (pull_end - 0.05, 4), (rec0 + 0.1, 3), (1, -2)], Tc)),
              pitch=F(cyc([(0, head_down), (0.2, head_down), (pull_end - 0.12, 0), (pull_end - 0.02, head_up),
                           (rec0 + 0.14, head_up), (0.94, 0), (1, head_down)], Tc)))
    if one_arm:
        sc['armB'] = lambda t: ((50, -3, 2), (112, -6, 0))
    else:
        sc.update(B=F(pc), modeB=lambda t: arm_mode)
    br = [(0, 0), (pull_end - 0.02, 0), (pull_end + 0.02, 1), (rec0 + 0.12, 1), (rec0 + 0.16, 0), (1, 0)]
    sc['breath'] = F(per_cycle(Tc, breath_cycles, br, n_cycles)) if breath_cycles is not None else (lambda t: 0)

    def thrust(t):
        q = (t / Tc) % 1.0
        th = 0.0
        if hold <= q <= pull_end: th += 380 if one_arm else 520
        if kick and (0.02 <= q <= 0.12 or 0.5 <= q <= 0.6): th += 260
        return th
    sc['thrust'] = thrust
    return sc
