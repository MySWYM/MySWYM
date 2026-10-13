import { useTranslation } from "react-i18next";
import { Heart, ListOrdered, Search } from "lucide-react";
import { getTabUi } from "../tab-ui-registry.js";
import { playUiSound } from "../lib/ui-sounds.js";
import "./library.css";

/**
 * Upsell favoris Premium (réf. GOWOD « Exercices favoris »).
 * @param {{ onBack: () => void, onUpgrade: () => void, onOpenMenu?: () => void }} props
 */
export default function LibraryFavoritesPremium({ onBack, onUpgrade, onOpenMenu }) {
  const { t } = useTranslation("app");
  const { AppTopBar } = getTabUi();

  return (
    <div className="ms-library-screen ms-library-fav-premium">
      <AppTopBar
        title={t("library.title")}
        onBack={() => {
          playUiSound("soft");
          onBack();
        }}
        onOpenMenu={onOpenMenu}
      />
      <div className="ms-library-fav-premium-body">
        <div className="ms-library-fav-premium-visual" aria-hidden>
          <div className="ms-library-fav-premium-phone">
            <img
              className="ms-library-fav-premium-phone-photo"
              src="/library/swimmer-favorites.jpg"
              alt=""
              decoding="async"
            />
            <div className="ms-library-fav-premium-phone-ui">
              <p className="ms-library-fav-premium-phone-title">{t("library.favorites")}</p>
              <p className="ms-library-fav-premium-phone-sub">{t("library.favPremiumMockSub")}</p>
              <div className="ms-library-fav-premium-phone-rows">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
        <h1 className="ms-library-fav-premium-title">{t("library.favPremiumTitle")}</h1>
        <p className="ms-library-fav-premium-lead">{t("library.favPremiumLead")}</p>
        <ul className="ms-library-fav-premium-list">
          <li>
            <Heart size={18} aria-hidden />
            <span>{t("library.favPremiumB1")}</span>
          </li>
          <li>
            <Search size={18} aria-hidden />
            <span>{t("library.favPremiumB2")}</span>
          </li>
          <li>
            <ListOrdered size={18} aria-hidden />
            <span>{t("library.favPremiumB3")}</span>
          </li>
        </ul>
        <button
          type="button"
          className="ms-library-cta ms-library-cta-primary"
          onClick={() => {
            playUiSound("soft");
            onUpgrade();
          }}
        >
          {t("library.favPremiumCta")}
        </button>
      </div>
    </div>
  );
}
