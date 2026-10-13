import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import { useReducedMotion } from "framer-motion";

/** Résout `/school-motion/…` sous Vite et Capacitor. */
function resolveMotionUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  try {
    return new URL(path.replace(/^\//, ""), document.baseURI || window.location.href).href;
  } catch {
    return path;
  }
}

/**
 * @param {{ path: string|null|undefined, className?: string }} props
 */
export default function LibraryMotion({ path, className = "" }) {
  const reduced = useReducedMotion();
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path || !hostRef.current) return undefined;

    let cancelled = false;
    let anim = null;
    setFailed(false);
    hostRef.current.innerHTML = "";

    const url = resolveMotionUrl(path);

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled || !hostRef.current) return;
        if (!json?.layers?.length) throw new Error("empty lottie");

        const animationData = JSON.parse(JSON.stringify(json));
        anim = lottie.loadAnimation({
          container: hostRef.current,
          renderer: "svg",
          loop: !reduced,
          autoplay: !reduced,
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: false,
          },
        });
        if (reduced) anim.goToAndStop(0, true);
      } catch (err) {
        if (cancelled) return;
        console.warn("[LibraryMotion] load failed", path, err);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (anim) {
        anim.destroy();
        anim = null;
      }
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [path, reduced]);

  if (!path) return null;

  return (
    <div className={`ms-library-motion${className ? ` ${className}` : ""}`} aria-hidden>
      <div className="ms-library-motion-stage">
        <div
          ref={hostRef}
          className={`ms-library-motion-lottie${failed ? " is-failed" : ""}`}
        />
        {failed ? <div className="ms-library-motion-fallback" /> : null}
      </div>
    </div>
  );
}
