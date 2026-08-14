import { useEffect } from "react";

const SESSION_DISTANCE_PRESETS_UI = [
  1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 5500, 6000,
];

export function formatDistanceFr(meters) {
  const n = Math.round(Number(meters) || 0);
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")} m`;
}

export function defaultDistancePresetForLevel(level) {
  const l = String(level || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (l.includes("decouv") || l === "beginner" || l === "debutant") return 1000;
  if (l.includes("sportif")) return 2500;
  if (l.includes("perf") || l === "advanced") return 3000;
  return 2000;
}

/** Distance moyenne par séance — jauge / slider */
export function StepSessionDistance({ value, level, onChange, onNext, onBack, Btn, G }) {
  const presets = SESSION_DISTANCE_PRESETS_UI;
  const fallback = defaultDistancePresetForLevel(level);
  const current = Number(value) > 0 ? Number(value) : fallback;
  let safeIdx = presets.findIndex((p) => p === current);
  if (safeIdx < 0) safeIdx = Math.max(0, presets.findIndex((p) => p === fallback));

  useEffect(() => {
    if (!(Number(value) > 0)) onChange(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
        Quelle distance veux-tu nager en moyenne par séance ?
      </h2>
      <p style={{ fontSize: 14, color: G.grey, marginBottom: 28, lineHeight: 1.45 }}>
        Pas besoin d’être précis, indique simplement la distance que tu aimes généralement nager.
      </p>

      <div
        style={{
          background: G.surface,
          borderRadius: 18,
          padding: "28px 20px 22px",
          border: `1px solid ${G.greyLight}`,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: G.blue, letterSpacing: -0.5, lineHeight: 1.1 }}>
          {formatDistanceFr(presets[safeIdx] || current)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: G.grey, marginTop: 8 }}>
          Distance moyenne par séance
        </div>

        <input
          type="range"
          min={0}
          max={presets.length - 1}
          step={1}
          value={safeIdx}
          onChange={(e) => onChange(presets[Number(e.target.value)] || fallback)}
          aria-label="Distance moyenne par séance"
          style={{
            width: "100%",
            marginTop: 28,
            accentColor: G.blue,
            cursor: "pointer",
            height: 36,
            touchAction: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 11,
            fontWeight: 600,
            color: G.greyMid,
          }}
        >
          <span>{formatDistanceFr(presets[0])}</span>
          <span>{formatDistanceFr(presets[presets.length - 1])}</span>
        </div>
      </div>

      <Btn onClick={onNext}>Continuer</Btn>
      <button
        type="button"
        onClick={onBack}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "12px",
          background: "none",
          border: "none",
          color: G.grey,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ← Retour
      </button>
    </div>
  );
}

/** Demande libre — préférences d'entraînement */
export function StepTrainingWish({ value, onChange, onNext, onBack, isLast = false, Btn, G }) {
  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
        Qu’aimerais-tu retrouver dans tes entraînements ?
      </h2>
      <p style={{ fontSize: 14, color: G.grey, marginBottom: 20, lineHeight: 1.45 }}>
        Un type de séance, un objectif, un exercice, du matériel, quelque chose que tu veux travailler… dis-nous tout.
      </p>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value.slice(0, 2000))}
        rows={6}
        placeholder="Exemple : plus de séries au seuil, travailler mes virages, utiliser des plaquettes, préparer un 100 m crawl…"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "16px 18px",
          borderRadius: 14,
          border: `1.5px solid ${G.greyLight}`,
          fontSize: 15,
          fontFamily: "'Lexend', sans-serif",
          color: G.ink,
          background: G.surface,
          outline: "none",
          lineHeight: 1.5,
          minHeight: 140,
          resize: "vertical",
          marginBottom: 20,
        }}
      />
      <Btn onClick={onNext}>{isLast ? "Générer mon plan" : "Continuer"}</Btn>
      <button
        type="button"
        onClick={onBack}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "12px",
          background: "none",
          border: "none",
          color: G.grey,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ← Retour
      </button>
    </div>
  );
}
