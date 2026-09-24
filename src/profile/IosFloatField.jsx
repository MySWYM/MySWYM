/**
 * Champ pastille iOS : label au centre si vide, flotte en haut dès focus ou valeur.
 */
import { useState } from "react";

export default function IosFloatField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);
  const filled = String(value ?? "").trim() !== "";
  const up = focused || filled;

  return (
    <label className={`ios-float${up ? " is-up" : ""}${focused ? " is-focus" : ""}`}>
      <span className="ios-float-label">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </label>
  );
}

export function IosFloatButton({
  label,
  value,
  prefix,
  onClick,
  disabled = false,
}) {
  const up = String(value ?? "").trim() !== "";
  return (
    <button
      type="button"
      className={`ios-float ios-float-btn${up ? " is-up" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="ios-float-label">{label}</span>
      {up ? (
        <span className="ios-float-value">
          {prefix}
          {value}
        </span>
      ) : null}
    </button>
  );
}
