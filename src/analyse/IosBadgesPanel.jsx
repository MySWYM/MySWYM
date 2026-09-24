import { useMemo, useState } from "react";
import { isBadgeEarned } from "../lib/plan-stats.js";
import {
  nextLadderBadge,
  ladderSummary,
  filterLadderDefs,
  ladderCardProgress,
  BADGE_FILTERS,
} from "../lib/badge-progress.js";
import { resolveAvatarUrl } from "../lib/avatar.js";
import { resolveDisplayFirstName } from "../lib/identity-cache.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { G } from "../theme/palette.js";

export default function IosBadgesPanel({ stats, user }) {
  const [filter, setFilter] = useState("all");
  const next = nextLadderBadge(stats);
  const summary = ladderSummary(stats);
  const defs = useMemo(() => filterLadderDefs(filter), [filter]);
  const NextIcon = next?.def?.icon;
  const avatarUrl = resolveAvatarUrl(user);
  const first = resolveDisplayFirstName(user);
  const initials = String(first || "M").slice(0, 2).toUpperCase();
  const fillPct = summary.total ? Math.round((summary.earned / summary.total) * 100) : 0;

  return (
    <div>
      <div className="ms-glass-card ios-badge-hero">
        <div className="ios-badge-hero-id">
          <span className="ios-analyse-avatar ios-badge-hero-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
          </span>
          <span className="ios-badge-hero-name">{first}</span>
          <span className="ios-badge-hero-count">
            {summary.earned} / {summary.total}
          </span>
        </div>
        <div className="ios-badge-next-track" aria-hidden>
          <div className="ios-badge-next-fill" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {next ? (
        <div className="ms-glass-card ios-badge-next">
          {NextIcon ? <NextIcon size={22} color={next.def.color} strokeWidth={2.25} /> : null}
          <div className="ios-badge-next-copy">
            <div className="ios-badge-next-name">{next.def.label}</div>
            <div className="ios-badge-next-frac">{next.barLabel}</div>
          </div>
          <div className="ios-badge-next-track" aria-hidden>
            <div className="ios-badge-next-fill" style={{ width: `${Math.round(next.ratio * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="ios-badge-filters" role="tablist" aria-label="Filtres badges">
        {BADGE_FILTERS.map((chip) => {
          const on = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`ms-chip${on ? " is-active" : ""}`}
              onClick={() => {
                playUiSound("soft");
                setFilter(chip.id);
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="ios-badge-grid">
        {defs.map((def) => {
          const ok = isBadgeEarned(def, stats);
          const isNext = next?.def?.id === def.id;
          const progress = ladderCardProgress(def, stats);
          const Icon = def.icon;
          return (
            <div
              key={def.id}
              className={`ms-glass-card ios-badge-tile${ok ? " is-on" : ""}${isNext ? " is-next" : ""}`}
            >
              <Icon
                size={22}
                color={ok || isNext ? def.color : G.greyMid}
                strokeWidth={2.2}
              />
              <div className="ios-badge-tile-name">{def.label}</div>
              {ok ? null : (
                <div className="ios-badge-tile-frac">{progress.fracLabel}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
