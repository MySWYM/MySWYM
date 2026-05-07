import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { POSTS } from "./posts.js";
import { Waves, ArrowRight, Clock, ChevronRight } from "lucide-react";

const FONT = "'Lexend', sans-serif";

const C = {
  bg:          "#f8f9fc",
  bgCard:      "#ffffff",
  bgSoft:      "#edeef1",
  ink:         "#191c1e",
  inkLight:    "#434751",
  primary:     "#355da3",
  accent:      "#8eb3ff",
  accentText:  "#154388",
  primaryFix:  "#d8e2ff",
  secondary:   "#5d5e61",
  outline:     "#737782",
  border:      "rgba(53,93,163,0.08)",
  shadow:      "0 2px 12px rgba(142,179,255,0.10)",
  shadowMd:    "0 8px 32px rgba(142,179,255,0.18)",
  white:       "#ffffff",
};

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

function Nav() {
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.0)",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
      boxShadow: scrolled ? "0 1px 20px rgba(142,179,255,0.12)" : "none",
      transition: "background 0.3s, box-shadow 0.3s",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/accueil" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={18} color={C.accentText} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>MySwym</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && (
            <Link to="/#pricing" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", fontFamily: FONT }}>Tarifs</Link>
          )}
          <Link to="/app" style={{
            background: C.accent, color: C.accentText,
            fontSize: 13, fontWeight: 700,
            padding: "9px 18px", borderRadius: 100,
            textDecoration: "none", fontFamily: FONT,
            boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
          }}>Commencer</Link>
        </div>
      </div>
    </nav>
  );
}

export default function Blog() {
  const isMobile = useIsMobile();
  useEffect(() => {
    document.title = "Blog MySWYM — Conseils natation & entraînement";
    document.body.style.background = C.bg;
    document.body.style.fontFamily = FONT;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <Nav />

      {/* Hero */}
      <div style={{
        paddingTop: isMobile ? 96 : 120, paddingBottom: 52,
        paddingLeft: 20, paddingRight: 20, textAlign: "center",
        background: `radial-gradient(circle at top center, #eef2ff 0%, ${C.bg} 60%)`,
      }}>
        <div style={{
          display: "inline-block", background: C.primaryFix,
          borderRadius: 100, padding: "5px 14px", marginBottom: 20,
        }}>
          <span style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: FONT }}>BLOG</span>
        </div>
        <h1 style={{
          fontFamily: FONT, fontWeight: 800,
          fontSize: "clamp(30px, 5vw, 52px)",
          color: C.ink, margin: "0 0 16px",
          letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          Conseils natation<br />&amp; entraînement
        </h1>
        <p style={{ color: C.inkLight, fontSize: 17, maxWidth: 480, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
          Méthodes, plans, techniques — tout ce qu'il faut pour progresser dans l'eau.
        </p>
      </div>

      {/* Articles */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: `0 16px 80px` }}>
        {/* Article vedette */}
        <Link to={`/blog/${POSTS[0].slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 28, overflow: "hidden",
            boxShadow: C.shadow,
            transition: "box-shadow 0.25s, transform 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ height: 5, background: `linear-gradient(90deg, ${POSTS[0].coverColor}, transparent)` }} />
            <div style={{ padding: isMobile ? "20px 18px" : "32px 36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ background: `${POSTS[0].coverColor}18`, color: POSTS[0].coverColor, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, letterSpacing: "0.05em", fontFamily: FONT }}>{POSTS[0].category}</span>
                <span style={{ color: C.outline, fontSize: 13, fontFamily: FONT }}>{POSTS[0].date}</span>
                <span style={{ color: C.outline, fontSize: 13, display: "flex", alignItems: "center", gap: 4, fontFamily: FONT }}><Clock size={12} />{POSTS[0].readingTime}</span>
              </div>
              <h2 style={{ fontFamily: FONT, fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{POSTS[0].title}</h2>
              <p style={{ color: C.inkLight, fontSize: 15, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 600, fontFamily: FONT }}>{POSTS[0].intro}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.primary, fontWeight: 600, fontSize: 14, fontFamily: FONT }}>
                Lire l'article <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </Link>

        {/* Autres articles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {POSTS.slice(1).map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 22, overflow: "hidden", height: "100%",
                boxShadow: C.shadow,
                transition: "box-shadow 0.25s, transform 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ height: 5, background: `linear-gradient(90deg, ${post.coverColor}, transparent)` }} />
                <div style={{ padding: "24px 26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ background: `${post.coverColor}18`, color: post.coverColor, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, fontFamily: FONT }}>{post.category}</span>
                    <span style={{ color: C.outline, fontSize: 12, display: "flex", alignItems: "center", gap: 3, fontFamily: FONT }}><Clock size={11} />{post.readingTime}</span>
                  </div>
                  <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 10px", lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ color: C.inkLight, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", fontFamily: FONT }}>{post.intro.slice(0, 120)}…</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.primary, fontWeight: 600, fontSize: 13, fontFamily: FONT }}>
                    Lire <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: C.bgSoft, borderTop: `1px solid ${C.border}`, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={15} color={C.accentText} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: C.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>MySwym</span>
        </div>
        <p style={{ color: C.outline, fontSize: 12, fontFamily: FONT }}>© 2025 MySWYM. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
