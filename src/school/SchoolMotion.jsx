import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getMotionScene } from "../lib/swim-school/motion-scenes.js";

/** Résout `/school-motion/…` sous Vite et Capacitor (`myswym://`, `capacitor://`). */
function resolveMotionUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  try {
    return new URL(path.replace(/^\//, ""), document.baseURI || window.location.href).href;
  } catch {
    return path;
  }
}

export default function SchoolMotion({ stepId, showCaption = true }) {
  const { t } = useTranslation("app");
  const reduced = useReducedMotion();
  const scene = getMotionScene(stepId);
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scene?.path || !hostRef.current) return undefined;

    let cancelled = false;
    let anim = null;
    setFailed(false);
    hostRef.current.innerHTML = "";

    const url = resolveMotionUrl(scene.path);

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled || !hostRef.current) return;
        if (!json?.layers?.length) throw new Error("empty lottie");

        // Copie : lottie-web mute le JSON (__complete).
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
        console.warn("[SchoolMotion] load failed", scene.path, err);
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
  }, [scene?.path, stepId, reduced]);

  if (!scene) return null;

  return (
    <div className="ms-school-motion">
      <div className="ms-school-motion-stage" aria-hidden>
        <div
          ref={hostRef}
          className={`ms-school-motion-lottie${failed ? " is-failed" : ""}`}
        />
        {failed ? <div className="ms-school-motion-fallback is-failed" /> : null}
      </div>
      {showCaption ? (
        <p className="ms-school-motion-caption">{t(scene.labelKey)}</p>
      ) : null}
    </div>
  );
}
