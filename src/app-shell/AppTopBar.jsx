import { useEffect, useMemo, useState } from "react";
import { Bell, Settings } from "lucide-react";
import BrandLogo from "../BrandLogo.jsx";
import { G } from "../theme/palette.js";
import { resolveAvatarUrl } from "../lib/avatar.js";
import {
  buildInAppNotifications,
  readSeenNotifications,
  writeSeenNotifications,
} from "../lib/in-app-notifications.js";
import NotificationsSheet from "../sheets/NotificationsSheet.jsx";

/** Barre haute commune (logo + paramètres), Accueil / Programme / Profil */
export default function AppTopBar({
  user,
  onOpenMenu,
  onAvatarClick,
  plan = null,
  onTabChange = null,
  onUpgrade = null,
}) {
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

  const handleOpenNotifications = () => {
    setNotifOpen(true);
    markNotificationsAsRead();
  };

  const handleNotificationAction = (_item, action) => {
    setNotifOpen(false);
    if (action === "upgrade") {
      onUpgrade?.();
      return;
    }
    if (action === "profile") {
      if (onTabChange) onTabChange("profile");
      else onAvatarClick?.();
      return;
    }
    if (action === "buddies") onTabChange?.("buddies");
  };

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
          <button
            type="button"
            onClick={handleOpenNotifications}
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
          <button type="button" onClick={onOpenMenu} aria-label="Ouvrir le menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>
            <Settings size={20} color={G.grey} />
          </button>
        </div>
      </div>

      <NotificationsSheet
        open={notifOpen}
        items={notificationItems}
        onClose={() => setNotifOpen(false)}
        onAction={handleNotificationAction}
      />
    </header>
  );
}
