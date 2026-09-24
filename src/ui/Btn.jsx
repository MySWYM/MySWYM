/** CTA app unique, même silhouette que `.lp-btn` / `.ms-plan-reveal-btn`. */
export default function Btn({ children, onClick, variant = "primary", disabled, style, type = "button" }) {
  const cls = [
    "ms-app-btn",
    (variant === "ghost") && "is-ghost",
    (variant === "secondary") && "is-secondary",
  ].filter(Boolean).join(" ");
  return (
    <button type={type || "button"} className={cls} disabled={!!disabled} onClick={onClick} style={style}>
      {children}
    </button>
  );
}
