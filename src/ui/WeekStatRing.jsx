/**
 * Anneau mètres de la semaine, DA dark (pas les tokens prototype conversion).
 */
export default function WeekStatRing({
  value = 0,
  max = 0,
  size = 88,
  stroke = 7,
  color = "#006bfd",
  track = "rgba(0, 107, 253, 0.18)",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const offset = c * (1 - pct);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#f4f8fa", fontFamily: "Space Grotesk, ui-sans-serif, sans-serif",
      }}>
        {max > 0 ? `${Math.round(pct * 100)}%` : "-"}
      </div>
    </div>
  );
}
