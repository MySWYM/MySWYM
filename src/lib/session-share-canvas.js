/**
 * Canvas fiche partage séance (1080×1080) — design MySWYM.
 * @param {object} session
 * @param {string} [goalLabel]
 * @param {{ label?: string, color?: string } | null} [badge]
 */
export function createShareCanvas(session, goalLabel, badge = null) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const roundRect = (x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  // Fond
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#06101F");
  bg.addColorStop(0.55, "#0A1A33");
  bg.addColorStop(1, "#0033A0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Halo
  const glow = ctx.createRadialGradient(860, 180, 40, 860, 180, 420);
  glow.addColorStop(0, "rgba(0, 87, 253, 0.45)");
  glow.addColorStop(1, "rgba(0, 87, 253, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Anneaux discrets
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#8EB3FF";
  ctx.lineWidth = 2;
  [160, 260, 360].forEach((r) => {
    ctx.beginPath();
    ctx.arc(920, 140, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  // Brand
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 36px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("MySWYM", 72, 110);

  // Pill terminée
  roundRect(72, 150, 280, 56, 28);
  ctx.fillStyle = "#00C48C";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 24px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Séance terminée", 98, 187);

  if (badge?.label) {
    const badgeColor = badge.color || "#FFB800";
    roundRect(370, 150, Math.min(520, 40 + badge.label.length * 18), 56, 28);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 2;
    roundRect(370, 150, Math.min(520, 40 + badge.label.length * 18), 56, 28);
    ctx.stroke();
    ctx.fillStyle = badgeColor;
    ctx.font = "700 22px Geist, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`★ ${badge.label}`, 394, 186);
  }

  const typeColors = {
    ENDURANCE: "#4080FF",
    SEUIL: "#FF8A3D",
    VITESSE: "#FF4757",
    TECHNIQUE: "#00B4D8",
    RÉCUPÉRATION: "#00C48C",
  };
  const type = session?.type || "";
  ctx.fillStyle = typeColors[type] || "#8EB3FF";
  ctx.font = "600 28px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(String(type).toUpperCase(), 72, 280);

  // Titre wrap
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 64px Geist, ui-sans-serif, system-ui, sans-serif";
  const words = String(session?.title || "Séance").split(/\s+/);
  let line = "";
  let y = 370;
  const maxW = 936;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), 72, y);
      line = `${word} `;
      y += 78;
      if (y > 530) break;
    } else {
      line = test;
    }
  }
  if (line && y <= 530) ctx.fillText(line.trim(), 72, y);

  // Stats
  const stats = [
    { label: "Distance", value: String(session?.distance || "—") },
    {
      label: "Durée",
      value: typeof session?.duration === "number" ? `${session.duration} min` : String(session?.duration || "—"),
    },
    { label: "Intensité", value: String(session?.intensity || "—") },
  ];
  stats.forEach((s, i) => {
    const x = 72 + i * 320;
    roundRect(x, 620, 300, 150, 24);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "500 22px Geist, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(s.label, x + 24, 668);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 40px Geist, ui-sans-serif, system-ui, sans-serif";
    const val = s.value.length > 12 ? `${s.value.slice(0, 11)}…` : s.value;
    ctx.fillText(val, x + 24, 730);
  });

  if (goalLabel) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "500 26px Geist, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`Objectif · ${goalLabel}`, 72, 860);
  }

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = "500 24px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("myswym.app", 72, 980);

  return canvas;
}
