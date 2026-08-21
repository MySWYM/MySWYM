import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "./index.js";
import { isAppPath, stripLocalePrefix, withLocalePrefix } from "./locale-path.js";

const OPTIONS = [
  { id: "fr", code: "FR", name: "Français" },
  { id: "en", code: "EN", name: "English" },
];

function FlagCircle({ locale }) {
  if (locale === "en") {
    return (
      <span className="ms-lang-flag" aria-hidden>
        <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="2.5" />
          <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      </span>
    );
  }
  return (
    <span className="ms-lang-flag" aria-hidden>
      <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
        <rect width="1" height="2" fill="#002395" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#ED2939" />
      </svg>
    </span>
  );
}

/**
 * Sélecteur de langue.
 * `nav` : drapeau + code (FR/EN) + menu Français / English (header).
 * `settings` : pastille FR | EN dans l’app.
 * Sur le site marketing : change l’URL (`/pricing` ↔ `/fr/tarifs`).
 * Dans l’app : change seulement la langue (pas de `/fr` sur `/app`).
 */
export default function LanguageSwitcher({ variant = "nav" }) {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const lng = i18n.language?.startsWith("en") ? "en" : "fr";
  const current = OPTIONS.find((o) => o.id === lng) || OPTIONS[0];
  const marketing = !isAppPath(location.pathname);
  const bare = stripLocalePrefix(location.pathname);
  const menuId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const target = (next) => ({
    pathname: withLocalePrefix(bare, next),
    search: location.search,
    hash: location.hash,
  });

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "settings") {
    const wrap = {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: 3,
      borderRadius: 999,
      background: "transparent",
      border: "1.5px solid #c3c6d2",
      fontFamily: "'Lexend', sans-serif",
    };
    const btn = (active) => ({
      border: "none",
      cursor: "pointer",
      fontFamily: "'Lexend', sans-serif",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: "0.04em",
      padding: "8px 14px",
      borderRadius: 999,
      minHeight: 36,
      minWidth: 44,
      background: active ? "#006bfd" : "transparent",
      color: active ? "#ffffff" : "#5d6b7d",
      transition: "background 0.15s, color 0.15s",
      WebkitTapHighlightColor: "transparent",
    });
    return (
      <div role="group" aria-label={t("lang.label")} style={wrap}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={lng === opt.id}
            aria-label={opt.id === "fr" ? t("lang.switchToFr") : t("lang.switchToEn")}
            onClick={() => setAppLanguage(opt.id)}
            style={btn(lng === opt.id)}
          >
            {opt.code}
          </button>
        ))}
      </div>
    );
  }

  const pick = (next) => {
    setAppLanguage(next);
    setOpen(false);
  };

  return (
    <div className="ms-lang" ref={rootRef}>
      <button
        type="button"
        className="ms-lang-btn"
        aria-label={t("lang.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <FlagCircle locale={current.id} />
        <span>{current.code}</span>
      </button>
      {open && (
        <div className="ms-lang-menu" id={menuId} role="listbox" aria-label={t("lang.label")}>
          {OPTIONS.map((opt) => {
            const selected = lng === opt.id;
            const className = `ms-lang-option${selected ? " is-active" : ""}`;
            const inner = (
              <>
                <FlagCircle locale={opt.id} />
                <span>{opt.name}</span>
              </>
            );
            if (marketing) {
              return (
                <Link
                  key={opt.id}
                  role="option"
                  aria-selected={selected}
                  to={target(opt.id)}
                  className={className}
                  onClick={() => pick(opt.id)}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={className}
                onClick={() => pick(opt.id)}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
