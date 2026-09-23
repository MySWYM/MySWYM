import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Check, Pencil, Camera, Trash2, X, AlertTriangle, ChevronLeft,
  Volume2, CreditCard, LogOut, RotateCcw, ChevronRight, Mail, User,
  Target, Waves, Package, HeartPulse, CalendarDays, Settings,
} from "lucide-react";
import { G } from "./theme/palette.js";
import { FONT_DISPLAY } from "./theme/brand.js";
import { isNativeIos } from "./lib/native-platform.js";
import { isIosSimpleNav, iosShowPremiumBar } from "./lib/ios-simple-nav.js";
import IosPremiumBar from "./ui/IosPremiumBar.jsx";
import { supabase } from "./supabase.js";
import {
  resolveAvatarUrl,
  hydrateAvatarFromStorage,
  uploadAndPersistAvatar,
  removeAndPersistAvatar,
  clearCachedAvatar,
} from "./lib/avatar.js";
import {
  readCachedFirstName,
  writeCachedFirstName,
  resolveDisplayFirstName,
  resolveDisplayLastName,
  resolveDisplayFullName,
} from "./lib/identity-cache.js";
import "./profile/ios-profile.css";
import {
  playUiSound,
  getUiSoundsEnabled,
  setUiSoundsEnabled,
} from "./lib/ui-sounds.js";
import { PRICING } from "./lib/pricing.js";
import { getAccessState } from "./lib/access.js";
import { openAppleSubscriptionManagement } from "./lib/native-iap.js";
import {
  ProfileHelpSettingsRows,
  ProfileSupportPanel,
  ProfileLegalPanel,
  useFitOverflow,
} from "./ProfileHelpPanels.jsx";
import {
  IosSettingsHome,
  IosLanguagePanel,
  IosPasswordPanel,
  IosDataPanel,
  IosStravaPanel,
  IosAppleHealthPanel,
  IosSubscriptionPanel,
} from "./profile/IosSettings.jsx";
import { ACCOUNT_DELETE_WARNING, ACCOUNT_DELETE_FLEX_WARNING } from "./lib/legal-copy.js";
import { requestAppleHealth } from "./lib/native-health.js";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { getTabUi } from "./tab-ui-registry.js";
import ProfileSection from "./ui/ProfileSection.jsx";
import FrequencyGauge from "./ui/FrequencyGauge.jsx";
import ConfirmSheet from "./sheets/ConfirmSheet.jsx";
import SoftMistSheet from "./sheets/SoftMistSheet.jsx";
import { PasswordInput } from "./AuthScreen.jsx";
import { AppShell, AppTabShell } from "./app-shell/index.js";
import {
  isNewsletterOptedIn,
  setNewsletterOptIn,
} from "./lib/newsletter-opt-in.js";
import {
  INJURY_CONSENT_CHECKBOX,
  HEART_RATE_CONSENT_CHECKBOX,
  INJURY_ZONES,
  INJURY_SEVERITIES,
  formatInjurySummary,
  injuriesForUi,
  toggleInjuryZone,
  setInjurySeverity,
  clearInjuries,
  hasInjuryConsent,
  hasHeartRateConsent,
} from "./lib/health-data.js";
import {
  BIRTH_MONTH_OPTIONS,
  GENDER_OPTIONS,
  computeAgeFromBirth,
  daysInBirthMonth,
  formatBirthDisplay,
} from "./lib/swimmer-profile.js";
import { countryLabelFr } from "./lib/countries.js";
import IosFloatField, { IosFloatButton } from "./profile/IosFloatField.jsx";
import FlagCircle from "./profile/FlagCircle.jsx";
import IosCountrySheet from "./profile/IosCountrySheet.jsx";
import IosBirthWheelSheet from "./profile/IosBirthWheelSheet.jsx";
import i18n from "./i18n/index.js";

import {
  CATEGORIES, POOLS, SWIM_STYLES, SUB_GOALS,
  EQUIPMENT_OPTS, eqLabel, hidesFourNagesChoice, findGoalById, levelsForPicker, findLevelById,
  isProgressionGoal,
} from "./lib/onboarding-catalog.jsx";
import { impliedSwimStyleForLevel, isBeginnerBlockedForGoal } from "./lib/onboarding-level-gate.js";
import {
  familyIdFromProfile,
  familyNeedsDate,
  formatEventLine,
  rhythmLine,
  currentWeekLine,
  isSameGoalPatch,
} from "./lib/profile-goal.js";
import IosGoalPickerSheet from "./profile/IosGoalPickerSheet.jsx";

/** Icônes produit MySWYM (WebP fond transparent). */
const EQUIPMENT_IMAGES = {
  palmes: "/equip-palmes.webp",
  tuba: "/equip-tuba.webp",
  pull: "/equip-pull.webp",
  planche: "/equip-planche.webp",
  plaquettes: "/equip-plaquettes.webp",
  plaquettes_doigts: "/equip-plaquettes-doigts.webp",
  elastique: "/equip-elastique.webp",
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

function iosGoalCard(profile, plan) {
  const familyId = familyIdFromProfile(profile);
  const family = CATEGORIES.find((c) => c.id === familyId);
  const goalMeta = findGoalById(profile?.goal);
  const sub = (SUB_GOALS[familyId] || []).find((s) => s.id === profile?.goal);
  const familyLabel = family?.label || goalMeta?.label || "Mon objectif";
  let targetLabel = "";
  if (sub) {
    targetLabel = sub.dist ? `${sub.label} · ${sub.dist}` : sub.label;
  } else if (goalMeta && !isProgressionGoal(profile?.goal)) {
    targetLabel = goalMeta.dist ? `${goalMeta.label} · ${goalMeta.dist}` : goalMeta.label;
  }
  const dateLabel = familyNeedsDate(familyId) ? formatEventLine(profile?.eventDate) : "";
  const weekLabel = currentWeekLine(plan);
  const freqLabel = rhythmLine(profile);
  return { familyLabel, targetLabel, dateLabel, freqLabel, weekLabel };
}

function snapshotBirth(profile) {
  const nowY = new Date().getFullYear();
  const birthYear = profile?.birthYear ?? (
    profile?.age != null && profile.age !== "" && Number.isFinite(Number(profile.age))
      ? nowY - Math.round(Number(profile.age))
      : ""
  );
  return {
    day: profile?.birthDay ?? "",
    month: profile?.birthMonth ?? "",
    year: birthYear,
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

export default function ProfileTab({
  plan,
  profile,
  user,
  onUserUpdate,
  onTabChange,
  onBack,
  onEquipmentChange,
  onSwimmerProfileChange,
  isPremium = false,
  onUpgrade,
  onPortal,
  onCancelSubscription,
  onRefreshStatus,
  onSignOut,
  onDeleteAccount,
  referralSlot = null,
  onGoBuddies = null,
  showBuddies = false,
  onHideDock = null,
  onPaceUpdate = null,
  onValidateSession = null,
  onChangeGoal = null,
  sessionRemindersOn = true,
  sessionRemindersBusy = false,
  onToggleSessionReminders = null,
}) {
  const { t: to } = useTranslation("onboarding");
  const { StravaSection } = getTabUi();
  const access = getAccessState(user);
  const applePaid = access.billingProvider === "apple";
  const canManageSubscription = access.canManageSubscription;
  const [msg, setMsg] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState(null);
  const [deleteGate, setDeleteGate] = useState({
    allowed: false,
    code: "pending",
    message: "Vérification de l’abonnement…",
    willCancelSubscription: false,
  });
  const [soundsOn, setSoundsOn] = useState(() => getUiSoundsEnabled());
  const [draftEquipment, setDraftEquipment] = useState(() =>
    Array.isArray(profile?.equipment) ? [...profile.equipment] : []
  );
  const [draftNatation, setDraftNatation] = useState(() => snapshotNatation(profile));
  const [natationConfirmOpen, setNatationConfirmOpen] = useState(false);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [goalConfirmOpen, setGoalConfirmOpen] = useState(false);
  const [pendingGoalPatch, setPendingGoalPatch] = useState(null);
  const [goalBusy, setGoalBusy] = useState(false);

  useEffect(() => {
    setDraftEquipment(Array.isArray(profile?.equipment) ? [...profile.equipment] : []);
  }, [profile?.equipment]);

  useEffect(() => {
    setSoundsOn(getUiSoundsEnabled());
  }, []);

  useEffect(() => {
    if (!user?.id || !onDeleteAccount) return undefined;
    let cancelled = false;
    setDeleteGate({
      allowed: false,
      code: "pending",
      message: "Vérification de l’abonnement…",
      willCancelSubscription: false,
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const status = user?.app_metadata?.subscription_status;
      const looksPaid = status === "active" || status === "canceled";
      const paidFallback = {
        allowed: false,
        code: "unverified",
        message: "Impossible de vérifier l’abonnement. Le compte n’a pas été supprimé.",
        willCancelSubscription: false,
      };
      const freeFallback = {
        allowed: true,
        code: "ok",
        message: null,
        willCancelSubscription: false,
      };
      if (!token) {
        if (!cancelled) {
          setDeleteGate({
            allowed: false,
            code: "unverified",
            message: "Reconnecte-toi pour vérifier si le compte peut être supprimé.",
            willCancelSubscription: false,
          });
        }
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setDeleteGate(looksPaid ? {
            ...paidFallback,
            message: json.error || paidFallback.message,
            code: json.code || "unverified",
          } : freeFallback);
          return;
        }
        setDeleteGate({
          allowed: json.allowed === true,
          code: json.code || (json.allowed ? "ok" : "unverified"),
          message: json.message || null,
          willCancelSubscription: json.willCancelSubscription === true,
          endsAt: json.endsAt || null,
        });
      } catch {
        if (!cancelled) setDeleteGate(looksPaid ? paidFallback : freeFallback);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

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
  const [firstName, setFirstName] = useState(() => (
    user?.user_metadata?.firstname || readCachedFirstName(user?.id) || ""
  ));
  const [lastName, setLastName] = useState(() => resolveDisplayLastName(user));
  const [nameInput, setNameInput] = useState(firstName);
  const [lastNameInput, setLastNameInput] = useState(lastName);
  const [draftGender, setDraftGender] = useState(() => profile?.gender || "");
  const [draftCountry, setDraftCountry] = useState(() => profile?.country || "");
  const [draftBirth, setDraftBirth] = useState(() => snapshotBirth(profile));
  const [draftWeight, setDraftWeight] = useState(() => profile?.weightKg ?? "");
  const [draftHeight, setDraftHeight] = useState(() => profile?.heightCm ?? "");
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [birthWheelOpen, setBirthWheelOpen] = useState(false);
  const [profileLane, setProfileLane] = useState("natation");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [newsletterOn, setNewsletterOn] = useState(() => isNewsletterOptedIn(user));
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const [pwdOk, setPwdOk] = useState(false);
  const [helpPanel, setHelpPanel] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthErr, setHealthErr] = useState(null);
  const settingsBodyRef = useFitOverflow(settingsOpen && !helpPanel);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    onHideDock?.(isIosSimpleNav() && !!(
      settingsOpen || helpPanel || editProfileOpen || goalPickerOpen || goalConfirmOpen
      || natationDirty || equipmentDirty
    ));
    return () => onHideDock?.(false);
  }, [settingsOpen, helpPanel, editProfileOpen, goalPickerOpen, goalConfirmOpen, natationDirty, equipmentDirty, onHideDock]);

  useEffect(() => {
    if (!user?.id) {
      setStravaConnected(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { data: rpcRows, error: rpcError } = await supabase.rpc("get_strava_connection_status");
        if (cancelled) return;
        if (!rpcError) {
          const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
          setStravaConnected(row?.connected === true);
          return;
        }
        const { data } = await supabase
          .from("strava_tokens")
          .select("athlete_data")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setStravaConnected(!!data);
      } catch {
        if (!cancelled) setStravaConnected(false);
      }
    };
    load();
    const refresh = () => { load(); };
    window.addEventListener("myswym:strava-connected", refresh);
    window.addEventListener("myswym:strava-status", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("myswym:strava-connected", refresh);
      window.removeEventListener("myswym:strava-status", refresh);
    };
  }, [user?.id, helpPanel]);

  // Resync depuis user_metadata quand l'objet user arrive ou change
  useEffect(() => {
    if (user?.user_metadata?.firstname) setFirstName(user.user_metadata.firstname);
    else if (user?.id) {
      const cached = readCachedFirstName(user.id);
      if (cached) setFirstName(cached);
    }
    setLastName(resolveDisplayLastName(user));
    if (avatarBusy) return;
    const next = resolveAvatarUrl(user);
    setAvatarUrl(next);
  }, [user?.id, user?.user_metadata?.firstname, user?.user_metadata?.lastname, user?.user_metadata?.full_name, user?.user_metadata?.avatar_url, avatarBusy]);

  useEffect(() => {
    setNewsletterOn(isNewsletterOptedIn(user));
  }, [user?.id, user?.user_metadata?.newsletter_opt_in]);

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

  const openEditProfile = () => {
    playUiSound("soft");
    const fallback = resolveDisplayFirstName(user);
    setNameInput(fallback);
    setLastNameInput(resolveDisplayLastName(user));
    setDraftGender(profile?.gender || "");
    setDraftCountry(profile?.country || user?.user_metadata?.country || "");
    setDraftBirth(snapshotBirth(profile));
    setDraftWeight(profile?.weightKg ?? "");
    setDraftHeight(profile?.heightCm ?? "");
    setEditProfileOpen(true);
  };

  const savePerson = () => {
    const first = nameInput.trim();
    const last = lastNameInput.trim();
    if (first) {
      writeCachedFirstName(user?.id, first);
      setFirstName(first);
    }
    setLastName(last);
    const fullName = [first || firstName, last].filter(Boolean).join(" ");
    supabase.auth.updateUser({
      data: {
        ...(first ? { firstname: first } : {}),
        lastname: last,
        full_name: fullName,
        country: draftCountry || "",
      },
    })
      .then(({ data }) => { if (data?.user && onUserUpdate) onUserUpdate(data.user); })
      .catch(() => {});
    if (onSwimmerProfileChange) {
      const day = draftBirth.day === "" ? "" : Number(draftBirth.day);
      const month = draftBirth.month === "" ? "" : Number(draftBirth.month);
      const year = draftBirth.year === "" ? "" : Number(draftBirth.year);
      const age = computeAgeFromBirth(month, year, new Date(), day === "" ? undefined : day);
      onSwimmerProfileChange({
        gender: draftGender,
        country: draftCountry || "",
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        ...(age != null ? { age } : {}),
        weightKg: draftWeight === "" ? "" : Number(draftWeight),
        heightCm: draftHeight === "" ? "" : Number(draftHeight),
      });
    }
    setEditProfileOpen(false);
    setCountrySheetOpen(false);
    setBirthWheelOpen(false);
    playUiSound("success");
    setMsg({ type: "ok", text: "Profil mis à jour." });
    setTimeout(() => setMsg(null), 2500);
  };

  const openAccountSheet = () => {
    playUiSound("soft");
    setPwdNew("");
    setPwdConfirm("");
    setPwdError(null);
    setPwdOk(false);
    setNewsletterOn(isNewsletterOptedIn(user));
    setAccountSheetOpen(true);
  };

  const closeAccountSheet = () => {
    playUiSound("soft");
    setAccountSheetOpen(false);
    setPwdNew("");
    setPwdConfirm("");
    setPwdError(null);
    setPwdOk(false);
  };

  const savePassword = async () => {
    if (pwdNew.length < 6) {
      setPwdError("Le mot de passe doit faire au moins 6 caractères.");
      setPwdOk(false);
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError("Les deux mots de passe ne correspondent pas.");
      setPwdOk(false);
      return;
    }
    setPwdError(null);
    setPwdOk(false);
    setPwdBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwdNew });
      if (error) throw error;
      setPwdNew("");
      setPwdConfirm("");
      setPwdOk(true);
      playUiSound("success");
      setMsg({ type: "ok", text: "Mot de passe mis à jour." });
    } catch (e) {
      setPwdError(e?.message || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setPwdBusy(false);
    }
  };

  const toggleNewsletter = async () => {
    if (newsletterBusy) return;
    const next = !newsletterOn;
    setNewsletterBusy(true);
    setNewsletterOn(next);
    playUiSound("soft");
    try {
      const { user: updated, error } = await setNewsletterOptIn(next);
      if (error) throw error;
      if (updated && onUserUpdate) onUserUpdate(updated);
      setMsg({
        type: "ok",
        text: next
          ? "Tu es abonné aux newsletters."
          : "Tu es désabonné des newsletters.",
      });
    } catch (e) {
      setNewsletterOn(!next);
      setMsg({ type: "err", text: e?.message || "Impossible d’enregistrer la préférence." });
    } finally {
      setNewsletterBusy(false);
    }
  };

  const saveName = () => {
    savePerson();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";

    const previousUrl = avatarUrl;
    setAvatarBusy(true);

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

  const fullName = [firstName || resolveDisplayFirstName(user), lastName].filter(Boolean).join(" ")
    || resolveDisplayFullName(user);
  const initials = fullName.slice(0, 2).toUpperCase();
  const iosNav = isIosSimpleNav();
  const iosCover = iosNav && (settingsOpen || helpPanel || editProfileOpen);
  const levelLabel = findLevelById(profile?.level)?.label || profile?.level || "Nageur";
  const goalLabel = findGoalById(profile?.goal)?.label
    || CATEGORIES.find(c => c.id === profile?.category)?.label
    || "Mon objectif";
  const iosGoal = iosGoalCard(profile, plan);
  const freqN = Math.max(0, Math.min(7, Number(profile?.sessionsPerWeek) || 0));
  const programmeLabel = freqN > 0
    ? `${freqN} séance${freqN > 1 ? "s" : ""}`
    : "À définir";

  const profileDirty = natationDirty || equipmentDirty;
  const declaredInjuries = injuriesForUi(profile);
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

  const patchDraftBirth = (nextDay, nextMonth, nextYear) => {
    const d = nextDay === "" ? "" : Number(nextDay);
    const m = nextMonth === "" ? "" : Number(nextMonth);
    const y = nextYear === "" ? "" : Number(nextYear);
    const maxD = daysInBirthMonth(m, y);
    const clamped = d === "" ? "" : Math.min(Math.max(1, d), maxD);
    setDraftBirth({ day: clamped, month: m, year: y });
  };
  const personDayOpts = [];
  {
    const dim = daysInBirthMonth(draftBirth.month, draftBirth.year);
    for (let d = 1; d <= dim; d++) personDayOpts.push(d);
  }
  const nowYear = new Date().getFullYear();

  return (
    <AppTabShell
      className={iosCover ? "ios-cover-lock" : undefined}
      style={{
        minHeight: "100dvh",
        ...(iosCover ? { height: "100dvh", overflow: "hidden" } : {}),
        paddingBottom: iosCover
          ? 0
          : profileDirty
            ? "calc(var(--safe-bottom) + 112px)"
            : (iosNav
              ? "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 32px)"
              : "calc(var(--safe-bottom) + 32px)"),
      }}
    >
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
      {helpPanel === "support" ? (
        <ProfileSupportPanel onBack={() => setHelpPanel(null)} />
      ) : null}
      {helpPanel === "legal" ? (
        <ProfileLegalPanel onBack={() => setHelpPanel(null)} />
      ) : null}
      {helpPanel === "language" ? (
        <IosLanguagePanel onBack={() => setHelpPanel(null)} />
      ) : null}
      {helpPanel === "password" ? (
        <IosPasswordPanel
          user={user}
          onBack={() => setHelpPanel(null)}
          onMsg={setMsg}
        />
      ) : null}
      {helpPanel === "data" ? (
        <IosDataPanel
          user={user}
          profile={profile}
          onBack={() => setHelpPanel(null)}
          onMsg={setMsg}
          newsletterOn={newsletterOn}
          newsletterBusy={newsletterBusy}
          onToggleNewsletter={toggleNewsletter}
          onDeleteAccount={async () => {
            setDeleteErr(null);
            setDeleteBusy(true);
            try {
              await onDeleteAccount();
            } catch (e) {
              setDeleteErr(e?.message || "Suppression impossible.");
              setDeleteBusy(false);
            }
          }}
          deleteBusy={deleteBusy}
          deleteErr={deleteErr}
          deleteGate={deleteGate}
          deleteWarning={deleteGate.willCancelSubscription ? ACCOUNT_DELETE_FLEX_WARNING : ACCOUNT_DELETE_WARNING}
        />
      ) : null}
      {helpPanel === "strava" ? (
        <IosStravaPanel onBack={() => setHelpPanel(null)}>
          <StravaSection
            user={user}
            plan={plan}
            profile={profile}
            currentPace100={profile?.pace100}
            onPaceUpdate={onPaceUpdate}
            onValidateSession={onValidateSession}
            showProgramActions={false}
            showDetails
            embedded
            isPremium={isPremium}
            onUpgrade={onUpgrade}
          />
        </IosStravaPanel>
      ) : null}
      {helpPanel === "health" ? (
        <IosAppleHealthPanel
          connected={profile?.appleHealthConnected === true}
          busy={healthBusy}
          error={healthErr}
          onBack={() => {
            setHealthErr(null);
            setHelpPanel(null);
          }}
          onConnect={async () => {
            setHealthBusy(true);
            setHealthErr(null);
            try {
              await requestAppleHealth();
              onSwimmerProfileChange?.({
                appleHealthConnected: true,
                appleHealthConnectedAt: new Date().toISOString(),
              });
              playUiSound("success");
            } catch (e) {
              setHealthErr(e?.message || "Impossible de relier Apple Santé.");
            } finally {
              setHealthBusy(false);
            }
          }}
          onDisconnect={() => {
            onSwimmerProfileChange?.({
              appleHealthConnected: false,
              appleHealthConnectedAt: null,
            });
            playUiSound("soft");
          }}
        />
      ) : null}
      {helpPanel === "subscription" ? (
        <IosSubscriptionPanel
          onBack={() => setHelpPanel(null)}
          canManageSubscription={canManageSubscription}
          isPremium={isPremium}
          applePaid={applePaid}
          nativeIos={isNativeIos()}
          access={access}
          onUpgrade={onUpgrade}
          onPortal={() => {
            if (applePaid) void openAppleSubscriptionManagement();
            else onPortal();
          }}
          onCancelSubscription={onCancelSubscription}
          referralSlot={referralSlot}
        />
      ) : null}
      {settingsOpen && !helpPanel ? (
        <div className="ms-profile-subpanel ios-lock-pane">
          <header className="ms-profile-subpanel-toolbar">
            <button
              type="button"
              className="ms-glass-icon-btn"
              aria-label="Retour"
              onClick={() => {
                playUiSound("soft");
                setSettingsOpen(false);
              }}
            >
              <ChevronLeft size={22} color={G.ink} strokeWidth={2.25} />
            </button>
            <h1>Paramètres</h1>
            <div style={{ width: 44 }} aria-hidden />
          </header>
          <div ref={settingsBodyRef} className="ms-profile-subpanel-body">
          {msg && (
            <div style={{ background: msg.type === "ok" ? G.mintLight : G.coralLight, borderRadius: 12, padding: "10px 12px", marginBottom: 14, color: msg.type === "ok" ? G.mint : G.coral, fontSize: 13 }}>
              {msg.text}
            </div>
          )}

          {isIosSimpleNav() ? (
            <IosSettingsHome
              user={user}
              onRefreshStatus={onRefreshStatus}
              stravaConnected={stravaConnected}
              healthConnected={profile?.appleHealthConnected === true}
              onOpenStrava={() => setHelpPanel("strava")}
              onOpenHealth={() => {
                setHealthErr(null);
                setHelpPanel("health");
              }}
              onOpenSubscription={() => setHelpPanel("subscription")}
              onOpenLanguage={() => setHelpPanel("language")}
              onOpenPassword={() => setHelpPanel("password")}
              onOpenData={() => setHelpPanel("data")}
              onOpenHelp={() => setHelpPanel("support")}
              onOpenLegal={() => setHelpPanel("legal")}
              onSignOut={onSignOut}
              sessionRemindersOn={sessionRemindersOn}
              sessionRemindersBusy={sessionRemindersBusy}
              onToggleSessionReminders={onToggleSessionReminders}
            />
          ) : (
          <>
          <div className="ms-profile-group-label">Compte</div>
          <div className="ms-profile-account-stack">
            <button type="button" className="ms-profile-account-row" onClick={openAccountSheet}>
              <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
                <Mail size={18} color={G.blue} />
              </span>
              <span className="ms-profile-settings-label" style={{ flex: 1 }}>Email et mot de passe</span>
              <span className="ms-profile-account-value" style={{ maxWidth: "40%" }}>
                {user?.email || "-"}
              </span>
              <ChevronRight size={18} color={G.greyMid} />
            </button>
          </div>

          <div className="ms-profile-group-label">Réglages</div>
          <div className="ms-profile-settings-list">
            {!isNativeIos() && (
            <div className="ms-profile-settings-row">
              <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
                <Volume2 size={18} color={G.blue} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ms-profile-settings-label">Sons de l’app</div>
                <div className="ms-profile-settings-hint">Retours sonores sur les boutons</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={soundsOn}
                className={`ms-menu-switch${soundsOn ? " is-on" : ""}`}
                onClick={() => {
                  const next = !soundsOn;
                  setSoundsOn(next);
                  setUiSoundsEnabled(next);
                  if (next) playUiSound("success");
                }}
              >
                <span />
              </button>
            </div>
            )}
            <LanguageSwitcher variant="settings" />
            <ProfileHelpSettingsRows
              onOpenSupport={() => setHelpPanel("support")}
              onOpenLegal={() => setHelpPanel("legal")}
            />
          </div>

          {isIosSimpleNav() ? (
            <>
              <div className="ms-profile-group-label">Connexions</div>
              <div className="ms-profile-settings-list" style={{ marginBottom: 16 }}>
                <div className="ms-glass-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
                      <Waves size={18} color={G.blue} />
                    </span>
                    <div>
                      <div className="ms-profile-settings-label">Strava</div>
                      <div className="ms-profile-settings-hint">Sync nage et allure</div>
                    </div>
                  </div>
                  <StravaSection
                    user={user}
                    plan={plan}
                    profile={profile}
                    currentPace100={profile?.pace100}
                    onPaceUpdate={onPaceUpdate}
                    onValidateSession={onValidateSession}
                    showProgramActions={false}
                    showDetails={false}
                    isPremium={isPremium}
                    onUpgrade={onUpgrade}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="ms-profile-group-label">Abonnement</div>
          <div className="ms-profile-settings-list" style={{ marginBottom: 16 }}>
            <div className="ms-profile-settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="ms-profile-settings-icon" style={{ background: G.goldLight }}>
                  <CreditCard size={18} color={G.gold} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="ms-profile-settings-label">Abonnement</div>
                  <div className="ms-profile-settings-hint">
                    {canManageSubscription
                      ? (access.cancelAtPeriodEnd
                        ? (applePaid ? "Premium App Store, jusqu’à la fin de période" : "Premium actif, jusqu’à la fin de période")
                        : (applePaid ? "Premium App Store" : "Premium actif"))
                      : isPremium
                        ? "Essai 7 jours"
                        : "Essai terminé"}
                  </div>
                </div>
              </div>
              {canManageSubscription ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {applePaid && isNativeIos() ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { void openAppleSubscriptionManagement(); }}
                        className="ms-pill-cta ms-pill-cta-secondary"
                        style={{ minHeight: 44 }}
                      >
                        Modifier mon abonnement
                      </button>
                      <button
                        type="button"
                        onClick={() => { void openAppleSubscriptionManagement(); }}
                        style={{
                          width: "100%", minHeight: 44, border: "none", background: "none",
                          color: G.grey, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Résilier
                      </button>
                    </>
                  ) : applePaid ? (
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: G.grey }}>
                      Abonnement App Store. Gère-le sur l’iPhone : Réglages, Apple ID, Abonnements.
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onPortal()}
                        className="ms-pill-cta ms-pill-cta-secondary"
                        style={{ minHeight: 44 }}
                      >
                        Modifier mon abonnement
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancelSubscription()}
                        style={{
                          width: "100%", minHeight: 44, border: "none", background: "none",
                          color: G.grey, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Résilier
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpgrade?.("profile")}
                  className={isNativeIos() ? "ms-pill-cta ms-pill-cta-gold" : "ms-pill-cta"}
                  style={{ minHeight: 44 }}
                >
                  {isNativeIos() ? "Devenir Premium" : `S’abonner : dès ${PRICING.monthlyCommit.label}/mois`}
                </button>
              )}
              {canManageSubscription ? referralSlot : null}
              <button
                type="button"
                onClick={() => {
                  playUiSound("soft");
                  onRefreshStatus?.();
                }}
                style={{
                  width: "100%", minHeight: 40, border: "none", background: "none",
                  color: G.grey, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <RotateCcw size={14} /> Restaurer les achats
              </button>
              <p className="ms-profile-settings-hint" style={{ margin: 0, textAlign: "center" }}>
                Si un achat n’apparaît pas
              </p>
            </div>
          </div>

          <div className="ms-profile-group-label">Zone sensible</div>
          <div className="ms-profile-account-stack" style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={onSignOut}
              className="ms-profile-account-row"
            >
              <span className="ms-profile-settings-icon" style={{ background: "rgba(232,90,104,0.12)" }}>
                <LogOut size={18} color={G.coral} />
              </span>
              <span className="ms-profile-settings-label" style={{ flex: 1, color: G.coral }}>Déconnexion</span>
              <ChevronRight size={18} color={G.coral} />
            </button>
            {user && onDeleteAccount ? (
              <>
                <button
                  type="button"
                  disabled={deleteBusy || !deleteGate.allowed}
                  className="ms-profile-account-row"
                  style={!deleteGate.allowed ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                  onClick={async () => {
                    if (!deleteGate.allowed) return;
                    setDeleteErr(null);
                    const warning = deleteGate.willCancelSubscription
                      ? ACCOUNT_DELETE_FLEX_WARNING
                      : ACCOUNT_DELETE_WARNING;
                    const ok = window.confirm(
                      `${warning}\n\nConfirmer la suppression définitive du compte ?`,
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
                >
                  <span className="ms-profile-settings-icon" style={{ background: "rgba(232,90,104,0.12)" }}>
                    <Trash2 size={18} color={G.coral} />
                  </span>
                  <span className="ms-profile-settings-label" style={{ flex: 1, color: G.coral }}>
                    {deleteBusy ? "Suppression…" : "Supprimer mon compte"}
                  </span>
                  <ChevronRight size={18} color={G.coral} />
                </button>
                {!deleteGate.allowed && deleteGate.message ? (
                  <div style={{ padding: "0 4px 4px", fontSize: 12, color: G.coral, lineHeight: 1.45 }}>
                    {deleteGate.message}
                    {deleteGate.endsAt ? (
                      <>
                        {" "}
                        Fin : {new Date(deleteGate.endsAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}.
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
            {deleteErr ? (
              <div style={{ padding: "0 4px 4px", fontSize: 12, color: G.coral }}>{deleteErr}</div>
            ) : null}
          </div>
          </>
          )}
          </div>
        </div>
      ) : null}
      {iosNav && editProfileOpen && !helpPanel && !settingsOpen ? (
        <div className="ms-profile-subpanel ios-lock-pane">
          <header className="ms-profile-subpanel-toolbar">
            <button
              type="button"
              className="ms-glass-icon-btn"
              aria-label="Retour"
              onClick={() => {
                playUiSound("soft");
                setCountrySheetOpen(false);
                setBirthWheelOpen(false);
                setEditProfileOpen(false);
              }}
            >
              <ChevronLeft size={22} color={G.ink} strokeWidth={2.25} />
            </button>
            <h1>Profil</h1>
            <div style={{ width: 44 }} aria-hidden />
          </header>
          <div className="ms-profile-subpanel-body is-scrollable">
            <div className="ios-person-photo">
              <button
                type="button"
                className="ms-edit-profile-avatar"
                onClick={() => {
                  if (avatarBusy) return;
                  playUiSound("soft");
                  fileInputRef.current?.click();
                }}
                aria-label="Modifier la photo"
                style={{ opacity: avatarBusy ? 0.7 : 1, cursor: avatarBusy ? "wait" : "pointer" }}
              >
                <span className="ms-edit-profile-avatar-media">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" />
                    : <span style={{ fontSize: 28, fontWeight: 800, color: G.blue }}>{initials}</span>}
                </span>
              </button>
              <button
                type="button"
                className="ms-pill-cta ms-pill-cta-secondary"
                style={{ marginTop: 12, minHeight: 40, width: "auto", padding: "0 16px" }}
                onClick={() => {
                  if (avatarBusy) return;
                  playUiSound("soft");
                  fileInputRef.current?.click();
                }}
              >
                <Pencil size={14} style={{ marginRight: 8 }} />
                Modifier la photo
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    playUiSound("soft");
                    handleAvatarRemove();
                  }}
                  style={{
                    marginTop: 8, border: "none", background: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: G.coral,
                  }}
                >
                  Supprimer la photo
                </button>
              ) : null}
            </div>
            <div className="ios-person-fields">
              <IosFloatField
                label="Prénom"
                value={nameInput}
                onChange={setNameInput}
                autoComplete="given-name"
              />
              <IosFloatField
                label="Nom"
                value={lastNameInput}
                onChange={setLastNameInput}
                autoComplete="family-name"
              />
              <IosFloatButton
                label="Date de naissance"
                value={formatBirthDisplay(draftBirth.day, draftBirth.month, draftBirth.year)}
                onClick={() => setBirthWheelOpen(true)}
              />
              <IosFloatButton
                label="Pays"
                prefix={draftCountry ? <FlagCircle code={draftCountry} lazy={false} /> : null}
                value={countryLabelFr(draftCountry)}
                onClick={() => setCountrySheetOpen(true)}
              />
            </div>
            <div className="ms-profile-label" style={{ marginTop: 18 }}>Genre</div>
            <div className="ms-profile-choice-row">
              {GENDER_OPTIONS.map((opt) => {
                const active = draftGender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraftGender(opt.id)}
                    className={`ms-profile-choice is-fill${active ? " is-active" : ""}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="ms-profile-metrics-grid" style={{ marginTop: 16 }}>
              <IosFloatField
                label="Poids (kg)"
                value={draftWeight}
                onChange={setDraftWeight}
                type="number"
                inputMode="numeric"
              />
              <IosFloatField
                label="Taille (cm)"
                value={draftHeight}
                onChange={setDraftHeight}
                type="number"
                inputMode="numeric"
              />
            </div>
            <div className="ms-profile-label" style={{ marginTop: 18 }}>Blessure</div>
            <div className="ms-profile-choice-row">
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
                        onSwimmerProfileChange(clearInjuries());
                      } else {
                        onSwimmerProfileChange({ injuryStatus: "oui" });
                      }
                    }}
                    className={`ms-profile-choice is-fill${active ? " is-active" : ""}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {profile?.injuryStatus === "oui" && (
              <>
                <div className="ms-profile-label">Zones</div>
                <div className="ms-profile-choice-wrap">
                  {INJURY_ZONES.map((z) => {
                    const active = declaredInjuries.some((i) => i.zone === z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => onSwimmerProfileChange(toggleInjuryZone(declaredInjuries, z.id))}
                        className={`ms-profile-choice${active ? " is-active" : ""}`}
                      >
                        {z.label}
                      </button>
                    );
                  })}
                </div>
                {declaredInjuries.map((item) => {
                  const zoneLabel = INJURY_ZONES.find((z) => z.id === item.zone)?.label || item.zone;
                  return (
                    <div key={item.zone} style={{ marginBottom: 12 }}>
                      <div className="ms-profile-label">
                        Gravité · {zoneLabel}
                      </div>
                      <div className="ms-profile-choice-wrap">
                        {INJURY_SEVERITIES.map((s) => {
                          const active = item.severity === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => onSwimmerProfileChange(setInjurySeverity(declaredInjuries, item.zone, s.id))}
                              className={`ms-profile-choice${active ? " is-active" : ""}`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasInjuryConsent(profile)}
                onChange={(e) => {
                  const v = e.target.checked;
                  const at = v ? new Date().toISOString() : null;
                  onSwimmerProfileChange({
                    injuryConsent: v,
                    injuryConsentAt: at,
                  });
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>
                {INJURY_CONSENT_CHECKBOX}
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasHeartRateConsent(profile)}
                onChange={(e) => {
                  const v = e.target.checked;
                  const at = v ? new Date().toISOString() : null;
                  onSwimmerProfileChange({
                    heartRateConsent: v,
                    heartRateConsentAt: at,
                  });
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>
                {HEART_RATE_CONSENT_CHECKBOX}
              </span>
            </label>
            <button
              type="button"
              className="ms-pill-cta"
              style={{ width: "100%", minHeight: 52, marginTop: 20 }}
              onClick={savePerson}
              disabled={avatarBusy}
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : null}
      <IosCountrySheet
        open={iosNav && countrySheetOpen}
        value={draftCountry}
        onClose={() => setCountrySheetOpen(false)}
        onPick={(code) => {
          setDraftCountry(code);
          setCountrySheetOpen(false);
        }}
      />
      <IosBirthWheelSheet
        open={iosNav && birthWheelOpen}
        day={draftBirth.day}
        month={draftBirth.month}
        year={draftBirth.year}
        onClose={() => setBirthWheelOpen(false)}
        onConfirm={({ day, month, year }) => {
          setDraftBirth({ day, month, year });
          setBirthWheelOpen(false);
        }}
      />
      <AppShell style={helpPanel || settingsOpen || (iosNav && editProfileOpen) ? { display: "none" } : undefined}>
      <header className="ms-profile-toolbar" style={{ position: "relative" }}>
        {iosNav ? (
          <div style={{ width: 44 }} aria-hidden />
        ) : (
        <button
          type="button"
          className="ms-glass-icon-btn"
          aria-label="Retour"
          onClick={() => {
            playUiSound("soft");
            if (onBack) onBack();
            else onTabChange?.("home");
          }}
        >
          <ChevronLeft size={22} color={G.ink} strokeWidth={2.25} />
        </button>
        )}
        {iosNav ? null : (
        <h1 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 800,
          color: G.ink,
          letterSpacing: "-0.02em",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}>Profil</h1>
        )}
        <button
          type="button"
          className="ms-glass-icon-btn"
          aria-label="Paramètres"
          onClick={() => {
            playUiSound("soft");
            setSettingsOpen(true);
          }}
        >
          <Settings size={18} color={G.ink} strokeWidth={2.25} />
        </button>
      </header>
      {iosNav ? <h1 className="ios-profile-title">Profil</h1> : null}

      {iosNav ? (
        <button
          type="button"
          className="ms-profile-account-row ios-profile-identity"
          onClick={openEditProfile}
        >
          <span className="ios-profile-identity-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
          </span>
          <span className="ios-profile-identity-name">{fullName}</span>
          <ChevronRight size={18} color={G.greyMid} />
        </button>
      ) : (
      <div className="ms-profile-head">
        <button
          type="button"
          className="ms-profile-head-avatar"
          onClick={openEditProfile}
          aria-label="Modifier le profil"
          style={{ padding: 0, border: "none", cursor: "pointer", font: "inherit" }}
        >
          <span className="ms-profile-head-avatar-media">
            {avatarUrl
              ? <img src={avatarUrl} alt="" />
              : <span style={{ fontSize: 28, fontWeight: 800, color: G.blue }}>{initials}</span>}
          </span>
          <span className="ms-profile-head-avatar-badge" aria-hidden>
            <Pencil size={12} color="#fff" strokeWidth={2.5} />
          </span>
        </button>
        <h1 className="ms-profile-head-name">{String(fullName).toUpperCase()}</h1>
        <p className="ms-profile-head-email">{user?.email || "Compte mySWYM"}</p>
        <div className="ms-profile-meta" role="group" aria-label="Objectif, niveau et programme">
          <div className="ms-profile-meta-item">
            <span className="ms-profile-meta-kicker">Objectif</span>
            <span className="ms-profile-meta-pill is-goal">
              <Target size={13} strokeWidth={2.5} aria-hidden />
              <span>{goalLabel}</span>
            </span>
          </div>
          <div className="ms-profile-meta-item">
            <span className="ms-profile-meta-kicker">Niveau</span>
            <span className="ms-profile-meta-pill is-level">
              <Waves size={13} strokeWidth={2.5} aria-hidden />
              <span>{levelLabel}</span>
            </span>
          </div>
          <div className="ms-profile-meta-item">
            <span className="ms-profile-meta-kicker">Programme</span>
            <span className="ms-profile-meta-pill is-programme">
              <CalendarDays size={13} strokeWidth={2.5} aria-hidden />
              <span>{programmeLabel}</span>
            </span>
          </div>
        </div>
      </div>
      )}

      {isIosSimpleNav() && iosShowPremiumBar(access) ? (
        <div style={{ padding: "0 0 16px" }}>
          <IosPremiumBar onUpgrade={onUpgrade} source="profile" />
        </div>
      ) : null}

      {!iosNav && editProfileOpen && createPortal(
        <div
          className="ms-edit-profile-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playUiSound("soft");
              setEditProfileOpen(false);
            }
          }}
        >
          <div
            className="ms-edit-profile-modal scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ms-edit-profile-modal-head">
              <h2 id="edit-profile-title">Modifier le profil</h2>
              <button
                type="button"
                className="ms-glass-icon-btn"
                aria-label="Fermer"
                onClick={() => {
                  playUiSound("soft");
                  setEditProfileOpen(false);
                }}
                style={{ width: 36, height: 36 }}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>

            <div className="ms-edit-profile-photo">
              <button
                type="button"
                className="ms-edit-profile-avatar"
                onClick={() => {
                  if (avatarBusy) return;
                  playUiSound("soft");
                  fileInputRef.current?.click();
                }}
                aria-label="Changer la photo"
                style={{ opacity: avatarBusy ? 0.7 : 1, cursor: avatarBusy ? "wait" : "pointer" }}
              >
                <span className="ms-edit-profile-avatar-media">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" />
                    : <span style={{ fontSize: 28, fontWeight: 800, color: G.blue }}>{initials}</span>}
                </span>
                <span className="ms-edit-profile-avatar-badge" aria-hidden>
                  <Camera size={14} color="#fff" />
                </span>
              </button>
              <button
                type="button"
                className="ms-edit-profile-change-photo"
                onClick={() => {
                  if (avatarBusy) return;
                  playUiSound("soft");
                  fileInputRef.current?.click();
                }}
              >
                Changer la photo
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    playUiSound("soft");
                    handleAvatarRemove();
                  }}
                  style={{
                    marginTop: 6, border: "none", background: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: G.coral,
                  }}
                >
                  Supprimer la photo
                </button>
              ) : null}
            </div>

            <label className="ms-edit-profile-field">
              <span>Prénom</span>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                placeholder="Ton prénom"
              />
            </label>

            <button
              type="button"
              className="ms-pill-cta"
              style={{ width: "100%", minHeight: 52, marginTop: 8 }}
              onClick={saveName}
              disabled={avatarBusy}
            >
              Enregistrer
            </button>
          </div>
        </div>,
        document.body,
      )}

      <div>
        {msg && (
          <div style={{ background: msg.type === "ok" ? G.mintLight : G.coralLight, borderRadius: 12, padding: "10px 12px", marginBottom: 14, color: msg.type === "ok" ? G.mint : G.coral, fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        <SoftMistSheet
          open={!iosNav && accountSheetOpen}
          onClose={closeAccountSheet}
          title="Compte"
          subtitle={user?.email || "Ton adresse e-mail"}
          ariaLabel="Gérer le compte"
          zIndex={400}
        >
          <div className="ms-account-sheet">
            <div className="ms-account-sheet-block">
              <div className="ms-account-sheet-label">Adresse e-mail</div>
              <div className="ms-account-sheet-email">{user?.email || "-"}</div>
              <p className="ms-account-sheet-hint">
                Contacte le support si tu dois changer d’adresse.
              </p>
            </div>

            <div className="ms-account-sheet-block">
              <div className="ms-account-sheet-label">Mot de passe</div>
              {pwdError ? (
                <div className="ms-account-sheet-alert is-err">{pwdError}</div>
              ) : null}
              {pwdOk ? (
                <div className="ms-account-sheet-alert is-ok">Mot de passe mis à jour.</div>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <PasswordInput
                  id="profile-pwd-new"
                  label="Nouveau mot de passe"
                  placeholder="Au moins 6 caractères"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  onEnter={savePassword}
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="profile-pwd-confirm"
                  label="Confirmer"
                  placeholder="Retape le mot de passe"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  onEnter={savePassword}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="button"
                className="ms-pill-cta"
                style={{ width: "100%", minHeight: 48, marginTop: 12 }}
                onClick={savePassword}
                disabled={pwdBusy || !pwdNew || !pwdConfirm}
              >
                {pwdBusy ? "…" : "Enregistrer le mot de passe"}
              </button>
            </div>

            <div className="ms-account-sheet-block is-last">
              <div className="ms-profile-settings-row" style={{ padding: 0, border: "none" }}>
                <span className="ms-profile-settings-icon" style={{ background: "rgba(124, 107, 207, 0.12)" }}>
                  <Mail size={18} color={G.purple} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ms-profile-settings-label">Newsletters</div>
                  <div className="ms-profile-settings-hint">
                    Actus et conseils MySWYM par e-mail
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newsletterOn}
                  aria-busy={newsletterBusy}
                  className={`ms-menu-switch${newsletterOn ? " is-on" : ""}`}
                  onClick={toggleNewsletter}
                  disabled={newsletterBusy}
                >
                  <span />
                </button>
              </div>
            </div>
          </div>
        </SoftMistSheet>

        {iosNav ? (
          <div className="ms-seg-track ios-profile-lanes" role="tablist">
            {[
              { id: "natation", label: "Natation" },
              { id: "materiel", label: "Matériel" },
              { id: "objectif", label: "Objectif" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={profileLane === tab.id}
                className={`ms-seg-btn${profileLane === tab.id ? " is-active" : ""}`}
                onClick={() => {
                  playUiSound("soft");
                  setProfileLane(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="ms-profile-group-label">Natation</div>
        )}

        {onSwimmerProfileChange && (
          <>
            {!iosNav ? (
            <ProfileSection id="profile-physique" title="Mon profil" summary="Âge, sexe, poids, taille" icon={User} defaultOpen={false}>
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
                    <div className="ms-profile-birth-grid">
                      <label style={{ display: "block" }}>
                        <div className="ms-profile-label">
                          {to("physique.day")}
                        </div>
                        <select
                          value={birthDay === "" || birthDay == null ? "" : Number(birthDay)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            patchBirth(raw === "" ? "" : Number(raw), birthMonth, birthYear);
                          }}
                          className="ms-profile-field"
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">{to("physique.day")}</option>
                          {dayOpts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "block" }}>
                        <div className="ms-profile-label">
                          {to("physique.month")}
                        </div>
                        <select
                          value={birthMonth === "" || birthMonth == null ? "" : Number(birthMonth)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            patchBirth(birthDay, raw === "" ? "" : Number(raw), birthYear);
                          }}
                          className="ms-profile-field"
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">{to("physique.month")}</option>
                          {BIRTH_MONTH_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{to(`months.${o.value}`)}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "block" }}>
                        <div className="ms-profile-label">
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
                          className="ms-profile-field"
                        />
                      </label>
                    </div>
                    <div className="ms-profile-label">
                      {to("physique.sexe")}
                    </div>
                    <div className="ms-profile-choice-wrap">
                      {GENDER_OPTIONS.filter((opt) => opt.id !== "autre").map((opt) => {
                        const active = profile?.gender === opt.id;
                        const labelKey = opt.id === "homme" ? "physique.sexeHomme" : "physique.sexeFemme";
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onSwimmerProfileChange({ gender: active ? "" : opt.id })}
                            className={`ms-profile-choice${active ? " is-active" : ""}`}
                          >
                            {to(labelKey)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="ms-profile-metrics-grid">
                      {[
                        { key: "weightKg", label: "Poids", placeholder: "kg" },
                        { key: "heightCm", label: "Taille", placeholder: "cm" },
                      ].map(({ key, label, placeholder }) => (
                        <label key={key} style={{ display: "block" }}>
                          <div className="ms-profile-label">{label}</div>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={profile?.[key] ?? ""}
                            placeholder={placeholder}
                            onChange={(e) => {
                              const raw = e.target.value;
                              onSwimmerProfileChange({ [key]: raw === "" ? "" : Number(raw) });
                            }}
                            className="ms-profile-field"
                          />
                        </label>
                      ))}
                    </div>
                  </>
                );
              })()}
            </ProfileSection>
            ) : null}

            {(!iosNav || profileLane === "natation") ? (
            <ProfileSection
              id="profile-natation"
              title="Ma natation"
              summary={`${Number(profile?.pool) === 50 ? "50 m" : "25 m"} · ${profile?.level || "niveau"} · ${profile?.sessionsPerWeek ? `${profile.sessionsPerWeek}×/sem` : "fréquence"}`}
              icon={Waves}
              defaultOpen
              bare={iosNav}
            >
              {!iosNav ? (
              <p className="ms-profile-hint">
                Bassin et matériel calent les éducatifs. Le plan a été généré en 25 m, sans matériel, tant que tu ne changes rien ici.
              </p>
              ) : null}
              <div className="ms-profile-label">Niveau</div>
              <div className="ms-profile-choice-wrap">
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
                      className={`ms-profile-choice${active ? " is-active" : ""}`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
              {isBeginnerBlockedForGoal(profile?.goal) ? (
                <p className="ms-profile-hint" style={{ marginTop: -6 }}>
                  {to("level.beginnerBlocked")}
                </p>
              ) : null}
              <div className="ms-profile-label">Bassin</div>
              <div className="ms-profile-choice-row">
                {POOLS.map((p) => {
                  const active = Number(draftNatation.pool) === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDraftNatation((prev) => ({ ...prev, pool: p.id }))}
                      className={`ms-profile-choice is-fill${active ? " is-active" : ""}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="ms-profile-label">Fréquence</div>
              <FrequencyGauge
                value={draftNatation.sessionsPerWeek}
                onChange={(next) => setDraftNatation((prev) => ({ ...prev, sessionsPerWeek: next }))}
              />
              {!hidesFourNagesChoice({ ...profile, ...draftNatation }) && (
                <>
                  <div className="ms-profile-label">
                    Sais-tu nager du 4 nages ?
                  </div>
                  <div className="ms-profile-choice-row">
                    {SWIM_STYLES.map((s) => {
                      const active = (draftNatation.swimStyle || "crawl") === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setDraftNatation((prev) => ({ ...prev, swimStyle: s.id }))}
                          className={`ms-profile-choice is-fill${active ? " is-active" : ""}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </ProfileSection>
            ) : null}
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

        {onEquipmentChange && (!iosNav || profileLane === "materiel") && (
        iosNav ? (
          <div className="ios-equip">
            <p className="ios-equip-lead">
              Indique le matériel que tu as au bassin. On l’intègre dans tes séances seulement quand c’est utile.
            </p>
            <div className="ios-equip-grid">
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
                    className={`ios-equip-item${active ? " is-active" : ""}`}
                  >
                    <span className="ios-equip-icon">
                      {imgSrc ? (
                        <img src={imgSrc} alt="" />
                      ) : null}
                    </span>
                    <span className="ios-equip-name">{eqLabel(o.id)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
        <ProfileSection
          id="profile-equipment"
          title="Mon matériel"
          summary={Array.isArray(profile?.equipment) && profile.equipment.length > 0
            ? profile.equipment.map((id) => eqLabel(id)).join(" · ")
            : "Aucun matériel"}
          icon={Package}
          defaultOpen={false}
        >
          <p className="ms-profile-hint">
            Coche ce que tu as au bord du bassin. On l’utilise seulement quand c’est utile, jamais de matos que tu n’as pas.
          </p>
          <div className="ms-equip-grid">
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
                  className={`ms-equip-tile${active ? " is-active" : ""}`}
                >
                  <span className="ms-equip-tile-thumb">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        width={36}
                        height={36}
                      />
                    ) : null}
                  </span>
                  <span className="ms-equip-tile-label">
                    {eqLabel(o.id)}
                  </span>
                  <span aria-hidden className="ms-equip-tile-check">
                    {active ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setDraftEquipment([])}
            disabled={draftEquipment.length === 0}
            className={`ms-equip-none${draftEquipment.length === 0 ? " is-active" : ""}`}
          >
            Aucun matériel
          </button>
        </ProfileSection>
        )
        )}

        {onSwimmerProfileChange && (!iosNav || profileLane === "objectif") && (
          <>
          {iosNav ? (
            <div className="ms-glass-card" style={{ padding: "18px 16px", marginBottom: 16, borderRadius: 28 }}>
              <div className="ios-profile-goal-head">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ms-profile-label">Objectif</div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: G.ink, letterSpacing: "-0.02em" }}>
                    {iosGoal.familyLabel}
                  </h2>
                  {iosGoal.targetLabel ? (
                    <p className="ios-profile-goal-meta">{iosGoal.targetLabel}</p>
                  ) : null}
                  {iosGoal.dateLabel ? (
                    <p className="ios-profile-goal-meta">{iosGoal.dateLabel}</p>
                  ) : null}
                  {iosGoal.freqLabel ? (
                    <p className="ios-profile-goal-meta">{iosGoal.freqLabel}</p>
                  ) : null}
                  {iosGoal.weekLabel ? (
                    <p className="ios-profile-goal-meta">{iosGoal.weekLabel}</p>
                  ) : null}
                  {goalBusy ? (
                    <p className="ios-profile-goal-meta">On adapte tes prochaines séances…</p>
                  ) : null}
                </div>
                {onChangeGoal ? (
                  <button
                    type="button"
                    className="ios-profile-goal-edit"
                    aria-label="Modifier l'objectif"
                    disabled={goalBusy}
                    onClick={() => {
                      if (!access.canUpdateProgram) {
                        onUpgrade?.("trial_expired");
                        return;
                      }
                      setGoalPickerOpen(true);
                    }}
                  >
                    <Pencil size={16} strokeWidth={2.2} />
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
          <ProfileSection
            id="profile-health"
            title="Santé et blessures"
            summary={
              profile?.injuryStatus === "oui"
                ? formatInjurySummary(profile)
                : (profile?.injuryStatus === "aucune" ? "Aucune blessure" : "À compléter")
            }
            icon={HeartPulse}
            defaultOpen={false}
          >
            <div className="ms-profile-label">Blessure</div>
            <div className="ms-profile-choice-row">
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
                        onSwimmerProfileChange(clearInjuries());
                      } else {
                        onSwimmerProfileChange({ injuryStatus: "oui" });
                      }
                    }}
                    className={`ms-profile-choice is-fill${active ? " is-active" : ""}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {profile?.injuryStatus === "oui" && (
              <>
                <div className="ms-profile-label">Zones</div>
                <p className="ms-profile-hint">
                  Tu peux en cocher plusieurs, chacune avec sa gravité. Le programme ne se réécrit pas tout seul, ça nous aide à mieux te connaître.
                </p>
                <div className="ms-profile-choice-wrap">
                  {INJURY_ZONES.map((z) => {
                    const active = declaredInjuries.some((i) => i.zone === z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => onSwimmerProfileChange(toggleInjuryZone(declaredInjuries, z.id))}
                        className={`ms-profile-choice${active ? " is-active" : ""}`}
                      >
                        {z.label}
                      </button>
                    );
                  })}
                </div>
                {declaredInjuries.map((item) => {
                  const zoneLabel = INJURY_ZONES.find((z) => z.id === item.zone)?.label || item.zone;
                  return (
                    <div key={item.zone} style={{ marginBottom: 12 }}>
                      <div className="ms-profile-label">
                        Gravité · {zoneLabel}
                      </div>
                      <div className="ms-profile-choice-wrap">
                        {INJURY_SEVERITIES.map((s) => {
                          const active = item.severity === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => onSwimmerProfileChange(setInjurySeverity(declaredInjuries, item.zone, s.id))}
                              className={`ms-profile-choice${active ? " is-active" : ""}`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasInjuryConsent(profile)}
                onChange={(e) => {
                  const v = e.target.checked;
                  const at = v ? new Date().toISOString() : null;
                  onSwimmerProfileChange({
                    injuryConsent: v,
                    injuryConsentAt: at,
                  });
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>
                {INJURY_CONSENT_CHECKBOX}
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasHeartRateConsent(profile)}
                onChange={(e) => {
                  const v = e.target.checked;
                  const at = v ? new Date().toISOString() : null;
                  onSwimmerProfileChange({
                    heartRateConsent: v,
                    heartRateConsentAt: at,
                  });
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>
                {HEART_RATE_CONSENT_CHECKBOX}
              </span>
            </label>
          </ProfileSection>
          )}
          </>
        )}
      </div>
      </AppShell>

      {iosNav && onChangeGoal ? (
        <IosGoalPickerSheet
          open={goalPickerOpen}
          profile={profile}
          onClose={() => setGoalPickerOpen(false)}
          onCommit={(patch) => {
            setGoalPickerOpen(false);
            if (isSameGoalPatch(profile, patch)) return;
            setPendingGoalPatch(patch);
            setGoalConfirmOpen(true);
          }}
        />
      ) : null}
      {goalConfirmOpen && pendingGoalPatch && createPortal(
        <ConfirmSheet
          title="Modifier ton objectif ?"
          message="Tes prochaines séances s'adaptent à ce nouvel objectif. Les séances déjà validées sont conservées. Continuer ?"
          confirmLabel="Oui, adapter mon plan"
          cancelLabel="Annuler"
          destructive={false}
          icon={Target}
          onCancel={() => {
            setGoalConfirmOpen(false);
            setPendingGoalPatch(null);
          }}
          onConfirm={() => {
            const patch = pendingGoalPatch;
            setGoalConfirmOpen(false);
            setPendingGoalPatch(null);
            if (!patch || !onChangeGoal) return;
            setGoalBusy(true);
            Promise.resolve(onChangeGoal(patch)).finally(() => setGoalBusy(false));
          }}
        />,
        document.body,
      )}

      {profileDirty && !iosCover && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 120,
            padding: "12px max(16px, env(safe-area-inset-left)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-right))",
            background: "rgba(247, 251, 255, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(15,27,45,0.08)",
            boxShadow: "0 -12px 32px rgba(15, 60, 120, 0.1)",
          }}
        >
          <div className="app-shell" style={{ display: "flex", gap: 10, maxWidth: "var(--app-max)", margin: "0 auto" }}>
            <button
              type="button"
              onClick={() => {
                playUiSound("soft");
                resetDirtyDrafts();
              }}
              className="ms-pill-cta ms-pill-cta-secondary"
              style={{ flex: 1 }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                playUiSound("success");
                handleStickySave();
              }}
              className="ms-pill-cta"
              style={{ flex: 1.5 }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </AppTabShell>
  );
}
