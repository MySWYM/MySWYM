import { useState } from "react";
import { Star } from "lucide-react";
import { usePublishedReviews } from "./usePublishedReviews.js";

const FONT = "'Lexend', sans-serif";
const C = {
  ink: "#191c1e",
  inkLight: "#434751",
  secondary: "#5d5e61",
  accent: "#8eb3ff",
  accentText: "#154388",
  border: "rgba(53,93,163,0.12)",
  white: "#ffffff",
  bgSoft: "#edeef1",
};

function StarRow({ value, onChange, readOnly = false }) {
  return (
    <div style={{ display: "flex", gap: 4 }} role={readOnly ? "img" : "radiogroup"} aria-label="Note sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} sur 5`}
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: readOnly ? "default" : "pointer",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Star size={22} fill={n <= value ? "#d4a017" : "none"} color="#d4a017" />
        </button>
      ))}
    </div>
  );
}

export default function LandingReviews() {
  const reviews = usePublishedReviews();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    const honey = e.currentTarget.elements.company?.value || "";
    try {
      const res = await fetch("/api/landing-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rating,
          body: body.trim(),
          email: email.trim(),
          company: honey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Envoi impossible");
      setStatus("ok");
      setName("");
      setBody("");
      setEmail("");
      setRating(5);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "Envoi impossible.");
    }
  };

  return (
    <section id="avis" style={{ background: C.bgSoft, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: FONT }}>
        <p style={{
          display: "inline-flex", background: "#d8e2ff", borderRadius: 100,
          padding: "5px 14px", color: "#355da3", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
        }}>AVIS</p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 4.5vw, 48px)",
          fontWeight: 800, color: C.ink, margin: "16px 0 12px", textTransform: "uppercase",
        }}>
          Ce qu’en disent les nageurs
        </h2>
        <p style={{ color: C.secondary, fontSize: 16, lineHeight: 1.6, margin: "0 0 28px" }}>
          Uniquement des avis réels, publiés après relecture. Pas de témoignages inventés.
        </p>

        {reviews.length === 0 ? (
          <p style={{
            background: C.white, border: `1px dashed ${C.border}`, borderRadius: 16,
            padding: 20, color: C.secondary, fontSize: 15, lineHeight: 1.55, marginBottom: 24,
          }}>
            Les premiers avis publiés apparaîtront ici.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {reviews.map((r) => (
              <article key={r.id} style={{
                background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18,
              }}>
                <StarRow value={r.rating} readOnly />
                <p style={{ margin: "8px 0 6px", color: C.ink, fontSize: 15, lineHeight: 1.6 }}>{r.body}</p>
                <p style={{ margin: 0, color: C.secondary, fontSize: 13, fontWeight: 700 }}>{r.authorName}</p>
              </article>
            ))}
          </div>
        )}

        <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
          Avis Google : fiche à créer.
        </p>

        {status === "ok" ? (
          <p style={{ background: "#e6f8f1", color: "#0f5c40", borderRadius: 14, padding: 16, fontWeight: 600 }}>
            Merci. Ton avis est en relecture — il s’affichera s’il est publié.
          </p>
        ) : (
          <form onSubmit={submit} style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>Prénom *</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
                style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 13px", fontSize: 15, fontFamily: FONT, minHeight: 44 }} />
            </label>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>Note *</span>
              <StarRow value={rating} onChange={setRating} />
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>Ton avis *</span>
              <textarea required value={body} onChange={(e) => setBody(e.target.value)} maxLength={800} rows={4}
                style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 13px", fontSize: 15, fontFamily: FONT }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>Email (non publié)</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false}
                style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 13px", fontSize: 15, fontFamily: FONT, minHeight: 44 }} />
            </label>
            {status === "error" ? <p style={{ margin: 0, color: "#b42318", fontSize: 13, fontWeight: 600 }}>{errorMsg}</p> : null}
            <button type="submit" disabled={status === "sending"} style={{
              border: "none", borderRadius: 14, minHeight: 48, background: C.accent, color: C.accentText,
              fontWeight: 700, fontSize: 15, fontFamily: FONT, cursor: "pointer",
            }}>
              {status === "sending" ? "Envoi…" : "Envoyer mon avis"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
