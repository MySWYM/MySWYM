import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTabUi } from "../tab-ui-registry.js";
import { playUiSound } from "../lib/ui-sounds.js";
import LibraryMotion from "./LibraryMotion.jsx";
import "./library.css";

/**
 * @param {{
 *  item: import("../lib/library/catalog.js").LibraryItem,
 *  isFavorite: boolean,
 *  pinnedName?: string|null,
 *  canPin: boolean,
 *  canFavorite?: boolean,
 *  onBack: () => void,
 *  onToggleFavorite: () => void,
 *  onUseNextSession: () => void,
 *  onOpenMenu?: () => void,
 * }} props
 */
export default function LibraryDetailScreen({
  item,
  isFavorite,
  pinnedName = null,
  canPin = true,
  canFavorite = true,
  onBack,
  onToggleFavorite,
  onUseNextSession,
  onOpenMenu,
}) {
  const { t } = useTranslation("app");
  const { AppTopBar } = getTabUi();
  const isPinned = pinnedName && item?.sheetName && pinnedName === item.sheetName;
  const canUseSheet = Boolean(item?.source === "sheet" && item?.sheetName);

  if (!item) return null;

  const metaParts = [
    item.nages?.filter((n) => n && n !== "toutes" && n !== "all").map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(" · ") ||
      null,
    item.levelLabel,
    item.sourceLabel,
  ].filter(Boolean);

  const objective = item.objective || item.stimulus || "";
  const watchPoints =
    Array.isArray(item.watchPoints) && item.watchPoints.length
      ? item.watchPoints
      : Array.isArray(item.mistakes)
        ? item.mistakes
        : [];

  return (
    <div className="ms-library-screen">
      <AppTopBar
        title={t("library.title")}
        onBack={() => {
          playUiSound("soft");
          onBack();
        }}
        onOpenMenu={onOpenMenu}
      />
      {item.motionUrl ? (
        <div className="ms-library-detail-media ms-library-detail-media-motion">
          <LibraryMotion path={item.motionUrl} />
        </div>
      ) : item.thumbUrl ? (
        <div className="ms-library-detail-media">
          <img src={item.thumbUrl} alt="" decoding="async" />
        </div>
      ) : null}
      <h1 className="ms-library-detail-title">{item.name}</h1>
      <p className="ms-library-detail-meta">{metaParts.join(" · ")}</p>

      {objective ? (
        <section className="ms-library-card">
          <h3>{t("library.objective")}</h3>
          <p>{objective}</p>
        </section>
      ) : null}

      {item.cue ? (
        <section className="ms-library-card">
          <h3>{t("library.instructions")}</h3>
          <p>{item.cue}</p>
        </section>
      ) : null}

      {item.successCriteria ? (
        <section className="ms-library-card">
          <h3>{t("library.successCriteria")}</h3>
          <p>{item.successCriteria}</p>
        </section>
      ) : null}

      {watchPoints.length ? (
        <section className="ms-library-card">
          <h3>{t("library.watchPoints")}</h3>
          <ul>
            {watchPoints.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {item.equipment ? (
        <section className="ms-library-card">
          <h3>{t("library.gear")}</h3>
          <p>{item.equipment}</p>
        </section>
      ) : null}

      <div className="ms-library-actions">
        <button
          type="button"
          className="ms-library-cta ms-library-cta-primary"
          disabled={!canPin || !canUseSheet || isPinned}
          onClick={() => {
            playUiSound("soft");
            onUseNextSession();
          }}
        >
          {isPinned ? t("library.pinned") : t("library.useNext")}
        </button>
        {!canUseSheet ? (
          <p className="ms-library-empty" style={{ padding: 0 }}>
            {t("library.bookOnlyHint")}
          </p>
        ) : null}
        <button
          type="button"
          className={`ms-library-cta ms-library-cta-ghost${isFavorite && canFavorite ? " is-on" : ""}`}
          onClick={() => {
            playUiSound("soft");
            onToggleFavorite();
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <Heart size={16} fill={isFavorite && canFavorite ? "currentColor" : "none"} />
            {canFavorite
              ? isFavorite
                ? t("library.unfavorite")
                : t("library.favorite")
              : t("library.favoritePremiumCta")}
          </span>
        </button>
      </div>
    </div>
  );
}
