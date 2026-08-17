import { Link } from "react-router-dom";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

export default function NotFoundPage() {
  usePageSeo({
    title: "Page introuvable — MySWYM",
    description: "Cette page n’existe pas. Retrouve l’accueil MySWYM ou démarre ton essai.",
    path: "/404",
    noIndex: true,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: FONT, color: "#191c1e" }}>
      <PublicNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 64px", textAlign: "center" }}>
        <p style={{ color: "#355da3", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 12px" }}>404</p>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(36px,5vw,52px)", fontWeight: 800,
          textTransform: "uppercase", margin: "0 0 16px",
        }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "#5d5e61", margin: "0 0 28px" }}>
          Ce lien ne mène nulle part. Tu peux revenir à l’accueil ou créer ton plan.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link to="/accueil" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, background: "#8eb3ff", color: "#154388", fontWeight: 700, textDecoration: "none",
          }}>
            Accueil
          </Link>
          <Link to="/inscription" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, border: "1.5px solid #c3c6d2", color: "#191c1e", fontWeight: 700, textDecoration: "none",
          }}>
            Démarrer l’essai
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
