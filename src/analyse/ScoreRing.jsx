import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { scoreColor } from "./score-color.js";

const EASE = [0.22, 1, 0.36, 1];

export function ScoreRing({
  ratio = 0,
  size = 128,
  stroke = 8,
  sublabel = "du volume",
}) {
  const reduced = useReducedMotion();
  const target = Math.min(1, Math.max(0, Number(ratio) || 0));
  const [progress, setProgress] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(target);
      return undefined;
    }
    setProgress(0);
    const controls = animate(0, target, {
      duration: 1.35,
      ease: EASE,
      onUpdate: setProgress,
    });
    return () => controls.stop();
  }, [target, reduced]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(progress);
  const pct = Math.round(progress * 100);

  return (
    <div
      className="ms-score-ring"
      style={{ width: size, height: size }}
      aria-label={`${pct} pour cent ${sublabel}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="ms-score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ms-score-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ms-score-ring-label">
        <span className="ms-type-display" style={{ fontSize: 28 }}>
          {pct}%
        </span>
        <span className="ms-type-caption">{sublabel}</span>
      </div>
    </div>
  );
}
