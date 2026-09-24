/**
 * Export séance → fichier Garmin FIT (workout piscine).
 * Lecture via buildWorkoutView uniquement. Pas d’allure inventée.
 */
import { buildWorkoutView, parseAllurePaceRange } from "./workout-display.js";

const FIT_EPOCH = 631065600;
const NAME_SIZE = 24;
const WKT_NAME_SIZE = 32;

const INTENSITY = {
  active: 0,
  rest: 1,
  warmup: 2,
  cooldown: 3,
};

const SECTION_INTENSITY = {
  warm: "warmup",
  main: "active",
  cool: "cooldown",
};

function isDevEnv() {
  try {
    return Boolean(import.meta.env && import.meta.env.DEV);
  } catch {
    return false;
  }
}

function asDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  return new Date();
}

/** 25 ou 50. Jamais 0. */
export function poolLengthFromProfile(profile) {
  return Number(profile?.pool) === 50 ? 50 : 25;
}

export function watchExportFilename(now = new Date()) {
  const d = asDate(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `myswym-seance-${y}${m}${day}.fit`;
}

function stepName(ex) {
  const vol = ex?.volumeLabel || (ex?.meters ? `${ex.meters} m` : "");
  const stroke = ex?.strokeLabel || "";
  const raw = [vol, stroke].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return (raw || "Nage").slice(0, NAME_SIZE - 1);
}

function paceFromExercise(ex) {
  if (!ex?.allurePaceLow || !ex?.allurePaceHigh) return null;
  const parsed = parseAllurePaceRange(`@${ex.allurePaceLow}-${ex.allurePaceHigh}`);
  if (!parsed?.lowSeconds || !parsed?.highSeconds) return null;
  return {
    lowSeconds: parsed.lowSeconds,
    highSeconds: parsed.highSeconds,
  };
}

function workoutName(view, session) {
  const title = view?.header?.title || session?.title || "Séance MySWYM";
  return String(title).replace(/\s+/g, " ").trim().slice(0, WKT_NAME_SIZE - 1) || "Séance MySWYM";
}

function logSkipped(skipped) {
  if (!skipped?.length || !isDevEnv()) return;
  for (const row of skipped) {
    // eslint-disable-next-line no-console
    console.warn("[watch-export] skip", row.id || row.raw || "ex", row.reason);
  }
}

/**
 * 1 exercice UI = 1 step distance (+ 1 step repos si restSeconds connu).
 * @param {object} session
 * @param {{ profile?: object, view?: object }} [opts]
 */
export function buildWatchSteps(session, opts = {}) {
  const view = opts.view || buildWorkoutView(session || {});
  const pool = poolLengthFromProfile(opts.profile);
  const steps = [];
  const skipped = [];

  for (const section of view.sections || []) {
    const intensity = SECTION_INTENSITY[section.id] || "active";
    for (const ex of section.exercises || []) {
      const meters = Number(ex?.meters) || 0;
      if (!(meters > 0)) {
        skipped.push({
          id: ex?.id || null,
          raw: ex?.raw || ex?.main || null,
          reason: "no_meters",
        });
        continue;
      }
      const pace = paceFromExercise(ex);
      steps.push({
        kind: "distance",
        meters,
        intensity,
        name: stepName(ex),
        paceLowSeconds: pace?.lowSeconds ?? null,
        paceHighSeconds: pace?.highSeconds ?? null,
        sourceId: ex.id || null,
      });
      const rest = Number(ex.restSeconds);
      if (Number.isFinite(rest) && rest > 0) {
        steps.push({
          kind: "rest",
          seconds: Math.round(rest),
          intensity: "rest",
          name: "Repos",
          sourceId: ex.id || null,
        });
      }
    }
  }

  return {
    steps,
    skipped,
    pool,
    name: workoutName(view, session),
    view,
  };
}

export function exportedDistanceMeters(steps = []) {
  return (steps || [])
    .filter((s) => s?.kind === "distance")
    .reduce((sum, s) => sum + (Number(s.meters) || 0), 0);
}

const CRC_TABLE = new Uint16Array([
  0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
  0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
]);

export function fitCrc16(bytes, crc = 0, start = 0, end = bytes.length) {
  let c = crc;
  for (let i = start; i < end; i += 1) {
    const byte = bytes[i];
    let tmp = CRC_TABLE[c & 0xF];
    c = (c >> 4) & 0x0FFF;
    c = c ^ tmp ^ CRC_TABLE[byte & 0xF];
    tmp = CRC_TABLE[c & 0xF];
    c = (c >> 4) & 0x0FFF;
    c = c ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xF];
  }
  return c;
}

class FitWriter {
  constructor() {
    this.chunks = [];
  }

  u8(n) {
    this.chunks.push(n & 0xFF);
  }

  u16(n) {
    const v = n & 0xFFFF;
    this.u8(v);
    this.u8(v >> 8);
  }

  u32(n) {
    const v = n >>> 0;
    this.u8(v);
    this.u8(v >> 8);
    this.u8(v >> 16);
    this.u8(v >> 24);
  }

  paddedString(text, size) {
    const enc = new TextEncoder().encode(String(text || ""));
    const out = new Uint8Array(size);
    const n = Math.min(enc.length, size - 1);
    out.set(enc.subarray(0, n));
    for (let i = 0; i < size; i += 1) this.u8(out[i]);
  }

  definition(local, global, fields) {
    this.u8(0x40 | (local & 0x0F));
    this.u8(0);
    this.u8(0);
    this.u16(global);
    this.u8(fields.length);
    for (const field of fields) {
      this.u8(field.num);
      this.u8(field.size);
      this.u8(field.base);
    }
  }

  data(local) {
    this.u8(local & 0x0F);
  }

  toUint8Array() {
    return Uint8Array.from(this.chunks);
  }
}

function paceToMmPerSec(paceSecPer100) {
  const sec = Number(paceSecPer100);
  if (!(sec > 0)) return null;
  return Math.round((100 / sec) * 1000);
}

/**
 * Workout FIT piscine (file_id + workout + workout_step).
 * @param {{ steps: object[], name?: string, pool?: number, now?: Date }} payload
 */
export function encodeGarminFitWorkout(payload = {}) {
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  const pool = Number(payload.pool) === 50 ? 50 : 25;
  const now = asDate(payload.now);
  const body = new FitWriter();

  body.definition(0, 0, [
    { num: 0, size: 1, base: 0x00 },
    { num: 1, size: 2, base: 0x84 },
    { num: 4, size: 4, base: 0x86 },
  ]);
  body.data(0);
  body.u8(5);
  body.u16(255);
  body.u32(Math.floor(now.getTime() / 1000) - FIT_EPOCH);

  body.definition(1, 26, [
    { num: 4, size: 1, base: 0x00 },
    { num: 6, size: 2, base: 0x84 },
    { num: 8, size: WKT_NAME_SIZE, base: 0x07 },
    { num: 11, size: 1, base: 0x00 },
    { num: 14, size: 2, base: 0x84 },
    { num: 15, size: 1, base: 0x00 },
  ]);
  body.data(1);
  body.u8(5);
  body.u16(steps.length);
  body.paddedString(payload.name || "Séance MySWYM", WKT_NAME_SIZE);
  body.u8(17);
  body.u16(pool * 100);
  body.u8(0);

  body.definition(2, 27, [
    { num: 254, size: 2, base: 0x84 },
    { num: 0, size: NAME_SIZE, base: 0x07 },
    { num: 1, size: 1, base: 0x00 },
    { num: 2, size: 4, base: 0x86 },
    { num: 3, size: 1, base: 0x00 },
    { num: 4, size: 4, base: 0x86 },
    { num: 5, size: 4, base: 0x86 },
    { num: 6, size: 4, base: 0x86 },
    { num: 7, size: 1, base: 0x00 },
  ]);

  steps.forEach((step, index) => {
    body.data(2);
    body.u16(index);
    const label = step?.name || (step?.kind === "rest" ? "Repos" : "Nage");
    body.paddedString(label, NAME_SIZE);
    if (step?.kind === "rest") {
      body.u8(0);
      body.u32(Math.max(0, Math.round(Number(step.seconds) || 0)) * 1000);
      body.u8(2);
      body.u32(0xFFFFFFFF);
      body.u32(0xFFFFFFFF);
      body.u32(0xFFFFFFFF);
      body.u8(INTENSITY.rest);
      return;
    }
    body.u8(1);
    body.u32(Math.max(0, Math.round(Number(step.meters) || 0)) * 100);
    const fast = paceToMmPerSec(Math.min(step.paceLowSeconds || 0, step.paceHighSeconds || 0));
    const slow = paceToMmPerSec(Math.max(step.paceLowSeconds || 0, step.paceHighSeconds || 0));
    if (fast && slow) {
      body.u8(0);
      body.u32(0);
      body.u32(Math.min(slow, fast));
      body.u32(Math.max(slow, fast));
    } else {
      body.u8(2);
      body.u32(0xFFFFFFFF);
      body.u32(0xFFFFFFFF);
      body.u32(0xFFFFFFFF);
    }
    body.u8(INTENSITY[step.intensity] ?? INTENSITY.active);
  });

  const data = body.toUint8Array();
  const header = new Uint8Array(14);
  header[0] = 14;
  header[1] = 0x10;
  header[2] = 0x2E;
  header[3] = 0x08;
  header[4] = data.length & 0xFF;
  header[5] = (data.length >> 8) & 0xFF;
  header[6] = (data.length >> 16) & 0xFF;
  header[7] = (data.length >> 24) & 0xFF;
  header[8] = 0x2E;
  header[9] = 0x46;
  header[10] = 0x49;
  header[11] = 0x54;
  const headerCrc = fitCrc16(header, 0, 0, 12);
  header[12] = headerCrc & 0xFF;
  header[13] = (headerCrc >> 8) & 0xFF;

  const file = new Uint8Array(14 + data.length + 2);
  file.set(header, 0);
  file.set(data, 14);
  const fileCrc = fitCrc16(file, 0, 0, file.length - 2);
  file[file.length - 2] = fileCrc & 0xFF;
  file[file.length - 1] = (fileCrc >> 8) & 0xFF;
  return file;
}

export function isValidFitFile(bytes) {
  if (!bytes || bytes.length < 16) return false;
  if (bytes[8] !== 0x2E || bytes[9] !== 0x46 || bytes[10] !== 0x49 || bytes[11] !== 0x54) {
    return false;
  }
  const headerSize = bytes[0];
  if (headerSize === 14) {
    const headerCrc = bytes[12] | (bytes[13] << 8);
    if (fitCrc16(bytes, 0, 0, 12) !== headerCrc) return false;
  }
  const fileCrc = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
  return fitCrc16(bytes, 0, 0, bytes.length - 2) === fileCrc;
}

/**
 * @param {object} session
 * @param {{ profile?: object, now?: Date }} [opts]
 */
export function buildWatchExport(session, opts = {}) {
  const built = buildWatchSteps(session, opts);
  logSkipped(built.skipped);
  const bytes = encodeGarminFitWorkout({
    steps: built.steps,
    name: built.name,
    pool: built.pool,
    now: opts.now,
  });
  return {
    steps: built.steps,
    skipped: built.skipped,
    pool: built.pool,
    name: built.name,
    bytes,
    filename: watchExportFilename(opts.now),
    format: "fit",
  };
}

function triggerBrowserDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
  }, 2000);
}

/**
 * Télécharge le FIT. Share sheet mobile si l’API navigateur l’accepte.
 * @returns {Promise<{ ok: boolean, reason?: string, filename?: string, shared?: boolean, format?: string }>}
 */
export async function downloadWatchExport(session, opts = {}) {
  if (opts.isPremium === false) {
    return { ok: false, reason: "locked", format: "fit" };
  }
  const file = buildWatchExport(session, opts);
  if (!exportedDistanceMeters(file.steps) || !file.bytes?.byteLength) {
    return { ok: false, reason: "empty", format: "fit" };
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: true, filename: file.filename, shared: false, format: "fit", downloaded: false };
  }

  let shared = false;
  try {
    const nativeFile = new File([file.bytes], file.filename, {
      type: "application/octet-stream",
    });
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    if (mobile && navigator.canShare?.({ files: [nativeFile] })) {
      await navigator.share({
        files: [nativeFile],
        title: "Séance MySWYM",
        text: "Garmin Connect : Entraînements, puis Importer.",
      });
      shared = true;
    }
  } catch (err) {
    shared = false;
    if (err && err.name === "AbortError") {
      /* l’utilisateur a fermé la feuille : on tombe sur le téléchargement */
    }
  }
  if (!shared) triggerBrowserDownload(file.bytes, file.filename);
  return { ok: true, filename: file.filename, shared, format: "fit" };
}
