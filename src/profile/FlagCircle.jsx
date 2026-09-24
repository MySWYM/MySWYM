/**
 * Drapeau SVG recadré en rond, comme les langues (LanguageSwitcher).
 */
import { countryFlagSrc } from "../lib/countries.js";

export default function FlagCircle({ code, size = 22, lazy = true }) {
  const src = countryFlagSrc(code);
  if (!src) return null;
  return (
    <span
      className="ios-flag-circle"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        decoding="async"
        loading={lazy ? "lazy" : "eager"}
      />
    </span>
  );
}
