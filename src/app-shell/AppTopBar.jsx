import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Settings } from "lucide-react";
import BrandLogo from "../BrandLogo.jsx";
import { G } from "../theme/palette.js";
import { resolveAvatarUrl } from "../lib/avatar.js";
import {
  NOTIFICATION_KIND_META,
  buildInAppNotifications,
  readSeenNotifications,
  writeSeenNotifications,
  formatNotificationDate,
} from "../lib/in-app-notifications.js";

/** Barre haute commune (logo + paramètres) — Accueil / Programme / Profil */
export default function AppTopBar({ user, onOpenMenu, onAvatarClick, plan = null }) {
  const avatarUrl = resolveAvatarUrl(user);
  const firstName = user?.user_metadata?.firstname
    || (() => {
      try {
        if (user?.id) {
          return localStorage.getItem(`myswym_firstname_${user.id}`) || localStorage.getItem("myswym_firstname");
        }
        return localStorage.getItem("myswym_firstname");
      } catch { return null; }
    })()
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "Nageur";
  const initials = firstName.slice(0, 2).toUpperCase();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const notificationItems = useMemo(
    () => buildInAppNotifications({ user, plan }),
    [user, plan],
  );
  const [seenMap, setSeenMap] = useState(() => readSeenNotifications(user));
  const unreadCount = notificationItems.filter((item) => !seenMap[item.id]).length;

  useEffect(() => {
    setSeenMap(readSeenNotifications(user));
  }, [user?.id, user?.user_metadata?.notifications_seen]);

  useEffect(() => {
    const existing = readSeenNotifications(user);
    if (Object.keys(existing).length > 0) return;
    const bootstrapSeen = {};
    notificationItems.forEach((item) => {
      if (item.type === "badge") bootstrapSeen[item.id] = Date.now();
    });
    if (Object.keys(bootstrapSeen).length > 0) {
      writeSeenNotifications(user, bootstrapSeen);
      setSeenMap(bootstrapSeen);
    }
    // notificationItems identity is memoized on user/plan — avoid render loops
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once per user/plan
  }, [user?.id, plan]);

  const markNotificationsAsRead = (items = notificationItems) => {
    if (!items.length) return;
    const next = { ...readSeenNotifications(user) };
    const stamp = Date.now();
    items.forEach((item) => { next[item.id] = stamp; });
    writeSeenNotifications(user, next);
    setSeenMap(next);
  };

  const handleToggleNotifications = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) markNotificationsAsRead();
  };

  useEffect(() => {
    if (!notifOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!notifRef.current?.contains(event.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [notifOpen]);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: G.glass, backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${G.greyLight}`,
      boxShadow: "0 1px 16px rgba(0,107,253,0.12)",
      paddingTop: "var(--safe-top)",
    }}>
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 10, paddingBottom: 10, minHeight: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          {onAvatarClick ? (
            <button type="button" onClick={onAvatarClick} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${G.blueMid}`, flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 12, fontWeight: 800, color: G.blue }}>{initials}</span>
                }
              </div>
            </button>
          ) : null}
          <BrandLogo variant="wordmark" height={24} onDark style={{ maxWidth: "100%" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-label={`Ouvrir les notifications (${unreadCount} non lues)`}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent", position: "relative" }}
            >
              <Bell size={20} color={unreadCount ? G.gold : G.grey} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 6,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: G.coral,
                    color: G.white,
                    border: `2px solid ${G.glass}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {Math.min(unreadCount, 9)}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: -4,
                  width: 320,
                  maxWidth: "calc(100vw - 24px)",
                  background: G.surface,
                  border: `1px solid ${G.greyLight}`,
                  borderRadius: 18,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
                  padding: 14,
                  zIndex: 60,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: G.ink }}>Notifications</div>
                    <div style={{ fontSize: 11, color: G.grey }}>
                      {notificationItems.length
                        ? `${notificationItems.length} notification${notificationItems.length > 1 ? "s" : ""} dans ton centre`
                        : "Aucune notification pour l'instant"}
                    </div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 12, background: unreadCount ? G.goldLight : G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bell size={16} color={G.blue} />
                  </div>
                </div>

                {notificationItems.length ? (
                  <div style={{ display: "grid", gap: 8, maxHeight: "min(60vh, 420px)", overflowY: "auto", paddingRight: 2 }}>
                    {notificationItems.map((item) => {
                      const kindMeta = NOTIFICATION_KIND_META[item.type] || NOTIFICATION_KIND_META.update;
                      const Icon = item.accentIcon || kindMeta.Icon;
                      const bg = item.type === "badge" ? `${item.accentColor}22` : kindMeta.bg;
                      const color = item.accentColor || kindMeta.color;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            background: G.greyXLight,
                            borderRadius: 14,
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: G.ink, marginBottom: 2 }}>{item.title}</div>
                            <div style={{ fontSize: 11, color: G.grey, lineHeight: 1.45 }}>{item.body}</div>
                            <div style={{ fontSize: 10, color: G.greyMid, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {formatNotificationDate(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: G.greyXLight, borderRadius: 14, padding: "12px 14px", fontSize: 12, color: G.grey }}>
                    Ici tu verras les badges, alertes d'abonnement, promos, newsletters, binomes et grosses mises a jour.
                  </div>
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={onOpenMenu} aria-label="Ouvrir le menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>
            <Settings size={20} color={G.grey} />
          </button>
        </div>
      </div>
    </header>
  );
}
