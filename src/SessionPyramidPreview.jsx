/**
 * Preview mobile — même composant live que l'app.
 * Route : /prototype/session-pyramid
 */
import SessionLiveView from "./SessionLiveView.jsx";

const DEMO_SESSION = {
  title: "Économie Ironman",
  type: "ENDURANCE",
  intensity: "Z2 — nage économique",
  distance: "2500m",
  duration: 72,
  details: [
    "-200m crawl souple — échauffement facile",
    "-4 × 100m crawl — exercice bras alterné — repos 30s",
    "-5 × 50m battements + planche — repos 20s",
    "-100m crawl — repos 20s",
    "-200m crawl — repos 20s",
    "-300m crawl — régulier — repos 20s",
    "-200m crawl — repos 20s",
    "-100m crawl — repos 20s",
    "-8 × 100m crawl — nage appliquée — repos 20s",
    "-150m crawl souple — Z1",
  ],
};

export default function SessionPyramidPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef3fb 0%, #f4f7fc 100%)",
        display: "flex",
        justifyContent: "center",
        padding: "16px 12px 40px",
        fontFamily: "'Lexend', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#355da3", marginBottom: 12, letterSpacing: "0.04em" }}>
          MYSWYM · LIVE PAGE SÉANCE
        </div>
        <SessionLiveView
          session={DEMO_SESSION}
          isPremium
          badge="Économie crawl"
          subtitle="Séance du jour · Ironman perf"
          ctaLabel="Démarrer la séance"
        />
      </div>
    </div>
  );
}
