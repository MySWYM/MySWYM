import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { POSTS } from "./posts.js";
import { Waves, ArrowRight, Clock, ChevronRight } from "lucide-react";

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

const C = {
  ink:      "#0C1117",
  inkLight: "#141C26",
  inkMid:   "#1E2A38",
  blue:     "#0A84FF",
  white:    "#FFFFFF",
  grey:     "#8A9BB0",
  greyLight:"#C4CDD8",
  border:   "rgba(255,255,255,0.08)",
};

function Nav() {
  const isMobile = useIsMobile();
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(12,17,23,0.95)", backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: C.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={16} color={C.white} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: C.white }}>MySWYM</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && <Link to="/#pricing" style={{ color: C.grey, fontSize: 14, textDecoration: "none" }}>Tarifs</Link>}
          <Link to="/app" style={{ background: C.blue, color: C.white, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 9, textDecoration: "none" }}>Commencer</Link>
        </div>
      </div>
    </nav>
  );
}

export default function Blog() {
  const isMobile = useIsMobile();
  useEffect(() => {
    document.title = "Blog MySWYM — Conseils natation & entraînement";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ paddingTop: isMobile ? 90 : 120, paddingBottom: 48, paddingLeft: 20, paddingRight: 20, textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
          <span style={{ color: C.blue, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>BLOG</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 54px)", color: C.white, margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
          Conseils natation<br />& entraînement
        </h1>
        <p style={{ color: C.grey, fontSize: 17, maxWidth: 480, margin: "0 auto" }}>
          Méthodes, plans, techniques — tout ce qu'il faut pour progresser dans l'eau.
        </p>
      </div>

      {/* Articles */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: `0 16px 80px` }}>
        {/* Featured — premier article en grand */}
        <Link to={`/blog/${POSTS[0].slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 28 }}>
          <div style={{
            background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 24, overflow: "hidden",
            transition: "border-color 0.25s, transform 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(10,132,255,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {/* Color bar */}
            <div style={{ height: 6, background: `linear-gradient(90deg, ${POSTS[0].coverColor}, transparent)` }} />
            <div style={{ padding: isMobile ? "20px 18px" : "32px 36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ background: `${POSTS[0].coverColor}18`, color: POSTS[0].coverColor, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, letterSpacing: "0.05em" }}>{POSTS[0].category}</span>
                <span style={{ color: C.grey, fontSize: 13 }}>{POSTS[0].date}</span>
                <span style={{ color: C.grey, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{POSTS[0].readingTime}</span>
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: C.white, margin: "0 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{POSTS[0].title}</h2>
              <p style={{ color: C.grey, fontSize: 15, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 600 }}>{POSTS[0].intro}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.blue, fontWeight: 600, fontSize: 14 }}>
                Lire l'article <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </Link>

        {/* Deux autres articles côte à côte */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {POSTS.slice(1).map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", height: "100%",
                transition: "border-color 0.25s, transform 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(10,132,255,0.35)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ height: 5, background: `linear-gradient(90deg, ${post.coverColor}, transparent)` }} />
                <div style={{ padding: "24px 26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ background: `${post.coverColor}18`, color: post.coverColor, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100 }}>{post.category}</span>
                    <span style={{ color: C.grey, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{post.readingTime}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.white, margin: "0 0 10px", lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>{post.intro.slice(0, 120)}…</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.blue, fontWeight: 600, fontSize: 13 }}>
                    Lire <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: C.inkLight, borderTop: `1px solid ${C.border}`, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, background: C.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={14} color={C.white} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: C.white }}>MySWYM</span>
        </div>
        <p style={{ color: C.grey, fontSize: 12 }}>© 2025 MySWYM. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
