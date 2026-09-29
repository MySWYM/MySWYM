import { useEffect } from "react";
import { bootStatusLabel, markBootWarm } from "../lib/boot-warm.js";

/** Chargement app : logo blanc, fond bleu, anneau. Styles dans index.html. */
export default function Loading() {
  useEffect(() => () => {
    markBootWarm();
    requestAnimationFrame(() => {
      if (!document.querySelector(".myswym-boot")) {
        document.documentElement.classList.remove("myswym-boot-screen");
      }
    });
  }, []);

  return (
    <div
      className="myswym-boot myswym-boot--app"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={bootStatusLabel()}
    >
      <img
        className="myswym-boot-wordmark myswym-boot-wordmark--app"
        src="/logo-myswym-banner-blanc.png"
        alt=""
        height={36}
        width={155}
      />
      <div className="myswym-boot-spin" aria-hidden="true" />
    </div>
  );
}
