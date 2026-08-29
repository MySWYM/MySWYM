/**
 * Schéma pyramide séance, montée / sommet / descente (design page séance).
 * Volume = somme exacte des paliers (jamais un monolithe opaque).
 */

const ROLE_LABEL = {
  montee: "Montée",
  sommet: "Sommet",
  descente: "Descente",
};

/**
 * Extrait les paliers depuis une ligne type :
 * `-900m pyramide crawl : 100 → 200 → 300 → 200 → 100 (sommet 300), repos 20s`
 * @returns {{ steps: number[], peak: number, rest: string|null, label: string, volume: number }|null}
 */
export function parsePyramidLine(raw) {
  const text = String(raw || "").replace(/^[\s\-–—·]+/, "").trim();
  if (!/pyramide/i.test(text)) return null;

  const arrowMatch = text.match(/(\d+(?:\s*→\s*\d+)+)/);
  let steps = [];
  if (arrowMatch) {
    steps = arrowMatch[1]
      .split(/\s*→\s*/)
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  if (steps.length < 3) {
    // Fallback : "100m · 200m · 300m · 200m · 100m"
    const dotted = [...text.matchAll(/(\d+)\s*m\b/gi)].map((m) => parseInt(m[1], 10));
    // Drop leading total if present (first number often = volume)
    if (dotted.length >= 4) {
      const maybeVol = dotted[0];
      const rest = dotted.slice(1);
      const sumRest = rest.reduce((a, b) => a + b, 0);
      steps = Math.abs(sumRest - maybeVol) <= 50 ? rest : dotted;
    }
  }
  if (steps.length < 3) return null;

  const volume = steps.reduce((a, b) => a + b, 0);
  const peak = Math.max(...steps);
  const restMatch = text.match(/repos\s+(\d+(?:\s*[–\-]\s*\d+)?)\s*s/i);
  const labelMatch = text.match(/pyramide\s+([^:—–]+)/i);
  return {
    steps,
    peak,
    volume,
    rest: restMatch ? `repos ${restMatch[1]}s` : null,
    label: (labelMatch?.[1] || "crawl").trim(),
  };
}

function rolesForSteps(steps) {
  const peakIdx = steps.indexOf(Math.max(...steps));
  return steps.map((_, i) => {
    if (i === peakIdx) return "sommet";
    if (i < peakIdx) return "montee";
    return "descente";
  });
}

/**
 * @param {{ steps: number[], peak?: number, rest?: string|null, label?: string, volume?: number, accent?: string }} props
 */
export default function PyramidBlockViz({
  steps = [],
  peak,
  rest = null,
  label = "crawl",
  volume,
  accent = "#006bfd",
}) {
  if (!steps?.length) return null;
  const max = Math.max(...steps);
  const roles = rolesForSteps(steps);
  const vol = volume ?? steps.reduce((a, b) => a + b, 0);
  const pk = peak ?? max;

  const groups = [
    { role: "montee", items: [] },
    { role: "sommet", items: [] },
    { role: "descente", items: [] },
  ];
  steps.forEach((d, i) => {
    const g = groups.find((x) => x.role === roles[i]);
    g.items.push({ d, i });
  });

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 12px 10px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(248,250,255,0.98) 0%, rgba(242,246,255,0.98) 100%)",
        border: "1px solid rgba(83,116,196,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: "#223556" }}>
          {vol}m pyramide {label}
        </div>
        {rest && (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#7a8aa8" }}>{rest}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {steps.map((d, i) => {
          const role = roles[i];
          const widthPct = Math.max(28, Math.round((d / max) * 72));
          const isPeak = role === "sommet";
          return (
            <div
              key={`${i}-${d}`}
              title={`${ROLE_LABEL[role]} · ${d} m`}
              style={{
                width: `${widthPct}%`,
                minHeight: 18,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: "#fff",
                background: isPeak
                  ? `linear-gradient(180deg, #4e7af0 0%, ${accent} 100%)`
                  : `linear-gradient(180deg, #567ce1 0%, ${accent} 100%)`,
                boxShadow: isPeak
                  ? "0 2px 6px rgba(53,93,163,0.18)"
                  : "0 1px 3px rgba(53,93,163,0.12)",
                letterSpacing: "0.01em",
              }}
            >
              {d}m
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginTop: 11,
          fontSize: 9,
          color: "#7384a1",
        }}
      >
        {groups.map((g) => (
          <div
            key={g.role}
            style={{
              textAlign:
                g.role === "sommet" ? "center" : g.role === "descente" ? "right" : "left",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontSize: 8,
                marginBottom: 3,
                color: accent,
              }}
            >
              {ROLE_LABEL[g.role]}
            </div>
            <div style={{ fontWeight: 700 }}>
              {g.items.length ? `${g.items.map((x) => x.d).join(" - ")} m` : "-"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 9, color: "#6d7e9b", textAlign: "center", fontWeight: 600 }}>
        Sommet {pk} m, régulier
      </div>
    </div>
  );
}
