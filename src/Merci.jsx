import { Link } from "react-router-dom";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

export default function MerciPage() {
  usePageSeo({
    title: "Message envoyé — MySWYM",
    description: "Nous avons bien reçu ton message. Réponse sous 24–48 h ouvrées.",
    path: "/merci",
    noIndex: true,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: FONT, color: "#191c1e" }}>
      <PublicNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 64px", textAlign: "center" }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(36px,5vw,52px)", fontWeight: 800,
          textTransform: "uppercase", margin: "0 0 16px",
        }}>
          Merci
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "#5d5e61", margin: "0 0 28px" }}>
          Ton message est bien parti. On te répond sous 24–48 h ouvrées.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link to="/" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, background: "#8eb3ff", color: "#154388", fontWeight: 700, textDecoration: "none",
          }}>
            Retour à l’accueil
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
