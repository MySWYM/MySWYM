/**
 * Sticker story transparent : distance, durée, allure, logo.
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

export function durationMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) return duration;
  const text = String(duration || "").trim();
  const hours = text.match(/(\d+)\s*h(?:\s*(\d+))?/i);
  if (hours) return parseInt(hours[1], 10) * 60 + (hours[2] ? parseInt(hours[2], 10) : 0);
  const mins = text.match(/(\d+)\s*min/i);
  if (mins) return parseInt(mins[1], 10);
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

export function formatStoryDuration(duration) {
  const mins = durationMinutes(duration);
  if (mins == null) {
    const text = String(duration || "").trim();
    return text || null;
  }
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

export function formatStoryPace(session) {
  const meters = parseDistanceMeters(session?.distance);
  const mins = durationMinutes(session?.duration);
  if (meters == null || meters < 100 || mins == null) return null;
  const secPer100 = (mins * 60) / (meters / 100);
  if (secPer100 < 40 || secPer100 > 300) return null;
  const total = Math.round(secPer100);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")} /100 m`;
}

export function storyStickerLines(session) {
  const distance = formatStoryDistance(session?.distance);
  const duration = formatStoryDuration(session?.duration);
  const pace = formatStoryPace(session);
  return [
    distance ? { label: "Distance", value: distance } : null,
    duration ? { label: "Durée", value: duration } : null,
    pace ? { label: "Allure", value: pace } : null,
  ].filter(Boolean);
}

export function createStoryStickerCanvas(session) {
  if (typeof document === "undefined") return null;
  const lines = storyStickerLines(session);
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
