/**
 * Paramètres iOS : IA type GOWOD, DA soft mist.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check, ChevronRight, Mail, RotateCcw, Lock, Shield, CircleHelp, Info, Languages,
  FileText, LogOut, HeartPulse, CreditCard, Activity, AlertTriangle, Bell,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { setAppLanguage } from "../i18n/index.js";
import { APP_LANGUAGES, normalizeAppLanguage } from "../i18n/languages.js";
import FlagMark from "../i18n/FlagMark.jsx";
import { withLocalePrefix } from "../i18n/locale-path.js";
import { supabase } from "../supabase.js";
import { isNativeApp, nativeApiOrigin } from "../lib/native-platform.js";
import {
  buildAccountExportPayload,
  downloadAccountExport,
  hasEmailPasswordProvider,
} from "../lib/account-export.js";
import {
  ACCOUNT_DELETE_BLOCKED_TITLE,
  ACCOUNT_DELETE_BLOCKED_MESSAGE,
} from "../lib/legal-copy.js";
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
      const redirectTo = isNativeApp()
        ? `${nativeApiOrigin()}/app`
        : `${window.location.origin}/app`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetErr) throw resetErr;
      playUiSound("success");
      onMsg?.({ type: "ok", text: t("settings.passwordResetSent") });
      setOk(false);
    } catch (e) {
      setError(e?.message || t("settings.passwordResetFail"));
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
          title={ACCOUNT_DELETE_BLOCKED_TITLE}
          message={ACCOUNT_DELETE_BLOCKED_MESSAGE}
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
  onSignOut,
  onDeleteAccount,
  deleteBusy = false,
  deleteErr = null,
  deleteGate = null,
  deleteWarning = "",
}) {
  const { t, i18n } = useTranslation("settings");
  const { t: ta } = useTranslation("app");
  const lng = normalizeAppLanguage(i18n.language);
  const lang = APP_LANGUAGES.find((l) => l.id === lng);
  const faqHref = withLocalePrefix("/faq", lng);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return undefined;
    let cancelled = false;
    import("../lib/native-push.js").then(({ notificationsSwitchOn }) => (
      notificationsSwitchOn().then((on) => {
        if (!cancelled) setNotifOn(on);
      })
    )).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
          <>
            <SettingsRow
              icon={HeartPulse}
              title={ta("settings.health")}
              chevron={false}
              trailing={<StatusCheck on={!!healthConnected} />}
              onClick={onOpenHealth}
            />
            <SettingsRow
              icon={Bell}
              title={ta("settings.notifications")}
              hint={ta("settings.notificationsHint")}
              chevron={false}
              trailing={(
                <button
                  type="button"
                  role="switch"
                  aria-label={ta("settings.notifications")}
                  aria-checked={notifOn}
                  aria-busy={notifBusy}
                  className={`ms-menu-switch${notifOn ? " is-on" : ""}`}
                  disabled={notifBusy}
                  onClick={async () => {
                    if (notifBusy) return;
                    const next = !notifOn;
                    setNotifBusy(true);
                    setNotifMsg("");
                    try {
                      const mod = await import("../lib/native-push.js");
                      const res = next
                        ? await mod.enableNativeNotifications()
                        : await mod.disableNativeNotifications();
                      setNotifOn(res?.enabled === true);
                      if (next && !res?.ok) {
                        // Refus iOS : sheet avec chemin + CTA Réglages (pas seulement une ligne).
                        if (res?.reason === "denied" || res?.reason === "not_asked") {
                          setNotifSettingsOpen(true);
                        } else {
                          setNotifMsg(ta("settings.notificationsDenied"));
                        }
                      }
                    } catch {
                      setNotifOn(false);
                      setNotifSettingsOpen(true);
                    } finally {
                      setNotifBusy(false);
                    }
                  }}
                >
                  <span />
                </button>
              )}
            />
          </>
        ) : null}
        {notifMsg ? <p className="ios-settings-copy">{notifMsg}</p> : null}
        {notifSettingsOpen && createPortal(
          <ConfirmSheet
            title={ta("settings.notificationsDeniedTitle")}
            message={ta("settings.notificationsDeniedBody")}
            confirmLabel={ta("settings.notificationsOpenSettings")}
            cancelLabel={ta("settings.notificationsLater")}
            destructive={false}
            icon={Bell}
            onConfirm={async () => {
              setNotifSettingsOpen(false);
              try {
                const mod = await import("../lib/native-push.js");
                await mod.openNativeAppSettings();
              } catch { /* ignore */ }
            }}
            onCancel={() => setNotifSettingsOpen(false)}
          />,
          document.body,
        )}
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

      {user && onDeleteAccount ? (
        <>
          <p className="ios-settings-warn">La suppression du compte est irréversible.</p>
          {deleteGate?.allowed && deleteWarning ? (
            <p className="ios-settings-copy" style={{ marginBottom: 8 }}>
              {deleteWarning}
            </p>
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
          title={ACCOUNT_DELETE_BLOCKED_TITLE}
          message={ACCOUNT_DELETE_BLOCKED_MESSAGE}
          confirmLabel={ta("settings.gotIt")}
          cancelLabel={null}
          destructive={false}
          icon={AlertTriangle}
          onConfirm={() => setDeleteBlockedOpen(false)}
          onCancel={() => setDeleteBlockedOpen(false)}
        />,
        document.body,
      )}

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
