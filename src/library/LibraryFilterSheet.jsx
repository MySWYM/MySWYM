import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { playUiSound } from "../lib/ui-sounds.js";
import {
  countLibraryFiltered,
  LIBRARY_LEVEL_FILTERS,
  LIBRARY_NAGE_FILTERS,
} from "../lib/library/catalog.js";

/**
 * @typedef {{
 *   sources: string[],
 *   nages: string[],
 *   levels: string[],
 *   equipment: string[],
 *   zones: string[],
 * }} LibraryFilterState
 */

export const EMPTY_LIBRARY_FILTERS = /** @type {LibraryFilterState} */ ({
  sources: [],
  nages: [],
  levels: [],
  equipment: [],
  zones: [],
});

function toggleIn(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  items: import("../lib/library/catalog.js").LibraryItem[],
 *  value: LibraryFilterState,
 *  onApply: (next: LibraryFilterState) => void,
 * }} props
 */
export default function LibraryFilterSheet({ open, onClose, items, value, onApply }) {
  const { t } = useTranslation("app");
  const [draft, setDraft] = useState(value || EMPTY_LIBRARY_FILTERS);

  useEffect(() => {
    if (open) setDraft(value || EMPTY_LIBRARY_FILTERS);
  }, [open, value]);

  const count = useMemo(
    () =>
      countLibraryFiltered(items, {
        nages: draft.nages,
        levels: draft.levels,
      }),
    [items, draft],
  );

  const nageOptions = LIBRARY_NAGE_FILTERS.filter((f) => f.id !== "toutes" && f.id !== "all");
  const levelOptions = LIBRARY_LEVEL_FILTERS.filter((f) => f.id);

  return (
    <SoftMistSheet
      open={open}
      onClose={onClose}
      ariaLabel={t("library.filterTitle")}
      title={
        <span className="ms-library-filter-title-row">
          <span>{t("library.filterTitle")}</span>
          <span className="ms-library-filter-count" aria-live="polite">
            {count}
          </span>
        </span>
      }
      footer={
        <div className="ms-library-filter-footer">
          <button
            type="button"
            className="ms-library-filter-reset"
            onClick={() => {
              playUiSound("soft");
              setDraft(EMPTY_LIBRARY_FILTERS);
            }}
          >
            {t("library.filterReset")}
          </button>
          <button
            type="button"
            className="ms-library-cta ms-library-cta-primary ms-library-filter-apply"
            onClick={() => {
              playUiSound("soft");
              onApply({
                ...EMPTY_LIBRARY_FILTERS,
                nages: draft.nages,
                levels: draft.levels,
              });
              onClose();
            }}
          >
            {t("library.filterApply")}
          </button>
        </div>
      }
    >
      <div className="ms-library-filter-body">
        <p className="ms-library-filter-section">{t("library.filterStroke")}</p>
        <div className="ms-library-filter-chips">
          {nageOptions.map((opt) => {
            const on = draft.nages.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`ms-library-filter-chip${on ? " is-on" : ""}`}
                onClick={() => {
                  playUiSound("soft");
                  setDraft((d) => ({ ...d, nages: toggleIn(d.nages, opt.id) }));
                }}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>

        <p className="ms-library-filter-section">{t("library.filterLevel")}</p>
        <div className="ms-library-filter-chips">
          {levelOptions.map((opt) => {
            const on = draft.levels.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`ms-library-filter-chip${on ? " is-on" : ""}`}
                onClick={() => {
                  playUiSound("soft");
                  setDraft((d) => ({ ...d, levels: toggleIn(d.levels, opt.id) }));
                }}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </SoftMistSheet>
  );
}
