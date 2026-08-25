import { Home, Calendar, Users, User, Lock } from "lucide-react";
import { G } from "../theme/palette.js";

export default function BottomNav({ active, onChange, newBadge, hideBuddies = false, lockBuddies = false }) {
  const tabs = [
    { id: "home", Icon: Home, label: "Accueil" },
    { id: "plan", Icon: Calendar, label: "Programme" },
    !hideBuddies && { id: "buddies", Icon: Users, label: "Binômes", locked: lockBuddies },
    { id: "profile", Icon: User, label: "Profil" },
  ].filter(Boolean);
  return (
    <div className="bottom-nav">
      <nav className="bottom-nav-inner" style={{ minHeight: "var(--bottom-nav-h)", padding: "6px 0 8px" }} aria-label="Navigation principale">
        {tabs.map((t) => {
          const isActive = active === t.id;
          const muted = t.locked && !isActive;
          const iconColor = isActive ? G.blue : muted ? G.greyMid : G.greyMid;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={t.locked ? `${t.label} (abonnés)` : t.label}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, background: "none", border: "none", cursor: "pointer",
                minHeight: 48, padding: "6px 4px", position: "relative",
                opacity: muted ? 0.55 : 1,
              }}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                <t.Icon size={22} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} style={{ transition: "all 0.2s" }} />
                {t.locked && (
                  <Lock size={10} color={iconColor} strokeWidth={2.6} style={{ position: "absolute", right: -6, top: -3 }} />
                )}
              </span>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? G.blue : G.grey }}>{t.label}</span>
              {t.id === "profile" && newBadge && <div style={{ position: "absolute", top: 6, right: "calc(50% - 18px)", width: 8, height: 8, borderRadius: "50%", background: G.coral }} />}
              {isActive && <div style={{ position: "absolute", bottom: 2, width: 28, height: 3, borderRadius: 2, background: G.blue }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
