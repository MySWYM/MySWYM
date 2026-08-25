import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  User, Users, ExternalLink, RotateCcw, LogOut, Trash2,
  ChevronRight, Link2, CreditCard, X,
} from "lucide-react";
import { G } from "./theme/palette.js";
import { FONT_DISPLAY } from "./theme/brand.js";
import { PRICING } from "./lib/pricing.js";
import { ACCOUNT_DELETE_WARNING } from "./lib/legal-copy.js";
import {
  getSessionRemindersEnabled,
  setSessionRemindersEnabled,
  persistSessionRemindersPreference,
} from "./lib/session-reminder.js";
import { supabase } from "./supabase.js";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { getStoredLanguage } from "./i18n/index.js";

export default function SettingsDrawer({
  open,
  onClose,
  user,
  isPremium,
  onUpgrade,
  onPortal,
  onRefreshStatus,
  onGoProfile,
  onGoBuddies,
  showBuddies = false,
  onSignOut,
  onDeleteAccount,
  plan,
  profile,
  onPaceUpdate,
  onValidateSession,
  connectionsSlot = null,
  referralSlot = null,
}) {
  const { t: ts } = useTranslation("settings");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState(null);
  const [remindersOn, setRemindersOn] = useState(() => getSessionRemindersEnabled(user?.id));
  useEffect(() => {
    setRemindersOn(getSessionRemindersEnabled(user?.id));
  }, [user?.id]);
  if (!open) return null;

  const menuRow = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 0",
    background: "none",
    border: "none",
    borderBottom: `1px solid ${G.greyLight}`,
    cursor: "pointer",
    color: G.ink,
    textAlign: "left",
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(15, 23, 42, 0.38)",
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <div style={{
        width: "min(420px, 92vw)", height: "100%",
        background: G.surface, borderLeft: `1px solid ${G.greyLight}`,
        boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
        overflowY: "auto",
        padding: "calc(var(--safe-top) + 18px) 18px calc(var(--safe-bottom) + 28px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink, letterSpacing: "-0.03em" }}>Menu</div>
            <div style={{ fontSize: 13, color: G.grey }}>Navigation, compte et réglages</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            style={{ width: 44, height: 44, borderRadius: 14, border: `1px solid ${G.greyLight}`, background: G.greyXLight, color: G.ink, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ background: G.greyXLight, borderRadius: 20, padding: "8px 16px", marginBottom: 16 }}>
          <button type="button" onClick={() => { onGoProfile?.(); onClose(); }} style={menuRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <User size={18} color={G.blue} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Mon profil</div>
                <div style={{ fontSize: 12, color: G.grey }}>Infos personnelles, stats, badges</div>
              </div>
            </div>
            <ChevronRight size={18} color={G.greyMid} />
          </button>
          {showBuddies && (
          <button type="button" onClick={() => { onGoBuddies?.(); onClose(); }} style={menuRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Users size={18} color={G.water} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  Binômes eau libre
                </div>
                <div style={{ fontSize: 12, color: G.grey }}>Prénom, ville, téléphone · abonnés uniquement</div>
              </div>
            </div>
            <ChevronRight size={18} color={G.greyMid} />
          </button>
          )}
          <a
            href={withLocalePrefix("/", getStoredLanguage())}
            onClick={onClose}
            style={{ ...menuRow, textDecoration: "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ExternalLink size={18} color={G.blue} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Site mySWYM</div>
                <div style={{ fontSize: 12, color: G.grey }}>Landing, tarifs, blog et présentation</div>
              </div>
            </div>
            <ChevronRight size={18} color={G.greyMid} />
          </a>
          <button type="button" onClick={onRefreshStatus} style={{ ...menuRow, borderBottom: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <RotateCcw size={18} color={G.mint} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Restaurer les achats</div>
                <div style={{ fontSize: 12, color: G.grey }}>Resynchroniser le statut Premium</div>
              </div>
            </div>
            <ChevronRight size={18} color={G.greyMid} />
          </button>
        </div>

        <div style={{ background: G.surface, borderRadius: 20, padding: "16px", border: `1px solid ${G.greyLight}`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: G.grey, marginBottom: 12 }}>
            Paramètres
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>Rappel séance</div>
              <div style={{ fontSize: 12, color: G.grey, marginTop: 2 }}>Bannière du jour si tu n’as pas encore nagé</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={remindersOn}
              onClick={() => {
                const next = !remindersOn;
                setRemindersOn(next);
                setSessionRemindersEnabled(user?.id, next);
                persistSessionRemindersPreference(supabase, next);
              }}
              style={{
                width: 52, height: 32, borderRadius: 999, border: "none", cursor: "pointer",
                background: remindersOn ? G.blue : G.greyLight,
                position: "relative", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 4, left: remindersOn ? 24 : 4,
                width: 24, height: 24, borderRadius: "50%", background: G.white,
                transition: "left 0.15s ease",
              }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>{ts("language.title")}</div>
              <div style={{ fontSize: 12, color: G.grey }}>{ts("language.hint")}</div>
            </div>
            <LanguageSwitcher variant="settings" />
          </div>
        </div>

        <div style={{ background: G.surface, borderRadius: 20, padding: "16px", border: `1px solid ${G.greyLight}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Link2 size={17} color={G.blue} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink }}>Connexions</div>
              <div style={{ fontSize: 12, color: G.grey }}>Strava et services liés</div>
            </div>
          </div>
          {connectionsSlot}
        </div>

        <div style={{ background: G.surface, borderRadius: 20, padding: "16px", border: `1px solid ${G.greyLight}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: G.goldLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={17} color={G.gold} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink }}>Gestion de l&apos;abonnement</div>
              <div style={{ fontSize: 12, color: G.grey }}>{isPremium ? "Premium actif" : "Essai terminé — abonne-toi pour continuer"}</div>
            </div>
          </div>
          {isPremium ? (
            <button onClick={onPortal} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1.5px solid ${G.blue}`, background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48 }}>
              Gérer mon abonnement
            </button>
          ) : (
            <button onClick={onUpgrade} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${G.blue}, ${G.blueDeep})`, color: G.white, fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48 }}>
              S’abonner — dès {PRICING.monthlyCommit.label}/mois
            </button>
          )}
          {isPremium ? (
            referralSlot
          ) : (
            <div style={{
              marginTop: 10, padding: 14, borderRadius: 14,
              border: `1px dashed ${G.greyLight}`, background: G.greyXLight,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>Parrainage Premium</div>
              <div style={{ fontSize: 12, color: G.grey, lineHeight: 1.45 }}>
                Une fois Premium, invite un ami (−20% pour lui, 4,99 € de crédit pour toi).
              </div>
            </div>
          )}
        </div>

        <div style={{ background: G.greyXLight, borderRadius: 20, padding: "8px 16px" }}>
          <button type="button" onClick={onSignOut} style={{ ...menuRow, color: G.coral }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <LogOut size={18} color={G.coral} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Déconnexion</div>
                <div style={{ fontSize: 12, color: G.grey }}>Fermer la session actuelle</div>
              </div>
            </div>
            <ChevronRight size={18} color={G.greyMid} />
          </button>
          {user && onDeleteAccount && (
            <button
              type="button"
              disabled={deleteBusy}
              onClick={async () => {
                setDeleteErr(null);
                const ok = window.confirm(
                  `${ACCOUNT_DELETE_WARNING}\n\nConfirmer la suppression définitive du compte ?`,
                );
                if (!ok) return;
                setDeleteBusy(true);
                try {
                  await onDeleteAccount();
                } catch (e) {
                  setDeleteErr(e?.message || "Suppression impossible.");
                  setDeleteBusy(false);
                }
              }}
              style={{ ...menuRow, borderBottom: "none", color: G.coral }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Trash2 size={18} color={G.coral} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{deleteBusy ? "Suppression…" : "Supprimer mon compte"}</div>
                  <div style={{ fontSize: 12, color: G.grey }}>Droit à l’effacement (RGPD)</div>
                </div>
              </div>
              <ChevronRight size={18} color={G.greyMid} />
            </button>
          )}
          {deleteErr && (
            <div style={{ padding: "8px 0 12px", fontSize: 12, color: G.coral }}>{deleteErr}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
