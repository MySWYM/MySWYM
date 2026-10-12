/**
 * DEPRECATED pour l’app : Accueil utilise les photos `school-hero-*.webp`.
 * Les 70 scènes exercice = `scripts/generate-school-step-lotties.mjs`.
 * Ne pas réécrire les JSON d’étapes avec ce script.
 *
 * Ancien usage cards Accueil (1 geste / cours), soft mist, 2 s @ 30 fps.
 * Usage: node scripts/generate-school-card-lotties.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "school-motion");
const W = 800;
const H = 400;
const FR = 30;
const OP = 60; // 2 s

const COL = {
  mist: [0.957, 0.976, 0.992, 1], // #F4F9FD
  water: [0.49, 0.72, 0.96, 0.35],
  near: [0.043, 0.31, 0.54, 1], // bleu foncé
  far: [0.49, 0.72, 0.96, 0.85],
  head: [0.043, 0.31, 0.54, 1],
  goggle: [0.9, 0.95, 1, 1],
};

function color(c) {
  return { a: 0, k: c };
}

function solid(c) {
  return { ty: "fl", c: color(c), o: { a: 0, k: 100 }, r: 1 };
}

function stroke(c, w = 10) {
  return { ty: "st", c: color(c), o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 2 };
}

function ellipse(rx, ry) {
  return {
    ty: "el",
    p: { a: 0, k: [0, 0] },
    s: { a: 0, k: [rx * 2, ry * 2] },
  };
}

function rect(w, h, r = 8) {
  return {
    ty: "rc",
    p: { a: 0, k: [0, 0] },
    s: { a: 0, k: [w, h] },
    r: { a: 0, k: r },
  };
}

/** Keyframed rotation degrees → Lottie r */
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

function layer(ind, name, shapes, { p = [0, 0], r = 0, parent = undefined, rAnim = null, pAnim = null } = {}) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
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
  return { ty: "gr", nm: name, it: [...items, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] };
}

/** Cards Accueil : pas de fond (le photo school-hero reste visible). */
function makeDoc(name, layers) {
  return {
    v: "5.7.0",
    fr: FR,
    ip: 0,
    op: OP,
    w: W,
    h: H,
    nm: name,
    ddd: 0,
    assets: [],
    layers,
  };
}

/** Crawl : ventre, tête à droite, bras alternés, battement */
function crawl() {
  const body = layer(10, "torso", [group("t", [ellipse(70, 22), solid(COL.near)])], { p: [400, 210] });
  const head = layer(11, "head", [
    group("h", [ellipse(18, 16), solid(COL.head)]),
    group("g", [ellipse(6, 5), solid(COL.goggle)]),
  ], {
    p: [490, 198],
    pAnim: posKF([
      { t: 0, v: [490, 198, 0] },
      { t: 15, v: [492, 194, 0] },
      { t: 30, v: [490, 198, 0] },
      { t: 45, v: [488, 202, 0] },
      { t: 60, v: [490, 198, 0] },
    ]),
  });
  const armNear = layer(12, "arm-near", [group("a", [ellipse(55, 9), solid(COL.near)])], {
    p: [400, 200],
    rAnim: rotKF([
      { t: 0, v: -35 },
      { t: 15, v: 50 },
      { t: 30, v: 120 },
      { t: 45, v: -10 },
      { t: 60, v: -35 },
    ]),
  });
  const armFar = layer(13, "arm-far", [group("a", [ellipse(55, 8), solid(COL.far)])], {
    p: [400, 215],
    rAnim: rotKF([
      { t: 0, v: 120 },
      { t: 15, v: -10 },
      { t: 30, v: -35 },
      { t: 45, v: 50 },
      { t: 60, v: 120 },
    ]),
  });
  const legNear = layer(14, "leg-near", [group("l", [ellipse(48, 8), solid(COL.near)])], {
    p: [320, 220],
    rAnim: rotKF([
      { t: 0, v: 18 },
      { t: 15, v: -22 },
      { t: 30, v: 18 },
      { t: 45, v: -22 },
      { t: 60, v: 18 },
    ]),
  });
  const legFar = layer(15, "leg-far", [group("l", [ellipse(48, 7), solid(COL.far)])], {
    p: [320, 228],
    rAnim: rotKF([
      { t: 0, v: -22 },
      { t: 15, v: 18 },
      { t: 30, v: -22 },
      { t: 45, v: 18 },
      { t: 60, v: -22 },
    ]),
  });
  return makeDoc("card-crawl", [body, head, armFar, armNear, legFar, legNear]);
}

/** Dos : sur le dos, tête à droite, bras en arcs opposés */
function dos() {
  const body = layer(10, "torso", [group("t", [ellipse(70, 20), solid(COL.near)])], { p: [400, 200] });
  const head = layer(11, "head", [
    group("h", [ellipse(17, 15), solid(COL.head)]),
    group("g", [ellipse(5, 4), solid(COL.goggle)]),
  ], { p: [490, 188] });
  const armNear = layer(12, "arm-near", [group("a", [ellipse(58, 9), solid(COL.near)])], {
    p: [400, 195],
    rAnim: rotKF([
      { t: 0, v: -90 },
      { t: 20, v: 0 },
      { t: 40, v: 90 },
      { t: 60, v: -90 },
    ]),
  });
  const armFar = layer(13, "arm-far", [group("a", [ellipse(58, 8), solid(COL.far)])], {
    p: [400, 205],
    rAnim: rotKF([
      { t: 0, v: 90 },
      { t: 20, v: -90 },
      { t: 40, v: 0 },
      { t: 60, v: 90 },
    ]),
  });
  const kick = layer(14, "kick", [group("l", [ellipse(50, 7), solid(COL.near)])], {
    p: [310, 210],
    rAnim: rotKF([
      { t: 0, v: 12 },
      { t: 15, v: -14 },
      { t: 30, v: 12 },
      { t: 45, v: -14 },
      { t: 60, v: 12 },
    ]),
  });
  return makeDoc("card-dos", [body, head, armFar, armNear, kick]);
}

/** Virage : roulade (corps qui tourne) */
function virage() {
  const body = layer(10, "torso", [group("t", [ellipse(55, 20), solid(COL.near)])], {
    p: [420, 210],
    rAnim: rotKF([
      { t: 0, v: 0 },
      { t: 20, v: 120 },
      { t: 40, v: 240 },
      { t: 60, v: 360 },
    ]),
  });
  const head = layer(11, "head", [group("h", [ellipse(16, 14), solid(COL.head)])], {
    p: [470, 200],
    parent: 10,
  });
  const wall = layer(9, "wall", [group("w", [rect(18, 220, 4), solid([0.7, 0.82, 0.92, 1])])], {
    p: [720, 200],
  });
  return makeDoc("card-virage", [wall, body, head]);
}

/** Départ : chute / plongeon vers la droite */
function depart() {
  const block = layer(9, "block", [group("b", [rect(90, 40, 6), solid([0.75, 0.85, 0.95, 1])])], {
    p: [160, 160],
  });
  const body = layer(10, "torso", [group("t", [ellipse(60, 18), solid(COL.near)])], {
    p: [220, 140],
    rAnim: rotKF([
      { t: 0, v: -40 },
      { t: 20, v: 10 },
      { t: 40, v: 35 },
      { t: 60, v: 45 },
    ]),
    pAnim: posKF([
      { t: 0, v: [220, 140, 0] },
      { t: 20, v: [340, 170, 0] },
      { t: 40, v: [480, 220, 0] },
      { t: 60, v: [580, 250, 0] },
    ]),
  });
  const arms = layer(11, "arms", [group("a", [ellipse(50, 8), solid(COL.near)])], {
    p: [0, -8],
    parent: 10,
    r: -20,
  });
  return makeDoc("card-depart", [block, body, arms]);
}

/** Papillon : deux bras sync + ondulation */
function pap() {
  const body = layer(10, "torso", [group("t", [ellipse(65, 20), solid(COL.near)])], {
    p: [400, 210],
    pAnim: posKF([
      { t: 0, v: [400, 205, 0] },
      { t: 15, v: [400, 225, 0] },
      { t: 30, v: [400, 200, 0] },
      { t: 45, v: [400, 220, 0] },
      { t: 60, v: [400, 205, 0] },
    ]),
  });
  const head = layer(11, "head", [group("h", [ellipse(17, 15), solid(COL.head)])], {
    p: [480, 200],
    parent: 10,
  });
  const arms = layer(12, "arms-sync", [group("a", [ellipse(60, 10), solid(COL.near)])], {
    p: [400, 200],
    rAnim: rotKF([
      { t: 0, v: -50 },
      { t: 20, v: 40 },
      { t: 40, v: 100 },
      { t: 60, v: -50 },
    ]),
  });
  const legs = layer(13, "dolphin", [group("l", [ellipse(55, 9), solid(COL.near)])], {
    p: [320, 220],
    rAnim: rotKF([
      { t: 0, v: 25 },
      { t: 15, v: -20 },
      { t: 30, v: 25 },
      { t: 45, v: -20 },
      { t: 60, v: 25 },
    ]),
  });
  return makeDoc("card-pap", [body, head, arms, legs]);
}

/** Brasse : bras + ciseau jambes */
function brasse() {
  const body = layer(10, "torso", [group("t", [ellipse(65, 22), solid(COL.near)])], { p: [400, 210] });
  const head = layer(11, "head", [group("h", [ellipse(17, 15), solid(COL.head)])], {
    p: [475, 200],
    pAnim: posKF([
      { t: 0, v: [475, 205, 0] },
      { t: 20, v: [475, 190, 0] },
      { t: 40, v: [475, 205, 0] },
      { t: 60, v: [475, 205, 0] },
    ]),
  });
  const arms = layer(12, "arms", [group("a", [ellipse(50, 9), solid(COL.near)])], {
    p: [420, 205],
    rAnim: rotKF([
      { t: 0, v: 20 },
      { t: 20, v: -40 },
      { t: 40, v: 60 },
      { t: 60, v: 20 },
    ]),
  });
  const legs = layer(13, "ciseau", [group("l", [ellipse(48, 10), solid(COL.near)])], {
    p: [320, 225],
    rAnim: rotKF([
      { t: 0, v: 0 },
      { t: 15, v: 35 },
      { t: 30, v: -5 },
      { t: 45, v: 0 },
      { t: 60, v: 0 },
    ]),
  });
  return makeDoc("card-brasse", [body, head, arms, legs]);
}

const FILES = {
  "card-crawl.json": crawl,
  "card-dos.json": dos,
  "card-virage.json": virage,
  "card-depart.json": depart,
  "card-pap.json": pap,
  "card-brasse.json": brasse,
};

mkdirSync(OUT, { recursive: true });
console.warn("Deprecated: Accueil = photos. Étapes = generate-school-step-lotties.mjs");
for (const [file, fn] of Object.entries(FILES)) {
  const json = JSON.stringify(fn());
  writeFileSync(join(OUT, file), json);
  console.log("wrote", file, json.length, "bytes");
}
console.log("done", Object.keys(FILES).length);
