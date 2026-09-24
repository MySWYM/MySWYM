import { bootStatusLabel } from "../lib/boot-warm.js";
import { isNativeApp } from "../lib/native-platform.js";
import Loading from "./Loading.jsx";

/** Chargement marketing : wordmark + barre. Styles dans index.html. iOS : GIF bleu. */
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
          src="/logo-myswym-on-light.png"
          alt=""
          height={22}
          width={95}
        />
        <div className="myswym-boot-track" aria-hidden="true">
          <span className="myswym-boot-bar" />
        </div>
      </div>
    </div>
  );
}
