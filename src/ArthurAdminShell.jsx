import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import {
  ARTHUR_ADMIN_SECRET_KEY,
  arthurAdminHeaders,
  isLocalDev,
  isPrimaryAdminEmail,
  probeArthurAdmin,
  readStoredAdminSecret,
  writeStoredAdminSecret,
} from "./lib/arthur-admin-auth.js";

const AdminCtx = createContext({ secret: "", headers: async () => ({}) });

// eslint-disable-next-line react-refresh/only-export-components
export function useArthurAdmin() {
  return useContext(AdminCtx);
}

const NAV = [
  { to: "/admin", label: "Accueil", end: true },
  { to: "/admin/arthur-nageurs", label: "Nageurs", end: false },
  { to: "/admin/arthur-shadow", label: "Messages", end: false },
  { to: "/admin/arthur-growth", label: "Chiffres", end: false },
  { to: "/admin/arthur-followups", label: "Relances", end: false },
  { to: "/admin/arthur-optimize", label: "Qualité", end: false },
  { to: "/admin/arthur-readiness", label: "Santé", end: false },
];

export default function ArthurAdminShell() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState(readStoredAdminSecret);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(
    () => arthurAdminHeaders(secret, { json: true }),
    [secret],
  );

  const unlockWith = async (nextSecret) => {
    const key = (nextSecret || "").trim();
    try {
      await probeArthurAdmin(key);
      if (key) {
        writeStoredAdminSecret(key);
        setSecret(key);
      }
      setUnlocked(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const apiMissing =
        code === "API_ADMIN_ABSENTE" || /^HTTP 200\b/.test(code);
      if (apiMissing && isLocalDev() && key) {
        writeStoredAdminSecret(key);
        setSecret(key);
        setUnlocked(true);
        return;
      }
      throw err;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      setError("");
      const stored = readStoredAdminSecret();
      if (!stored) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        await unlockWith(stored);
      } catch (err) {
        if (!cancelled) {
          writeStoredAdminSecret("");
          setSecret("");
          setUnlocked(false);
          setError(
            friendlyAuthError(err instanceof Error ? err.message : "Accès refusé"),
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== ARTHUR_ADMIN_SECRET_KEY) return;
      const next = (e.newValue || "").trim();
      if (!next) {
        setSecret("");
        setUnlocked(false);
        return;
      }
      unlockWith(next).catch(() => setUnlocked(false));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const friendlyAuthError = (msg) => {
    if (/Auth admin requise|Clé refusée|HTTP 401|Session invalide/i.test(msg)) {
      return "Identifiants incorrects.";
    }
    if (msg === "API_ADMIN_ABSENTE" || /^HTTP 200\b/.test(msg)) {
      return "En local l’API n’est pas lancée. La session est quand même ouverte : les chiffres s’afficheront sur staging.";
    }
    return msg;
  };

  const signIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const mail = email.trim().toLowerCase();
    const key = password.trim();
    if (!isPrimaryAdminEmail(mail)) {
      setError("Identifiants incorrects.");
      setBusy(false);
      return;
    }
    if (!key) {
      setError("Entre le mot de passe.");
      setBusy(false);
      return;
    }
    try {
      await unlockWith(key);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : "Connexion impossible"));
      setUnlocked(false);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    writeStoredAdminSecret("");
    setSecret("");
    setUnlocked(false);
    setPassword("");
  };

  if (checking) {
    return (
      <div style={page}>
        <p style={{ margin: 0, color: "#9bb0c4" }}>Vérification de l’accès…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={page}>
        <div style={card}>
          <BrandLogo variant="wordmark" height={28} />
          <h1 style={title}>Espace admin</h1>
          <form onSubmit={signIn}>
            <label htmlFor="admin-email" style={label}>
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
            <label htmlFor="admin-password" style={label}>
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
            {error ? (
              <p style={errBox} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} style={btnPrimary}>
              {busy ? "Connexion…" : "Entrer"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ secret, headers }}>
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f7fb",
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <header
          style={{
            background: "#0c1a2e",
            color: "#fff",
            padding: "12px 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <BrandLogo variant="wordmark" height={22} onDark />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>ADMIN</span>
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginLeft: "auto",
            }}
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  color: "#fff",
                  textDecoration: "none",
                  padding: "10px 12px",
                  minHeight: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 8,
                  background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={signOut} style={signOutBtn}>
            Sortir
          </button>
        </header>
        <Outlet />
      </div>
    </AdminCtx.Provider>
  );
}

const page = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "#0c1a2e",
  fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
};

const card = {
  width: "min(420px, 100%)",
  background: "#fff",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.25)",
};

const title = {
  fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
  fontSize: 28,
  margin: "16px 0 8px",
  color: "#0c1a2e",
};

const label = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
  margin: "0 0 6px",
  color: "#0c1a2e",
};
const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  fontSize: 16,
  borderRadius: 10,
  border: "1px solid #d8dee6",
  marginBottom: 14,
  fontFamily: "inherit",
};
const btnPrimary = {
  width: "100%",
  minHeight: 44,
  border: 0,
  borderRadius: 10,
  background: "#154388",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};
const errBox = {
  background: "#fde8e4",
  color: "#8a2b1a",
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 14,
  margin: "0 0 12px",
};
const signOutBtn = {
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255, 255, 255, 0.35)",
  borderRadius: 8,
  padding: "10px 12px",
  minHeight: 44,
  cursor: "pointer",
  fontSize: 13,
};
