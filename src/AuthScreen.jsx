import { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabase.js";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import Btn from "./ui/Btn.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { useActiveLocale } from "./i18n/locale-routing.jsx";
import { track } from "./lib/analytics.js";
import { captureReferralFromUrl, getStoredReferralCode } from "./lib/referral.js";
import { legalHref } from "./lib/legal-copy.js";
import { hideNativeKeyboard, isNativeApp, isNativeIos, nativeApiOrigin } from "./lib/native-platform.js";
import { markNativeQuizStarted } from "./lib/native-welcome.js";
import {
  isAppleSignInCanceled,
  signInWithAppleNative,
} from "./lib/apple-auth.js";
import { NATIVE_OAUTH_REDIRECT } from "./lib/native-oauth.js";
import { openNativeOAuthUrl } from "./lib/native-links.js";
import { usePageSeo } from "./lib/seo.js";
import { NEWSLETTER_META_KEY, stashPendingNewsletterOptIn, clearPendingNewsletterOptIn } from "./lib/newsletter-opt-in.js";

function mapSocialAuthError(raw, t) {
  const msg = String(raw || "");
  if (/not enabled|Unsupported provider|provider is not enabled/i.test(msg)) {
    return t("auth.socialOff");
  }
  if (/Unacceptable audience|invalid_grant|invalid jwt|JWT|audience/i.test(msg)) {
    return t("auth.socialAppleConfig");
  }
  if (msg === "APPLE_NO_TOKEN") return t("auth.socialFail");
  return msg || t("auth.socialFail");
}

export const getAuthInpStyle = () => {
  if (isNativeApp()) {
    return {
      width: "100%",
      padding: "14px 16px",
      borderRadius: 14,
      border: "1.5px solid rgba(255, 255, 255, 0.42)",
      fontSize: 16,
      fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
      background: "rgba(255, 255, 255, 0.16)",
      color: "#fff",
      outline: "none",
      boxSizing: "border-box",
    };
  }
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: `1.5px solid ${G.inkLight}`,
    fontSize: 15,
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
    background: G.greyXLight,
    color: G.ink,
    outline: "none",
    boxSizing: "border-box",
  };
};

export const PasswordInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  onEnter,
  autoComplete = "current-password",
  enterKeyHint = "go",
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = id || "auth-password";
  return (
    <div style={{ width: "100%" }}>
      {label ? (
        <label htmlFor={inputId} className="native-auth-label" style={{ display: "block", fontSize: 13, fontWeight: 600, color: isNativeApp() ? "#fff" : G.ink, marginBottom: 6 }}>
          {label}
        </label>
      ) : null}
      <div style={{ position: "relative", width: "100%" }}>
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={e => e.key === "Enter" && onEnter?.()}
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          style={{ ...getAuthInpStyle(), paddingRight: 48 }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", padding: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isNativeApp() ? "rgba(255, 255, 255, 0.78)" : G.greyMid, lineHeight: 0, minWidth: 44, minHeight: 44,
          }}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  );
};

function mapAuthError(raw, t) {
  const msg = String(raw || "");
  if (/invalid login credentials|invalid_credentials/i.test(msg)) return t("auth.errCredentials", { defaultValue: "Email ou mot de passe incorrect." });
  if (/email not confirmed/i.test(msg)) return t("auth.errConfirm", { defaultValue: "Confirme ton email avant de te connecter." });
  if (/user already registered|already been registered/i.test(msg)) return t("auth.errExists", { defaultValue: "Ce compte existe déjà. Connecte-toi ou réinitialise ton mot de passe." });
  if (/password/i.test(msg) && /at least|characters|weak/i.test(msg)) return t("auth.errPassword", { defaultValue: "Mot de passe trop court. Utilise au moins 6 caractères." });
  if (/rate limit|too many/i.test(msg)) return t("auth.errRate", { defaultValue: "Trop de tentatives. Réessaie dans une minute." });
  if (/network|fetch/i.test(msg)) return t("auth.errNetwork", { defaultValue: "Connexion impossible. Vérifie ton réseau et réessaie." });
  return msg || t("auth.errGeneric", { defaultValue: "Une erreur est survenue. Réessaie." });
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AppleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.365 1.43c0 1.14-.43 2.2-1.2 3.01-.8.84-2.12 1.49-3.24 1.4-.13-1.1.4-2.25 1.18-3.08.85-.9 2.29-1.55 3.26-1.33zM20.76 17.37c-.55 1.28-.82 1.85-1.53 2.98-1 1.58-2.4 3.55-4.14 3.56-1.55.02-1.95-1.01-4.06-1-2.1.01-2.54 1.02-4.09 1-1.75-.02-3.09-1.79-4.09-3.37-2.79-4.4-3.08-9.56-1.36-12.3 1.22-1.94 3.15-3.07 4.96-3.07 1.85 0 3.01 1.01 4.54 1.01 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.33.88 4.54 2.4-3.99 2.19-3.34 7.89.68 9.81z"
    />
  </svg>
);

const authOAuthRedirect = () =>
  isNativeApp() ? NATIVE_OAUTH_REDIRECT : `${window.location.origin}/app`;

const SocialAuthButtons = ({ disabled, onError, onBlockedClick, onAuth, intent = "login", newsletterOptIn = false }) => {
  const { t } = useTranslation("onboarding");
  const [busy, setBusy] = useState(null);
  const nativeIos = isNativeIos();

  useEffect(() => {
    if (!isNativeApp()) return undefined;
    const onDone = (ev) => {
      const detail = ev?.detail || {};
      setBusy(null);
      if (detail.ok && detail.user) {
        onAuth?.(detail.user);
        return;
      }
      if (detail.ok === false && detail.error) {
        onError?.(mapSocialAuthError(detail.error, t));
      }
    };
    window.addEventListener("myswym:native-oauth-done", onDone);
    return () => window.removeEventListener("myswym:native-oauth-done", onDone);
  }, [onAuth, onError, t]);

  const startOAuth = async (provider) => {
    if (busy) return;
    if (disabled) {
      onBlockedClick?.();
      return;
    }
    setBusy(provider);
    onError?.(null);
    try {
      try { sessionStorage.setItem("myswym_oauth_intent", intent); } catch { /* ignore */ }
      if (intent === "signup") {
        stashPendingNewsletterOptIn(!!newsletterOptIn);
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) await supabase.auth.signOut();
      } else {
        clearPendingNewsletterOptIn();
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          skipBrowserRedirect: isNativeApp(),
          redirectTo: authOAuthRedirect(),
          queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (error) throw error;
      if (isNativeApp()) {
        if (!data?.url) throw new Error(t("auth.socialFail"));
        // Capacitor Browser (SFSafariViewController) → retour myswym://auth/callback
        await openNativeOAuthUrl(data.url);
      }
    } catch (e) {
      setBusy(null);
      onError?.(mapSocialAuthError(e.message, t));
    }
  };

  const startApple = async () => {
    if (busy) return;
    if (disabled) {
      onBlockedClick?.();
      return;
    }
    setBusy("apple");
    onError?.(null);
    try {
      try { sessionStorage.setItem("myswym_oauth_intent", intent); } catch { /* ignore */ }
      if (intent === "signup") {
        stashPendingNewsletterOptIn(!!newsletterOptIn);
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) await supabase.auth.signOut();
      } else {
        clearPendingNewsletterOptIn();
      }
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const extraMeta = intent === "signup"
        ? {
            confirmed_age_18: true,
            accepted_terms_at: new Date().toISOString(),
            [NEWSLETTER_META_KEY]: !!newsletterOptIn,
            ...(getStoredReferralCode() ? { referred_by: getStoredReferralCode() } : {}),
          }
        : {};
      const data = await signInWithAppleNative(
        supabase,
        (opts) => SignInWithApple.authorize(opts),
        extraMeta,
      );
      const user = data?.user;
      if (!user) throw new Error(t("auth.socialFail"));
      if (intent === "signup") {
        track("signup_completed", { source: "apple" }, { onceKey: `signup_completed:${user.id}` });
      }
      onAuth?.(user);
    } catch (e) {
      setBusy(null);
      if (isAppleSignInCanceled(e)) return;
      onError?.(mapSocialAuthError(e.message, t));
    }
  };

  const btnBase = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: nativeIos ? "11px 16px" : "13px 16px",
    borderRadius: nativeIos ? 999 : 12, fontSize: 15, fontWeight: 600,
    fontFamily: FONT, cursor: busy ? "not-allowed" : "pointer",
    opacity: disabled && !onBlockedClick ? 0.45 : 1, transition: "opacity 0.15s, background 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: nativeIos ? 8 : 10 }}>
      {nativeIos && (
        <button
          type="button"
          className="native-funnel-social"
          disabled={!!busy}
          aria-disabled={disabled || !!busy}
          onClick={startApple}
          style={{
            ...btnBase,
            background: "rgba(255, 255, 255, 0.16)",
            color: "#fff",
            border: "1.5px solid rgba(255, 255, 255, 0.42)",
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <AppleMark />
          {busy === "apple" ? t("auth.connecting") : t("auth.apple")}
        </button>
      )}
      <button
        type="button"
        className={nativeIos ? "native-funnel-social" : undefined}
        disabled={!!busy}
        aria-disabled={disabled || !!busy}
        onClick={() => startOAuth("google")}
        style={{
          ...btnBase,
          background: nativeIos ? "rgba(255, 255, 255, 0.92)" : G.surface,
          color: G.ink,
          border: nativeIos ? "1.5px solid rgba(255, 255, 255, 0.95)" : `1.5px solid ${G.greyLight}`,
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <GoogleMark />
        {busy === "google" ? t("auth.redirecting") : t("auth.google")}
      </button>
    </div>
  );
};

const AuthScreen = ({ onAuth, onBack, onNavigateMode, onStartQuiz, initialMode = "password", showBrandHeader = true }) => {
  const locale = useActiveLocale();
  const { t } = useTranslation("onboarding");
  // mode :
  //   "password", login classique avec mot de passe
  //   "register", création de compte avec mot de passe
  //   "reset"   , réinitialisation du mot de passe
  const [mode, setMode] = useState(initialMode);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => { captureReferralFromUrl(); }, []);
  useEffect(() => {
    if (mode === "register") {
      track("signup_started", { source: "auth_screen" }, { onceKey: "signup_started:auth_screen" });
    }
  }, [mode]);

  const authPath = mode === "register" ? "/inscription" : mode === "reset" ? "/connexion" : "/connexion";
  usePageSeo({
    title: locale === "en"
      ? (mode === "register" ? "Sign up | MySWYM" : mode === "reset" ? "Reset password | MySWYM" : "Log in | MySWYM")
      : (mode === "register" ? "Inscription | MySWYM" : mode === "reset" ? "Mot de passe oublié | MySWYM" : "Connexion | MySWYM"),
    description: locale === "en"
      ? "Log in or create your MySWYM account. 7-day Premium trial, no card."
      : "Connecte-toi ou crée ton compte MySWYM. Essai Premium 7 jours, sans carte.",
    path: authPath,
    noIndex: true,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);    // pour les autres flows (reset, register confirm)
  const [acceptAge, setAcceptAge] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const referralCode = getStoredReferralCode();

  const switchMode = (m) => {
    if (m === "register" || m === "password") onNavigateMode?.(m);
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handle = async () => {
    setError(null); setSuccess(null); setLoading(true);
    const mail = String(email || "").trim().toLowerCase();
    const pass = String(password || "");
    try {
      if (mode === "password") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
        if (error) throw error;
        onAuth(data.user);
      } else if (mode === "register") {
        if (!acceptAge || !acceptTerms) {
          throw new Error(t("auth.needChecks"));
        }
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) {
          await supabase.auth.signOut();
        }
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password: pass,
          options: {
            emailRedirectTo: isNativeApp() ? `${nativeApiOrigin()}/app` : `${window.location.origin}/app`,
            data: {
              ...(referralCode ? { referred_by: referralCode } : {}),
              accepted_terms_at: new Date().toISOString(),
              confirmed_age_18: true,
              [NEWSLETTER_META_KEY]: !!acceptNewsletter,
            },
          },
        });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) throw new Error(t("auth.exists"));
        track("signup_completed", {}, { onceKey: `signup_completed:${data.user?.id || mail}` });
        let sessionUser = data.session?.user ?? null;
        if (!sessionUser) {
          const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
            email: mail,
            password: pass,
          });
          if (signInError && !/email not confirmed/i.test(signInError.message || "")) {
            throw signInError;
          }
          sessionUser = signedIn?.user ?? null;
        }
        if (sessionUser) {
          onAuth(sessionUser);
          return;
        }
        setSuccess(referralCode ? t("auth.createdReferral") : t("auth.created"));
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: `${window.location.origin}/app`,
        });
        if (error) throw error;
        setSuccess(t("auth.resetSent"));
      }
    } catch (e) { setError(mapAuthError(e.message || e, t)); }
    finally { setLoading(false); }
  };

  const titleMap = {
    password: t("auth.loginTitle"),
    register: t("auth.registerTitle"),
    reset:    t("auth.resetTitle"),
  };
  const subtitleMap = {
    password: t("auth.loginLead"),
    register: referralCode
      ? t("auth.registerReferral", { code: referralCode })
      : t("auth.registerLead"),
    reset:    t("auth.resetLead"),
  };
  const ctaMap = {
    password: t("auth.loginCta"),
    register: t("auth.registerCta"),
    reset:    t("auth.resetCta"),
  };

  const registerBlocked = mode === "register" && (!acceptAge || !acceptTerms);
  const native = isNativeApp();
  const legalChecks = mode === "register" ? (
    <div className="native-auth-legal" style={{ marginBottom: native ? 12 : 16 }}>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: native ? 6 : 10, fontSize: 12, lineHeight: 1.35, color: native ? "rgba(255, 255, 255, 0.88)" : G.grey, cursor: "pointer" }}>
        <input type="checkbox" checked={acceptAge} onChange={(e) => setAcceptAge(e.target.checked)} style={{ marginTop: 2 }} />
        <span>{t("auth.age")}</span>
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, lineHeight: 1.35, color: native ? "rgba(255, 255, 255, 0.88)" : G.grey, cursor: "pointer" }}>
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <Trans
            i18nKey="auth.terms"
            ns="onboarding"
            components={{
              cgu: <a href={legalHref("cgu", locale)} target="_blank" rel="noopener noreferrer" style={{ color: native ? "#fff" : G.blue, fontWeight: 700, textDecoration: native ? "underline" : "none" }} />,
              privacy: <a href={legalHref("privacy", locale)} target="_blank" rel="noopener noreferrer" style={{ color: native ? "#fff" : G.blue, fontWeight: 700, textDecoration: native ? "underline" : "none" }} />,
            }}
          />
        </span>
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: native ? 6 : 10, fontSize: 12, lineHeight: 1.35, color: native ? "rgba(255, 255, 255, 0.88)" : G.grey, cursor: "pointer" }}>
        <input type="checkbox" checked={acceptNewsletter} onChange={(e) => setAcceptNewsletter(e.target.checked)} style={{ marginTop: 2 }} />
        <span>{t("auth.newsletter")}</span>
      </label>
      {!native && (
        <>
          <p style={{ fontSize: 11, color: G.greyMid, margin: "10px 0 0", lineHeight: 1.4 }}>
            {t("auth.trial")}
          </p>
          <p style={{ fontSize: 11, color: G.greyMid, margin: "6px 0 0", lineHeight: 1.4 }}>
            {t("health.safety")}
          </p>
        </>
      )}
    </div>
  ) : null;

  return (
    <div
      className={native ? "native-auth-fit native-auth-funnel" : undefined}
      onPointerDown={(e) => {
        if (!native) return;
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (t.closest("input, textarea, select, button, a, label")) return;
        hideNativeKeyboard();
      }}
      style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "0 20px",
        paddingTop: native ? undefined : showBrandHeader ? 64 : 96,
        paddingBottom: native ? undefined : "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {(showBrandHeader || onBack || (native && ((onStartQuiz && mode === "password") || mode === "register" || mode === "reset"))) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: native ? 8 : 44 }}>
          {showBrandHeader && !native ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <BrandLogo variant="wordmark" height={24} />
            </div>
          ) : <div />}
          {native && onStartQuiz && mode === "password" ? (
            <button
              type="button"
              className="ms-glass-icon-btn native-guest-chip"
              onClick={() => {
                markNativeQuizStarted();
                onStartQuiz();
              }}
            >
              {t("auth.createAccount")}
            </button>
          ) : native && (mode === "register" || mode === "reset") ? (
            <button
              type="button"
              className="ms-glass-icon-btn native-guest-chip"
              onClick={() => switchMode("password")}
            >
              {t("auth.loginCta")}
            </button>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("common.back")}
              style={{
                background: "none",
                border: `1px solid ${G.greyLight}`,
                borderRadius: 10,
                padding: "10px 14px",
                minHeight: 44,
                fontSize: 13,
                fontWeight: 600,
                color: G.grey,
                cursor: "pointer",
              }}
            >
              {t("common.back")}
            </button>
          ) : null}
        </div>
      )}
      <div className="fade-up">
        <h1 style={{ fontFamily: native ? FONT : FONT_DISPLAY, fontSize: native ? 28 : 32, fontWeight: 700, letterSpacing: "-0.03em", textTransform: "none", color: native ? "#fff" : G.ink, marginBottom: 8, lineHeight: 1.1 }}>
          {titleMap[mode]}
        </h1>
        <p style={{ color: native ? "rgba(255, 255, 255, 0.88)" : G.grey, fontSize: native ? 14 : 15, marginBottom: native ? 12 : 28, lineHeight: 1.4 }}>
          {subtitleMap[mode]}
        </p>

        {error   && <div style={{ background: G.coralLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: G.coral, fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: G.mintLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: G.mint, fontSize: 13 }}>{success}</div>}

        {native ? legalChecks : null}

        {(mode === "password" || mode === "register") && (
          <>
            <SocialAuthButtons
              disabled={loading || registerBlocked}
              intent={mode === "register" ? "signup" : "login"}
              newsletterOptIn={acceptNewsletter}
              onAuth={onAuth}
              onError={(msg) => { setSuccess(null); setError(msg); }}
              onBlockedClick={registerBlocked ? () => {
                setSuccess(null);
                setError(t(isNativeIos() ? "auth.socialBlocked" : "auth.googleBlocked"));
              } : undefined}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: native ? "8px 0" : "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: native ? "rgba(255, 255, 255, 0.28)" : G.greyLight }} />
              <span style={{ fontSize: 12, color: native ? "rgba(255, 255, 255, 0.72)" : G.grey, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("common.or")}</span>
              <div style={{ flex: 1, height: 1, background: native ? "rgba(255, 255, 255, 0.28)" : G.greyLight }} />
            </div>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: native ? 8 : 12, marginBottom: mode === "password" ? 8 : native ? 8 : 16 }}>
          <div>
            <label htmlFor="auth-email" className="native-auth-label" style={{ display: "block", fontSize: 13, fontWeight: 600, color: native ? "#fff" : G.ink, marginBottom: 6 }}>
              {t("auth.email")}
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              enterKeyHint={native && (mode === "register" || mode === "password") ? "next" : "go"}
              placeholder="exemple@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (native && (mode === "register" || mode === "password")) {
                  document.getElementById("auth-password")?.focus();
                  return;
                }
                handle();
              }}
              style={getAuthInpStyle()}
            />
          </div>
          {(mode === "password" || mode === "register") && (
            <PasswordInput
              id="auth-password"
              label={t("auth.password")}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onEnter={native && mode === "register" ? hideNativeKeyboard : handle}
              enterKeyHint={native && mode === "register" ? "done" : "go"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          )}
        </div>

        {mode === "password" && (
          <div style={{ textAlign: "right", marginBottom: native ? 8 : 16 }}>
            <button
              type="button"
              onClick={() => switchMode("reset")}
              style={{
                background: "none", border: "none", color: native ? "rgba(255, 255, 255, 0.88)" : G.grey, fontSize: 13, cursor: "pointer",
                minHeight: 44, padding: native ? "6px 4px" : "10px 4px", display: "inline-flex", alignItems: "center",
              }}
            >
              {t("auth.forgot")}
            </button>
          </div>
        )}

        {!native ? legalChecks : null}

        <Btn onClick={handle} disabled={loading || !email || ((mode === "password" || mode === "register") && !password) || registerBlocked} variant="blue">
          {loading
            ? (mode === "register" ? "Création…" : mode === "reset" ? "Envoi…" : "Connexion…")
            : ctaMap[mode]}
        </Btn>
        {(mode === "password" || mode === "register") && (!email || !password) && !loading && !native ? (
          <p style={{ fontSize: 12, color: G.greyMid, margin: "8px 0 0", lineHeight: 1.4 }}>
            Renseigne email et mot de passe pour continuer.
          </p>
        ) : null}
        {registerBlocked && !loading && !native ? (
          <p style={{ fontSize: 12, color: G.greyMid, margin: "8px 0 0", lineHeight: 1.4 }}>
            {t("auth.needChecks")}
          </p>
        ) : null}

        {/* Toggles secondaires. iOS : chips en haut, pas de 2e CTA en bas. */}
        <div style={{ marginTop: native ? 8 : 18, textAlign: "center", fontSize: 14, color: G.grey }}>
          {mode === "password" && !native && (
            <button
              type="button"
              onClick={() => (onStartQuiz ? onStartQuiz() : switchMode("register"))}
              style={{
                background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14,
                minHeight: 44, padding: "10px 12px", display: "inline-flex", alignItems: "center",
              }}
            >
              {t("auth.createAccount")}
            </button>
          )}
          {mode === "register" && !native && (
            <button
              type="button"
              onClick={() => switchMode("password")}
              style={{
                background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14,
                minHeight: 44, padding: "10px 12px", display: "inline-flex", alignItems: "center",
              }}
            >
              {t("auth.hasAccount")}
            </button>
          )}
          {mode === "reset" && !native && (
            <button
              type="button"
              onClick={() => switchMode("password")}
              style={{
                background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14,
                minHeight: 44, padding: "10px 12px", display: "inline-flex", alignItems: "center",
              }}
            >
              {t("auth.backLogin")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
