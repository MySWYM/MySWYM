import { motion, useReducedMotion } from "framer-motion";
import { G } from "../theme/palette.js";
import { formatKm } from "../lib/swimmer-period-stats.js";
import { scoreColor } from "./score-color.js";

const EASE = [0.22, 1, 0.36, 1];

export function VolumeBars({ bars }) {
  const reduced = useReducedMotion();
  if (!bars?.length) return null;

  const max = Math.max(1, ...bars.map((bar) => bar.meters || 0));
  const hasVolume = bars.some((bar) => bar.meters > 0);

  return (
    <div className="ms-volume-chart" aria-hidden="true">
      <div className="ms-volume-bars">
        {bars.map((bar, i) => {
          const ratio = hasVolume ? (bar.meters || 0) / max : 0;
          const pct = hasVolume
            ? Math.max(bar.meters > 0 ? 14 : 12, Math.round(ratio * 100))
            : 10;
          const color = scoreColor(hasVolume ? ratio : 0);
          return (
            <div key={bar.key} className="ms-volume-col">
              <motion.div
                className={`ms-volume-bar${bar.active ? " is-active" : ""}`}
                title={`${bar.label} · ${formatKm(bar.meters)}`}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: reduced ? 0 : 0.85,
                  delay: reduced ? 0 : 0.12 + i * 0.07,
                  ease: EASE,
                }}
                style={{
                  height: `${pct}%`,
                  background: color,
                  originY: 1,
                  boxShadow: bar.active ? `0 6px 14px ${color}55` : "none",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="ms-volume-labels">
        {bars.map((bar) => (
          <div
            key={`${bar.key}-lbl`}
            className={`ms-volume-label${bar.active ? " is-active" : ""}`}
            style={{ color: bar.active ? G.blue : G.greyMid }}
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}
