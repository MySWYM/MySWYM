/**
 * Sticker story transparent : distance prévue, ou distance et allure
 * d'une nage Strava du même jour. Pas de durée inventée.
 * Le PNG n'a pas de fond, pour être collé sur une photo Instagram.
 */

const FONT = "Geist, ui-sans-serif, system-ui, sans-serif";

export function parseDistanceMeters(distance) {
  if (typeof distance === "number" && Number.isFinite(distance) && distance > 0) {
    return Math.round(distance);
  }
  const raw = String(distance || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(",", ".");
  const km = raw.match(/^(\d+(?:\.\d+)?)km$/);
  if (km) return Math.round(parseFloat(km[1]) * 1000);
  const meters = raw.match(/^(\d+(?:\.\d+)?)m$/);
  if (meters) return Math.round(parseFloat(meters[1]));
  const plain = raw.match(/^(\d+)$/);
  if (plain) return parseInt(plain[1], 10);
  return null;
}

export function formatStoryDistance(distance) {
  const meters = parseDistanceMeters(distance);
  if (meters == null) {
    const text = String(distance || "").trim();
    return text || null;
  }
  return `${meters.toLocaleString("fr-FR")} m`;
}

const SWIM_TYPES = new Set(["Swim", "OpenWaterSwim"]);

export function formatPaceSeconds(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n < 40 || n > 300) return null;
  const total = Math.round(n);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")} /100 m`;
}

function parseInstant(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const t = Date.parse(text);
  return Number.isFinite(t) ? t : null;
}

function localDayKey(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function activityStartMs(activity) {
  const raw = activity?.raw_data || {};
  return parseInstant(raw.start_date_local) || parseInstant(raw.start_date) || null;
}

export function activityPaceSeconds(activity) {
  const stored = Number(activity?.pace);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const dist = Number(activity?.distance);
  const time = Number(activity?.duration);
  if (!dist || !time) return null;
  return Math.round((time / dist) * 100);
}

/** Instant de la séance : validation, sinon maintenant. */
export function sessionShareInstant(session, now = new Date()) {
  return (
    parseInstant(session?.completedAt)
    || parseInstant(session?.completed_at)
    || parseInstant(session?.feedback?.at)
    || now.getTime()
  );
}

/**
 * Nage Strava du même jour, la plus proche de l'heure de la séance.
 * @param {object[]} activities
 */
export function matchStravaSwim(activities, session, now = new Date()) {
  const at = sessionShareInstant(session, now);
  const day = localDayKey(at);
  const candidates = (activities || []).filter((activity) => {
    if (!SWIM_TYPES.has(activity?.activity_type)) return false;
    const start = activityStartMs(activity);
    if (start == null || localDayKey(start) !== day) return false;
    const meters = Number(activity.distance);
    return Number.isFinite(meters) && meters >= 100;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => Math.abs(activityStartMs(a) - at) - Math.abs(activityStartMs(b) - at));
  return candidates[0];
}

export function storyStickerLines(session, activity = null) {
  if (activity) {
    const distance = formatStoryDistance(activity.distance);
    const pace = formatPaceSeconds(activityPaceSeconds(activity));
    return [
      distance ? { label: "Distance", value: distance } : null,
      pace ? { label: "Allure", value: pace } : null,
    ].filter(Boolean);
  }
  const distance = formatStoryDistance(session?.distance);
  return distance ? [{ label: "Distance", value: distance }] : [];
}

export function createStoryStickerCanvas(session, activity = null) {
  if (typeof document === "undefined") return null;
  const lines = storyStickerLines(session, activity);
  if (!lines.length) return null;

  const W = 900;
  const top = 48;
  const brandH = 40;
  const labelH = 28;
  const valueH = 76;
  const blockGap = 22;
  const H = top + brandH + 16 + lines.length * (labelH + 8 + valueH) + Math.max(0, lines.length - 1) * blockGap + 48;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText("MySWYM", W / 2, top);

  let y = top + brandH + 16;
  for (const line of lines) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(line.label, W / 2, y);
    y += labelH + 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 64px ${FONT}`;
    ctx.fillText(line.value, W / 2, y);
    y += valueH + blockGap;
  }
  return canvas;
}

function downloadPng(dataUrl) {
  const link = document.createElement("a");
  link.download = "myswym-story.png";
  link.href = dataUrl;
  link.click();
  return "saved";
}

async function copyWithClipboard(canvas) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") return null;
  const item = new ClipboardItem({
    "image/png": new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png"))), "image/png");
    }),
  });
  await navigator.clipboard.write([item]);
  return "copied";
}

/**
 * @returns {Promise<"copied" | "saved">}
 */
export async function copyStoryStickerPng(canvas) {
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  try {
    const { isNativeIos } = await import("./native-platform.js");
    if (isNativeIos()) {
      const { registerPlugin } = await import("@capacitor/core");
      const StorySticker = registerPlugin("StorySticker");
      await StorySticker.copyPng({ base64 });
      return "copied";
    }
  } catch {
    /* presse-papiers web, ou téléchargement */
  }
  try {
    const copied = await copyWithClipboard(canvas);
    if (copied) return copied;
  } catch {
    /* téléchargement */
  }
  return downloadPng(dataUrl);
}
