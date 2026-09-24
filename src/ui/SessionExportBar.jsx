import { useEffect, useState } from "react";
import { CheckCheck, Copy, Share2 } from "lucide-react";
import { G } from "../theme/palette.js";
import { copySessionText } from "../lib/session-export.js";
import { buildSessionSharePack } from "../lib/session-share-pack.js";
import { fetchReferralInvite } from "../lib/referral-share.js";

/**
 * Copier (Strava / WhatsApp) + Partager (image / ShareModal).
 */
export default function SessionExportBar({
  session,
  isPremium = false,
  onUpgrade,
  onShare,
  colors = G,
}) {
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState(null);
  const c = colors || G;

  useEffect(() => {
    if (!isPremium) return undefined;
    let cancelled = false;
    fetchReferralInvite().then((inv) => {
      if (!cancelled) setInvite(inv);
    });
    return () => { cancelled = true; };
  }, [isPremium, session]);

  const runCopy = async (e) => {
    e?.stopPropagation?.();
    if (!isPremium) {
      onUpgrade?.("session_locked");
      return;
    }
    const pack = buildSessionSharePack(session, invite || {});
    const ok = await copySessionText(session, pack.clipboardText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runShareImage = (e) => {
    e?.stopPropagation?.();
    if (!isPremium) {
      onUpgrade?.("session_locked");
      return;
    }
    onShare?.(session);
  };

  const btn = {
    flex: 1,
    minWidth: 110,
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: `1px solid ${c.greyLight || G.greyLight}`,
    background: c.surface || G.surface,
    color: c.inkLight || G.inkLight,
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={runCopy}
        style={{
          ...btn,
          background: copied ? (c.mint || G.mint) : (c.surface || G.surface),
          borderColor: copied ? (c.mint || G.mint) : (c.greyLight || G.greyLight),
          color: copied ? (c.white || G.white) : (c.inkLight || G.inkLight),
        }}
      >
        {copied ? <><CheckCheck size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
      </button>
      {typeof onShare === "function" ? (
        <button type="button" onClick={runShareImage} style={btn}>
          <Share2 size={13} /> Partager
        </button>
      ) : null}
    </div>
  );
}
