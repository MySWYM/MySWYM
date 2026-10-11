import { LOGO_WORDMARK_LIGHT, LOGO_WORDMARK_RATIO } from "../lib/brand.js";
import { bootStatusLabel } from "../lib/boot-warm.js";
import { isNativeApp } from "../lib/native-platform.js";
import Loading from "./Loading.jsx";

const WORDMARK_H = 22;

/** Chargement marketing : wordmark + barre. Styles dans index.html. iOS : logo bleu. */
export default function PublicLoading() {
  if (isNativeApp()) return <Loading />;
  return (
    <div
      className="myswym-boot myswym-boot--public"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={bootStatusLabel()}
    >
      <div className="myswym-boot-inner">
        <img
          className="myswym-boot-wordmark myswym-boot-wordmark--public myswym-boot-wordmark--static"
          src={LOGO_WORDMARK_LIGHT}
          alt=""
          height={WORDMARK_H}
          width={Math.round(WORDMARK_H * LOGO_WORDMARK_RATIO)}
        />
        <div className="myswym-boot-track" aria-hidden="true">
          <span className="myswym-boot-bar" />
        </div>
      </div>
    </div>
  );
}
