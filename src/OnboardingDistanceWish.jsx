import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { defaultSessionDistanceForLevel } from "./lib/swimmer-profile.js";

const SESSION_DISTANCE_PRESETS_UI = [
  1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 5500, 6000,
];

export function formatDistanceFr(meters) {
  const n = Math.round(Number(meters) || 0);
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")} m`;
}

export function defaultDistancePresetForLevel(level) {
  return defaultSessionDistanceForLevel(level);
}

/** Distance moyenne par séance, jauge / slider */
export function StepSessionDistance({ value, level, onChange, onNext, onBack, Btn, G }) {
  const { t } = useTranslation("onboarding");
  const presets = SESSION_DISTANCE_PRESETS_UI;
  const fallback = defaultDistancePresetForLevel(level);
  const current = Number(value) > 0 ? Number(value) : fallback;
  let safeIdx = presets.findIndex((p) => p === current);
  if (safeIdx < 0) safeIdx = Math.max(0, presets.findIndex((p) => p === fallback));
  const pct = presets.length > 1 ? (safeIdx / (presets.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!(Number(value) > 0)) onChange(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fade-up">
      <h2 style={{ fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
        {t("distance.title")}
      </h2>
      <p style={{ fontSize: 14, color: G.grey, marginBottom: 28, lineHeight: 1.45 }}>
        {t("distance.lead")}
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
          {t("distance.label")}
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 28,
            height: 36,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              right: 11,
              height: 4,
              borderRadius: 2,
              background: G.greyLight,
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              width: `calc((100% - 22px) * ${pct / 100})`,
              height: 4,
              borderRadius: 2,
              background: G.blue,
              pointerEvents: "none",
            }}
          />
          <input
            type="range"
            className="ms-distance-slider"
            min={0}
            max={presets.length - 1}
            step={1}
            value={safeIdx}
            onChange={(e) => onChange(presets[Number(e.target.value)] || fallback)}
            aria-label={t("distance.aria")}
            style={{
              position: "relative",
              width: "100%",
              height: 36,
              cursor: "pointer",
              touchAction: "none",
              zIndex: 1,
            }}
          />
        </div>
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

      <Btn onClick={onNext}>{t("common.continue")}</Btn>
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
        {t("common.back")}
      </button>
    </div>
  );
}
