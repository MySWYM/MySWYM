import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { POSTS } from "./posts.js";
import { Waves, ArrowLeft, Clock, ArrowRight, ChevronRight } from "lucide-react";

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
  offwhite: "#F2F4F8",
  grey:     "#8A9BB0",
  greyLight:"#C4CDD8",
  border:   "rgba(255,255,255,0.08)",
  borderMid:"rgba(255,255,255,0.14)",
};

// Transforme le markdown léger en JSX
function RichText({ text }) {
  const paragraphs = text.trim().split(/\n\n+/);
  return (
    <>
      {paragraphs.map((para, i) => {
        // Titre h3 **...**
        if (para.startsWith("**") && para.endsWith("**") && !para.slice(2,-2).includes("**")) {
          return <h3 key={i} style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.white, margin: "28px 0 8px" }}>{para.slice(2,-2)}</h3>;
        }
        // Paragraphe avec gras inline
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ color: C.grey, fontSize: 15, lineHeight: 1.8, margin: "0 0 18px" }}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} style={{ color: C.offwhite, fontWeight: 600 }}>{part.slice(2,-2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </>
  );
}

function Nav({ post }) {
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
          <Link to="/blog" style={{ color: C.grey, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            <ArrowLeft size={13} /> {!isMobile && "Blog"}
          </Link>
          <Link to="/app" style={{ background: C.blue, color: C.white, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 9, textDecoration: "none" }}>Commencer</Link>
        </div>
      </div>
    </nav>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS.find(p => p.slug === slug);
  const others = POSTS.filter(p => p.slug !== slug).slice(0, 2);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — MySWYM`;
      // Meta description
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = post.description;
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) return <Navigate to="/blog" />;

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav post={post} />

      {/* Header article */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 18px 0" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontSize: 13, color: C.grey }}>
          <Link to="/" style={{ color: C.grey, textDecoration: "none" }}>Accueil</Link>
          <ChevronRight size={12} />
          <Link to="/blog" style={{ color: C.grey, textDecoration: "none" }}>Blog</Link>
          <ChevronRight size={12} />
          <span style={{ color: post.coverColor }}>{post.category}</span>
        </div>

        {/* Category + meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ background: `${post.coverColor}18`, color: post.coverColor, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 100 }}>{post.category}</span>
          <span style={{ color: C.grey, fontSize: 14 }}>{post.date}</span>
          <span style={{ color: C.grey, fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} />{post.readingTime} de lecture</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(28px, 5vw, 46px)", color: C.white,
          margin: "0 0 24px", letterSpacing: "-1.2px", lineHeight: 1.12,
        }}>{post.title}</h1>

        {/* Color bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${post.coverColor}, transparent)`, borderRadius: 2, marginBottom: 36 }} />

        {/* Intro */}
        <p style={{ color: C.greyLight, fontSize: 18, lineHeight: 1.75, margin: "0 0 60px", fontStyle: "italic" }}>{post.intro}</p>
      </div>

      {/* Article body */}
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
        {post.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 52 }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: "clamp(20px, 3vw, 26px)", color: C.white,
              margin: "0 0 20px", letterSpacing: "-0.5px", lineHeight: 1.25,
              paddingLeft: 16,
              borderLeft: `3px solid ${post.coverColor}`,
            }}>{section.h2}</h2>
            <RichText text={section.content} />
          </section>
        ))}

        {/* CTA block */}
        <div style={{
          background: "linear-gradient(135deg, #0F1E32, #0C1117)",
          border: `1px solid rgba(10,132,255,0.35)`,
          borderRadius: 24, padding: "36px 32px",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(10,132,255,0.08)",
          marginTop: 20,
        }}>
          <div style={{ width: 52, height: 52, background: "rgba(10,132,255,0.12)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Waves size={26} color={C.blue} />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.white, margin: "0 0 12px" }}>{post.cta.title}</h3>
          <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.65, margin: "0 0 24px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>{post.cta.text}</p>
          <Link to="/app" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.blue, color: C.white, fontWeight: 700, fontSize: 15,
            padding: "13px 28px", borderRadius: 12, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(10,132,255,0.3)",
          }}>{post.cta.button} <ArrowRight size={15} /></Link>
          <p style={{ color: C.grey, fontSize: 12, marginTop: 12 }}>Gratuit · 2 minutes · Sans carte bancaire</p>
        </div>
      </article>

      {/* Articles similaires */}
      {others.length > 0 && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 20 }}>À lire aussi</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {others.map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 18,
                  overflow: "hidden", transition: "border-color 0.2s, transform 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${p.coverColor}, transparent)` }} />
                  <div style={{ padding: "18px 20px" }}>
                    <span style={{ background: `${p.coverColor}18`, color: p.coverColor, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100 }}>{p.category}</span>
                    <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: C.white, margin: "10px 0 6px", lineHeight: 1.3 }}>{p.title}</h4>
                    <span style={{ fontSize: 12, color: C.blue, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>Lire <ChevronRight size={12} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
