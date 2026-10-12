/**
 * Lottie soft mist par étape école (70 scènes).
 * Silhouettes design (pas le moteur pédagogique Python perdu) :
 * famille par nage + variante par étape, fond mist, eau, surface.
 *
 * Usage: node scripts/generate-school-step-lotties.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public", "school-motion");
const STORE = join(ROOT, "store", "school-motion");
const W = 800;
const H = 400;
const FR = 30;
const OP = 90; // 3 s

const COL = {
  mist: [0.957, 0.976, 0.992, 1],
  water: [0.549, 0.784, 0.925, 1],
  surface: [0.435, 0.698, 0.871, 1],
  near: [0.122, 0.369, 0.573, 1], // #1F5E92
  far: [0.612, 0.769, 0.886, 1], // #9CC4E2
  body: [0.29, 0.565, 0.769, 1], // #4A90C4
  goggle: [0.9, 0.95, 1, 1],
  breath: [0.18, 0.651, 0.867, 1], // #2EA6DD
  wall: [0.788, 0.867, 0.925, 1],
  block: [0.788, 0.867, 0.925, 1],
};

/** @type {Record<string, string>} */
const FILES = {
  ANC1: "step-01-coulee.json",
  ANC2: "step-02-kick.json",
  ANC3: "step-03-inspire-devant.json",
  ANC4: "step-04-vrille-dos.json",
  ANC5: "step-05-deux-bras.json",
  ANC6: "step-06-un-bras-puis-autre.json",
  ANC7: "step-07-retour-sous-eau.json",
  ANC8: "step-08-retour-aerien.json",
  ANC9: "step-09-cycle-vrille-dos.json",
  ANC10: "step-10-dos-bras-opposes.json",
  ANC11: "step-11-rattrape-vrille-dos.json",
  ANC12: "step-12-rattrape-avant-cote.json",
  ANC13: "step-13-rattrape-arriere-cote.json",
  ANC14: "step-14-rattrape-avant-3-temps.json",
  ANC15: "step-15-rattrape-arriere-3-temps.json",
  ANC16: "step-16-opposition-arret.json",
  ANC17: "step-17-crawl-3-temps.json",
  ANC18: "step-18-cycles.json",
  DOS1: "dos-01-cote.json",
  DOS2: "dos-02-tete-immobile.json",
  DOS3: "dos-03-gainage.json",
  DOS4: "dos-04-battement.json",
  DOS5: "dos-05-deux-bras.json",
  DOS6: "dos-06-costal.json",
  DOS7: "dos-07-echange.json",
  DOS8: "dos-08-vers-complete.json",
  DOS9: "dos-09-prise-eau.json",
  DOS10: "dos-10-sync.json",
  DOS11: "dos-11-respiration.json",
  DOS12: "dos-12-qui-tient.json",
  AVC1: "virage-01-deux-mains-dos.json",
  AVC2: "virage-02-une-main-ventre.json",
  AVC3: "virage-03-un-bras-air.json",
  AVC4: "virage-04-coulee-reprise.json",
  AVC5: "virage-05-roulade.json",
  AVC6: "virage-06-crawl-roulade.json",
  AVC7: "virage-07-pieds-au-mur.json",
  AVC8: "virage-08-crawl-pieds.json",
  AVC9: "virage-09-poussee-dos.json",
  AVC10: "virage-10-virage-complet.json",
  ADC1: "depart-01-chute.json",
  ADC2: "depart-02-desequilibre.json",
  ADC3: "depart-03-bras.json",
  ADC4: "depart-04-cerceau.json",
  ADC5: "depart-05-depart-reprise.json",
  ADC6: "depart-06-agrippe.json",
  ADC7: "depart-07-tete-relevee.json",
  ADC8: "depart-08-pieds-decales.json",
  ADC9: "depart-09-cerceau-reprise.json",
  ADC10: "depart-10-signal.json",
  PAP1: "pap-01-deux-attitudes.json",
  PAP2: "pap-02-canard.json",
  PAP3: "pap-03-bras-planche.json",
  PAP4: "pap-04-un-bras.json",
  PAP5: "pap-05-apnee.json",
  PAP6: "pap-06-entree.json",
  PAP7: "pap-07-retour.json",
  PAP8: "pap-08-tete-bras.json",
  PAP9: "pap-09-inspirer.json",
  PAP10: "pap-10-qui-tient.json",
  BRA1: "brasse-01-ciseau.json",
  BRA2: "brasse-02-fouette.json",
  BRA3: "brasse-03-prisonnier.json",
  BRA4: "brasse-04-deux-attitudes.json",
  BRA5: "brasse-05-bonnet.json",
  BRA6: "brasse-06-relance.json",
  BRA7: "brasse-07-prise-eau.json",
  BRA8: "brasse-08-corps-plat.json",
  BRA9: "brasse-09-inspirer.json",
  BRA10: "brasse-10-sans-trou.json",
};

function color(c) {
  return { a: 0, k: c };
}

function solid(c, o = 100) {
  return { ty: "fl", c: color(c), o: { a: 0, k: o }, r: 1 };
}

function ellipse(rx, ry) {
  return { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [rx * 2, ry * 2] } };
}

function rect(w, h, r = 8) {
  return { ty: "rc", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: r } };
}

function rotKF(frames) {
  return {
    a: 1,
    k: frames.map((f, i) => ({
      t: f.t,
      s: [f.v],
      e: [frames[Math.min(i + 1, frames.length - 1)].v],
      i: { x: [0.5], y: [1] },
      o: { x: [0.5], y: [0] },
    })),
  };
}

function posKF(frames) {
  return {
    a: 1,
    k: frames.map((f, i) => {
      const next = frames[Math.min(i + 1, frames.length - 1)];
      return {
        t: f.t,
        s: f.v,
        e: next.v,
        i: { x: 0.5, y: 1 },
        o: { x: 0.5, y: 0 },
      };
    }),
  };
}

function layer(ind, name, shapes, { p = [0, 0], r = 0, parent, rAnim, pAnim, o = 100 } = {}) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: o },
      r: rAnim || { a: 0, k: r },
      p: pAnim || { a: 0, k: [...p, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ...(parent != null ? { parent } : {}),
  };
}

function group(name, items) {
  return {
    ty: "gr",
    nm: name,
    it: [
      ...items,
      {
        ty: "tr",
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
      },
    ],
  };
}

function makeDoc(name, layers) {
  return { v: "5.7.0", fr: FR, ip: 0, op: OP, w: W, h: H, nm: name, ddd: 0, assets: [], layers };
}

function bgLayers() {
  return [
    layer(1, "bg-mist", [group("bg", [rect(W, H, 0), solid(COL.mist)])], { p: [400, 200] }),
    layer(2, "water", [group("w", [rect(W, 220, 0), solid(COL.water, 30)])], { p: [400, 290] }),
    layer(3, "surface", [group("s", [rect(W, 4, 0), solid(COL.surface, 70)])], { p: [400, 180] }),
  ];
}

function breathCue(on = true) {
  if (!on) return [];
  return [
    layer(20, "inspire-shaft", [group("b", [ellipse(4, 18), solid(COL.breath, 80)])], {
      p: [505, 160],
      pAnim: posKF([
        { t: 0, v: [505, 175, 0] },
        { t: 30, v: [505, 145, 0] },
        { t: 60, v: [505, 175, 0] },
        { t: 90, v: [505, 175, 0] },
      ]),
      o: 70,
    }),
  ];
}

function shiftRot(frames, deg) {
  return frames.map((f) => ({ t: f.t, v: f.v + deg }));
}

function crawlScene(variant) {
  const kickAmp = variant.kick ? 22 : 6;
  const armAmp = variant.arms === "none" ? 0 : variant.arms === "sync" ? 55 : 70;
  const phase = variant.phase || 0;
  const slow = variant.slow ? 1.15 : 1;
  const headY = variant.breathFront ? [198, 188, 198, 205] : [198, 194, 198, 202];
  const roll = variant.roll || 0;

  const armNearFrames = shiftRot(
    [
      { t: 0, v: -35 },
      { t: 22, v: 50 },
      { t: 45, v: 120 },
      { t: 68, v: -10 },
      { t: 90, v: -35 },
    ].map((f) => ({ t: Math.round(f.t * slow), v: f.v * (armAmp ? armAmp / 70 : 0) })),
    phase,
  );
  const armFarFrames = shiftRot(
    [
      { t: 0, v: 120 },
      { t: 22, v: -10 },
      { t: 45, v: -35 },
      { t: 68, v: 50 },
      { t: 90, v: 120 },
    ].map((f) => ({ t: Math.round(f.t * slow), v: f.v * (armAmp ? armAmp / 70 : 0) })),
    variant.arms === "sync" ? phase : phase + 45,
  );

  const layers = [
    ...bgLayers(),
    ...(variant.wallLeft
      ? [layer(4, "wall", [group("w", [rect(22, 260, 4), solid(COL.wall)])], { p: [70, 200] })]
      : []),
    layer(10, "torso", [group("t", [ellipse(70, 22), solid(COL.body)])], {
      p: [400, 210],
      r: roll,
      pAnim: variant.glide
        ? posKF([
            { t: 0, v: [280, 210, 0] },
            { t: 70, v: [520, 210, 0] },
            { t: 80, v: [520, 210, 0] },
            { t: 90, v: [280, 210, 0] },
          ])
        : undefined,
    }),
    layer(
      11,
      "head",
      [group("h", [ellipse(18, 16), solid(COL.near)]), group("g", [ellipse(6, 5), solid(COL.goggle)])],
      {
        p: [490, headY[0]],
        parent: 10,
        pAnim: posKF([
          { t: 0, v: [90, headY[0] - 210, 0] },
          { t: 22, v: [92, headY[1] - 210, 0] },
          { t: 45, v: [90, headY[2] - 210, 0] },
          { t: 68, v: [88, headY[3] - 210, 0] },
          { t: 90, v: [90, headY[0] - 210, 0] },
        ]),
      },
    ),
    layer(12, "arm-near", [group("a", [ellipse(55, 9), solid(COL.near)])], {
      p: [0, -10],
      parent: 10,
      rAnim: rotKF(armNearFrames),
    }),
    layer(13, "arm-far", [group("a", [ellipse(55, 8), solid(COL.far)])], {
      p: [0, 5],
      parent: 10,
      rAnim: rotKF(armFarFrames),
    }),
    layer(14, "leg-near", [group("l", [ellipse(48, 8), solid(COL.near)])], {
      p: [-80, 10],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: kickAmp },
        { t: 22, v: -kickAmp },
        { t: 45, v: kickAmp },
        { t: 68, v: -kickAmp },
        { t: 90, v: kickAmp },
      ]),
    }),
    layer(15, "leg-far", [group("l", [ellipse(48, 7), solid(COL.far)])], {
      p: [-80, 18],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: -kickAmp },
        { t: 22, v: kickAmp },
        { t: 45, v: -kickAmp },
        { t: 68, v: kickAmp },
        { t: 90, v: -kickAmp },
      ]),
    }),
    ...breathCue(Boolean(variant.breath)),
  ];
  return makeDoc(variant.nm || "crawl-step", layers);
}

function dosScene(variant) {
  const kick = variant.kick ? 14 : 4;
  const armSpan = variant.arms === "none" ? 0 : variant.arms === "sync" ? 90 : 90;
  const side = variant.side ? 25 : 0;
  const layers = [
    ...bgLayers(),
    layer(10, "torso", [group("t", [ellipse(70, 20), solid(COL.body)])], {
      p: [400, 200],
      r: side,
    }),
    layer(
      11,
      "head",
      [group("h", [ellipse(17, 15), solid(COL.near)]), group("g", [ellipse(5, 4), solid(COL.goggle)])],
      { p: [90, -12], parent: 10 },
    ),
    layer(12, "arm-near", [group("a", [ellipse(58, 9), solid(COL.near)])], {
      p: [0, -5],
      parent: 10,
      rAnim: rotKF(
        variant.arms === "none"
          ? [
              { t: 0, v: 0 },
              { t: 90, v: 0 },
            ]
          : [
              { t: 0, v: -armSpan },
              { t: 30, v: 0 },
              { t: 60, v: armSpan },
              { t: 90, v: -armSpan },
            ],
      ),
    }),
    layer(13, "arm-far", [group("a", [ellipse(58, 8), solid(COL.far)])], {
      p: [0, 5],
      parent: 10,
      rAnim: rotKF(
        variant.arms === "sync"
          ? [
              { t: 0, v: -armSpan },
              { t: 30, v: 0 },
              { t: 60, v: armSpan },
              { t: 90, v: -armSpan },
            ]
          : [
              { t: 0, v: armSpan },
              { t: 30, v: -armSpan },
              { t: 60, v: 0 },
              { t: 90, v: armSpan },
            ],
      ),
    }),
    layer(14, "kick", [group("l", [ellipse(50, 7), solid(COL.near)])], {
      p: [-90, 10],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: kick },
        { t: 22, v: -kick },
        { t: 45, v: kick },
        { t: 68, v: -kick },
        { t: 90, v: kick },
      ]),
    }),
    ...breathCue(Boolean(variant.breath)),
  ];
  return makeDoc(variant.nm || "dos-step", layers);
}

function virageScene(variant) {
  const layers = [
    ...bgLayers(),
    layer(4, "wall", [group("w", [rect(22, 280, 4), solid(COL.wall)])], { p: [720, 200] }),
    layer(10, "torso", [group("t", [ellipse(55, 20), solid(COL.body)])], {
      p: [420, 210],
      rAnim: rotKF([
        { t: 0, v: 0 },
        { t: 25, v: 120 },
        { t: 50, v: 240 },
        { t: 75, v: 360 },
        { t: 90, v: 360 },
      ]),
      pAnim: posKF([
        { t: 0, v: [380, 210, 0] },
        { t: 40, v: [560, 220, 0] },
        { t: 70, v: [620, 230, 0] },
        { t: 90, v: [500, 210, 0] },
      ]),
    }),
    layer(11, "head", [group("h", [ellipse(16, 14), solid(COL.near)])], {
      p: [50, -10],
      parent: 10,
    }),
    layer(12, "legs", [group("l", [ellipse(45, 9), solid(COL.near)])], {
      p: [-45, 8],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: 10 },
        { t: 40, v: 80 },
        { t: 70, v: 20 },
        { t: 90, v: 10 },
      ]),
    }),
  ];
  if (variant.push) {
    layers.push(
      layer(13, "push-cue", [group("p", [ellipse(8, 8), solid(COL.breath, 60)])], {
        p: [680, 240],
        o: 50,
      }),
    );
  }
  return makeDoc(variant.nm || "virage-step", layers);
}

function departScene(variant) {
  const plotY = variant.plot ? 150 : 140;
  const layers = [
    ...bgLayers(),
    layer(4, "block", [group("b", [rect(variant.plot ? 100 : 90, 40, 6), solid(COL.block)])], {
      p: [160, plotY],
    }),
    layer(10, "torso", [group("t", [ellipse(60, 18), solid(COL.body)])], {
      rAnim: rotKF([
        { t: 0, v: variant.grab ? -55 : -40 },
        { t: 25, v: 5 },
        { t: 50, v: 35 },
        { t: 75, v: 45 },
        { t: 90, v: 45 },
      ]),
      pAnim: posKF([
        { t: 0, v: [220, plotY - 20, 0] },
        { t: 25, v: [340, 170, 0] },
        { t: 50, v: [480, 220, 0] },
        { t: 75, v: [580, 250, 0] },
        { t: 90, v: [620, 260, 0] },
      ]),
    }),
    layer(11, "arms", [group("a", [ellipse(50, 8), solid(COL.near)])], {
      p: [0, -8],
      parent: 10,
      r: variant.armsUp ? -35 : -15,
    }),
    layer(12, "head", [group("h", [ellipse(15, 13), solid(COL.near)])], {
      p: [55, -6],
      parent: 10,
    }),
  ];
  if (variant.hoop) {
    layers.push(
      layer(5, "hoop", [group("h", [ellipse(55, 28), solid(COL.breath, 35)])], {
        p: [420, 230],
      }),
    );
  }
  if (variant.signal) {
    layers.push(
      layer(21, "signal", [group("s", [ellipse(14, 14), solid(COL.breath)])], {
        p: [80, 60],
        pAnim: posKF([
          { t: 0, v: [80, 60, 0] },
          { t: 10, v: [80, 50, 0] },
          { t: 20, v: [80, 60, 0] },
          { t: 90, v: [80, 60, 0] },
        ]),
      }),
    );
  }
  return makeDoc(variant.nm || "depart-step", layers);
}

function papScene(variant) {
  const und = variant.undulate ? 22 : 10;
  const arm = variant.oneArm ? 45 : 70;
  const layers = [
    ...bgLayers(),
    layer(10, "torso", [group("t", [ellipse(65, 20), solid(COL.body)])], {
      p: [400, 210],
      pAnim: posKF([
        { t: 0, v: [400, 205, 0] },
        { t: 22, v: [400, 205 + und, 0] },
        { t: 45, v: [400, 205 - und / 2, 0] },
        { t: 68, v: [400, 205 + und, 0] },
        { t: 90, v: [400, 205, 0] },
      ]),
    }),
    layer(11, "head", [group("h", [ellipse(17, 15), solid(COL.near)])], {
      p: [80, -10],
      parent: 10,
    }),
    layer(12, "arms-sync", [group("a", [ellipse(60, 10), solid(COL.near)])], {
      p: [0, -10],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: -arm },
        { t: 30, v: 40 },
        { t: 55, v: 100 },
        { t: 90, v: -arm },
      ]),
    }),
    ...(variant.oneArm
      ? [
          layer(13, "arm-front", [group("a", [ellipse(40, 8), solid(COL.far)])], {
            p: [40, -5],
            parent: 10,
            r: -20,
          }),
        ]
      : []),
    layer(14, "dolphin", [group("l", [ellipse(55, 9), solid(COL.near)])], {
      p: [-80, 12],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: 25 },
        { t: 22, v: -20 },
        { t: 45, v: 25 },
        { t: 68, v: -20 },
        { t: 90, v: 25 },
      ]),
    }),
    ...breathCue(Boolean(variant.breath)),
  ];
  return makeDoc(variant.nm || "pap-step", layers);
}

function brasseScene(variant) {
  const legAmp = variant.kickOnly ? 40 : 28;
  const armAmp = variant.kickOnly || variant.prisoner ? 0 : 50;
  const layers = [
    ...bgLayers(),
    layer(10, "torso", [group("t", [ellipse(65, 22), solid(COL.body)])], {
      p: [400, 210],
      pAnim: variant.flat
        ? posKF([
            { t: 0, v: [400, 208, 0] },
            { t: 30, v: [400, 218, 0] },
            { t: 60, v: [400, 205, 0] },
            { t: 90, v: [400, 208, 0] },
          ])
        : undefined,
    }),
    layer(11, "head", [group("h", [ellipse(17, 15), solid(COL.near)])], {
      p: [75, -10],
      parent: 10,
      pAnim: posKF([
        { t: 0, v: [75, -5, 0] },
        { t: 30, v: [75, variant.breath ? -22 : -8, 0] },
        { t: 55, v: [75, -5, 0] },
        { t: 90, v: [75, -5, 0] },
      ]),
    }),
    layer(12, "arms", [group("a", [ellipse(50, 9), solid(COL.near)])], {
      p: [20, -5],
      parent: 10,
      rAnim: rotKF(
        armAmp
          ? [
              { t: 0, v: 20 },
              { t: 25, v: -armAmp },
              { t: 50, v: 55 },
              { t: 90, v: 20 },
            ]
          : [
              { t: 0, v: variant.prisoner ? 160 : 0 },
              { t: 90, v: variant.prisoner ? 160 : 0 },
            ],
      ),
    }),
    layer(13, "ciseau", [group("l", [ellipse(48, 10), solid(COL.near)])], {
      p: [-80, 15],
      parent: 10,
      rAnim: rotKF([
        { t: 0, v: 0 },
        { t: 22, v: legAmp },
        { t: 45, v: -8 },
        { t: 65, v: 0 },
        { t: 90, v: 0 },
      ]),
    }),
    ...breathCue(Boolean(variant.breath)),
  ];
  return makeDoc(variant.nm || "brasse-step", layers);
}

/** Variantes pédagogiques légères par stepId */
const VARIANTS = {
  ANC1: { nm: "step-01", wallLeft: true, glide: true, arms: "none", kick: false },
  ANC2: { nm: "step-02", wallLeft: true, glide: true, arms: "none", kick: true },
  ANC3: { nm: "step-03", arms: "none", kick: true, breathFront: true, breath: true },
  ANC4: { nm: "step-04", arms: "none", kick: true, roll: 160, breath: true },
  ANC5: { nm: "step-05", arms: "sync", kick: true, breathFront: true, breath: true },
  ANC6: { nm: "step-06", arms: "alt", kick: true, breathFront: true, breath: true },
  ANC7: { nm: "step-07", arms: "alt", kick: true, phase: 10 },
  ANC8: { nm: "step-08", arms: "alt", kick: true, phase: -15 },
  ANC9: { nm: "step-09", arms: "alt", kick: true, roll: 90, breath: true },
  ANC10: { nm: "step-10", arms: "alt", kick: true, roll: 150, breath: true },
  ANC11: { nm: "step-11", arms: "alt", kick: true, roll: 140, breath: true },
  ANC12: { nm: "step-12", arms: "alt", kick: true, breath: true },
  ANC13: { nm: "step-13", arms: "alt", kick: true, breath: true, phase: 20 },
  ANC14: { nm: "step-14", arms: "alt", kick: true, breath: true, slow: true },
  ANC15: { nm: "step-15", arms: "alt", kick: true, breath: true, slow: true, phase: 15 },
  ANC16: { nm: "step-16", arms: "alt", kick: true, breath: true },
  ANC17: { nm: "step-17", arms: "alt", kick: true, breath: true },
  ANC18: { nm: "step-18", arms: "alt", kick: true, breath: true, slow: true },

  DOS1: { nm: "dos-01", side: true, arms: "none", kick: true },
  DOS2: { nm: "dos-02", arms: "alt", kick: true },
  DOS3: { nm: "dos-03", arms: "none", kick: true },
  DOS4: { nm: "dos-04", arms: "none", kick: true },
  DOS5: { nm: "dos-05", arms: "sync", kick: true, breath: true },
  DOS6: { nm: "dos-06", side: true, arms: "none", kick: true },
  DOS7: { nm: "dos-07", arms: "sync", kick: true },
  DOS8: { nm: "dos-08", arms: "alt", kick: true },
  DOS9: { nm: "dos-09", arms: "alt", kick: true },
  DOS10: { nm: "dos-10", arms: "alt", kick: true },
  DOS11: { nm: "dos-11", arms: "alt", kick: true, breath: true },
  DOS12: { nm: "dos-12", arms: "alt", kick: true },

  AVC1: { nm: "virage-01" },
  AVC2: { nm: "virage-02" },
  AVC3: { nm: "virage-03" },
  AVC4: { nm: "virage-04", push: true },
  AVC5: { nm: "virage-05" },
  AVC6: { nm: "virage-06" },
  AVC7: { nm: "virage-07", push: true },
  AVC8: { nm: "virage-08", push: true },
  AVC9: { nm: "virage-09", push: true },
  AVC10: { nm: "virage-10", push: true },

  ADC1: { nm: "depart-01" },
  ADC2: { nm: "depart-02" },
  ADC3: { nm: "depart-03", armsUp: true },
  ADC4: { nm: "depart-04", hoop: true },
  ADC5: { nm: "depart-05", plot: true },
  ADC6: { nm: "depart-06", plot: true, grab: true },
  ADC7: { nm: "depart-07", plot: true, grab: true },
  ADC8: { nm: "depart-08", plot: true },
  ADC9: { nm: "depart-09", plot: true, hoop: true },
  ADC10: { nm: "depart-10", plot: true, signal: true },

  PAP1: { nm: "pap-01", undulate: true },
  PAP2: { nm: "pap-02", undulate: true },
  PAP3: { nm: "pap-03", undulate: false },
  PAP4: { nm: "pap-04", undulate: true, oneArm: true },
  PAP5: { nm: "pap-05", undulate: true },
  PAP6: { nm: "pap-06", undulate: true },
  PAP7: { nm: "pap-07", undulate: true },
  PAP8: { nm: "pap-08", undulate: true },
  PAP9: { nm: "pap-09", undulate: true, breath: true },
  PAP10: { nm: "pap-10", undulate: true, breath: true },

  BRA1: { nm: "brasse-01", kickOnly: true },
  BRA2: { nm: "brasse-02", kickOnly: true },
  BRA3: { nm: "brasse-03", prisoner: true, breath: true },
  BRA4: { nm: "brasse-04", flat: true, breath: true },
  BRA5: { nm: "brasse-05", breath: true },
  BRA6: { nm: "brasse-06" },
  BRA7: { nm: "brasse-07" },
  BRA8: { nm: "brasse-08", flat: true },
  BRA9: { nm: "brasse-09", breath: true },
  BRA10: { nm: "brasse-10", breath: true },
};

function build(stepId) {
  const v = VARIANTS[stepId] || { nm: stepId };
  if (stepId.startsWith("ANC")) return crawlScene(v);
  if (stepId.startsWith("DOS")) return dosScene(v);
  if (stepId.startsWith("AVC")) return virageScene(v);
  if (stepId.startsWith("ADC")) return departScene(v);
  if (stepId.startsWith("PAP")) return papScene(v);
  if (stepId.startsWith("BRA")) return brasseScene(v);
  throw new Error(`unknown step ${stepId}`);
}

mkdirSync(PUBLIC, { recursive: true });
mkdirSync(STORE, { recursive: true });

let n = 0;
for (const [stepId, file] of Object.entries(FILES)) {
  const json = JSON.stringify(build(stepId));
  const pub = join(PUBLIC, file);
  const store = join(STORE, file);
  writeFileSync(pub, json);
  copyFileSync(pub, store);
  n += 1;
  console.log("wrote", file, json.length);
}
console.log("done", n, "scenes → public/ + store/");
