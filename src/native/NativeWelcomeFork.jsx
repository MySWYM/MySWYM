import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useActiveLocale } from "../i18n/locale-routing.jsx";
import { legalHref } from "../lib/legal-copy.js";
import BrandLogo from "../BrandLogo.jsx";

/**
 * Premier écran iOS : plein bleu, picto blanc, CTAs verre.
 * « Créer son compte » lance le questionnaire, pas l’inscription directe.
 */
export default function NativeWelcomeFork({ onCreate }) {
  const { t } = useTranslation("onboarding");
  const locale = useActiveLocale();

  return (
    <div className="native-welcome-fork">
      <div className="native-welcome-swimmer" aria-hidden="true">
        <img
          src="/hero-pool.webp"
          alt=""
          width={1024}
          height={1024}
          decoding="async"
        />
      </div>
      <main className="native-welcome-main">
        <div className="native-welcome-logo" aria-hidden="true">
          <BrandLogo variant="mark" onDark height={105} alt="" />
        </div>
        <div className="native-welcome-copy">
          <h1>{t("welcome.title")}</h1>
          <p>{t("welcome.lead")}</p>
        </div>
      </main>

      <div className="native-welcome-fork-actions">
        <button type="button" className="native-welcome-cta is-primary" onClick={onCreate}>
          <span className="native-welcome-cta-sheen" aria-hidden="true" />
          <span className="native-welcome-cta-label">
            {t("welcome.continue")}
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </button>
        <Link to="/connexion" className="native-welcome-cta is-secondary">
          <span className="native-welcome-cta-sheen" aria-hidden="true" />
          <span className="native-welcome-cta-label">{t("welcome.signIn")}</span>
        </Link>
        <p className="native-welcome-legal">
          <Trans
            i18nKey="welcome.legal"
            ns="onboarding"
            components={{
              cgu: (
                <a
                  href={legalHref("cgu", locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              privacy: (
                <a
                  href={legalHref("privacy", locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
}
