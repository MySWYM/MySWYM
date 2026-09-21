/**
 * Paramètres iOS : IA type GOWOD, DA soft mist.
 */
import { useState } from "react";
import {
  Check, ChevronRight, Mail, RotateCcw, Globe, Lock, Shield, CircleHelp, Info,
  FileText, LogOut, HeartPulse, CreditCard, Activity,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { setAppLanguage } from "../i18n/index.js";
import { withLocalePrefix } from "../i18n/locale-path.js";
import { supabase } from "../supabase.js";
import { isNativeApp, nativeApiOrigin } from "../lib/native-platform.js";
import {
  buildAccountExportPayload,
  downloadAccountExport,
  hasEmailPasswordProvider,
} from "../lib/account-export.js";
import { PanelShell } from "../ProfileHelpPanels.jsx";
import FlagCircle from "./FlagCircle.jsx";

const LANGS = [
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
];

function StatusCheck({ on }) {
  return (
    <span className={`ios-settings-check${on ? " is-on" : ""}`} aria-hidden>
      <Check size={15} strokeWidth={2.8} />
    </span>
  );
}

function SettingsRow({ icon: Icon, title, value, hint, onClick, href, external, chevron, trailing }) {
  const showChevron = chevron ?? Boolean(onClick || href);
  const inner = (
    <>
      {Icon ? (
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
  const { i18n } = useTranslation();
  const lng = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <PanelShell title="Langues" onBack={onBack}>
      <p className="ios-settings-lead">Change ta langue</p>
      <div className="ios-settings-choice-list">
        {LANGS.map((opt) => {
          const active = lng === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`ios-settings-choice${active ? " is-active" : ""}`}
              onClick={() => {
                playUiSound("soft");
                if (opt.id !== lng) setAppLanguage(opt.id);
              }}
            >
              <FlagCircle code={opt.id === "en" ? "GB" : "FR"} size={28} lazy={false} />
              <span className="ios-settings-choice-label">{opt.name}</span>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function IosPasswordPanel({ user, onBack, onMsg }) {
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
      setError("Le mot de passe doit faire au moins 6 caractères.");
      setOk(false);
      return;
    }
    if (next !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      setOk(false);
      return;
    }
    if (!current) {
      setError("Indique ton mot de passe actuel.");
      setOk(false);
      return;
    }
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      const email = user?.email;
      if (!email) throw new Error("Compte sans e-mail.");
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) throw new Error("Mot de passe actuel incorrect.");
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) throw upErr;
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk(true);
      playUiSound("success");
      onMsg?.({ type: "ok", text: "Mot de passe mis à jour." });
    } catch (e) {
      setError(e?.message || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const email = user?.email;
    if (!email) {
      setError("Compte sans e-mail.");
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
      onMsg?.({ type: "ok", text: "E-mail de réinitialisation envoyé." });
      setOk(false);
    } catch (e) {
      setError(e?.message || "Impossible d’envoyer l’e-mail.");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <PanelShell title="Mettre à jour le mot de passe" onBack={onBack}>
      {!canPwd ? (
        <p className="ios-settings-lead">
          Tu te connectes avec Apple. Il n’y a pas de mot de passe MySWYM à changer.
        </p>
      ) : (
        <>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">Mot de passe actuel</span>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Mot de passe actuel"
            />
          </label>
          <button type="button" className="ios-settings-text-btn" onClick={forgot} disabled={resetBusy}>
            {resetBusy ? "Envoi…" : "Mot de passe oublié ?"}
          </button>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">Nouveau mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Nouveau mot de passe"
            />
          </label>
          <label className="ios-settings-field">
            <span className="ios-settings-field-label">Confirmer le nouveau mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le nouveau mot de passe"
            />
          </label>
          {error ? <p className="ios-settings-alert is-err">{error}</p> : null}
          {ok ? <p className="ios-settings-alert is-ok">Mot de passe mis à jour.</p> : null}
          <button
            type="button"
            className="ms-pill-cta ios-settings-save"
            onClick={save}
            disabled={busy || !current || !next || !confirm}
          >
            {busy ? "…" : "Enregistrer"}
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
  const [exportBusy, setExportBusy] = useState(false);
  const [exportNote, setExportNote] = useState(null);

  const exportData = async () => {
    setExportBusy(true);
    setExportNote(null);
    try {
      const payload = buildAccountExportPayload({ user, profile });
      const res = await downloadAccountExport(payload);
      if (res.aborted) return;
      playUiSound("success");
      const text = res.shared ? "Fichier prêt à partager." : "Téléchargement lancé.";
      setExportNote({ type: "ok", text });
      onMsg?.({ type: "ok", text });
    } catch (e) {
      const text = e?.message || "Export impossible.";
      setExportNote({ type: "err", text });
      onMsg?.({ type: "err", text });
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <PanelShell title="Mes données personnelles" onBack={onBack}>
      <p className="ios-settings-copy">
        Tes données personnelles sont utilisées par MySWYM pour personnaliser tes séances.
      </p>
      <p className="ios-settings-copy">
        Elles ne sont pas vendues à d’autres applications ou entreprises.
      </p>
      <p className="ios-settings-copy">
        Tu peux télécharger tes données personnelles à tout moment.
      </p>
      <button
        type="button"
        className="ms-pill-cta"
        style={{ width: "100%", minHeight: 52, margin: "8px 0 24px" }}
        onClick={exportData}
        disabled={exportBusy}
      >
        {exportBusy ? "Préparation…" : "Télécharger mes données personnelles"}
      </button>
      {exportNote ? (
        <p className={`ios-settings-alert ${exportNote.type === "err" ? "is-err" : "is-ok"}`}>
          {exportNote.text}
        </p>
      ) : null}

      <div className="ms-profile-group-label">Newsletters</div>
      <div className="ms-profile-account-stack">
        <div className="ms-profile-account-row is-static">
          <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
            <Mail size={18} color={G.blue} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ms-profile-settings-label">Actus MySWYM</div>
            <div className="ms-profile-settings-hint">Conseils et nouveautés par e-mail</div>
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
        Tu peux supprimer toutes tes données à tout moment en supprimant ton compte MySWYM.
      </p>
      <p className="ios-settings-warn">Cette action est irréversible.</p>
      {user && onDeleteAccount ? (
        <>
          <button
            type="button"
            className="ios-settings-danger"
            disabled={deleteBusy || !deleteGate?.allowed}
            onClick={async () => {
              if (!deleteGate?.allowed) return;
              const ok = window.confirm(
                `${deleteWarning}\n\nConfirmer la suppression définitive du compte ?`,
              );
              if (!ok) return;
              playUiSound("soft");
              await onDeleteAccount();
            }}
          >
            {deleteBusy ? "Suppression…" : "Supprimer mon compte"}
          </button>
          {!deleteGate?.allowed && deleteGate?.message ? (
            <p className="ios-settings-alert is-err">
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
            </p>
          ) : null}
          {deleteErr ? <p className="ios-settings-alert is-err">{deleteErr}</p> : null}
        </>
      ) : null}
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
}) {
  const { i18n } = useTranslation();
  const lng = i18n.language?.startsWith("en") ? "en" : "fr";
  const langName = LANGS.find((l) => l.id === lng)?.name || "Français";
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
          title={restoreBusy ? "Restauration…" : "Restaurer les achats"}
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

      <div className="ms-profile-group-label">Connecter</div>
      <div className="ms-profile-account-stack">
        <SettingsRow
          icon={Activity}
          title="Strava"
          chevron={false}
          trailing={<StatusCheck on={!!stravaConnected} />}
          onClick={onOpenStrava}
        />
        <SettingsRow
          icon={HeartPulse}
          title="Apple Santé"
          chevron={false}
          trailing={<StatusCheck on={!!healthConnected} />}
          onClick={onOpenHealth}
        />
      </div>

      <div className="ms-profile-group-label">Abonnement</div>
      <div className="ms-profile-account-stack">
        <SettingsRow icon={CreditCard} title="Abonnement" onClick={onOpenSubscription} />
      </div>

      <div className="ms-profile-group-label">Gestion du compte</div>
      <div className="ms-profile-account-stack">
        <SettingsRow icon={Globe} title="Langue" value={langName} onClick={onOpenLanguage} />
        <SettingsRow icon={Lock} title="Changer le mot de passe" onClick={onOpenPassword} />
        <SettingsRow icon={Shield} title="Mes données personnelles" onClick={onOpenData} />
        <SettingsRow icon={CircleHelp} title="FAQ" href={faqHref} external />
        <SettingsRow icon={Info} title="Aide" onClick={onOpenHelp} />
        <SettingsRow icon={FileText} title="Politiques" onClick={onOpenLegal} />
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
        Déconnexion
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
  onConnect,
  onDisconnect,
  onBack,
}) {
  return (
    <PanelShell title="Apple Santé" onBack={onBack}>
      <p className="ios-settings-copy">
        Relie Apple Santé pour importer tes séances de natation et ta fréquence cardiaque.
      </p>
      <p className="ios-settings-copy">
        Tu peux retirer l’accès à tout moment dans Réglages iPhone, Santé, Sources.
      </p>
      {connected ? (
        <>
          <p className="ios-settings-alert is-ok">Connecté</p>
          <button
            type="button"
            className="ios-settings-danger"
            onClick={onDisconnect}
            disabled={busy}
          >
            Déconnecter
          </button>
        </>
      ) : (
        <button
          type="button"
          className="ms-pill-cta ios-settings-save"
          onClick={onConnect}
          disabled={busy}
        >
          {busy ? "…" : "Connecter Apple Santé"}
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
  const hint = canManageSubscription
    ? (access.cancelAtPeriodEnd
      ? (applePaid ? "Premium App Store, jusqu’à la fin de période" : "Premium actif, jusqu’à la fin de période")
      : (applePaid ? "Premium App Store" : "Premium actif"))
    : isPremium
      ? "Essai 7 jours"
      : "Essai terminé";

  return (
    <PanelShell title="Abonnement" onBack={onBack}>
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
                Modifier mon abonnement
              </button>
              <button
                type="button"
                onClick={() => { void onPortal(); }}
                className="ios-settings-text-btn"
              >
                Résilier
              </button>
            </>
          ) : applePaid ? (
            <p className="ios-settings-copy">
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
                className="ios-settings-text-btn"
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
          className="ms-pill-cta ms-pill-cta-gold"
          style={{ width: "100%", minHeight: 44 }}
        >
          Devenir Premium
        </button>
      )}
      {canManageSubscription ? referralSlot : null}
    </PanelShell>
  );
}
