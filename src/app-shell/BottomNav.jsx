import { Home, Calendar, History, ChartNoAxesCombined } from "lucide-react";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { isIosSimpleNav } from "../lib/ios-simple-nav.js";
import BrandLogo from "../BrandLogo.jsx";
import { useTranslation } from "react-i18next";

/** Grille 2×2 type GOWOD (modules / analyse). */
function NavGridIcon({ size = 22, color, filled }) {
  const gap = 2.2;
  const cell = (size - gap) / 2;
  const r = Math.max(2.4, cell * 0.28);
  const tiles = [
    [0, 0],
    [cell + gap, 0],
    [0, cell + gap],
    [cell + gap, cell + gap],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {tiles.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={cell}
          height={cell}
          rx={r}
          fill={filled ? color : "none"}
          stroke={color}
          strokeWidth={filled ? 0 : 1.7}
        />
      ))}
    </svg>
  );
}

/** Silhouette profil, pleine à l’onglet actif. */
function NavUserIcon({ size = 22, color, filled }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8"
        r="3.35"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={filled ? 0 : 1.75}
      />
      <path
        d="M5.4 19.2c.55-3.35 3.15-5.2 6.6-5.2s6.05 1.85 6.6 5.2"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={filled ? 0 : 1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav({ active, onChange, newBadge }) {
  const { t } = useTranslation("app");
  const ios = isIosSimpleNav();
  const tabs = ios
    ? [
        { id: "analyse", NavIcon: NavGridIcon, label: t("nav.analyse") },
        { id: "home", brand: true, label: t("nav.swim"), center: true },
        { id: "profile", NavIcon: NavUserIcon, label: t("nav.profile") },
      ]
    : [
        { id: "home", Icon: Home, label: t("nav.home") },
        { id: "plan", Icon: Calendar, label: t("nav.plan") },
        { id: "analyse", Icon: ChartNoAxesCombined, label: t("nav.analyse") },
        { id: "history", Icon: History, label: t("nav.history") },
      ];
  const centerSize = ios ? 40 : 48;
  const sideW = ios ? 36 : 44;
  const sideH = ios ? 32 : 36;
  const iconSize = ios ? 22 : 22;

  return (
    <div className="bottom-nav">
      <nav
        className="bottom-nav-inner"
        style={{ minHeight: "var(--bottom-nav-h)", padding: ios ? "6px 10px" : "8px 6px" }}
        aria-label={t("nav.main")}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const centerOn = tab.center && isActive;
          const iconColor = centerOn ? G.white : isActive ? G.blue : G.grey;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playUiSound("nav");
                onChange(tab.id);
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              className={[
                tab.center ? "ms-nav-center" : "",
                isActive ? "is-active" : "",
              ].filter(Boolean).join(" ") || undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: ios ? 0 : 2, background: "none", border: "none", outline: "none", cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                minHeight: ios ? 44 : 48, padding: ios ? "2px 2px" : "4px 2px", position: "relative",
              }}
            >
              <span
                className={isActive ? "ms-nav-active-halo" : undefined}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: tab.center ? centerSize : sideW,
                  height: tab.center ? centerSize : sideH,
                  borderRadius: 999,
                  background: centerOn ? G.blue : isActive ? "rgba(0, 107, 253, 0.12)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                {tab.brand ? (
                  <BrandLogo variant="mark" height={ios ? 20 : 22} onDark={centerOn} alt="" />
                ) : tab.NavIcon ? (
                  <tab.NavIcon size={iconSize} color={iconColor} filled={isActive} />
                ) : (
                  <tab.Icon size={iconSize} color={iconColor} strokeWidth={isActive ? 2.2 : 1.6} style={{ transition: "all 0.2s" }} />
                )}
                {tab.id === "analyse" && newBadge && (
                  <div style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: G.coral }} />
                )}
              </span>
              {!ios && (
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? G.blue : G.grey,
                  lineHeight: 1.1,
                }}>
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
