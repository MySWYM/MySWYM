/**
 * Graphes SVG pour l’admin — pas de librairie, pas de nouvelle fonction Vercel.
 */

const FONT = "Space Grotesk, ui-sans-serif, system-ui, sans-serif";
const INK = "#0c1a2e";
const MUTED = "#5a6a7a";
const BLUE = "#154388";
const GREEN = "#1f7a4c";
const WARM = "#c45c26";

export function FunnelChart({
  steps = [],
  caption,
}) {
  const max = Math.max(1, ...steps.map((s) => Number(s.value) || 0));
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d8dee6",
        borderRadius: 16,
        padding: 18,
        minHeight: 220,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>
        Entonnoir
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => {
          const v = Number(s.value) || 0;
          const w = Math.max(8, Math.round((v / max) * 100));
          const prev = i === 0 ? null : Number(steps[i - 1].value) || 0;
          const conv = prev ? Math.round((v / prev) * 100) : null;
          return (
            <div key={s.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: MUTED,
                  marginBottom: 4,
                }}
              >
                <span>
                  {s.label}
                  {conv != null ? `  ·  ${conv} % de l’étape d’avant` : ""}
                </span>
                <strong style={{ color: INK }}>{v}</strong>
              </div>
              <div
                style={{
                  height: 22,
                  background: "#eef2f7",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${w}%`,
                    height: "100%",
                    background: i === steps.length - 1 ? GREEN : BLUE,
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {caption ? (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.4 }}>
          {caption}
        </p>
      ) : null}
    </div>
  );
}

export function BarChart({ title, rows = [], empty = "Pas encore de données." }) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((r) => Number(r.value) || 0));
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d8dee6",
        borderRadius: 16,
        padding: 18,
        minHeight: 220,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>
        {title}
      </div>
      {top.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{empty}</p>
      ) : (
        <svg
          viewBox={`0 0 360 ${top.length * 36}`}
          role="img"
          aria-label={title}
          style={{ width: "100%", height: top.length * 36 }}
        >
          {top.map((r, i) => {
            const v = Number(r.value) || 0;
            const w = Math.max(4, (v / max) * 210);
            const y = i * 36;
            return (
              <g key={`${r.label}-${i}`}>
                <text x="0" y={y + 22} fontSize="11" fill={MUTED} fontFamily={FONT}>
                  {String(r.label).slice(0, 18)}
                </text>
                <rect x="120" y={y + 12} width={w} height="12" rx="6" fill={BLUE} />
                <text
                  x={128 + w}
                  y={y + 22}
                  fontSize="11"
                  fill={INK}
                  fontFamily={FONT}
                  fontWeight="700"
                >
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export function DonutChart({ title, slices = [], caption }) {
  const total = slices.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  const colors = [WARM, "#c9a227", "#6b7c8f", BLUE];
  let acc = 0;
  const segs = slices.map((s, i) => {
    const v = Number(s.value) || 0;
    const start = acc / total;
    acc += v;
    return { ...s, start, end: acc / total, color: colors[i % colors.length] };
  });
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d8dee6",
        borderRadius: 16,
        padding: 18,
        minHeight: 220,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={title}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="#eef2f7" strokeWidth="16" />
          {segs.map((s) => {
            const len = Math.max(0, (s.end - s.start) * C);
            return (
              <circle
                key={s.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-s.start * C}
                transform="rotate(-90 60 60)"
              />
            );
          })}
          <text
            x="60"
            y="64"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill={INK}
            fontFamily={FONT}
          >
            {slices.reduce((s, x) => s + (Number(x.value) || 0), 0)}
          </text>
        </svg>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13, color: MUTED }}>
          {segs.map((s) => (
            <li key={s.label} style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: s.color,
                  display: "inline-block",
                }}
              />
              {s.label} · {s.value ?? 0}
            </li>
          ))}
        </ul>
      </div>
      {caption ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: MUTED }}>{caption}</p>
      ) : null}
    </div>
  );
}
