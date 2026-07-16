import { useEffect, useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

const C = {
  ink: "#191c1e",
  white: "#ffffff",
  secondary: "#5d5e61",
  border: "rgba(53,93,163,0.08)",
  accent: "#8eb3ff",
  accentText: "#154388",
};

const LINKS = [
  ["Comment ca marche", "/comment-ca-marche"],
  ["Objectifs", "/objectifs"],
  ["Tarifs", "/tarifs"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 900);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMobile && menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, menuOpen]);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: (scrolled || menuOpen) ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0)",
        backdropFilter: (scrolled || menuOpen) ? "blur(16px)" : "none",
        borderBottom: (scrolled || menuOpen) ? `1px solid ${C.border}` : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(142,179,255,0.12)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "0 20px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <a href="/accueil" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 900, fontSize: 18, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>MYSWYM</span>
          </a>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {LINKS.map(([label, href]) => (
                <a key={href} href={href} style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", fontFamily: "'Lexend', sans-serif" }}>
                  {label}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <a href="/connexion" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 12px", fontFamily: "'Lexend', sans-serif" }}>
                Se connecter
              </a>
            )}
            <a href="/" style={{
              background: C.accent, color: C.accentText, fontSize: isMobile ? 13 : 14, fontWeight: 700,
              padding: isMobile ? "9px 16px" : "10px 22px", borderRadius: 100, textDecoration: "none",
              fontFamily: "'Lexend', sans-serif", boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
            }}>
              Générer mon plan
            </a>
            {isMobile && (
              <button onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px 4px", marginLeft: 4, color: C.ink }}>
                {menuOpen ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 199, pointerEvents: menuOpen ? "all" : "none" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(25,28,30,0.28)", opacity: menuOpen ? 1 : 0, transition: "opacity 0.25s" }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, background: C.white, borderBottom: `1px solid ${C.border}`,
            boxShadow: menuOpen ? "0 8px 32px rgba(142,179,255,0.18)" : "none", padding: "8px 0 24px",
            transform: menuOpen ? "translateY(0)" : "translateY(-100%)", visibility: menuOpen ? "visible" : "hidden",
            transition: menuOpen ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0s" : "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0.28s",
          }}>
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", color: C.ink, fontSize: 16, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${C.border}`, fontFamily: "'Lexend', sans-serif" }}>
                {label}
                <ChevronRight size={16} color="#737782" />
              </a>
            ))}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/connexion" onClick={() => setMenuOpen(false)} style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: 16, border: "1.5px solid #c3c6d2", color: C.ink, fontSize: 15, fontWeight: 600, textDecoration: "none", background: "#f2f3f6", fontFamily: "'Lexend', sans-serif" }}>
                Se connecter
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
