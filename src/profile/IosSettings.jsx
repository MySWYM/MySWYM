/**
 * Paramètres iOS : IA type GOWOD, DA soft mist.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check, ChevronRight, Mail, RotateCcw, Lock, Shield, CircleHelp, Info, Languages,
  FileText, LogOut, HeartPulse, CreditCard, Activity, AlertTriangle, Bell, Smartphone, Monitor,
  Waves, Flame, Award, Users, MessageCircle, Sparkles, Newspaper, Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { setAppLanguage } from "../i18n/index.js";
import { APP_LANGUAGES, normalizeAppLanguage } from "../i18n/languages.js";
import FlagMark from "../i18n/FlagMark.jsx";
import { withLocalePrefix } from "../i18n/locale-path.js";
import { supabase } from "../supabase.js";
import { isNativeApp } from "../lib/native-platform.js";
import {
  buildAccountExportPayload,
  downloadAccountExport,
  hasEmailPasswordProvider,
} from "../lib/account-export.js";
import {
  formatDeviceSeenAt,
  listUserDevices,
  revokeAllUserDevices,
  revokeOtherUserDevices,
  revokeUserDevice,
} from "../lib/user-devices.js";
import {
  notificationPrefsFromUser,
  setPushPref,
  setEmailNewsPref,
} from "../lib/notification-prefs.js";
import { countryFlagSrc } from "../lib/countries.js";
import { PanelShell } from "../ProfileHelpPanels.jsx";
import TimedUndoAction from "../ui/TimedUndoAction.jsx";
import ConfirmSheet from "../sheets/ConfirmSheet.jsx";

function StatusCheck({ on }) {
  return (
    <span className={`ios-settings-check${on ? " is-on" : ""}`} aria-hidden>
      <Check size={15} strokeWidth={2.8} />
    </span>
  );
}

function SettingsRow({ icon: Icon, mark, title, value, hint, onClick, href, external, chevron, trailing }) {
  const showChevron = chevron ?? Boolean(onClick || href);
  const inner = (
    <>
      {mark ? (
        <span className="ms-profile-settings-icon" style={{ background: "transparent" }}>
          {mark}
        </span>
      ) : Icon ? (
        <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
          <Icon size={18} color={G.blue} />
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ms-profile-settings-label" style={{ display: "block" }}>{title}</span>
        {hint ? (
          <span className="ms-profile-settings-hint" style={{ display: "block" }}>{hint}</span>
        ) : null}
      </span>
      {value ? <span className="ms-profile-account-value">{value}</span> : null}
      {trailing}
      {showChevron ? <ChevronRight size={18} color={G.greyMid} /> : null}
    </>
  );
  if (href) {
    return (
      <a
        className="ms-profile-account-row"
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={() => playUiSound("soft")}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {inner}
      </a>
    );
  }
  if (!onClick) {
    return <div className="ms-profile-account-row is-static">{inner}</div>;
  }
  // Trailing = souvent un <button> (switch) : pas de <button> parent (HTML invalide → clic mort sur iOS).
  if (trailing) {
    return (
      <div
        className="ms-profile-account-row"
        role="button"
        tabIndex={0}
        onClick={() => {
          playUiSound("soft");
          onClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            playUiSound("soft");
            onClick();
          }
        }}
      >
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="ms-profile-account-row"
      onClick={() => {
        playUiSound("soft");
        onClick();
      }}
    >
      {inner}
    </button>
  );
}

export function IosLanguagePanel({ onBack }) {
  const { t, i18n } = useTranslation("settings");
  const lng = normalizeAppLanguage(i18n.language);
  const [pendingId, setPendingId] = useState(null);
  const pending = APP_LANGUAGES.find((l) => l.id === pendingId) || null;

  return (
    <PanelShell title={t("language.panelTitle")} onBack={onBack}>
      <p className="ios-settings-lead">{t("language.panelLead")}</p>
      <div className="ios-settings-choice-list">
        {APP_LANGUAGES.map((opt) => {
          const active = lng === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`ios-settings-choice${active ? " is-active" : ""}`}
              onClick={() => {
                playUiSound("soft");
                if (opt.id !== lng) setPendingId(opt.id);
              }}
            >
              <FlagMark code={opt.flag} size={28} className="ios-flag-circle" />
              <span className="ios-settings-choice-label">{opt.name}</span>
              {active ? <StatusCheck on /> : null}
            </button>
          );
        })}
      </div>
      {pending && createPortal(
        <ConfirmSheet
          title={t("language.confirmTitle")}
          message={t("language.confirmMessage", { language: pending.name })}
          confirmLabel={t("language.confirmAction")}
          cancelLabel={t("language.cancel")}
          destructive={false}
          icon={Languages}
          onConfirm={() => {
            playUiSound("tap");
            setAppLanguage(pending.id);
            setPendingId(null);
          }}
          onCancel={() => {
            playUiSound("soft");
            setPendingId(null);
          }}
        />,
        document.body,
      )}
    </PanelShell>
  );
}

export function IosPasswordPanel({ user, onBack, onMsg }) {
  const { t } = useTranslation("app");
  const canPwd = hasEmailPasswordProvider(user);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const save = async () => {
    if (next.length < 6) {
      setError(t("settings.passwordMin"));
      setOk(false);
      return;
    }
    if (next !== confirm) {
      setError(t("settings.passwordMismatch"));
      setOk(false);
      return;
    }
    if (!current) {
      setError(t("settings.passwordNeedCurrent"));
      setOk(false);
      return;
    }
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      const email = user?.email;
      if (!email) throw new Error(t("settings.passwordNoEmail"));
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) throw new Error(t("settings.passwordWrong"));
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) throw upErr;
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk(true);
      playUiSound("success");
      onMsg?.({ type: "ok", text: t("settings.passwordUpdated") });
    } catch (e) {
      setError(e?.message || t("settings.passwordFail"));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const email = user?.email;
    if (!email) {
      setError(t("settings.passwordNoEmail"));
      return;
    }
    setResetBusy(true);
    setError(null);
    try {
      const { requestPasswordReset } = await import("../lib/password-reset.js");
      await requestPasswordReset(email);
      playUiSound("success");
      onMsg?.({ type: "ok", text: t("settings.passwordResetSent") });
      setOk(false);
    } catch (e) {
      const raw = typeof e?.message === "string" && e.message !== "[object Object]"
        ? e.message
        : t("settings.passwordResetFail");
      setError(raw);
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <PanelShell title={t("settings.passwordTitle")} onBack={onBack}>
      {!canPwd ? (
        <p className="ios-settings-lead">
          {t("settings.passwordApple")}
        </p>
      ) : (
        <>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">{t("settings.passwordCurrent")}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder={t("settings.passwordCurrent")}
            />
          </label>
          <button type="button" className="ios-settings-text-btn" onClick={forgot} disabled={resetBusy}>
            {resetBusy ? t("settings.passwordSending") : t("settings.passwordForgot")}
          </button>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">{t("settings.passwordNew")}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder={t("settings.passwordNew")}
            />
          </label>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">{t("settings.passwordConfirm")}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("settings.passwordConfirm")}
            />
          </label>
          {error ? <p className="ios-settings-alert is-err">{error}</p> : null}
          {ok ? <p className="ios-settings-alert is-ok">{t("settings.passwordUpdated")}</p> : null}
          <button
            type="button"
            className="ms-pill-cta ios-settings-save"
            onClick={save}
            disabled={busy || !current || !next || !confirm}
          >
            {busy ? "…" : t("settings.save")}
          </button>
        </>
      )}
    </PanelShell>
  );
}

export function IosDataPanel({
  user,
  profile,
  onBack,
  onMsg,
  newsletterOn,
  newsletterBusy,
  onToggleNewsletter,
  onDeleteAccount,
  deleteBusy,
  deleteErr,
  deleteGate,
  deleteWarning,
  onOpenDevices,
}) {
  const { t } = useTranslation("app");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportNote, setExportNote] = useState(null);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);

  const exportData = async () => {
    setExportBusy(true);
    setExportNote(null);
    try {
      const payload = buildAccountExportPayload({ user, profile });
      const res = await downloadAccountExport(payload);
      if (res.aborted) return;
      playUiSound("success");
      const text = res.shared ? t("settings.dataShared") : t("settings.dataStarted");
      setExportNote({ type: "ok", text });
      onMsg?.({ type: "ok", text });
    } catch (e) {
      const text = e?.message || t("settings.dataFail");
      setExportNote({ type: "err", text });
      onMsg?.({ type: "err", text });
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <PanelShell title={t("settings.data")} onBack={onBack}>
      <p className="ios-settings-copy">{t("settings.dataLead")}</p>
      <p className="ios-settings-copy">{t("settings.dataNotSold")}</p>
      <p className="ios-settings-copy">{t("settings.dataDownloadLead")}</p>
      <button
        type="button"
        className="ms-pill-cta"
        style={{ width: "100%", minHeight: 52, margin: "8px 0 24px" }}
        onClick={exportData}
        disabled={exportBusy}
      >
        {exportBusy ? t("settings.dataPreparing") : t("settings.dataDownload")}
      </button>
      {exportNote ? (
        <p className={`ios-settings-alert ${exportNote.type === "err" ? "is-err" : "is-ok"}`}>
          {exportNote.text}
        </p>
      ) : null}

      {onOpenDevices ? (
        <>
          <div className="ms-profile-group-label">{t("devices.title")}</div>
          <div className="ms-profile-account-stack" style={{ marginBottom: 20 }}>
            <SettingsRow
              icon={Smartphone}
              title={t("devices.title")}
              hint={t("devices.rowHint")}
              onClick={() => {
                playUiSound("soft");
                onOpenDevices();
              }}
            />
          </div>
        </>
      ) : null}

      <div className="ms-profile-group-label">{t("settings.news")}</div>
      <div className="ms-profile-account-stack">
        <div className="ms-profile-account-row is-static">
          <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
            <Mail size={18} color={G.blue} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ms-profile-settings-label">{t("settings.newsTitle")}</div>
            <div className="ms-profile-settings-hint">{t("settings.newsHint")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={newsletterOn}
            aria-busy={newsletterBusy}
            className={`ms-menu-switch${newsletterOn ? " is-on" : ""}`}
            onClick={onToggleNewsletter}
            disabled={newsletterBusy}
          >
            <span />
          </button>
        </div>
      </div>

      <p className="ios-settings-copy">
        {t("settings.dataDeleteLead")}
      </p>
      <p className="ios-settings-warn">{t("settings.irreversible")}</p>
      {user && onDeleteAccount ? (
        <>
          {deleteGate?.allowed ? (
            deleteWarning ? (
              <p className="ios-settings-copy" style={{ marginBottom: 8 }}>
                {deleteWarning}
              </p>
            ) : null
          ) : null}
          <div style={{ margin: "8px 0 12px" }}>
            <TimedUndoAction
              disabled={deleteBusy || deleteGate?.code === "pending"}
              busy={deleteBusy}
              blocked={deleteGate?.code !== "pending" && !deleteGate?.allowed}
              onBlocked={() => {
                playUiSound("soft");
                setDeleteBlockedOpen(true);
              }}
              onCommit={() => {
                playUiSound("soft");
                return onDeleteAccount();
              }}
            />
          </div>
          {deleteErr ? <p className="ios-settings-alert is-err">{deleteErr}</p> : null}
        </>
      ) : null}
      {deleteBlockedOpen && createPortal(
        <ConfirmSheet
          title={t("settings.deleteBlockedTitle")}
          message={t("settings.deleteBlockedBody")}
          confirmLabel={t("settings.gotIt")}
          cancelLabel={null}
          destructive={false}
          icon={AlertTriangle}
          onConfirm={() => setDeleteBlockedOpen(false)}
          onCancel={() => setDeleteBlockedOpen(false)}
        />,
        document.body,
      )}
    </PanelShell>
  );
}

export function IosSettingsHome({
  user,
  onRefreshStatus,
  stravaConnected,
  healthConnected,
  onOpenStrava,
  onOpenHealth,
  onOpenSubscription,
  onOpenLanguage,
  onOpenPassword,
  onOpenData,
  onOpenHelp,
  onOpenLegal,
  onOpenNotifications,
  onSignOut,
}) {
  const { t, i18n } = useTranslation("settings");
  const { t: ta } = useTranslation("app");
  const lng = normalizeAppLanguage(i18n.language);
  const lang = APP_LANGUAGES.find((l) => l.id === lng);
  const faqHref = withLocalePrefix("/faq", lng);
  const [restoreBusy, setRestoreBusy] = useState(false);

  return (
    <>
      {user?.email ? (
        <p className="ios-settings-email">{user.email}</p>
      ) : null}

      <div className="ms-profile-account-stack">
        <SettingsRow
          icon={RotateCcw}
          title={restoreBusy ? ta("settings.restoring") : ta("settings.restore")}
          chevron={false}
          onClick={async () => {
            if (restoreBusy) return;
            setRestoreBusy(true);
            try {
              await onRefreshStatus?.();
            } finally {
              setRestoreBusy(false);
            }
          }}
        />
      </div>

      <div className="ms-profile-group-label">{ta("settings.connect")}</div>
      <div className="ms-profile-account-stack">
        <SettingsRow
          icon={Activity}
          title="Strava"
          chevron={false}
          trailing={<StatusCheck on={!!stravaConnected} />}
          onClick={onOpenStrava}
        />
        {isNativeApp() ? (
          <SettingsRow
            icon={HeartPulse}
            title={ta("settings.health")}
            chevron={false}
            trailing={<StatusCheck on={!!healthConnected} />}
            onClick={onOpenHealth}
          />
        ) : null}
        <SettingsRow
          icon={Bell}
          title={ta("settings.notifications")}
          hint={ta("settings.notificationsHint")}
          onClick={() => {
            playUiSound("soft");
            onOpenNotifications?.();
          }}
        />
      </div>

      <div className="ms-profile-group-label">{ta("settings.subscription")}</div>
      <div className="ms-profile-account-stack">
        <SettingsRow icon={CreditCard} title={ta("settings.subscription")} onClick={onOpenSubscription} />
      </div>

      <div className="ms-profile-group-label">{ta("settings.account")}</div>
      <div className="ms-profile-account-stack">
        <SettingsRow
          mark={<FlagMark code={lang?.flag || "FR"} size={28} className="ios-flag-circle" />}
          title={t("language.section")}
          value={lang?.name || "Français"}
          onClick={onOpenLanguage}
        />
        <SettingsRow icon={Lock} title={ta("settings.password")} onClick={onOpenPassword} />
        <SettingsRow icon={Shield} title={ta("settings.data")} onClick={onOpenData} />
        <SettingsRow icon={CircleHelp} title={ta("settings.faq")} href={faqHref} external />
        <SettingsRow icon={Info} title={ta("settings.help")} onClick={onOpenHelp} />
        <SettingsRow icon={FileText} title={ta("settings.policies")} onClick={onOpenLegal} />
      </div>

      <button
        type="button"
        className="ios-settings-logout"
        onClick={() => {
          playUiSound("soft");
          onSignOut?.();
        }}
      >
        <LogOut size={18} strokeWidth={2.2} />
        {ta("settings.signOut")}
      </button>
    </>
  );
}

function deviceSeenLabel(t, iso) {
  const token = formatDeviceSeenAt(iso);
  if (token === "now") return t("devices.seenNow");
  if (token.endsWith("m")) return t("devices.seenMin", { n: token.replace("m", "") });
  if (token.endsWith("h")) return t("devices.seenHours", { n: token.replace("h", "") });
  if (token.endsWith("d")) return t("devices.seenDays", { n: token.replace("d", "") });
  return t("devices.seen", { when: token || "-" });
}

export function IosDevicesPanel({ onBack, onSignOut }) {
  const { t } = useTranslation("app");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [devices, setDevices] = useState([]);
  const [busyKey, setBusyKey] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'one'|'others'|'all', device_key? }

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listUserDevices();
      setDevices(Array.isArray(res.devices) ? res.devices : []);
    } catch {
      setErr(t("devices.fail"));
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const runAction = async () => {
    if (!confirm) return;
    const kind = confirm.kind;
    const targetKey = confirm.device_key;
    setBusyKey(kind === "one" ? targetKey : kind);
    setConfirm(null);
    try {
      if (kind === "one") {
        const res = await revokeUserDevice(targetKey);
        playUiSound("success");
        if (res?.self_revoked) {
          onSignOut?.();
          return;
        }
      } else if (kind === "others") {
        await revokeOtherUserDevices();
        playUiSound("success");
      } else if (kind === "all") {
        await revokeAllUserDevices();
        playUiSound("success");
        onSignOut?.();
        return;
      }
      await reload();
    } catch {
      setErr(t("devices.fail"));
    } finally {
      setBusyKey(null);
    }
  };

  const others = devices.filter((d) => !d.is_current);

  return (
    <PanelShell title={t("devices.title")} onBack={onBack}>
      <p className="ios-settings-copy">{t("devices.lead")}</p>
      {loading ? <p className="ios-settings-copy">{t("devices.loading")}</p> : null}
      {err ? <p className="ios-settings-alert is-err">{err}</p> : null}

      {!loading && devices.length === 0 && !err ? (
        <p className="ios-settings-copy">{t("devices.empty")}</p>
      ) : null}

      <div className="ios-devices-list">
        {devices.map((d) => {
          const Icon = d.platform === "ios" || d.platform === "android" ? Smartphone : Monitor;
          const flag = d.country_code ? countryFlagSrc(d.country_code) : "";
          const meta = [d.country_code, d.last_ip].filter(Boolean).join(" · ");
          return (
            <div key={d.device_key} className={`ios-device-card${d.is_current ? " is-current" : ""}`}>
              <span className="ios-device-icon" aria-hidden>
                <Icon size={20} color={G.blue} strokeWidth={2.2} />
              </span>
              <div className="ios-device-body">
                <div className="ios-device-name">{d.label || "Appareil"}</div>
                {meta ? (
                  <div className="ios-device-meta">
                    {flag ? <img src={flag} alt="" width={14} height={14} className="ios-device-flag" /> : null}
                    <span>{meta}</span>
                  </div>
                ) : null}
                <div className="ios-device-meta">
                  {t("devices.seen", { when: deviceSeenLabel(t, d.last_seen_at) })}
                </div>
                {d.is_current ? (
                  <div className="ios-device-badge">{t("devices.current")}</div>
                ) : (
                  <button
                    type="button"
                    className="ios-device-revoke"
                    disabled={Boolean(busyKey)}
                    onClick={() => {
                      playUiSound("soft");
                      setConfirm({ kind: "one", device_key: d.device_key });
                    }}
                  >
                    {busyKey === d.device_key ? t("devices.loading") : t("devices.revoke")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {others.length > 0 ? (
        <button
          type="button"
          className="ios-devices-danger"
          disabled={Boolean(busyKey)}
          onClick={() => {
            playUiSound("soft");
            setConfirm({ kind: "others" });
          }}
        >
          {busyKey === "others" ? t("devices.loading") : t("devices.revokeOthers")}
        </button>
      ) : null}

      <button
        type="button"
        className="ios-devices-danger is-strong"
        disabled={Boolean(busyKey) || devices.length === 0}
        onClick={() => {
          playUiSound("soft");
          setConfirm({ kind: "all" });
        }}
      >
        {busyKey === "all" ? t("devices.loading") : t("devices.revokeAll")}
      </button>

      {confirm && createPortal(
        <ConfirmSheet
          title={
            confirm.kind === "one"
              ? t("devices.revokeConfirmTitle")
              : confirm.kind === "others"
                ? t("devices.revokeOthersTitle")
                : t("devices.revokeAllTitle")
          }
          message={
            confirm.kind === "one"
              ? t("devices.revokeConfirmBody")
              : confirm.kind === "others"
                ? t("devices.revokeOthersBody")
                : t("devices.revokeAllBody")
          }
          confirmLabel={t("devices.revoke")}
          cancelLabel={t("sheet.cancel")}
          destructive
          icon={LogOut}
          onConfirm={() => { void runAction(); }}
          onCancel={() => setConfirm(null)}
        />,
        document.body,
      )}
    </PanelShell>
  );
}

function NotifPrefRow({ icon: Icon, title, hint, on, busy, onToggle }) {
  return (
    <div className="ios-notif-row">
      <span className="ios-notif-row-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="ios-notif-row-text">
        <span className="ios-notif-row-title">{title}</span>
        {hint ? <span className="ios-notif-row-hint">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!!on}
        aria-busy={!!busy}
        className={`ms-menu-switch${on ? " is-on" : ""}`}
        disabled={busy}
        onClick={() => {
          playUiSound("soft");
          onToggle?.();
        }}
      >
        <span />
      </button>
    </div>
  );
}

function NotifLockedRow({ icon: Icon, title, hint }) {
  return (
    <div className="ios-notif-row is-locked">
      <span className="ios-notif-row-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="ios-notif-row-text">
        <span className="ios-notif-row-title">{title}</span>
        {hint ? <span className="ios-notif-row-hint">{hint}</span> : null}
      </span>
    </div>
  );
}

export function IosNotificationsPanel({ user, plan, onBack, onUserUpdated }) {
  const { t } = useTranslation("app");
  const native = isNativeApp();
  const [channel, setChannel] = useState(native ? "push" : "email");
  const [prefs, setPrefs] = useState(() => notificationPrefsFromUser(user));
  const [busyKey, setBusyKey] = useState(null);
  const [err, setErr] = useState(null);
  const [masterOn, setMasterOn] = useState(false);
  const [masterBusy, setMasterBusy] = useState(false);
  const [deniedSheet, setDeniedSheet] = useState(false);

  useEffect(() => {
    setPrefs(notificationPrefsFromUser(user));
  }, [user?.id, user?.user_metadata?.notification_prefs, user?.user_metadata?.newsletter_opt_in]);

  useEffect(() => {
    if (!native) return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const { notificationsSwitchOn } = await import("../lib/native-push.js");
        const on = await notificationsSwitchOn();
        if (!cancelled) setMasterOn(on);
      } catch {
        if (!cancelled) setMasterOn(false);
      }
    };
    void refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("myswym:push-pref", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("myswym:push-pref", refresh);
    };
  }, [native]);

  const resyncLocal = async (nextUser) => {
    try {
      const { syncLocalNotificationsFromState } = await import("../lib/sync-local-notifications.js");
      await syncLocalNotificationsFromState({ user: nextUser || user, plan });
    } catch { /* ignore */ }
  };

  const toggleMaster = async () => {
    if (masterBusy || !native) return;
    const next = !masterOn;
    setMasterBusy(true);
    setErr(null);
    try {
      const mod = await import("../lib/native-push.js");
      if (!next) {
        const res = await mod.disableNativeNotifications();
        setMasterOn(res?.enabled === true);
        await resyncLocal(user);
        return;
      }
      const { getLocalNotificationPermission } = await import("../lib/native-local-notifications.js");
      const perm = await Promise.race([
        getLocalNotificationPermission(),
        new Promise((resolve) => { window.setTimeout(() => resolve("prompt"), 1200); }),
      ]);
      if (perm === "denied") {
        setMasterOn(false);
        setDeniedSheet(true);
        return;
      }
      const res = await mod.enableNativeNotifications();
      setMasterOn(res?.enabled === true);
      if (!res?.ok && res?.reason === "denied") setDeniedSheet(true);
      await resyncLocal(user);
    } catch {
      setDeniedSheet(true);
    } finally {
      setMasterBusy(false);
    }
  };

  const togglePush = async (key) => {
    if (busyKey) return;
    const next = !prefs.push[key];
    setBusyKey(`push.${key}`);
    setErr(null);
    try {
      const { user: updated, prefs: nextPrefs, error } = await setPushPref(key, next);
      if (error) throw error;
      if (nextPrefs) setPrefs(nextPrefs);
      if (updated) onUserUpdated?.(updated);
      await resyncLocal(updated);
      playUiSound("success");
    } catch {
      setErr(t("notif.fail"));
    } finally {
      setBusyKey(null);
    }
  };

  const toggleEmailNews = async () => {
    if (busyKey) return;
    const next = !prefs.email.news;
    setBusyKey("email.news");
    setErr(null);
    try {
      const { user: updated, prefs: nextPrefs, error } = await setEmailNewsPref(next);
      if (error) throw error;
      if (nextPrefs) setPrefs(nextPrefs);
      if (updated) onUserUpdated?.(updated);
      await resyncLocal(updated);
      playUiSound("success");
    } catch {
      setErr(t("notif.fail"));
    } finally {
      setBusyKey(null);
    }
  };

  const pushDisabled = native && !masterOn;

  return (
    <PanelShell title={t("settings.notifications")} onBack={onBack}>
      <p className="ios-settings-copy">{t("notif.lead")}</p>

      <div className="ios-notif-tabs" role="tablist" aria-label={t("settings.notifications")}>
        <button
          type="button"
          role="tab"
          aria-selected={channel === "push"}
          className={`ios-notif-tab${channel === "push" ? " is-on" : ""}`}
          onClick={() => { playUiSound("soft"); setChannel("push"); }}
        >
          {t("notif.tabPush")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={channel === "email"}
          className={`ios-notif-tab${channel === "email" ? " is-on" : ""}`}
          onClick={() => { playUiSound("soft"); setChannel("email"); }}
        >
          {t("notif.tabEmail")}
        </button>
      </div>

      {err ? <p className="ios-settings-alert is-err">{err}</p> : null}

      {channel === "push" ? (
        <>
          {native ? (
            <div className="ios-notif-card" style={{ marginBottom: 16 }}>
              <NotifPrefRow
                icon={Bell}
                title={t("notif.masterTitle")}
                hint={t("notif.masterHint")}
                on={masterOn}
                busy={masterBusy}
                onToggle={() => { void toggleMaster(); }}
              />
            </div>
          ) : (
            <p className="ios-settings-copy">{t("notif.pushWebOnly")}</p>
          )}

          {pushDisabled ? (
            <p className="ios-settings-copy">{t("notif.pushOffLead")}</p>
          ) : null}

          <div className={`ios-notif-section${pushDisabled ? " is-dim" : ""}`}>
            <div className="ios-notif-section-head">
              <span>{t("notif.secAccount")}</span>
              <span className="ios-notif-always">
                <Lock size={12} aria-hidden />
                {t("notif.alwaysOn")}
              </span>
            </div>
            <div className="ios-notif-card">
              <NotifLockedRow
                icon={Shield}
                title={t("notif.securityTitle")}
                hint={t("notif.securityHint")}
              />
              <NotifLockedRow
                icon={CreditCard}
                title={t("notif.billingTitle")}
                hint={t("notif.billingHint")}
              />
            </div>
          </div>

          <div className={`ios-notif-section${pushDisabled ? " is-dim" : ""}`}>
            <div className="ios-notif-section-head">
              <span>{t("notif.secTraining")}</span>
            </div>
            <div className="ios-notif-card">
              <NotifPrefRow
                icon={Waves}
                title={t("notif.sessionTitle")}
                hint={t("notif.sessionHint")}
                on={prefs.push.session}
                busy={busyKey === "push.session"}
                onToggle={() => { if (!pushDisabled) void togglePush("session"); }}
              />
              <NotifPrefRow
                icon={Flame}
                title={t("notif.streakTitle")}
                hint={t("notif.streakHint")}
                on={prefs.push.streak}
                busy={busyKey === "push.streak"}
                onToggle={() => { if (!pushDisabled) void togglePush("streak"); }}
              />
              <NotifPrefRow
                icon={Award}
                title={t("notif.badgesTitle")}
                hint={t("notif.badgesHint")}
                on={prefs.push.badges}
                busy={busyKey === "push.badges"}
                onToggle={() => { if (!pushDisabled) void togglePush("badges"); }}
              />
            </div>
          </div>

          <div className={`ios-notif-section${pushDisabled ? " is-dim" : ""}`}>
            <div className="ios-notif-section-head">
              <span>{t("notif.secSocial")}</span>
            </div>
            <div className="ios-notif-card">
              <NotifPrefRow
                icon={Users}
                title={t("notif.buddyTitle")}
                hint={t("notif.buddyHint")}
                on={prefs.push.buddy}
                busy={busyKey === "push.buddy"}
                onToggle={() => { if (!pushDisabled) void togglePush("buddy"); }}
              />
              <NotifPrefRow
                icon={MessageCircle}
                title={t("notif.supportTitle")}
                hint={t("notif.supportHint")}
                on={prefs.push.support}
                busy={busyKey === "push.support"}
                onToggle={() => { if (!pushDisabled) void togglePush("support"); }}
              />
            </div>
          </div>

          <div className={`ios-notif-section${pushDisabled ? " is-dim" : ""}`}>
            <div className="ios-notif-section-head">
              <span>{t("notif.secProduct")}</span>
            </div>
            <div className="ios-notif-card">
              <NotifPrefRow
                icon={Newspaper}
                title={t("notif.newsPushTitle")}
                hint={t("notif.newsPushHint")}
                on={prefs.push.news}
                busy={busyKey === "push.news"}
                onToggle={() => { if (!pushDisabled) void togglePush("news"); }}
              />
              <NotifPrefRow
                icon={Sparkles}
                title={t("notif.tipsTitle")}
                hint={t("notif.tipsHint")}
                on={prefs.push.product_tips}
                busy={busyKey === "push.product_tips"}
                onToggle={() => { if (!pushDisabled) void togglePush("product_tips"); }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="ios-notif-section">
            <div className="ios-notif-section-head">
              <span>{t("notif.secAccount")}</span>
              <span className="ios-notif-always">
                <Lock size={12} aria-hidden />
                {t("notif.alwaysOn")}
              </span>
            </div>
            <div className="ios-notif-card">
              <NotifLockedRow
                icon={Shield}
                title={t("notif.emailSecurityTitle")}
                hint={t("notif.emailSecurityHint")}
              />
              <NotifLockedRow
                icon={Download}
                title={t("notif.emailBillingTitle")}
                hint={t("notif.emailBillingHint")}
              />
            </div>
          </div>

          <div className="ios-notif-section">
            <div className="ios-notif-section-head">
              <span>{t("notif.secProduct")}</span>
            </div>
            <div className="ios-notif-card">
              <NotifPrefRow
                icon={Mail}
                title={t("settings.newsTitle")}
                hint={t("settings.newsHint")}
                on={prefs.email.news}
                busy={busyKey === "email.news"}
                onToggle={() => { void toggleEmailNews(); }}
              />
            </div>
          </div>
          <p className="ios-settings-copy">{t("notif.emailLead")}</p>
        </>
      )}

      {deniedSheet && createPortal(
        <ConfirmSheet
          title={t("settings.notificationsDeniedTitle")}
          message={t("settings.notificationsDeniedBody")}
          confirmLabel={t("settings.notificationsOpenSettings")}
          cancelLabel={t("settings.notificationsLater")}
          destructive={false}
          icon={Bell}
          zIndex={600}
          onConfirm={async () => {
            setDeniedSheet(false);
            try {
              const mod = await import("../lib/native-push.js");
              await mod.openNativeAppSettings();
            } catch { /* ignore */ }
          }}
          onCancel={() => setDeniedSheet(false)}
        />,
        document.body,
      )}
    </PanelShell>
  );
}

export function IosStravaPanel({ onBack, children }) {
  return (
    <PanelShell title="Strava" onBack={onBack}>
      {children}
    </PanelShell>
  );
}

export function IosAppleHealthPanel({
  connected,
  busy,
  error,
  summary = null,
  onConnect,
  onDisconnect,
  onBack,
}) {
  const { t } = useTranslation("app");
  const swimCount = Number(summary?.swimCount) || 0;
  const bpm = summary?.latestHeartRate;
  const countLine = swimCount > 1
    ? t("settings.healthCountPlural", { count: swimCount })
    : t("settings.healthCount", { count: swimCount });
  return (
    <PanelShell title={t("settings.health")} onBack={onBack}>
      <p className="ios-settings-copy">
        {t("settings.healthLead")}
      </p>
      <p className="ios-settings-copy">
        {t("settings.healthRevoke")}
      </p>
      {connected ? (
        <>
          <p className="ios-settings-alert is-ok">
            {swimCount > 0 ? countLine : t("settings.healthEmpty")}
            {bpm ? ` · ${t("settings.healthBpm", { bpm })}` : ""}
          </p>
          <button
            type="button"
            className="ios-settings-danger"
            onClick={onDisconnect}
            disabled={busy}
          >
            {t("settings.disconnect")}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="ms-pill-cta ios-settings-save"
          onClick={onConnect}
          disabled={busy}
        >
          {busy ? "…" : t("settings.healthConnect")}
        </button>
      )}
      {error ? <p className="ios-settings-alert is-err">{error}</p> : null}
    </PanelShell>
  );
}

export function IosSubscriptionPanel({
  onBack,
  canManageSubscription,
  isPremium,
  applePaid,
  nativeIos,
  access,
  onUpgrade,
  onPortal,
  onCancelSubscription,
  referralSlot,
}) {
  const { t } = useTranslation("app");
  const hint = canManageSubscription
    ? (access.cancelAtPeriodEnd
      ? (applePaid ? t("settings.subUntilApple") : t("settings.subUntilWeb"))
      : (applePaid ? t("settings.subApple") : t("settings.subActive")))
    : isPremium
      ? t("settings.subTrial")
      : t("settings.trialDone");

  return (
    <PanelShell title={t("settings.subscription")} onBack={onBack}>
      <p className="ios-settings-lead">{hint}</p>
      {canManageSubscription ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {applePaid && nativeIos ? (
            <>
              <button
                type="button"
                onClick={() => { void onPortal(); }}
                className="ms-pill-cta ms-pill-cta-secondary"
                style={{ minHeight: 44 }}
              >
                {t("settings.subEdit")}
              </button>
              <button
                type="button"
                onClick={() => { void onPortal(); }}
                className="ios-settings-text-btn"
              >
                {t("settings.subCancel")}
              </button>
            </>
          ) : nativeIos ? (
            <p className="ios-settings-copy">
              {t("settings.subWebOnly")}
            </p>
          ) : applePaid ? (
            <p className="ios-settings-copy">
              {t("settings.subStore")}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPortal()}
                className="ms-pill-cta ms-pill-cta-secondary"
                style={{ minHeight: 44 }}
              >
                {t("settings.subEdit")}
              </button>
              <button
                type="button"
                onClick={() => onCancelSubscription()}
                className="ios-settings-text-btn"
              >
                {t("settings.subCancel")}
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onUpgrade?.("profile")}
          className="ms-pill-cta"
          style={{ width: "100%", minHeight: 44 }}
        >
          {t("premium.cta")}
        </button>
      )}
      {canManageSubscription ? referralSlot : null}
    </PanelShell>
  );
}
