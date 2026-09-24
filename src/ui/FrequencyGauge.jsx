import { FREQUENCIES } from "../lib/onboarding-catalog.jsx";

/**
 * Jauge séances / semaine (Profil). Même contrôle dans le questionnaire.
 */
export default function FrequencyGauge({
  value,
  onChange,
  fallback = 1,
  "aria-label": ariaLabel = "Séances par semaine",
}) {
  const freqIds = FREQUENCIES.map((f) => f.id);
  const minF = freqIds[0] ?? 1;
  const maxF = freqIds[freqIds.length - 1] ?? 5;
  const raw = Number(value);
  const current = Number.isFinite(raw) && raw >= minF && raw <= maxF ? raw : fallback;
  const idx = Math.max(0, freqIds.indexOf(current));
  const pct = freqIds.length > 1 ? (idx / (freqIds.length - 1)) * 100 : 0;
  const meta = FREQUENCIES.find((f) => f.id === current) || FREQUENCIES[0];

  return (
    <div className="ms-freq-gauge">
      <div className="ms-freq-gauge-value">
        {current}
        <span className="ms-freq-gauge-unit">× / semaine</span>
      </div>
      {meta?.desc ? (
        <div className="ms-freq-gauge-desc">{meta.desc}</div>
      ) : null}
      <div className="ms-freq-gauge-track-wrap">
        <div className="ms-freq-gauge-track" aria-hidden />
        <div
          className="ms-freq-gauge-fill"
          aria-hidden
          style={{ width: `calc((100% - 22px) * ${pct / 100})` }}
        />
        <input
          type="range"
          className="ms-distance-slider ms-freq-gauge-input"
          min={minF}
          max={maxF}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          aria-valuemin={minF}
          aria-valuemax={maxF}
          aria-valuenow={current}
          aria-valuetext={meta?.label || `${current} fois par semaine`}
        />
      </div>
      <div className="ms-freq-gauge-ticks" aria-hidden>
        {FREQUENCIES.map((f) => (
          <span key={f.id} className={f.id === current ? "is-active" : undefined}>
            {f.id}
          </span>
        ))}
      </div>
    </div>
  );
}
