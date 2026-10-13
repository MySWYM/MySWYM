import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Heart, Search, SlidersHorizontal } from "lucide-react";
import { getTabUi } from "../tab-ui-registry.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { filterLibraryItems, loadLibraryCatalog } from "../lib/library/catalog.js";
import {
  libraryFavoriteSet,
  libraryPinnedEducatif,
  withLibraryFavorite,
} from "../lib/library/favorites.js";
import LibraryDetailScreen from "./LibraryDetailScreen.jsx";
import LibraryFavoritesPremium from "./LibraryFavoritesPremium.jsx";
import LibraryFilterSheet, { EMPTY_LIBRARY_FILTERS } from "./LibraryFilterSheet.jsx";
import "./library.css";

function filtersActive(f) {
  return Boolean(f?.nages?.length || f?.levels?.length);
}

function itemMeta(it) {
  return [
    (it.nages || [])
      .filter((n) => n && n !== "toutes")
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(" · ") || null,
    it.levelLabel,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * @param {{
 *  profile: object,
 *  user?: object|null,
 *  onBack: () => void,
 *  onOpenMenu?: () => void,
 *  onProfilePatch: (patch: object) => void,
 *  onUseInNextSession: (item: import("../lib/library/catalog.js").LibraryItem) => void,
 *  hasSessionAccess?: boolean,
 *  isPremium?: boolean,
 *  onUpgrade?: (ctx?: string) => void,
 * }} props
 */
export default function LibraryScreen({
  profile,
  onBack,
  onOpenMenu,
  onProfilePatch,
  onUseInNextSession,
  hasSessionAccess = true,
  isPremium = false,
  onUpgrade,
}) {
  const { t } = useTranslation("app");
  const { AppTopBar } = getTabUi();
  const [items, setItems] = useState(/** @type {import("../lib/library/catalog.js").LibraryItem[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(EMPTY_LIBRARY_FILTERS);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showFavPremium, setShowFavPremium] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState(/** @type {string|null} */ (null));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadLibraryCatalog()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const favSet = useMemo(() => libraryFavoriteSet(profile), [profile]);
  const pinned = useMemo(() => libraryPinnedEducatif(profile), [profile]);

  const filtered = useMemo(
    () =>
      filterLibraryItems(items, {
        q,
        ...filters,
        favoritesOnly: favoritesOnly && isPremium,
        favoriteIds: favSet,
      }),
    [items, q, filters, favoritesOnly, favSet, isPremium],
  );

  const active = useMemo(() => items.find((it) => it.id === activeId) || null, [items, activeId]);

  if (showFavPremium && !isPremium) {
    return (
      <LibraryFavoritesPremium
        onBack={() => setShowFavPremium(false)}
        onOpenMenu={onOpenMenu}
        onUpgrade={() => onUpgrade?.("library_favorites")}
      />
    );
  }

  if (active) {
    return (
      <LibraryDetailScreen
        item={active}
        isFavorite={favSet.has(active.id)}
        pinnedName={pinned?.name || null}
        canPin={hasSessionAccess}
        canFavorite={isPremium}
        onBack={() => setActiveId(null)}
        onOpenMenu={onOpenMenu}
        onToggleFavorite={() => {
          if (!isPremium) {
            setShowFavPremium(true);
            setActiveId(null);
            return;
          }
          const next = withLibraryFavorite(profile, active.id, !favSet.has(active.id));
          onProfilePatch({ libraryFavorites: next.libraryFavorites });
        }}
        onUseNextSession={() => {
          if (!hasSessionAccess) {
            onUpgrade?.("library");
            return;
          }
          onUseInNextSession(active);
        }}
      />
    );
  }

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
      <div className="ms-library-body">
        <button
          type="button"
          className={`ms-library-fav-hero${favoritesOnly && isPremium ? " is-on" : ""}`}
          onClick={() => {
            playUiSound("soft");
            if (!isPremium) {
              setShowFavPremium(true);
              return;
            }
            setFavoritesOnly((v) => !v);
          }}
        >
          <img
            className="ms-library-fav-hero-bg"
            src="/library/swimmer-favorites.jpg"
            alt=""
            decoding="async"
          />
          <span className="ms-library-fav-hero-scrim" aria-hidden />
          <span className="ms-library-fav-hero-banner">
            <Heart size={12} aria-hidden />
            {t("library.favorites")}
          </span>
          <span className="ms-library-fav-hero-copy">
            <span className="ms-library-fav-hero-title">
              {isPremium
                ? t("library.favoritesCount", { count: favSet.size })
                : t("library.favoritesPremiumHint")}
            </span>
            <span className="ms-library-fav-hero-sub">
              {isPremium ? t("library.favoritesCardHint") : t("library.favoritesCardPremium")}
            </span>
          </span>
        </button>

        <p className="ms-library-section-label">{t("library.listLabel")}</p>
        <div className="ms-library-search-row">
          <label className="ms-library-search">
            <Search size={16} aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("library.searchPlaceholder")}
              enterKeyHint="search"
            />
          </label>
          <button
            type="button"
            className={`ms-library-filter-btn${filtersActive(filters) ? " is-on" : ""}`}
            aria-label={t("library.filters")}
            onClick={() => {
              playUiSound("soft");
              setShowFilters(true);
            }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {loading ? (
          <p className="ms-library-empty">{t("library.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="ms-library-empty">{t("library.empty")}</p>
        ) : (
          <div className="ms-library-list">
            {filtered.map((it) => {
              const meta = itemMeta(it);
              return (
                <button
                  key={it.id}
                  type="button"
                  className="ms-library-row"
                  onClick={() => {
                    playUiSound("soft");
                    setActiveId(it.id);
                  }}
                >
                  {it.thumbUrl ? (
                    <img className="ms-library-thumb" src={it.thumbUrl} alt="" decoding="async" />
                  ) : null}
                  <span className="ms-library-row-copy">
                    <span className="ms-library-row-title">
                      {it.name}
                      {it.isNew ? <span className="ms-library-badge-new">New</span> : null}
                      {isPremium && favSet.has(it.id) ? (
                        <Heart size={12} fill="#e11d48" color="#e11d48" style={{ marginLeft: 6, verticalAlign: -1 }} />
                      ) : null}
                    </span>
                    <span className="ms-library-row-meta">{meta || it.sourceLabel}</span>
                  </span>
                  <ChevronRight size={18} color="rgba(11,36,56,0.35)" aria-hidden />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <LibraryFilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        items={items}
        value={filters}
        onApply={setFilters}
      />
    </div>
  );
}
