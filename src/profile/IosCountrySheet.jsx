/**
 * Sheet pays : recherche + liste drapeau SVG rond / nom FR.
 */
import { useMemo, useState } from "react";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { searchCountries } from "../lib/countries.js";
import FlagCircle from "./FlagCircle.jsx";

export default function IosCountrySheet({ open, value, onClose, onPick }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => searchCountries(query), [query]);

  return (
    <SoftMistSheet
      open={open}
      title="Rechercher un pays"
      onClose={() => {
        setQuery("");
        onClose?.();
      }}
      fullscreenMobile
    >
      <label className="ios-country-search">
        <span className="ios-country-search-label">Rechercher</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>
      <div className="ios-country-list">
        {rows.map((c) => {
          const active = value === c.code;
          return (
            <button
              key={c.code}
              type="button"
              className={`ios-country-row${active ? " is-active" : ""}`}
              onClick={() => {
                setQuery("");
                onPick?.(c.code);
              }}
            >
              <FlagCircle code={c.code} />
              <span className="ios-country-name">{c.name}</span>
            </button>
          );
        })}
      </div>
    </SoftMistSheet>
  );
}
