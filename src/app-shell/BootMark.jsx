import { useState } from "react";
import { LOGO_BOOT_MARK } from "../lib/brand.js";

/** GIF de préparation de plan. Pas le boot marketing. */
export default function BootMark() {
  const [reduce] = useState(() =>
    typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <div className="myswym-boot-stage" aria-hidden="true">
      {reduce ? (
        <img
          className="myswym-boot-still"
          src={LOGO_BOOT_MARK}
          alt=""
          width={200}
          height={200}
        />
      ) : (
        <img
          className="myswym-boot-gif"
          src="/chargement-application-natation.gif"
          alt=""
          width={200}
          height={200}
        />
      )}
    </div>
  );
}
