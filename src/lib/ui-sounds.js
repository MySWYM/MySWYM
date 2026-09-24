/**
 * Clics UI type touche (court, mat, peu de hauteur).
 * Synthèse Web Audio, pas d’asset externe. Muteable + prefers-reduced-motion.
 * iOS : pas de mute in-app, le bouton sonnerie / vibreur coupe (AVAudioSession ambient).
 */

import { isNativeIos } from "./native-platform.js";

const STORAGE_KEY = "myswym_ui_sounds";

let audioCtx = null;
let unlocked = false;
let noiseBuf = null;

function prefersReducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  } catch {
    return false;
  }
}

export function getUiSoundsEnabled() {
  if (isNativeIos()) return true;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return true;
    return v !== "0" && v !== "false";
  } catch {
    return true;
  }
}

export function setUiSoundsEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch { /* ignore */ }
}

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

function getNoise(ctx) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const n = Math.floor(ctx.sampleRate * 0.05);
  noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** Débloque l’AudioContext au premier geste (iOS). */
export function unlockUiSounds() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  unlocked = true;
}

/** Bruit filtré, le « clic » de touche. */
function noiseClick(ctx, {
  start = 0,
  dur = 0.018,
  gain = 0.016,
  freq = 1900,
  q = 1.8,
} = {}) {
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  const g = ctx.createGain();
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(hp);
  hp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.008);
}

/** Micro tick aigu, presque inaudible seul. */
function tick(ctx, {
  start = 0,
  freq = 2400,
  dur = 0.011,
  gain = 0.007,
} = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime + start;
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.006);
}

/**
 * @param {"tap"|"nav"|"success"|"soft"} kind
 */
export function playUiSound(kind = "tap") {
  if (!getUiSoundsEnabled() || prefersReducedMotion()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (!unlocked) unlocked = true;

  try {
    if (kind === "nav") {
      noiseClick(ctx, { dur: 0.016, gain: 0.013, freq: 1450, q: 1.4 });
      return;
    }
    if (kind === "success") {
      noiseClick(ctx, { dur: 0.016, gain: 0.014, freq: 2100, q: 1.6 });
      tick(ctx, { start: 0.016, freq: 2650, dur: 0.014, gain: 0.008 });
      return;
    }
    if (kind === "soft") {
      noiseClick(ctx, { dur: 0.014, gain: 0.01, freq: 1200, q: 1.2 });
      return;
    }
    noiseClick(ctx, { dur: 0.018, gain: 0.016, freq: 1900, q: 1.8 });
    tick(ctx, { freq: 2550, dur: 0.01, gain: 0.006 });
  } catch { /* ignore */ }
}
