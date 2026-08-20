import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";
import {
  BLOG_CATEGORIES,
  PAGE_SIZE,
  fetchPublishedArticles,
  formatArticleDate,
} from "./blogData.js";
import { BRAND, FONT, FONT_HREF } from "./theme/brand.js";
import "./theme/public.css";

const C = { ...BRAND };

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
    l.href = FONT_HREF;
    document.head.appendChild(l);
  }, []);
  return null;
}

function ArticleCard({ article, isMobile }) {
  return (
    <Link to={`/blog/${article.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <article
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 22,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: C.shadow,
          transition: "box-shadow 0.25s, transform 0.25s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = C.shadowMd;
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = C.shadow;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            aspectRatio: "16 / 10",
            background: article.image_url
              ? `center / cover no-repeat url(${article.image_url})`
              : `linear-gradient(135deg, ${C.primaryFix}, ${C.accent})`,
            backgroundColor: C.bgSoft,
          }}
          role="img"
          aria-label={article.titre}
        />
        <div style={{ padding: isMobile ? "18px 16px 20px" : "22px 22px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
          <span
            style={{
              alignSelf: "flex-start",
              background: C.primaryFix,
              color: C.primary,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 100,
              letterSpacing: "0.02em",
              marginBottom: 12,
            }}
          >
            {article.categorie}
          </span>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: isMobile ? 17 : 18,
              fontWeight: 700,
              color: C.ink,
              margin: "0 0 8px",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {article.titre}
          </h2>
          <time
            dateTime={article.date_publication}
            style={{ color: C.outline, fontSize: 12, marginBottom: 10, display: "block" }}
          >
            {formatArticleDate(article.date_publication)}
          </time>
          <p
            style={{
              color: C.inkLight,
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 16px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.extrait}
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.primary,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Lire l&apos;article <ArrowRight size={14} />
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function Blog() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorie = searchParams.get("categorie") || null;
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);

  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  usePageSeo({
    title: "Blog MySWYM — Conseils natation et entraînement",
    description: "Articles natation : technique, plans, eau libre et vocabulaire de bassin — sans jargon inutile.",
    path: "/blog",
  });

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.fontFamily = FONT;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublishedArticles({ categorie, page }).then((res) => {
      if (cancelled) return;
      setArticles(res.articles);
      setTotal(res.total);
      setPageCount(res.pageCount);
      setLoading(false);
      if (res.page !== page) {
        const next = new URLSearchParams(searchParams);
        if (res.page <= 1) next.delete("page");
        else next.set("page", String(res.page));
        setSearchParams(next, { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [categorie, page]);

  const setCategorie = (cat) => {
    const next = new URLSearchParams();
    if (cat) next.set("categorie", cat);
    setSearchParams(next);
  };

  const goPage = (p) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="ms-root" style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />

      <div
        style={{
          paddingTop: isMobile ? 96 : 120,
          paddingBottom: 40,
          paddingLeft: 20,
          paddingRight: 20,
          textAlign: "center",
          background: `radial-gradient(circle at top center, rgba(0,107,253,0.16) 0%, ${C.bg} 60%)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: C.primaryFix,
            borderRadius: 100,
            padding: "5px 14px",
            marginBottom: 20,
          }}
        >
          <span style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>BLOG</span>
        </div>
        <h1
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "clamp(30px, 5vw, 52px)",
            color: C.ink,
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Conseils natation
          <br />
          &amp; entraînement
        </h1>
        <p style={{ color: C.inkLight, fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Méthodes, technique, mental — des articles pour progresser dans l&apos;eau.
        </p>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: `0 16px ${isMobile ? 64 : 80}px` }}>
        {/* Filtre catégories */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: isMobile ? "flex-start" : "center",
            marginBottom: 28,
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 4 : 0,
            WebkitOverflowScrolling: "touch",
          }}
          role="tablist"
          aria-label="Filtrer par catégorie"
        >
          <FilterChip active={!categorie} onClick={() => setCategorie(null)} label="Tous" />
          {BLOG_CATEGORIES.map((cat) => (
            <FilterChip key={cat} active={categorie === cat} onClick={() => setCategorie(cat)} label={cat} />
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: C.secondary, padding: "48px 0" }}>Chargement des articles…</p>
        ) : articles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "56px 20px",
              background: C.bgCard,
              borderRadius: 22,
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ color: C.ink, fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>Aucun article dans cette catégorie</p>
            <p style={{ color: C.secondary, fontSize: 14, margin: 0 }}>
              Les articles seront ajoutés manuellement. Réessaie avec « Tous » ou une autre catégorie.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {articles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} isMobile={isMobile} />
              ))}
            </div>

            {pageCount > 1 && (
              <nav
                aria-label="Pagination"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginTop: 36,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => goPage(page - 1)}
                  disabled={page <= 1}
                  style={pagerBtn(page <= 1)}
                >
                  <ChevronLeft size={16} /> Précédent
                </button>
                <span style={{ color: C.secondary, fontSize: 14, fontWeight: 600 }}>
                  Page {page} / {pageCount}
                  <span style={{ fontWeight: 500, color: C.outline }}> · {total} article{total > 1 ? "s" : ""}</span>
                </span>
                <button
                  type="button"
                  onClick={() => goPage(page + 1)}
                  disabled={page >= pageCount}
                  style={pagerBtn(page >= pageCount)}
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </nav>
            )}

            {pageCount === 1 && total > 0 && total <= PAGE_SIZE && (
              <p style={{ textAlign: "center", color: C.outline, fontSize: 13, marginTop: 28 }}>
                {total} article{total > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        padding: "8px 14px",
        borderRadius: 100,
        border: active ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
        background: active ? C.primaryFix : C.bgCard,
        color: active ? C.primary : C.secondary,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: active ? "none" : C.shadow,
      }}
    >
      {label}
    </button>
  );
}

function pagerBtn(disabled) {
  return {
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
    padding: "10px 16px",
    borderRadius: 100,
    border: `1px solid ${C.border}`,
    background: disabled ? C.bgSoft : C.bgCard,
    color: disabled ? C.outline : C.primary,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
