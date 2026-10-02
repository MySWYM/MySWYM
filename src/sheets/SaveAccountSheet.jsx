import { useState } from "react";
import { useTranslation } from "react-i18next";
import SoftMistSheet from "./SoftMistSheet.jsx";
import { G } from "../theme/palette.js";
import { FONT } from "../theme/brand.js";
import { isNativeIos } from "../lib/native-platform.js";
import { supabase } from "../supabase.js";
import {
  isAppleSignInCanceled,
  signInWithAppleNative,
} from "../lib/apple-auth.js";
import { getStoredReferralCode } from "../lib/referral.js";
import { NEWSLETTER_META_KEY } from "../lib/newsletter-opt-in.js";
import { track } from "../lib/analytics.js";

const AppleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.365 1.43c0 1.14-.43 2.2-1.2 3.01-.8.84-2.12 1.49-3.24 1.4-.13-1.1.4-2.25 1.18-3.08.85-.9 2.29-1.55 3.26-1.33zM20.76 17.37c-.55 1.28-.82 1.85-1.53 2.98-1 1.58-2.4 3.55-4.14 3.56-1.55.02-1.95-1.01-4.06-1-2.1.01-2.54 1.02-4.09 1-1.75-.02-3.09-1.79-4.09-3.37-2.79-4.4-3.08-9.56-1.36-12.3 1.22-1.94 3.15-3.07 4.96-3.07 1.85 0 3.01 1.01 4.54 1.01 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.33.88 4.54 2.4-3.99 2.19-3.34 7.89.68 9.81z"
    />
  </svg>
);

/**
 * Après la 1ʳᵉ séance révélée : convertir l’anonyme sans perdre le plan.
 * Essai 7j démarre au rattachement (sync-subscription).
 */
export default function SaveAccountSheet({ open, onDismiss, onConverted, onEmail }) {
  const { t } = useTranslation("onboarding");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const nativeIos = isNativeIos();

  const startApple = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const referralCode = getStoredReferralCode();
      const data = await signInWithAppleNative(
        supabase,
        (opts) => SignInWithApple.authorize(opts),
        {
          confirmed_age_18: true,
          accepted_terms_at: new Date().toISOString(),
          [NEWSLETTER_META_KEY]: false,
          ...(referralCode ? { referred_by: referralCode } : {}),
        },
      );
      const user = data?.user;
      if (!user) throw new Error("APPLE_NO_USER");
      track("signup_completed", { source: "apple_convert" }, { onceKey: `signup_completed:${user.id}` });
      onConverted?.(user);
    } catch (e) {
      if (isAppleSignInCanceled(e)) return;
      setError(t("saveAccount.error"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <SoftMistSheet
      open
      eyebrow={t("saveAccount.eyebrow")}
      title={t("saveAccount.title")}
      subtitle={t("saveAccount.lead")}
      onClose={onDismiss}
      zIndex={510}
      ariaLabel={t("saveAccount.title")}
    >
      {error ? (
        <div
          style={{
            background: G.coralLight,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            color: G.coral,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {nativeIos ? (
          <button
            type="button"
            disabled={busy}
            onClick={startApple}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: FONT,
              background: G.ink,
              color: G.white,
              border: `1.5px solid ${G.ink}`,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <AppleMark />
            {busy ? t("auth.connecting") : t("saveAccount.apple")}
          </button>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => onEmail?.()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: FONT,
            background: G.blue,
            color: G.white,
            border: "none",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {t("saveAccount.email")}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            padding: "12px 8px",
            fontSize: 14,
            fontWeight: 600,
            color: G.grey,
            fontFamily: FONT,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {t("saveAccount.later")}
        </button>
      </div>
    </SoftMistSheet>
  );
}
