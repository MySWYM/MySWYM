import { Activity, CircleUser, Home, Calendar, History, ChartNoAxesCombined } from "lucide-react";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { isIosSimpleNav } from "../lib/ios-simple-nav.js";
import BrandLogo from "../BrandLogo.jsx";
import { useTranslation } from "react-i18next";

export default function BottomNav({ active, onChange, newBadge }) {
  const { t } = useTranslation("app");
  const ios = isIosSimpleNav();
  const tabs = ios
    ? [
        { id: "analyse", Icon: Activity, label: t("nav.analyse") },
        { id: "home", brand: true, label: t("nav.swim"), center: true },
        { id: "profile", Icon: CircleUser, label: t("nav.profile") },
      ]
    : [
        { id: "home", Icon: Home, label: t("nav.home") },
        { id: "plan", Icon: Calendar, label: t("nav.plan") },
        { id: "analyse", Icon: ChartNoAxesCombined, label: t("nav.analyse") },
        { id: "history", Icon: History, label: t("nav.history") },
      ];
  return (
    <div className="bottom-nav">
      <nav className="bottom-nav-inner" style={{ minHeight: "var(--bottom-nav-h)", padding: ios ? "10px 6px" : "8px 6px" }} aria-label={t("nav.main")}>
        {tabs.map((t) => {
          const isActive = active === t.id;
          const centerOn = t.center && isActive;
          const iconColor = centerOn ? G.white : isActive ? G.blue : G.grey;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                playUiSound("nav");
                onChange(t.id);
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={t.label}
              className={[
                t.center ? "ms-nav-center" : "",
                isActive ? "is-active" : "",
              ].filter(Boolean).join(" ") || undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 2, background: "none", border: "none", outline: "none", cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                minHeight: 48, padding: "4px 2px", position: "relative",
              }}
            >
              <span
                className={isActive ? "ms-nav-active-halo" : undefined}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: t.center ? 48 : 44,
                  height: t.center ? 48 : 36,
                  borderRadius: 999,
                  background: centerOn ? G.blue : isActive ? "rgba(0, 107, 253, 0.12)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                {t.brand ? (
                  <BrandLogo variant="mark" height={22} onDark={centerOn} alt="" />
                ) : (
                  <t.Icon size={22} color={iconColor} strokeWidth={isActive ? 2.2 : 1.6} style={{ transition: "all 0.2s" }} />
                )}
                {t.id === "analyse" && newBadge && (
                  <div style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: G.coral }} />
                )}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? G.blue : G.grey,
                lineHeight: 1.1,
                marginTop: ios ? 2 : 0,
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
