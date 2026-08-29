import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Waves, Check, Flame, Trophy, Pencil, Camera, Trash2, X, AlertTriangle,
} from "lucide-react";
import { G } from "./theme/palette.js";
import { FONT_DISPLAY } from "./theme/brand.js";
import { supabase } from "./supabase.js";
import {
  resolveAvatarUrl,
  hydrateAvatarFromStorage,
  uploadAndPersistAvatar,
  removeAndPersistAvatar,
} from "./lib/avatar.js";
import { computeStats, checkBadges } from "./lib/plan-stats.js";
import ProfileSection from "./ui/ProfileSection.jsx";
import ConfirmSheet from "./sheets/ConfirmSheet.jsx";
import { HomeBadgesSection } from "./Dashboard.jsx";
import AppTopBar from "./app-shell/AppTopBar.jsx";
import { AppShell } from "./app-shell/index.js";
import {
  HEALTH_CONSENT_CHECKBOX,
  INJURY_ZONES,
  INJURY_SEVERITIES,
} from "./lib/health-data.js";
import {
  BIRTH_MONTH_OPTIONS,
  TRAINING_FOCUS_OPTIONS,
  computeAgeFromBirth,
  daysInBirthMonth,
} from "./lib/swimmer-profile.js";
import i18n from "./i18n/index.js";

import {
  CATEGORIES, FREQUENCIES, POOLS, SWIM_STYLES,
  EQUIPMENT_OPTS, eqLabel, hidesFourNagesChoice, findGoalById, levelsForPicker, findLevelById,
} from "./lib/onboarding-catalog.jsx";
import { impliedSwimStyleForLevel, isBeginnerBlockedForGoal } from "./lib/onboarding-level-gate.js";

/** Icônes produit MySWYM (WebP fond transparent). */
const EQUIPMENT_IMAGES = {
  palmes: "/equip-palmes.webp",
  tuba: "/equip-tuba.webp",
  pull: "/equip-pull.webp",
  planche: "/equip-planche.webp",
  plaquettes: "/equip-plaquettes.webp",
};

function equipKey(list) {
  return [...(Array.isArray(list) ? list : [])].map(String).sort().join(",");
}

function snapshotNatation(profile) {
  return {
    level: profile?.level ?? null,
    pool: Number(profile?.pool) === 50 ? 50 : 25,
    sessionsPerWeek: profile?.sessionsPerWeek != null ? Number(profile.sessionsPerWeek) : null,
    swimStyle: profile?.swimStyle || "crawl",
  };
}

function natationPatch(draft, baseline) {
  const patch = {};
  if (draft.level !== baseline.level) patch.level = draft.level;
  if (draft.pool !== baseline.pool) patch.pool = draft.pool;
  if (draft.sessionsPerWeek !== baseline.sessionsPerWeek) patch.sessionsPerWeek = draft.sessionsPerWeek;
  if (draft.swimStyle !== baseline.swimStyle) patch.swimStyle = draft.swimStyle;
  return patch;
}

export default function ProfileTab({ plan, profile, user, onUserUpdate, onOpenMenu, onTabChange, onEquipmentChange, onSwimmerProfileChange }) {
  const { t: to } = useTranslation("onboarding");
  const nameStorageKey = user?.id ? `myswym_firstname_${user.id}` : "myswym_firstname";
  const [msg, setMsg] = useState(null);
  const [draftEquipment, setDraftEquipment] = useState(() =>
    Array.isArray(profile?.equipment) ? [...profile.equipment] : []
  );
  const [draftNatation, setDraftNatation] = useState(() => snapshotNatation(profile));
  const [natationConfirmOpen, setNatationConfirmOpen] = useState(false);

  useEffect(() => {
    setDraftEquipment(Array.isArray(profile?.equipment) ? [...profile.equipment] : []);
  }, [profile?.equipment]);

  useEffect(() => {
    setDraftNatation(snapshotNatation(profile));
  }, [profile?.level, profile?.pool, profile?.sessionsPerWeek, profile?.swimStyle]);

  const natationBaseline = snapshotNatation(profile);
  const natationDirty = Boolean(
    onSwimmerProfileChange
    && (
      draftNatation.level !== natationBaseline.level
      || draftNatation.pool !== natationBaseline.pool
      || draftNatation.sessionsPerWeek !== natationBaseline.sessionsPerWeek
      || draftNatation.swimStyle !== natationBaseline.swimStyle
    )
  );
  const equipmentDirty = Boolean(
    onEquipmentChange
    && equipKey(draftEquipment) !== equipKey(profile?.equipment)
  );

  // Avatar + firstName, user_metadata (cross-device) en priorité, cache local en fallback
  const [avatarUrl, setAvatarUrl] = useState(() => resolveAvatarUrl(user));
  const [firstName, setFirstName] = useState(() => {
    try {
      return user?.user_metadata?.firstname
        || (user?.id ? localStorage.getItem(`myswym_firstname_${user.id}`) : null)
        || localStorage.getItem("myswym_firstname")
        || "";
    } catch { return ""; }
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]   = useState(firstName);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef(null);

  // Resync depuis user_metadata quand l'objet user arrive ou change
  useEffect(() => {
    if (user?.user_metadata?.firstname) setFirstName(user.user_metadata.firstname);
    else if (user?.id) {
      try {
        const cached = localStorage.getItem(`myswym_firstname_${user.id}`) || localStorage.getItem("myswym_firstname");
        if (cached) setFirstName(cached);
      } catch {}
    }
    if (avatarBusy) return;
    const next = resolveAvatarUrl(user);
    setAvatarUrl(next);
  }, [user?.id, user?.user_metadata?.firstname, user?.user_metadata?.avatar_url, avatarBusy]);

  // Si metadata vide : retombe sur le fichier Storage et backfill (même compte, autre appareil)
  useEffect(() => {
    if (!user?.id || avatarBusy) return;
    if (resolveAvatarUrl(user)) return;
    let cancelled = false;
    hydrateAvatarFromStorage(user.id)
      .then((res) => {
        if (cancelled || !res?.publicUrl) return;
        setAvatarUrl(res.publicUrl);
        if (res.user && onUserUpdate) onUserUpdate(res.user);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, user?.user_metadata?.avatar_url, avatarBusy, onUserUpdate]);

  const stats  = computeStats(plan);
  const earned = checkBadges(stats);

  const saveName = () => {
    const v = nameInput.trim();
    if (v) {
      try {
        localStorage.setItem(nameStorageKey, v);
        localStorage.setItem("myswym_firstname", v);
      } catch {}
      setFirstName(v);
      // Sync cross-device via user_metadata
      supabase.auth.updateUser({ data: { firstname: v } })
        .then(({ data }) => { if (data?.user && onUserUpdate) onUserUpdate(data.user); })
        .catch(() => {});
    }
    setEditingName(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setAvatarMenuOpen(false);

    const previousUrl = avatarUrl;
    setAvatarBusy(true);

    // Aperçu immédiat (data URL), ne remplace pas la persistance serveur
    try {
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
      setAvatarUrl(preview);
    } catch { /* preview optionnel */ }

    try {
      const { publicUrl, user: updatedUser } = await uploadAndPersistAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      if (updatedUser && onUserUpdate) onUserUpdate(updatedUser);
      setMsg({ type: "ok", text: "Photo enregistrée, visible sur tous tes appareils." });
      setTimeout(() => setMsg(null), 3500);
    } catch (err) {
      setAvatarUrl(previousUrl || null);
      setMsg({ type: "err", text: err?.message || "Impossible d'enregistrer la photo de profil" });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || avatarBusy) return;
    setAvatarBusy(true);
    setAvatarMenuOpen(false);
    const previousUrl = avatarUrl;
    setAvatarUrl(null);
    try {
      clearCachedAvatar(user.id);
      const { user: updatedUser } = await removeAndPersistAvatar(user.id);
      if (updatedUser && onUserUpdate) onUserUpdate(updatedUser);
    } catch (err) {
      setAvatarUrl(previousUrl || null);
      setMsg({ type: "err", text: err?.message || "Impossible de supprimer la photo" });
    } finally {
      setAvatarBusy(false);
    }
  };

  const displayName = firstName || user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Nageur";
  const initials = displayName.slice(0, 2).toUpperCase();
  const levelLabel = findLevelById(profile?.level)?.label || profile?.level || "Nageur";
  const goalLabel = findGoalById(profile?.goal)?.label
    || CATEGORIES.find(c => c.id === profile?.category)?.label
    || "Mon objectif";

  const profileDirty = natationDirty || equipmentDirty;
  const saveEquipment = () => {
    if (!onEquipmentChange || !equipmentDirty) return;
    onEquipmentChange([...draftEquipment]);
  };
  const resetDirtyDrafts = () => {
    setDraftNatation(snapshotNatation(profile));
    setDraftEquipment(Array.isArray(profile?.equipment) ? [...profile.equipment] : []);
  };
  const handleStickySave = () => {
    if (natationDirty) {
      setNatationConfirmOpen(true);
      return;
    }
    if (equipmentDirty) {
      saveEquipment();
      setMsg({ type: "ok", text: "Matériel enregistré, prochaines séances adaptées (déjà faites conservées)." });
      setTimeout(() => setMsg(null), 3500);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "transparent",
      paddingBottom: profileDirty
        ? "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 96px)"
        : "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)",
    }}>
      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onAvatarClick={onTabChange ? () => onTabChange("profile") : undefined}
        plan={plan}
        onTabChange={onTabChange}
      />
      <AppShell>
      {/* ── Profile Header ─────────────────────────────────────── */}
      <div style={{ padding: "28px 0 24px", textAlign: "center" }}>
        {/* Avatar, menu Ajouter / Modifier / Supprimer */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => {
              if (avatarBusy) return;
              if (!avatarUrl) {
                fileInputRef.current?.click();
                return;
              }
              setAvatarMenuOpen(true);
            }}
            aria-label={avatarUrl ? "Gérer la photo de profil" : "Ajouter une photo de profil"}
            style={{ border: "none", background: "none", cursor: avatarBusy ? "wait" : "pointer", padding: 0, display: "block", minWidth: 44, minHeight: 44, opacity: avatarBusy ? 0.7 : 1 }}
          >
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${G.blueMid} 0%, ${G.blue} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(142,179,255,0.35)",
              border: "3px solid #fff", overflow: "hidden",
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{initials}</span>
              }
            </div>
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: "50%",
              background: G.blue, border: "2.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera size={12} color="#fff" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

        {avatarMenuOpen && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo de profil"
            onClick={() => setAvatarMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 420, background: G.surface, borderRadius: 20,
                border: `1px solid ${G.greyLight}`, overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ padding: "16px 18px 10px", textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink }}>Photo de profil</div>
                <div style={{ fontSize: 13, color: G.grey, marginTop: 2 }}>Choisis une action</div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", background: "none", border: "none", borderTop: `1px solid ${G.greyLight}`,
                  cursor: "pointer", textAlign: "left", minHeight: 52,
                }}
              >
                <Camera size={18} color={G.blue} />
                <span style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>
                  {avatarUrl ? "Modifier la photo" : "Ajouter une photo"}
                </span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", background: "none", border: "none", borderTop: `1px solid ${G.greyLight}`,
                    cursor: "pointer", textAlign: "left", minHeight: 52,
                  }}
                >
                  <Trash2 size={18} color={G.coral} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: G.coral }}>Supprimer la photo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(false)}
                style={{
                  width: "100%", padding: "14px 18px", background: G.greyXLight, border: "none",
                  borderTop: `1px solid ${G.greyLight}`, cursor: "pointer",
                  fontSize: 15, fontWeight: 700, color: G.grey, minHeight: 52,
                }}
              >
                Annuler
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Name, tappable pour éditer */}
        {editingName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              placeholder="Ton prénom"
              style={{ fontSize: 20, fontWeight: 700, color: G.ink, border: "none", borderBottom: `2px solid ${G.blue}`, outline: "none", background: "transparent", textAlign: "center", width: 160 }}
            />
            <button type="button" onClick={saveName} style={{ background: G.blue, border: "none", borderRadius: 8, padding: "8px 12px", color: G.white, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 44 }}>OK</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setNameInput(displayName); setEditingName(true); }}
            aria-label="Modifier le nom d’utilisateur"
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4, padding: 8, minHeight: 44 }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink, letterSpacing: "-0.03em" }}>{displayName}</span>
            <div
              aria-hidden
              style={{ width: 20, height: 20, borderRadius: 6, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Pencil size={11} color={G.blue} strokeWidth={2.4} />
            </div>
          </button>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          {levelLabel}
        </div>
        <div style={{ fontSize: 13, color: G.greyMid }}>{user?.email}</div>
      </div>

      <div>
        {msg && (
          <div style={{ background: msg.type === "ok" ? G.mintLight : G.coralLight, borderRadius: 12, padding: "10px 12px", marginBottom: 14, color: msg.type === "ok" ? G.mint : G.coral, fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { Icon: Waves, value: `${(stats.totalMeters / 1000).toFixed(1)} km`, label: "Nagés", color: G.blue, bg: G.blueLight },
            { Icon: Check, value: stats.totalSessions, label: "Séances", color: G.mint, bg: G.mintLight },
            { Icon: Flame, value: stats.streak, label: "Série", color: G.coral, bg: G.coralLight },
            { Icon: Trophy, value: earned.length, label: "Badges", color: G.gold, bg: G.goldLight },
          ].map(({ Icon, value, label, color, bg }, i) => (
            <div key={i} style={{ background: G.surface, borderRadius: 20, padding: "16px 14px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: G.grey, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <ProfileSection
          id="profile-goal"
          title="Mon objectif"
          summary={goalLabel}
          defaultOpen={false}
        >
          <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: "0 0 12px" }}>
            Change via « Nouveau plan » dans Programme.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Objectif", value: goalLabel },
              profile?.eventDate ? { label: "Date", value: profile.eventDate } : null,
              profile?.trainingFocus
                ? { label: "Focus", value: TRAINING_FOCUS_OPTIONS.find((o) => o.id === profile.trainingFocus)?.label || profile.trainingFocus }
                : null,
            ].filter(Boolean).map((item) => (
              <div key={item.label} style={{ background: G.greyXLight, borderRadius: 14, padding: "12px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, lineHeight: 1.35 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </ProfileSection>

        {onSwimmerProfileChange && (
          <>
            <ProfileSection id="profile-physique" title="Mon profil" summary="Âge, poids, taille" defaultOpen={false}>
              {(() => {
                const nowY = new Date().getFullYear();
                const birthMonth = profile?.birthMonth ?? "";
                const birthDay = profile?.birthDay ?? "";
                const birthYear = profile?.birthYear ?? (
                  profile?.age != null && profile.age !== "" && Number.isFinite(Number(profile.age))
                    ? nowY - Math.round(Number(profile.age))
                    : ""
                );
                const dim = daysInBirthMonth(birthMonth, birthYear);
                const fieldStyle = {
                  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12,
                  border: `1.5px solid ${G.greyLight}`, background: G.greyXLight, fontSize: 14, fontWeight: 700, color: G.ink,
                };
                const patchBirth = (nextDay, nextMonth, nextYear) => {
                  const d = nextDay === "" ? "" : Number(nextDay);
                  const m = nextMonth === "" ? "" : Number(nextMonth);
                  const y = nextYear === "" ? "" : Number(nextYear);
                  const maxD = daysInBirthMonth(m, y);
                  const clamped = d === "" ? "" : Math.min(Math.max(1, d), maxD);
                  const age = computeAgeFromBirth(m, y, new Date(), clamped);
                  onSwimmerProfileChange({
                    birthDay: clamped,
                    birthMonth: m,
                    birthYear: y,
                    ...(age != null ? { age } : {}),
                  });
                };
                const dayOpts = [];
                for (let d = 1; d <= dim; d++) dayOpts.push(d);
                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr 0.9fr", gap: 8, marginBottom: 12 }}>
                      <label style={{ display: "block" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                          {to("physique.day")}
                        </div>
                        <select
                          value={birthDay === "" || birthDay == null ? "" : Number(birthDay)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            patchBirth(raw === "" ? "" : Number(raw), birthMonth, birthYear);
                          }}
                          style={{ ...fieldStyle, cursor: "pointer" }}
                        >
                          <option value="">{to("physique.day")}</option>
                          {dayOpts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "block" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                          {to("physique.month")}
                        </div>
                        <select
                          value={birthMonth === "" || birthMonth == null ? "" : Number(birthMonth)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            patchBirth(birthDay, raw === "" ? "" : Number(raw), birthYear);
                          }}
                          style={{ ...fieldStyle, cursor: "pointer" }}
                        >
                          <option value="">{to("physique.month")}</option>
                          {BIRTH_MONTH_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{to(`months.${o.value}`)}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "block" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                          {to("physique.year")}
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1900}
                          max={nowY}
                          value={birthYear ?? ""}
                          placeholder="1998"
                          onChange={(e) => {
                            const raw = e.target.value;
                            patchBirth(birthDay, birthMonth, raw === "" ? "" : Number(raw));
                          }}
                          style={fieldStyle}
                        />
                      </label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { key: "weightKg", label: "Poids", placeholder: "kg" },
                        { key: "heightCm", label: "Taille", placeholder: "cm" },
                      ].map(({ key, label, placeholder }) => (
                        <label key={key} style={{ display: "block" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={profile?.[key] ?? ""}
                            placeholder={placeholder}
                            onChange={(e) => {
                              const raw = e.target.value;
                              onSwimmerProfileChange({ [key]: raw === "" ? "" : Number(raw) });
                            }}
                            style={fieldStyle}
                          />
                        </label>
                      ))}
                    </div>
                  </>
                );
              })()}
            </ProfileSection>

            <ProfileSection
              id="profile-natation"
              title="Ma natation"
              summary={`${Number(profile?.pool) === 50 ? "50 m" : "25 m"} · ${profile?.level || "niveau"} · ${profile?.sessionsPerWeek ? `${profile.sessionsPerWeek}×/sem` : "fréquence"}`}
              defaultOpen
            >
              <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: "0 0 12px" }}>
                Bassin et matériel calent les éducatifs. Le plan a été généré en 25 m, sans matériel, tant que tu ne changes rien ici.
              </p>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Niveau</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {levelsForPicker(profile?.level).map((l) => {
                  const active = draftNatation.level === l.id;
                  const blocked = isBeginnerBlockedForGoal(profile?.goal) && l.id === "régulier";
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={blocked && !active}
                      onClick={() => {
                        if (blocked && !active) return;
                        const implied = impliedSwimStyleForLevel(l.id);
                        setDraftNatation((prev) => ({
                          ...prev,
                          level: l.id,
                          ...(implied ? { swimStyle: implied } : {}),
                        }));
                      }}
                      style={{
                        padding: "8px 12px", borderRadius: 10, cursor: blocked && !active ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                        background: active ? G.blueLight : G.surface,
                        color: blocked && !active ? G.grey : active ? G.blue : G.ink,
                        opacity: blocked && !active ? 0.55 : 1,
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
              {isBeginnerBlockedForGoal(profile?.goal) ? (
                <p style={{ fontSize: 12, color: G.grey, lineHeight: 1.4, margin: "-6px 0 14px" }}>
                  {to("level.beginnerBlocked")}
                </p>
              ) : null}
              <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bassin</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {POOLS.map((p) => {
                  const active = Number(draftNatation.pool) === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDraftNatation((prev) => ({ ...prev, pool: p.id }))}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                        background: active ? G.blueLight : G.surface,
                        color: active ? G.blue : G.ink,
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fréquence</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {FREQUENCIES.map((f) => {
                  const active = Number(draftNatation.sessionsPerWeek) === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDraftNatation((prev) => ({ ...prev, sessionsPerWeek: f.id }))}
                      style={{
                        padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                        background: active ? G.blueLight : G.surface,
                        color: active ? G.blue : G.ink,
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              {!hidesFourNagesChoice({ ...profile, ...draftNatation }) && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Sais-tu nager du 4 nages ?
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {SWIM_STYLES.map((s) => {
                      const active = (draftNatation.swimStyle || "crawl") === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setDraftNatation((prev) => ({ ...prev, swimStyle: s.id }))}
                          style={{
                            flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                            border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                            background: active ? G.blueLight : G.surface,
                            color: active ? G.blue : G.ink,
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </ProfileSection>
            {natationConfirmOpen && createPortal(
              <ConfirmSheet
                title="Modifier ton plan ?"
                message="Ces réglages (niveau, bassin, fréquence, nage) adaptent tes prochaines séances. Les séances déjà validées sont conservées. Continuer ?"
                confirmLabel="Oui, adapter mon plan"
                cancelLabel="Annuler"
                destructive={false}
                icon={AlertTriangle}
                onCancel={() => setNatationConfirmOpen(false)}
                onConfirm={() => {
                  const patch = natationPatch(draftNatation, natationBaseline);
                  const alsoEquip = equipmentDirty;
                  setNatationConfirmOpen(false);
                  if (Object.keys(patch).length > 0) {
                    onSwimmerProfileChange(patch);
                  }
                  if (alsoEquip) {
                    saveEquipment();
                  }
                  setMsg({
                    type: "ok",
                    text: alsoEquip
                      ? "Profil et matériel enregistrés, prochaines séances adaptées (déjà faites conservées)."
                      : "Profil enregistré, prochaines séances adaptées (déjà faites conservées).",
                  });
                  setTimeout(() => setMsg(null), 4000);
                }}
              />,
              document.body,
            )}
          </>
        )}

        {onEquipmentChange && (
        <ProfileSection
          id="profile-equipment"
          title="Mon matériel"
          summary={Array.isArray(profile?.equipment) && profile.equipment.length > 0
            ? profile.equipment.map((id) => eqLabel(id)).join(" · ")
            : "Aucun matériel"}
          defaultOpen={false}
        >
          <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: "0 0 14px" }}>
            Coche ce que tu as au bord du bassin. On l’utilise seulement quand c’est utile, jamais de matos que tu n’as pas.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {EQUIPMENT_OPTS.map((o) => {
              const active = draftEquipment.includes(o.id);
              const imgSrc = EQUIPMENT_IMAGES[o.id];
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDraftEquipment((prev) => (
                    active ? prev.filter((x) => x !== o.id) : [...prev, o.id]
                  ))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    minHeight: 56,
                    borderRadius: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                    background: active ? G.blueLight : G.greyXLight,
                    color: active ? G.blue : G.ink,
                    transition: "border-color 0.15s ease, background 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? "rgba(0,107,253,0.14)" : G.surface,
                      overflow: "hidden",
                    }}
                  >
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        width={36}
                        height={36}
                        style={{ width: 36, height: 36, objectFit: "contain", display: "block" }}
                      />
                    ) : null}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>
                    {eqLabel(o.id)}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                      background: active ? G.blue : "transparent",
                    }}
                  >
                    {active ? <Check size={13} color={G.white} strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setDraftEquipment([])}
            disabled={draftEquipment.length === 0}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: `1px solid ${draftEquipment.length === 0 ? G.blue : G.greyLight}`,
              background: draftEquipment.length === 0 ? G.blueLight : "transparent",
              color: draftEquipment.length === 0 ? G.blue : G.grey,
              fontSize: 13,
              fontWeight: 600,
              cursor: draftEquipment.length === 0 ? "default" : "pointer",
              opacity: draftEquipment.length === 0 ? 1 : 0.95,
              minHeight: 44,
            }}
          >
            Aucun matériel
          </button>
        </ProfileSection>
        )}

        {onSwimmerProfileChange && (
          <ProfileSection
            id="profile-health"
            title="Santé et blessures"
            summary={profile?.injuryStatus === "oui" ? "Blessure déclarée" : (profile?.injuryStatus === "aucune" ? "Aucune blessure" : "À compléter")}
            defaultOpen={false}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Blessure</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[
                { id: "aucune", label: "Aucune" },
                { id: "oui", label: "Oui" },
              ].map((o) => {
                const active = profile?.injuryStatus === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      if (o.id === "aucune") {
                        onSwimmerProfileChange({
                          injuryStatus: "aucune",
                          injuryZone: null,
                          injurySeverity: null,
                          healthDeclaration: false,
                        });
                      } else {
                        onSwimmerProfileChange({ injuryStatus: "oui" });
                      }
                    }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                      border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                      background: active ? G.blueLight : G.surface,
                      color: active ? G.blue : G.ink,
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {profile?.injuryStatus === "oui" && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Zone</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {INJURY_ZONES.map((z) => {
                    const active = profile?.injuryZone === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => onSwimmerProfileChange({ injuryZone: z.id })}
                        style={{
                          padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                          border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                          background: active ? G.blueLight : G.surface,
                          color: active ? G.blue : G.ink,
                        }}
                      >
                        {z.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sévérité</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {INJURY_SEVERITIES.map((s) => {
                    const active = profile?.injurySeverity === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onSwimmerProfileChange({ injurySeverity: s.id })}
                        style={{
                          padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                          border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                          background: active ? G.blueLight : G.surface,
                          color: active ? G.blue : G.ink,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!profile?.healthConsent}
                onChange={(e) => {
                  const v = e.target.checked;
                  onSwimmerProfileChange({
                    healthConsent: v,
                    healthConsentAt: v ? new Date().toISOString() : null,
                  });
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>
                {HEALTH_CONSENT_CHECKBOX}
              </span>
            </label>
          </ProfileSection>
        )}

        <ProfileSection
          id="profile-badges"
          title="Badges"
          summary={`${earned.length} débloqué${earned.length > 1 ? "s" : ""}`}
          defaultOpen={false}
        >
          <HomeBadgesSection plan={plan} />
        </ProfileSection>
      </div>
      </AppShell>

      {profileDirty && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift))",
            zIndex: 90,
            padding: "10px max(16px, env(safe-area-inset-left)) 10px max(16px, env(safe-area-inset-right))",
            background: "rgba(6, 16, 31, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: `1px solid ${G.greyLight}`,
            boxShadow: "0 -8px 28px rgba(0,0,0,0.28)",
          }}
        >
          <div className="app-shell" style={{ display: "flex", gap: 8, maxWidth: "var(--app-max)", margin: "0 auto" }}>
            <button
              type="button"
              onClick={resetDirtyDrafts}
              style={{
                flex: 1, padding: "14px 12px", borderRadius: 12, border: `1px solid ${G.greyLight}`,
                background: G.surface, fontSize: 14, fontWeight: 600, color: G.grey, cursor: "pointer", minHeight: 48,
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleStickySave}
              className="ms-app-btn"
              style={{ flex: 1.4, margin: 0, boxShadow: "0 8px 24px rgba(0, 107, 253, 0.28)" }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
