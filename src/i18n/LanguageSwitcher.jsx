import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronRight, X } from "lucide-react";
import { setAppLanguage } from "./index.js";
import { APP_LANGUAGES, normalizeAppLanguage } from "./languages.js";
import FlagMark from "./FlagMark.jsx";
import { isAppPath, stripLocalePrefix, withLocalePrefix } from "./locale-path.js";
import { playUiSound } from "../lib/ui-sounds.js";

const NAV_OPTIONS = [
  { id: "fr", code: "FR", name: "Français", flag: "FR" },
  { id: "en", code: "EN", name: "English", flag: "GB" },
];

/**
 * Sélecteur de langue.
 * `nav` : drapeau + code (FR/EN) + menu (header marketing).
 * `settings` : ligne Profil + sheet Miracle (drapeaux, Confirm).
 */
export default function LanguageSwitcher({ variant = "nav" }) {
  const { t, i18n } = useTranslation("common");
  const { t: ts } = useTranslation("settings");
  const location = useLocation();
  const fullList = variant === "settings" || variant === "flag";
  const options = fullList ? APP_LANGUAGES : NAV_OPTIONS;
  const lng = fullList
    ? normalizeAppLanguage(i18n.language)
    : (String(i18n.language || "").toLowerCase().startsWith("en") ? "en" : "fr");
  const current = options.find((o) => o.id === lng) || options[0];
  const marketing = !isAppPath(location.pathname);
  const bare = stripLocalePrefix(location.pathname);
  const menuId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(lng);

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
    setDraft(lng);
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, lng]);

  useEffect(() => {
    if (!open || variant === "settings" || variant === "flag") return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, variant]);

  if (variant === "settings" || variant === "flag") {
    const close = () => {
      playUiSound("soft");
      setOpen(false);
    };
    const confirm = () => {
      playUiSound("tap");
      if (draft !== lng) setAppLanguage(draft);
      setOpen(false);
    };

    const trigger = variant === "flag" ? (
      <button
        type="button"
        className="ms-lang-flag-btn"
        onClick={() => {
          playUiSound("soft");
          setOpen(true);
        }}
        aria-label={ts("language.title")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <FlagMark code={current.flag} size={22} />
      </button>
    ) : (
      <button
          type="button"
          className="ms-profile-settings-row"
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            font: "inherit",
            boxSizing: "border-box",
          }}
          onClick={() => {
            playUiSound("soft");
            setOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="ms-profile-settings-icon" style={{ background: "rgba(0,107,253,0.1)" }}>
            <FlagMark code={current.flag} size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ms-profile-settings-label">{ts("language.title")}</div>
            <div className="ms-profile-settings-hint">{current.name}</div>
          </div>
          <ChevronRight size={18} color="#9aa8b8" strokeWidth={2} />
        </button>
    );

    return (
      <>
        {trigger}

        {open
          ? createPortal(
              <div
                className="sheet-overlay ms-lang-overlay"
                role="presentation"
                onClick={(e) => {
                  if (e.target === e.currentTarget) close();
                }}
              >
                <div
                  className="sheet-panel ms-sheet-card scale-in ms-lang-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${menuId}-title`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ms-lang-sheet-head">
                    <h2 id={`${menuId}-title`} className="ms-lang-sheet-title">
                      {ts("language.selectTitle")}
                    </h2>
                    <button
                      type="button"
                      className="ms-glass-icon-btn"
                      aria-label={t("nav.closeMenu")}
                      onClick={close}
                      style={{ width: 36, height: 36 }}
                    >
                      <X size={16} strokeWidth={2.25} />
                    </button>
                  </div>

                  <div className="ms-lang-sheet-list" role="listbox" aria-label={ts("language.selectTitle")}>
                    {options.map((opt) => {
                      const selected = draft === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`ms-lang-sheet-option${selected ? " is-active" : ""}`}
                          onClick={() => {
                            playUiSound("soft");
                            setDraft(opt.id);
                          }}
                        >
                          <FlagMark code={opt.flag} size={28} />
                          <span className="ms-lang-sheet-option-label">{opt.name}</span>
                          {selected ? (
                            <Check size={18} color="#006bfd" strokeWidth={2.5} aria-hidden />
                          ) : (
                            <span style={{ width: 18 }} aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {draft !== lng ? (
                    <p style={{ margin: "4px 0 12px", textAlign: "center", color: "#4A5D72", fontSize: 14, lineHeight: 1.45 }}>
                      {ts("language.confirmMessage", { language: options.find((o) => o.id === draft)?.name || "" })}
                    </p>
                  ) : null}
                  <button type="button" className="ms-pill-cta ms-lang-sheet-confirm" onClick={confirm}>
                    {draft !== lng ? ts("language.confirmAction") : ts("language.confirm")}
                  </button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
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
        <FlagMark code={current.flag} />
        <span>{current.code}</span>
      </button>
      {open && (
        <div className="ms-lang-menu" id={menuId} role="listbox" aria-label={t("lang.label")}>
          {options.map((opt) => {
            const selected = lng === opt.id;
            const className = `ms-lang-option${selected ? " is-active" : ""}`;
            const inner = (
              <>
                <FlagMark code={opt.flag} />
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
