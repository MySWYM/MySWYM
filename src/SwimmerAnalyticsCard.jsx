import { useMemo, useState } from "react";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import {
  PERIODS,
  PERIOD_META,
  buildPeriodAnalytics,
  formatKm,
} from "./lib/swimmer-period-stats.js";

function Sparkline({ bars }) {
  if (!bars?.length) return null;
  const max = Math.max(1, ...bars.map((bar) => bar.meters || 0));
  const hasVolume = bars.some((bar) => bar.meters > 0);

  return (
    <div aria-hidden="true">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 56 }}>
        {bars.map((bar) => {
          const pct = hasVolume ? Math.max(bar.meters > 0 ? 10 : 4, Math.round((bar.meters / max) * 100)) : 8;
          return (
            <div
              key={bar.key}
              title={`${bar.label} · ${formatKm(bar.meters)}`}
              style={{
                flex: 1,
                minWidth: 0,
                height: `${pct}%`,
                borderRadius: 5,
                background: bar.active ? G.blue : "rgba(61, 143, 255, 0.42)",
                boxShadow: bar.active ? "0 4px 10px rgba(0, 107, 253, 0.28)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
        {bars.map((bar) => (
          <div
            key={`${bar.key}-lbl`}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 9,
              fontWeight: bar.active ? 700 : 600,
              color: bar.active ? G.blueMid : G.greyMid,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SwimmerAnalyticsCard({ plan, profile }) {
  const [period, setPeriod] = useState("week");
  const stats = useMemo(
    () => buildPeriodAnalytics(plan, profile, period),
    [plan, profile, period],
  );

  if (!stats) return null;

  const heroKm = stats.isEmptyTarget ? formatKm(stats.plannedMeters) : stats.kmLabel;
  const heroSub = stats.isEmptyTarget ? "Objectif de la semaine" : "Nagés";
  const deltaPositive = stats.deltaLabel?.startsWith("+");

  return (
    <div style={{
      background: G.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      border: `1px solid ${G.greyLight}`,
      boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 6px 16px rgba(53,93,163,0.04)",
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: G.grey,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 10,
      }}>
        Ma nage
      </div>

      <div
        role="tablist"
        aria-label="Période"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {PERIODS.map((id) => {
          const selected = period === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPeriod(id)}
              style={{
                minHeight: 36,
                padding: "6px 4px",
                borderRadius: 10,
                border: selected ? "none" : `1px solid ${G.greyLight}`,
                background: selected ? G.blue : G.blueLight,
                color: selected ? G.white : G.grey,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              {PERIOD_META[id].chip}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: G.ink }}>
            {stats.title}
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 34,
            fontWeight: 700,
            color: G.ink,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}>
            {heroKm}
          </div>
          <div style={{ fontSize: 12, color: G.greyMid, marginTop: 4 }}>{heroSub}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {stats.showPrescribed ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, color: G.blue, fontVariantNumeric: "tabular-nums" }}>
                {stats.doneSessions}/{stats.plannedSessions}
              </div>
              <div style={{ fontSize: 11, color: G.greyMid }}>séances</div>
              {!stats.isEmptyTarget && stats.plannedMeters > 0 ? (
                <div style={{ fontSize: 11, color: G.greyMid, marginTop: 4 }}>
                  {formatKm(stats.doneMeters)} / {formatKm(stats.plannedMeters)}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, color: G.blue, fontVariantNumeric: "tabular-nums" }}>
                {stats.doneSessions}
              </div>
              <div style={{ fontSize: 11, color: G.greyMid }}>séances</div>
            </>
          )}
        </div>
      </div>

      {stats.isEmptyTarget ? (
        <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: "8px 0 14px" }}>
          Objectif : {formatKm(stats.plannedMeters)} · {stats.plannedSessions} séance{stats.plannedSessions > 1 ? "s" : ""}
        </p>
      ) : stats.deltaLabel ? (
        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: deltaPositive ? G.mint : G.coral,
          margin: "8px 0 14px",
        }}>
          {stats.deltaLabel}
        </p>
      ) : (
        <div style={{ height: 8, marginBottom: 10 }} />
      )}

      <Sparkline bars={stats.sparkline} />
    </div>
  );
}
