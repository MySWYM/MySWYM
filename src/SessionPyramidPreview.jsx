/**
 * Preview mobile — page séance avec pyramide corrigée (Ironman / perf).
 * Route : /prototype/session-pyramid
 */
import PyramidBlockViz, { parsePyramidLine } from "./PyramidBlockViz.jsx";

const G = {
  ink: "#1a2b4a",
  grey: "#5a6f82",
  greyLight: "#e8eef5",
  greyXLight: "#f4f7fb",
  surface: "#ffffff",
  blue: "#355da3",
  mint: "#00c48c",
};

const SESSION = {
  title: "Économie Ironman",
  type: "ENDURANCE",
  intensity: "Z2 — nage économique",
  distance: "2500m",
  duration: 72,
  details: [
    "→ Aujourd'hui : nager économique (triathlon)",
    "-200m crawl souple — échauffement facile",
    "-4 × 100m crawl — exercice bras alterné — repos 30s",
    "-5 × 50m battements + planche — repos 20s",
    "-900m pyramide crawl : 100 → 200 → 300 → 200 → 100 (sommet 300) — repos 20s",
    "-8 × 100m crawl — nage appliquée — hors pyramide — repos 20s",
    "-150m crawl souple — retour au calme",
  ],
};

function Block({ n, title, subtitle, children }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 4px",
        borderTop: n > 1 ? `1px solid ${G.greyLight}` : "none",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          flexShrink: 0,
          background: "rgba(53,93,163,0.12)",
          color: G.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          marginTop: 1,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, lineHeight: 1.35 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: G.grey, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  );
}

export default function SessionPyramidPreview() {
  const pyramidLine = SESSION.details.find((d) => /pyramide/i.test(d));
  const pyr = parsePyramidLine(pyramidLine);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #e8f1f8 0%, #f4f7fb 40%, #eef2f7 100%)",
        display: "flex",
        justifyContent: "center",
        padding: "24px 12px 48px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.blue, marginBottom: 8, letterSpacing: "0.04em" }}>
          MYSWYM · PAGE SÉANCE
        </div>
        <div style={{ fontSize: 13, color: G.grey, marginBottom: 16, lineHeight: 1.4 }}>
          Visu correction pyramide Ironman perf — paliers visibles, volume plafonné (plus de 1750&nbsp;m opaque).
        </div>

        <div
          style={{
            background: G.surface,
            borderRadius: 24,
            border: "1px solid rgba(53,93,163,0.10)",
            boxShadow: "0 2px 12px rgba(142,179,255,0.10), 0 8px 32px rgba(53,93,163,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 16px 12px 18px", borderBottom: `1px solid ${G.greyLight}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Mardi 12 août · Entraînement complet · Loisirs
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginTop: 4 }}>{SESSION.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, fontSize: 13, color: G.grey }}>
              <span><strong style={{ color: G.ink }}>2500 m</strong></span>
              <span><strong style={{ color: G.ink }}>1h 12</strong></span>
              <span>{SESSION.intensity}</span>
            </div>
          </div>

          <div style={{ padding: "4px 14px 8px" }}>
            <Block n={1} title="200 m — Crawl souple" subtitle="Échauffement" />
            <Block n={2} title="4 × 100 m — Exercice bras alterné" subtitle="Technique · repos 30s" />
            <Block n={3} title="5 × 50 m — Battements + planche" subtitle="VMA · repos 20s" />
            <Block
              n={4}
              title={`${pyr?.volume || 900} m — Pyramide crawl (bloc principal)`}
              subtitle={pyr?.rest || "repos 20s"}
            >
              {pyr && (
                <PyramidBlockViz
                  steps={pyr.steps}
                  peak={pyr.peak}
                  volume={pyr.volume}
                  rest={pyr.rest}
                  label={pyr.label}
                  accent={G.blue}
                />
              )}
            </Block>
            <Block n={5} title="8 × 100 m — Nage appliquée" subtitle="Hors pyramide · repos 20s" />
            <Block n={6} title="150 m — Crawl souple" subtitle="Retour au calme" />
          </div>

          <div style={{ padding: "12px 16px 18px" }}>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "none",
                background: G.blue,
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Démarrer la séance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
