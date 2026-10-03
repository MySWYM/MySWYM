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
  const centerSize = ios ? 40 : 48;
  const sideW = ios ? 36 : 44;
  const sideH = ios ? 32 : 36;
  const iconSize = ios ? 20 : 22;

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
