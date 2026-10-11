import { useEffect } from "react";
import { LOGO_WORDMARK_DARK, LOGO_WORDMARK_RATIO } from "../lib/brand.js";
import { bootStatusLabel, markBootWarm } from "../lib/boot-warm.js";

const WORDMARK_H = 36;

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
        src={LOGO_WORDMARK_DARK}
        alt=""
        height={WORDMARK_H}
        width={Math.round(WORDMARK_H * LOGO_WORDMARK_RATIO)}
      />
      <div className="myswym-boot-spin" aria-hidden="true" />
    </div>
  );
}
