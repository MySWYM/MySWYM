import { Link } from "react-router-dom";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";
import { BRAND, FONT, FONT_DISPLAY } from "./theme/brand.js";
import "./theme/public.css";

export default function MerciPage() {
  usePageSeo({
    title: "Message envoyé — MySWYM",
    description: "Nous avons bien reçu ton message. Réponse sous 24–48 h ouvrées.",
    path: "/merci",
    noIndex: true,
  });

  return (
    <div className="ms-root" style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: FONT, color: BRAND.ink }}>
      <PublicNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 64px", textAlign: "center" }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(36px,5vw,52px)", fontWeight: 800,
          textTransform: "none", margin: "0 0 16px", letterSpacing: "-0.03em",
        }}>
          Merci
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: BRAND.inkLight, margin: "0 0 28px" }}>
          Ton message est bien parti. On te répond sous 24–48 h ouvrées.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link to="/accueil" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, background: BRAND.primary, color: BRAND.accentText, fontWeight: 700, textDecoration: "none",
          }}>
            Retour à l’accueil
          </Link>
          <Link to="/inscription" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, border: `1.5px solid ${BRAND.outlineVar}`, color: BRAND.ink, fontWeight: 700, textDecoration: "none",
          }}>
            Démarrer l’essai
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
