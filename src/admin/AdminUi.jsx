/**
 * Blocs UI partagés de l’admin (cartes, files, états).
 */
import { Link } from "react-router-dom";
import { btnPrimary, cardBox, dash } from "./admin-format.js";

export function Card({ label, value, hint, to, onClick }) {
  const inner = (
    <>
      <div style={{ fontSize: 14, color: "#5a6a7a", lineHeight: 1.35 }}>{label}</div>
      <div
        style={{
          fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 800,
          color: "#0c1a2e",
          lineHeight: 1.15,
          marginTop: 6,
        }}
      >
        {dash(value)}
      </div>
      {hint ? (
        <div style={{ fontSize: 13, color: "#7a8a9a", marginTop: 6, lineHeight: 1.4 }}>{hint}</div>
      ) : null}
    </>
  );
  if (to) {
    return (
      <Link to={to} style={cardBox}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...cardBox, textAlign: "left", width: "100%" }}>
        {inner}
      </button>
    );
  }
  return <div style={cardBox}>{inner}</div>;
}

export function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      {title ? (
        <h2
          style={{
            fontSize: 18,
            fontWeight: 750,
            color: "#0c1a2e",
            margin: "0 0 12px",
          }}
        >
          {title}
        </h2>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function Banner({ tone = "warn", children }) {
  const bg = tone === "error" ? "#fde8e4" : "#fff6e8";
  const color = tone === "error" ? "#8a2b1a" : "#7a4a12";
  return (
    <p
      style={{
        background: bg,
        color,
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

export function QueueList({ title, rows, empty, onPick }) {
  return (
    <div style={{ ...cardBox, minHeight: 0 }}>
      <div style={{ fontWeight: 750, marginBottom: 10, color: "#0c1a2e" }}>{title}</div>
      {rows.length ? (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {rows.map((row) => (
            <li key={row.user_id || row.id} style={{ marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => onPick?.(row)}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  cursor: onPick ? "pointer" : "default",
                  fontSize: 14,
                  color: "#154388",
                  fontWeight: 600,
                }}
              >
                {row.email || String(row.user_id || row.id || "").slice(0, 8)}
              </button>
              {row.hint ? (
                <div style={{ fontSize: 13, color: "#7a8a9a" }}>{row.hint}</div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, color: "#7a8a9a", fontSize: 14 }}>{empty}</p>
      )}
    </div>
  );
}

export function PageHead({ title, days, setDays, loading, onReload, extra }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <h1
        style={{
          fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
          fontSize: "clamp(1.7rem, 4vw, 2.3rem)",
          margin: 0,
          color: "#0c1a2e",
          flex: "1 1 220px",
        }}
      >
        {title}
      </h1>
      {setDays ? (
        <label style={{ fontSize: 14, color: "#5a6a7a" }}>
          Période{" "}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ marginLeft: 6, padding: "10px 12px", minHeight: 44, borderRadius: 8, fontSize: 16 }}
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
            <option value={0}>Tout</option>
          </select>
        </label>
      ) : null}
      {extra}
      {onReload ? (
        <button type="button" disabled={loading} onClick={onReload} style={btnPrimary}>
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      ) : null}
    </div>
  );
}
