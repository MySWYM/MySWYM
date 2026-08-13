/**
 * Écran bloquant Version Gate — force update.
 * Style minimal aligné thème MySWYM ; n’altère pas le design existant de l’app.
 */
import { useCallback, useEffect, useState } from "react";
import { CURRENT_APP_VERSION } from "./lib/app-version.js";
import {
  checkVersionGate,
  cleanupUpdateQueryParam,
  forceAppUpdateReload,
} from "./lib/version-gate.js";

const shell = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "linear-gradient(160deg, #05070A 0%, #0c1520 55%, #0a1628 100%)",
  color: "#f4f7fb",
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const card = {
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
};

const title = {
  margin: "0 0 12px",
  fontSize: "1.35rem",
  fontWeight: 650,
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
};

const text = {
  margin: "0 0 8px",
  fontSize: "0.98rem",
  lineHeight: 1.5,
  color: "rgba(244,247,251,0.82)",
};

const btn = {
  marginTop: 28,
  appearance: "none",
  border: "none",
  borderRadius: 12,
  padding: "14px 22px",
  width: "100%",
  maxWidth: 280,
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  background: "#3B82F6",
  color: "#fff",
};

const meta = {
  marginTop: 18,
  fontSize: "0.75rem",
  color: "rgba(244,247,251,0.45)",
};

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function VersionGate({ children }) {
  const [state, setState] = useState({
    ready: false,
    mustUpdate: false,
    message: null,
    minSupportedAppVersion: null,
    checking: false,
  });
  const [reloading, setReloading] = useState(false);

  const runCheck = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }));
    const result = await checkVersionGate();
    if (result.status === "ok") {
      cleanupUpdateQueryParam();
    }
    setState({
      ready: true,
      mustUpdate: !!result.mustUpdate,
      message: result.message,
      minSupportedAppVersion: result.minSupportedAppVersion,
      checking: false,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await checkVersionGate();
      if (cancelled) return;
      if (result.status === "ok") cleanupUpdateQueryParam();
      setState({
        ready: true,
        mustUpdate: !!result.mustUpdate,
        message: result.message,
        minSupportedAppVersion: result.minSupportedAppVersion,
        checking: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      runCheck();
    };
    const onFocus = () => runCheck();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [runCheck]);

  const onUpdate = async () => {
    setReloading(true);
    await forceAppUpdateReload();
  };

  if (!state.ready) {
    // Même loader Apple que App / index.html — un seul écran.
    return (
      <div className="myswym-boot" role="status" aria-busy="true" aria-live="polite">
        <div className="myswym-boot-inner">
          <p className="myswym-boot-mark">MySWYM</p>
          <div className="myswym-boot-spinner" aria-hidden="true" />
          <p className="myswym-boot-label">Loading</p>
        </div>
      </div>
    );
  }

  if (state.mustUpdate) {
    return (
      <div style={shell} role="alertdialog" aria-modal="true" aria-labelledby="vg-title">
        <div style={card}>
          <p style={{ ...text, marginBottom: 20, fontWeight: 600, color: "#93c5fd" }}>MySWYM</p>
          <h1 id="vg-title" style={title}>
            {state.message || "Une nouvelle version de MySWYM est disponible."}
          </h1>
          <p style={text}>
            Une mise à jour est nécessaire pour continuer à utiliser l&apos;application.
          </p>
          <button type="button" style={btn} onClick={onUpdate} disabled={reloading}>
            {reloading ? "Mise à jour…" : "Mettre à jour"}
          </button>
          <p style={meta}>
            Version actuelle {CURRENT_APP_VERSION}
            {state.minSupportedAppVersion
              ? ` · requise ${state.minSupportedAppVersion}`
              : ""}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
