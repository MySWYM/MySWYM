import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, MapPin, MessageCircle, Settings, Search, Waves,
  Shield, Loader2, UserPlus, EyeOff,
} from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";
import { trackEvent } from "./lib/analytics.js";
import {
  BUDDY_DAYS,
  BUDDY_GOAL_CATEGORIES,
  BUDDY_LEVELS,
  BUDDY_OUTING_TYPES,
  BUDDY_RADIUS_OPTIONS,
  BUDDY_TIME_SLOTS,
  buildWhatsAppLink,
  defaultBuddyForm,
  disableBuddyProfile,
  fetchDiscoverableBuddies,
  fetchOwnBuddyProfile,
  formatAvailabilityLabel,
  formatRadiusLabel,
  formatWhatsAppDisplay,
  labelForGoalCategory,
  labelForLevel,
  labelsForOutingTypes,
  normalizeAvailabilityDays,
  normalizeAvailabilitySlots,
  normalizeOutingTypes,
  normalizeWhatsAppE164,
  toggleAvailabilityDay,
  toggleAvailabilitySlot,
  toggleOutingType,
  upsertBuddyProfile,
} from "./lib/buddy-profiles.js";

const G = {
  bg: "#f8f9fc",
  surface: "#FFFFFF",
  ink: "#191c1e",
  grey: "#737782",
  greyMid: "#9CA3AF",
  greyLight: "#e1e2e5",
  greyXLight: "#f2f3f6",
  blue: "#355da3",
  blueLight: "#d8e2ff",
  blueMid: "#8eb3ff",
  blueDeep: "#154388",
  water: "#00B4D8",
  waterLight: "#E0F7FA",
  coral: "#FF4757",
  coralLight: "#FFE8EA",
  mint: "#00C48C",
  mintLight: "#E6FFF6",
  white: "#FFFFFF",
  glass: "rgba(255,255,255,0.95)",
};

const inp = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1.5px solid ${G.greyLight}`,
  fontSize: 15,
  fontFamily: "'Lexend', sans-serif",
  background: G.surface,
  color: G.ink,
  outline: "none",
  boxSizing: "border-box",
};

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "8px 14px",
        borderRadius: 100,
        border: `1.5px solid ${active ? G.blue : G.greyLight}`,
        background: active ? G.blueLight : G.surface,
        color: active ? G.blueDeep : G.grey,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Lexend', sans-serif",
      }}
    >
      {label}
    </button>
  );
}

function BuddyCard({ buddy, canContact, senderName, onNeedProfile }) {
  const outingLabels = labelsForOutingTypes(buddy.outing_types);
  const outingLabel = outingLabels.join(", ");
  const waLink = canContact
    ? buildWhatsAppLink(buddy.whatsapp_e164, {
        senderName,
        buddyName: buddy.display_name,
        city: buddy.city,
        outingLabel,
      })
    : null;

  const initials = (buddy.display_name || "N").slice(0, 2).toUpperCase();

  return (
    <article
      style={{
        background: G.surface,
        borderRadius: 20,
        border: `1px solid ${G.greyLight}`,
        padding: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: buddy.avatar_url ? "transparent" : `linear-gradient(135deg, ${G.blueMid}, ${G.blue})`,
          overflow: "hidden", border: `2px solid ${G.blueLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {buddy.avatar_url
            ? <img src={buddy.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 16, fontWeight: 800, color: G.white }}>{initials}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: G.ink, marginBottom: 2 }}>{buddy.display_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: G.grey, marginBottom: 6 }}>
            <MapPin size={13} />
            <span>{buddy.city}</span>
          </div>
          <div style={{ fontSize: 12, color: G.greyMid, marginBottom: 6 }}>
            {buddy.radius_km >= 999 ? "Déplacement sans limite" : `Jusqu'à ${buddy.radius_km || 15} km de trajet`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: G.waterLight, color: G.water }}>
              {labelForGoalCategory(buddy.goal_category)}
            </span>
            {buddy.level && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: G.blueLight, color: G.blueDeep }}>
                {labelForLevel(buddy.level)}
              </span>
            )}
            {outingLabels.map((label) => (
              <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: G.greyXLight, color: G.grey }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {(() => {
        const avail = formatAvailabilityLabel(buddy.availability_days, buddy.availability_slots)
          || buddy.availability;
        if (!avail) return null;
        return (
          <div style={{ fontSize: 13, color: G.ink, marginBottom: 8, lineHeight: 1.45 }}>
            <strong style={{ color: G.grey, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dispo · </strong>
            {avail}
          </div>
        );
      })()}
      {buddy.bio && (
        <p style={{ fontSize: 13, color: G.grey, margin: "0 0 12px", lineHeight: 1.5 }}>{buddy.bio}</p>
      )}

      {canContact && waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("buddy_whatsapp_click", { goal_category: buddy.goal_category }, { essential: true })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 16px", borderRadius: 14, border: "none",
            background: "#25D366", color: G.white, fontWeight: 700, fontSize: 14,
            textDecoration: "none", cursor: "pointer", minHeight: 48,
          }}
        >
          <MessageCircle size={18} />
          Contacter sur WhatsApp
        </a>
      ) : (
        <button
          type="button"
          onClick={onNeedProfile}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 16px", borderRadius: 14,
            border: `1.5px dashed ${G.blueMid}`, background: G.blueLight,
            color: G.blueDeep, fontWeight: 700, fontSize: 13, cursor: "pointer", minHeight: 48,
          }}
        >
          <UserPlus size={16} />
          Active ton profil buddy pour contacter
        </button>
      )}
    </article>
  );
}

function BuddyTopBar({ user, onOpenMenu, onTabChange }) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const firstName = user?.user_metadata?.firstname || user?.email?.split("@")[0] || "N";
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: G.glass, backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${G.greyLight}`,
      paddingTop: "var(--safe-top)",
    }}>
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, paddingBottom: 10, minHeight: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onTabChange && (
            <button type="button" onClick={() => onTabChange("profile")} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${G.blueMid}` }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 12, fontWeight: 800, color: G.blue }}>{initials}</span>}
              </div>
            </button>
          )}
          <BrandLogo variant="wordmark" height={22} />
        </div>
        <button type="button" onClick={onOpenMenu} aria-label="Ouvrir le menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44 }}>
          <Settings size={20} color={G.grey} />
        </button>
      </div>
    </header>
  );
}

export default function BuddyMatching({ user, profile, onOpenMenu, onTabChange }) {
  const [view, setView] = useState("list");
  const [form, setForm] = useState(() => defaultBuddyForm(user, profile));
  const [buddies, setBuddies] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingForm, setLoadingForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [consentError, setConsentError] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");

  const senderName = form.display_name || user?.user_metadata?.firstname || "Un nageur MySWYM";
  const canContact = !!(form.is_discoverable && normalizeWhatsAppE164(form.whatsapp_e164));

  const loadList = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    const { data, error } = await fetchDiscoverableBuddies({
      city: cityFilter,
      level: levelFilter || undefined,
      goalCategory: goalFilter || undefined,
      excludeUserId: user.id,
    });
    if (error) setMsg({ type: "err", text: error.message || "Impossible de charger les profils." });
    else setBuddies(data);
    setLoadingList(false);
  }, [user?.id, cityFilter, levelFilter, goalFilter]);

  const loadOwn = useCallback(async () => {
    if (!user?.id) return;
    setLoadingForm(true);
    const { data, error } = await fetchOwnBuddyProfile(user.id);
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else if (data) {
      setForm({
        display_name: data.display_name,
        city: data.city || "",
        radius_km: data.radius_km || 15,
        level: data.level || profile?.level || "régulier",
        goal_category: data.goal_category || "eau_libre",
        outing_types: normalizeOutingTypes(data.outing_types),
        availability_days: normalizeAvailabilityDays(data.availability_days),
        availability_slots: normalizeAvailabilitySlots(data.availability_slots),
        bio: data.bio || "",
        whatsapp_e164: data.whatsapp_e164 ? formatWhatsAppDisplay(data.whatsapp_e164) : "",
        is_discoverable: data.is_discoverable,
        consent_whatsapp: data.consent_whatsapp,
        avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || "",
      });
    } else {
      setForm(defaultBuddyForm(user, profile));
    }
    setLoadingForm(false);
  }, [user, profile]);

  useEffect(() => { loadOwn(); }, [loadOwn]);
  useEffect(() => { loadList(); }, [loadList]);

  const handleSave = async (discoverable) => {
    if (!user?.id) return;
    if (discoverable && !form.consent_whatsapp) {
      setConsentError(true);
      setMsg({ type: "err", text: "Accepte la publication de ton numéro pour rendre ton profil visible." });
      return;
    }
    setSaving(true);
    setMsg(null);
    setConsentError(false);
    const payload = { ...form, is_discoverable: discoverable, consent_whatsapp: discoverable ? form.consent_whatsapp : false };
    const { data, error } = await upsertBuddyProfile(user.id, payload);
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else {
      setForm((f) => ({
        ...f,
        ...data,
        whatsapp_e164: data.whatsapp_e164 ? formatWhatsAppDisplay(data.whatsapp_e164) : f.whatsapp_e164,
        consent_whatsapp: data.consent_whatsapp,
        is_discoverable: data.is_discoverable,
      }));
      setMsg({ type: "ok", text: discoverable ? "Profil visible — les autres nageurs peuvent te contacter." : "Profil enregistré (non visible)." });
      trackEvent("buddy_profile_save", { discoverable }, { essential: true });
      await loadList();
      if (discoverable) setView("list");
    }
    setSaving(false);
  };

  const handleDisable = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await disableBuddyProfile(user.id);
    if (error) setMsg({ type: "err", text: error.message });
    else {
      setForm((f) => ({ ...f, is_discoverable: false, consent_whatsapp: false, whatsapp_e164: "" }));
      setMsg({ type: "ok", text: "Profil retiré de la liste publique." });
      await loadList();
    }
    setSaving(false);
  };

  const activeFilters = useMemo(() => [cityFilter, levelFilter, goalFilter].filter(Boolean).length, [cityFilter, levelFilter, goalFilter]);

  return (
    <div style={{ minHeight: "100dvh", background: "transparent", paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)" }}>
      <BuddyTopBar user={user} onOpenMenu={onOpenMenu} onTabChange={onTabChange} />

      <div className="app-shell" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: G.waterLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={22} color={G.water} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em" }}>Binômes</h1>
              <p style={{ margin: 0, fontSize: 13, color: G.grey }}>Trouve un partenaire eau libre · contact WhatsApp</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setView("list")}
              style={{
                flex: 1, padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: view === "list" ? G.blue : G.greyXLight,
                color: view === "list" ? G.white : G.grey,
                fontWeight: 700, fontSize: 13, fontFamily: "'Lexend', sans-serif",
              }}
            >
              Explorer
            </button>
            <button
              type="button"
              onClick={() => setView("form")}
              style={{
                flex: 1, padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: view === "form" ? G.blue : G.greyXLight,
                color: view === "form" ? G.white : G.grey,
                fontWeight: 700, fontSize: 13, fontFamily: "'Lexend', sans-serif",
              }}
            >
              Mon profil buddy
            </button>
          </div>
        </div>

        {msg && (
          <div style={{
            background: msg.type === "ok" ? G.mintLight : G.coralLight,
            borderRadius: 12, padding: "10px 12px", marginBottom: 14,
            color: msg.type === "ok" ? "#00897B" : G.coral, fontSize: 13, lineHeight: 1.45,
          }}>
            {msg.text}
          </div>
        )}

        {view === "list" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <Search size={16} color={G.greyMid} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="search"
                  placeholder="Ville ou zone (ex. Annecy, Lyon…)"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{ ...inp, paddingLeft: 40 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
                <FilterChip active={!goalFilter} label="Tous" onClick={() => setGoalFilter("")} />
                {BUDDY_GOAL_CATEGORIES.map((g) => (
                  <FilterChip key={g.id} active={goalFilter === g.id} label={g.label} onClick={() => setGoalFilter(goalFilter === g.id ? "" : g.id)} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                <FilterChip active={!levelFilter} label="Tous niveaux" onClick={() => setLevelFilter("")} />
                {BUDDY_LEVELS.map((l) => (
                  <FilterChip key={l.id} active={levelFilter === l.id} label={l.label} onClick={() => setLevelFilter(levelFilter === l.id ? "" : l.id)} />
                ))}
              </div>
            </div>

            {!canContact && (
              <div style={{
                background: G.blueLight, borderRadius: 16, padding: "14px 16px", marginBottom: 16,
                border: `1px solid ${G.blueMid}`, display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <Shield size={18} color={G.blue} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: G.blueDeep, marginBottom: 4 }}>Contact réciproque</div>
                  <div style={{ fontSize: 12, color: G.blue, lineHeight: 1.45, marginBottom: 10 }}>
                    Pour contacter quelqu&apos;un sur WhatsApp, active d&apos;abord ton propre profil buddy visible.
                  </div>
                  <button type="button" onClick={() => setView("form")} style={{ background: G.blue, color: G.white, border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Configurer mon profil
                  </button>
                </div>
              </div>
            )}

            {loadingList ? (
              <div style={{ textAlign: "center", padding: 40, color: G.grey }}>
                <Loader2 size={28} />
                <div style={{ marginTop: 12, fontSize: 14 }}>Chargement…</div>
              </div>
            ) : buddies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", background: G.surface, borderRadius: 20, border: `1px solid ${G.greyLight}` }}>
                <Waves size={36} color={G.blueMid} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 8 }}>
                  {activeFilters ? "Aucun profil pour ces filtres" : "Pas encore de binôme dans ta zone"}
                </div>
                <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.5, margin: "0 0 16px" }}>
                  Sois le premier à te rendre visible — les autres nageurs MySWYM pourront te trouver.
                </p>
                <button type="button" onClick={() => setView("form")} style={{ background: G.blue, color: G.white, border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Créer mon profil buddy
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {buddies.length} profil{buddies.length > 1 ? "s" : ""} disponible{buddies.length > 1 ? "s" : ""}
                </div>
                {buddies.map((b) => (
                  <BuddyCard
                    key={b.user_id}
                    buddy={b}
                    canContact={canContact}
                    senderName={senderName}
                    onNeedProfile={() => setView("form")}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === "form" && (
          loadingForm ? (
            <div style={{ textAlign: "center", padding: 40, color: G.grey }}>Chargement…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Prénom affiché</label>
                <input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} style={inp} maxLength={80} />
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Ville / zone *</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Ex. Annecy, Lyon, Arcachon…" style={inp} maxLength={120} />
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em" }}>Périmètre de déplacement</label>
                    <div style={{ padding: "6px 10px", borderRadius: 999, background: G.blueLight, color: G.blueDeep, fontSize: 12, fontWeight: 800 }}>
                      {formatRadiusLabel(form.radius_km)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={String(BUDDY_RADIUS_OPTIONS.length - 1)}
                    step="1"
                    value={Math.max(0, BUDDY_RADIUS_OPTIONS.indexOf(form.radius_km || 15))}
                    onChange={(e) => {
                      const next = BUDDY_RADIUS_OPTIONS[Number(e.target.value)] || 15;
                      setForm((f) => ({ ...f, radius_km: next }));
                    }}
                    style={{
                      width: "100%",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      height: 8,
                      borderRadius: 999,
                      outline: "none",
                      background: `linear-gradient(90deg, ${G.blue} 0%, ${G.blue} ${(Math.max(0, BUDDY_RADIUS_OPTIONS.indexOf(form.radius_km || 15)) / (BUDDY_RADIUS_OPTIONS.length - 1)) * 100}%, ${G.greyXLight} ${(Math.max(0, BUDDY_RADIUS_OPTIONS.indexOf(form.radius_km || 15)) / (BUDDY_RADIUS_OPTIONS.length - 1)) * 100}%, ${G.greyXLight} 100%)`,
                    }}
                    aria-label="Périmètre de déplacement toléré"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6, fontSize: 11, color: G.greyMid }}>
                    <span>Proche</span>
                    <span>Flexible</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {BUDDY_RADIUS_OPTIONS.map((km) => {
                      const active = (form.radius_km || 15) === km;
                      return (
                        <button
                          key={km}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, radius_km: km }))}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: `1px solid ${active ? G.blue : G.greyLight}`,
                            background: active ? G.blueLight : G.surface,
                            color: active ? G.blueDeep : G.grey,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Lexend', sans-serif",
                          }}
                        >
                          {formatRadiusLabel(km)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Objectif</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BUDDY_GOAL_CATEGORIES.map((g) => (
                    <FilterChip key={g.id} active={form.goal_category === g.id} label={g.label} onClick={() => setForm((f) => ({ ...f, goal_category: g.id }))} />
                  ))}
                </div>
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Type de sortie</label>
                <div style={{ fontSize: 12, color: G.greyMid, marginBottom: 10 }}>Plusieurs choix possibles</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {BUDDY_OUTING_TYPES.map((o) => {
                    const active = (form.outing_types || []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, outing_types: toggleOutingType(f.outing_types, o.id) }))}
                        aria-pressed={active}
                        style={{
                          padding: "12px 12px",
                          borderRadius: 14,
                          border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                          background: active ? G.blueLight : G.surface,
                          color: active ? G.blueDeep : G.grey,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Lexend', sans-serif",
                          textAlign: "left",
                          lineHeight: 1.3,
                          minHeight: 48,
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Niveau</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BUDDY_LEVELS.map((l) => (
                    <FilterChip key={l.id} active={form.level === l.id} label={l.label} onClick={() => setForm((f) => ({ ...f, level: l.id }))} />
                  ))}
                </div>
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Disponibilités</label>
                <div style={{ fontSize: 12, color: G.greyMid, marginBottom: 14 }}>Choisis les jours et créneaux où tu peux nager</div>

                <div style={{ fontSize: 12, fontWeight: 700, color: G.ink, marginBottom: 8 }}>Jours</div>
                <div
                  role="group"
                  aria-label="Jours disponibles"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                    marginBottom: 16,
                  }}
                >
                  {BUDDY_DAYS.map((d) => {
                    const active = (form.availability_days || []).includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={active}
                        aria-label={d.label}
                        title={d.label}
                        onClick={() => setForm((f) => ({
                          ...f,
                          availability_days: toggleAvailabilityDay(f.availability_days, d.id),
                        }))}
                        style={{
                          aspectRatio: "1",
                          minHeight: 44,
                          borderRadius: 12,
                          border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                          background: active ? G.blue : G.greyXLight,
                          color: active ? G.white : G.grey,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "'Lexend', sans-serif",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: G.ink, marginBottom: 8 }}>Créneaux</div>
                <div
                  role="group"
                  aria-label="Créneaux horaires"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
                >
                  {BUDDY_TIME_SLOTS.map((s) => {
                    const active = (form.availability_slots || []).includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setForm((f) => ({
                          ...f,
                          availability_slots: toggleAvailabilitySlot(f.availability_slots, s.id),
                        }))}
                        style={{
                          padding: "12px 12px",
                          borderRadius: 14,
                          border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                          background: active ? G.blueLight : G.surface,
                          color: active ? G.blueDeep : G.grey,
                          cursor: "pointer",
                          fontFamily: "'Lexend', sans-serif",
                          textAlign: "left",
                          minHeight: 56,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>{s.hint}</div>
                      </button>
                    );
                  })}
                </div>

                {formatAvailabilityLabel(form.availability_days, form.availability_slots) ? (
                  <div style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: G.waterLight,
                    color: G.blueDeep,
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}>
                    {formatAvailabilityLabel(form.availability_days, form.availability_slots)}
                  </div>
                ) : null}
              </div>

              <div style={{ background: G.surface, borderRadius: 20, padding: 16, border: `1px solid ${G.greyLight}` }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Bio (optionnel)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Ex. Je prépare un 2,5 km en août, cherche binôme rassurant…"
                  rows={3}
                  maxLength={400}
                  style={{ ...inp, resize: "vertical", minHeight: 80 }}
                />
              </div>

              <div
                style={{
                  background: consentError ? "#FFF5F5" : G.surface,
                  borderRadius: 20,
                  padding: 16,
                  border: `1.5px solid ${consentError ? "#F5B7B7" : G.greyLight}`,
                }}
              >
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>WhatsApp *</label>
                <input
                  type="tel"
                  value={form.whatsapp_e164}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp_e164: e.target.value }))}
                  placeholder="06 12 34 56 78"
                  style={inp}
                  autoComplete="tel"
                />
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.consent_whatsapp}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => ({ ...f, consent_whatsapp: checked }));
                      if (checked) setConsentError(false);
                    }}
                    style={{
                      marginTop: 2,
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      appearance: "none",
                      WebkitAppearance: "none",
                      border: "2px solid #111827",
                      borderRadius: 0,
                      background: form.consent_whatsapp
                        ? `center / 12px 12px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' d='M3 8.5l3 3L13 4.5'/%3E%3C/svg%3E"), ${G.blue}`
                        : "#FFFFFF",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ fontSize: 12, color: consentError ? G.coral : G.grey, lineHeight: 1.55 }}>
                    J&apos;accepte de publier mon numéro WhatsApp pour être contacté par d&apos;autres membres lorsque mon profil est actif. J&apos;ai lu les{" "}
                    <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" style={{ color: G.blue, fontWeight: 700, textDecoration: "none" }}>
                      mentions légales
                    </a>
                    , la{" "}
                    <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: G.blue, fontWeight: 700, textDecoration: "none" }}>
                      politique de confidentialité
                    </a>
                    {" "}et les{" "}
                    <a href="/cgu" target="_blank" rel="noopener noreferrer" style={{ color: G.blue, fontWeight: 700, textDecoration: "none" }}>
                      CGU
                    </a>
                    . <span style={{ color: G.coral, fontWeight: 800 }}>*</span>
                  </span>
                </label>
                {consentError && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: G.coral }}>
                    Coche cette case pour publier ton numéro.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14, border: "none",
                    background: `linear-gradient(135deg, ${G.blue}, ${G.blueDeep})`,
                    color: G.white, fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer", minHeight: 48,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Enregistrement…" : form.is_discoverable ? "Mettre à jour · visible" : "Publier mon profil"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 14,
                    border: `1.5px solid ${G.greyLight}`, background: G.surface,
                    color: G.ink, fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48,
                  }}
                >
                  Enregistrer sans publier
                </button>
                {form.is_discoverable && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDisable}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 14, border: "none",
                      background: G.coralLight, color: G.coral, fontWeight: 700, fontSize: 14,
                      cursor: "pointer", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <EyeOff size={16} />
                    Retirer de la liste publique
                  </button>
                )}
              </div>

              <p style={{ fontSize: 11, color: G.greyMid, lineHeight: 1.55, margin: "0 0 8px", textAlign: "center" }}>
                MySWYM facilite uniquement la mise en relation entre utilisateurs. Les échanges, rendez-vous, déplacements et sorties se font sous la seule responsabilité des personnes concernées. MySWYM et son éditeur déclinent toute responsabilité en cas d&apos;incident, accident, litige, dommage ou conséquence directe ou indirecte liée à une prise de contact ou à une sortie organisée via l&apos;application. Vérifie toujours météo, sécurité, niveau et matériel.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
