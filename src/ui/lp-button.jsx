import { Slot } from "radix-ui";

export function LpButton({ asChild = false, className = "", size, type = "button", ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  const classes = ["lp-btn", size === "lg" && "lp-btn-lg", className].filter(Boolean).join(" ");
  return <Comp className={classes} {...(asChild ? props : { type, ...props })} />;
}
