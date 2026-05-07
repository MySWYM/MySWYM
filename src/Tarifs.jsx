import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "./supabase.js";
import PublicNav from "./PublicNav.jsx";

const C = {
  bg: "#f8f9fc",
  bgSoft: "#edeef1",
  bgCard: "#f2f3f6",
  ink: "#191c1e",
  secondary: "#5d5e61",
  outlineVar: "#c3c6d2",
  white: "#ffffff",
  accent: "#8eb3ff",
  accentText: "#154388",
  border: "rgba(53,93,163,0.08)",
  shadow: "0 2px 12px rgba(142,179,255,0.10)",
};

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

function useIsMobile(bp = 760) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

export default function TarifsPage() {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Tarifs MySWYM";
    window.scrollTo(0, 0);
  }, []);

  const handlePremium = async (priceId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/?auth=register"; return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      window.location.href = "/";
    }
  };

  const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
  const PRICE_ANNUAL = "price_1TPjyeAS4mfgF2TwmSjSiidD";

  const freeFeatures = [
    "Plan du premier mois (4 semaines)",
    "Tous les objectifs sportifs",
    "1 a 2 seances par semaine",
    "Seances detaillees avec cues",
  ];
  const premiumFeatures = [
    "Plusieurs projets en parallele",
    "Plan complet jusqu'a 52 semaines",
    "Jusqu'a 4 seances par semaine",
    "Toutes les variantes de seances",
    "Progression avancee (seuil, vitesse)",
    "Seances specialisees BNSSA / eau libre",
    "Acces a vie aux mises a jour",
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />

      <section style={{ background: C.bgSoft, padding: isMobile ? "92px 16px 44px" : "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 52 }}>
            <p style={{ color: C.secondary, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", margin: 0 }}>TARIFS</p>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 0.95, fontWeight: 800, color: C.ink, margin: "8px 0 12px", textTransform: "uppercase", letterSpacing: "0" }}>
              Commence gratuitement.<br />Passe premium quand tu veux.
            </h1>
            <p style={{ color: C.secondary, fontSize: isMobile ? 20 : 16, fontFamily: FONT }}>Annule a tout moment.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: isMobile ? 14 : 16, alignItems: "start", paddingTop: isMobile ? 4 : 16 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: isMobile ? 24 : 28, padding: isMobile ? 22 : 32, boxShadow: C.shadow }}>
              <div style={{ fontSize: isMobile ? 34 : 22, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Gratuit</div>
              <div style={{ fontSize: isMobile ? 52 : 38, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.ink, margin: "14px 0 4px", lineHeight: 1 }}>0€</div>
              <div style={{ color: C.secondary, fontSize: isMobile ? 15 : 13, fontFamily: FONT, marginBottom: isMobile ? 16 : 24 }}>Pour toujours</div>
              <Link to="/?auth=register" style={{ display: "block", textAlign: "center", border: `1.5px solid ${C.outlineVar}`, color: C.ink, background: C.bgCard, fontWeight: 700, fontSize: isMobile ? 16 : 15, fontFamily: FONT, padding: isMobile ? "12px" : "13px", borderRadius: 16, textDecoration: "none", marginBottom: isMobile ? 18 : 24 }}>
                Creer mon compte
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 9 : 11 }}>
                {freeFeatures.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={isMobile ? 18 : 15} color={C.secondary} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.secondary, fontSize: isMobile ? 16 : 14, fontFamily: FONT, lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.ink, borderRadius: isMobile ? 24 : 28, padding: isMobile ? "26px 22px 22px" : 28, position: "relative", boxShadow: "0 20px 60px rgba(25,28,30,0.18)" }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.accentText, fontSize: isMobile ? 22 : 11, fontFamily: isMobile ? FONT_DISPLAY : FONT, fontWeight: 700, padding: isMobile ? "5px 16px" : "4px 16px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                MEILLEURE OFFRE
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16 }}>
                <div style={{ fontSize: isMobile ? 34 : 20, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.white, lineHeight: 1.0 }}>Premium Annuel</div>
                <div style={{ background: "#22C55E", color: C.white, fontSize: isMobile ? 14 : 12, fontFamily: FONT, fontWeight: 800, padding: isMobile ? "5px 10px" : "4px 10px", borderRadius: 8 }}>-33%</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: isMobile ? 14 : 20 }}>
                <span style={{ fontSize: isMobile ? 58 : 44, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.white, lineHeight: 1 }}>3,33€</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 16 : 14, fontFamily: FONT, marginBottom: isMobile ? 8 : 6 }}>/mois</span>
              </div>
              <button onClick={() => handlePremium(PRICE_ANNUAL)} style={{ display: "block", width: "100%", background: C.accent, color: C.accentText, fontWeight: 700, fontSize: isMobile ? 18 : 16, fontFamily: FONT, padding: isMobile ? "12px" : "15px", borderRadius: 16, border: "none", cursor: "pointer", marginBottom: isMobile ? 16 : 20 }}>
                Demarrer - 40€/an
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 9 : 11 }}>
                {premiumFeatures.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={isMobile ? 18 : 15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 16 : 14, fontFamily: FONT, lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: isMobile ? 24 : 28, padding: isMobile ? 22 : 32, boxShadow: C.shadow }}>
              <div style={{ fontSize: isMobile ? 34 : 22, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Premium</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "14px 0 4px" }}>
                <span style={{ fontSize: isMobile ? 52 : 38, fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.ink, lineHeight: 1 }}>4,99€</span>
                <span style={{ color: C.secondary, fontSize: isMobile ? 16 : 14, fontFamily: FONT, marginBottom: isMobile ? 8 : 8 }}>/mois</span>
              </div>
              <div style={{ color: C.secondary, fontSize: isMobile ? 15 : 13, fontFamily: FONT, marginBottom: isMobile ? 16 : 24 }}>Sans engagement</div>
              <button onClick={() => handlePremium(PRICE_MONTHLY)} style={{ display: "block", width: "100%", background: C.bgCard, border: `1.5px solid ${C.outlineVar}`, color: C.ink, fontWeight: 700, fontSize: isMobile ? 16 : 15, fontFamily: FONT, padding: isMobile ? "12px" : "13px", borderRadius: 16, cursor: "pointer", marginBottom: isMobile ? 18 : 24 }}>
                Choisir le mensuel
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 9 : 11 }}>
                {premiumFeatures.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={isMobile ? 18 : 15} color={C.secondary} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.secondary, fontSize: isMobile ? 16 : 14, fontFamily: FONT, lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
