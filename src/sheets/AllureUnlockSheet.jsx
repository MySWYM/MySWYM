import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Gauge, Lock, X } from "lucide-react";
import { FONT, FONT_DISPLAY } from "../theme/brand.js";
import { G } from "../theme/palette.js";
import { markAllureUnlockTipSeen } from "../lib/allure-unlock-tip.js";

function parsePaceDigits(raw, { minSec = 45, maxSec = 5 * 60 } = {}) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 3);
  if (digits.length < 3) return { val: null, display: digits.length <= 2 ? digits : `${digits[0]}:${digits.slice(1)}`, err: "" };
  const mins = parseInt(digits[0], 10);
  const secs = parseInt(digits.slice(1), 10);
  const display = `${digits[0]}:${digits.slice(1)}`;
  if (secs >= 60) return { val: null, display, err: "Secondes entre 00 et 59" };
  const total = mins * 60 + secs;
  if (total < minSec) return { val: null, display, err: "Trop rapide" };
  if (total > maxSec) return { val: null, display, err: "Trop lent" };
  return { val: total, display, err: "" };
}

/**
 * Bottom sheet : après la 1re séance, expliquer / saisir le T100 (Premium).
 */
export default function AllureUnlockSheet({
  userId,
  isPremium = false,
  initialPace100 = null,
  onSave,
  onUpgrade,
  onDismiss,
}) {
  const [raw, setRaw] = useState("");
  const [val, setVal] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialPace100) return;
    const m = Math.floor(initialPace100 / 60);
    const s = Math.round(initialPace100 % 60);
    setRaw(`${m}:${String(s).padStart(2, "0")}`);
    setVal(initialPace100);
  }, [initialPace100]);

  const close = () => {
    markAllureUnlockTipSeen(userId);
    onDismiss?.();
  };

  const handleChange = (input) => {
    const parsed = parsePaceDigits(input);
    setRaw(parsed.display);
    setVal(parsed.val);
    setErr(parsed.err);
  };

  const handleSave = async () => {
    if (!isPremium) {
      markAllureUnlockTipSeen(userId);
      onUpgrade?.("allure_unlock");
      onDismiss?.();
      return;
    }
    if (!val || saving) return;
    setSaving(true);
    try {
      await Promise.resolve(onSave?.(val));
      markAllureUnlockTipSeen(userId);
      onDismiss?.();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Mon allure"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="sheet-panel scale-in"
        style={{
          background: G.surface,
          borderRadius: "24px 24px 0 0",
          padding: "20px 18px max(28px, env(safe-area-inset-bottom))",
          maxHeight: "88dvh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 12,
              background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Gauge size={22} color={G.blue} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Premium
            </div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1.15, fontFamily: FONT_DISPLAY }}>
              Ton allure, c’est le moteur
            </h3>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0, cursor: "pointer",
              border: `1px solid ${G.greyLight}`, background: G.greyXLight,
              color: G.ink, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 14, color: G.inkLight, lineHeight: 1.5 }}>
          Ton meilleur 100&nbsp;m crawl (T100) calibre départs et allures sur <strong style={{ color: G.ink }}>ta</strong> vitesse.
          Sans ça, les séances restent génériques.
        </p>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Meilleur temps 100 m
          </div>
          {isPremium ? (
            <input
              type="text"
              inputMode="numeric"
              placeholder="1:45"
              value={raw}
              onChange={(e) => handleChange(e.target.value)}
              aria-label="Meilleur temps sur 100 mètres"
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                padding: "14px 12px", fontSize: 22, fontFamily: FONT, fontWeight: 700,
                textAlign: "center", letterSpacing: "0.06em",
                border: `2px solid ${val ? G.blue : G.greyLight}`,
                borderRadius: 14, outline: "none",
                background: G.greyXLight, color: G.ink,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                markAllureUnlockTipSeen(userId);
                onUpgrade?.("allure_unlock");
                onDismiss?.();
              }}
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                padding: "14px 12px", fontSize: 22, fontFamily: FONT, fontWeight: 700,
                textAlign: "center", letterSpacing: "0.06em",
                border: `2px solid ${G.greyLight}`,
                borderRadius: 14, background: G.greyXLight, color: G.greyMid,
                cursor: "pointer",
              }}
            >
              1:45
            </button>
          )}
          {err ? (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: G.coral, textAlign: "center" }}>{err}</p>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: G.grey, textAlign: "center" }}>
              100&nbsp;m crawl, départ dans l’eau — ton meilleur temps.
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {isPremium ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={!val || saving}
              style={{
                width: "100%", minHeight: 52, borderRadius: 14, border: "none",
                cursor: val && !saving ? "pointer" : "not-allowed",
                background: val ? G.mint : G.greyLight,
                color: val ? G.white : G.greyMid,
                fontWeight: 800, fontSize: 16, fontFamily: FONT,
              }}
            >
              {saving ? "Enregistrement…" : "Enregistrer mon 100 m"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                markAllureUnlockTipSeen(userId);
                onUpgrade?.("allure_unlock");
                onDismiss?.();
              }}
              style={{
                width: "100%", minHeight: 52, borderRadius: 14, border: "none", cursor: "pointer",
                background: G.blue, color: G.white, fontWeight: 800, fontSize: 16, fontFamily: FONT,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Lock size={16} color={G.white} />
              Débloquer avec Premium
            </button>
          )}
          <button
            type="button"
            onClick={close}
            style={{
              width: "100%", minHeight: 44, border: "none", background: "none",
              color: G.grey, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT,
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
