import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import Breadcrumb from "./marketing/Breadcrumb.jsx";
import { LocalizedLink, useActiveLocale } from "./i18n/locale-routing.jsx";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { usePageSeo, breadcrumbJsonLd } from "./lib/seo.js";
import { useTranslation } from "react-i18next";
import {
  fetchArticleBySlug,
  fetchRelatedArticles,
  formatArticleDate,
} from "./blogData.js";

const FONT = "'Lexend', sans-serif";

const C = {
  bg: "#f8f9fc",
  bgCard: "#ffffff",
  bgSoft: "#edeef1",
  ink: "#191c1e",
  inkLight: "#434751",
  primary: "#355da3",
  accent: "#8eb3ff",
  accentText: "#154388",
  primaryFix: "#d8e2ff",
  secondary: "#5d5e61",
  outline: "#737782",
  border: "rgba(53,93,163,0.08)",
  shadow: "0 2px 12px rgba(142,179,255,0.10)",
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

function ArticleSeo({ article }) {
  const { t } = useTranslation("common");
  const crumbs = [
    { label: t("footer.home"), href: "/" },
    { label: t("nav.blog"), href: "/blog" },
    { label: article?.titre || t("nav.blog") },
  ];
  usePageSeo({
    title: article ? `${article.titre} — MySWYM` : "Article — MySWYM",
    description: article?.extrait || article?.titre || "Article natation MySWYM",
    path: article?.slug ? `/blog/${article.slug}` : "/blog",
    jsonLd: breadcrumbJsonLd(crumbs),
  });
  return null;
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

/** Rendu markdown léger : ## titres, paragraphes, **gras** */
function ArticleBody({ contenu }) {
  const blocks = String(contenu || "")
    .trim()
    .split(/\n\n+/);

  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: "clamp(20px, 3vw, 26px)",
                color: C.ink,
                margin: "36px 0 14px",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                paddingLeft: 14,
                borderLeft: `3px solid ${C.accent}`,
              }}
            >
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.slice(2, -2).includes("**")) {
          return (
            <h3 key={i} style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "24px 0 8px" }}>
              {trimmed.slice(2, -2)}
            </h3>
          );
        }

        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ color: C.inkLight, fontSize: 16, lineHeight: 1.8, margin: "0 0 18px" }}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} style={{ color: C.ink, fontWeight: 600 }}>
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const locale = useActiveLocale();
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const [article, setArticle] = useState(undefined); // undefined = loading, null = not found
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setArticle(undefined);
    window.scrollTo(0, 0);

    fetchArticleBySlug(slug).then(async (data) => {
      if (cancelled) return;
      setArticle(data);
      if (data) {
        const rel = await fetchRelatedArticles(data.slug, data.categorie, 2);
        if (!cancelled) setRelated(rel);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.fontFamily = FONT;
  }, []);

  if (article === undefined) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
        <FontLoader />
        <PublicNav />
        <p style={{ textAlign: "center", color: C.secondary, padding: "120px 20px" }}>{t("pages.blogLoading")}</p>
      </div>
    );
  }

  if (!article) return <Navigate to={withLocalePrefix("/blog", locale)} replace />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <ArticleSeo article={article} />
      <PublicNav />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "88px 16px 0" : "104px 20px 0" }}>
        <Breadcrumb
          items={[
            { label: t("footer.home"), href: "/" },
            { label: t("nav.blog"), href: "/blog" },
            { label: article.titre },
          ]}
        />

        <LocalizedLink
          to="/blog"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: C.secondary,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> Retour au blog
        </LocalizedLink>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span
            style={{
              background: C.primaryFix,
              color: C.primary,
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 100,
            }}
          >
            {article.categorie}
          </span>
          <time dateTime={article.date_publication} style={{ color: C.outline, fontSize: 14 }}>
            {formatArticleDate(article.date_publication)}
          </time>
        </div>

        <h1
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: C.ink,
            margin: "0 0 20px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {article.titre}
        </h1>

        {article.image_url && (
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 28,
              aspectRatio: "16 / 9",
              background: `center / cover no-repeat url(${article.image_url}), ${C.bgSoft}`,
              boxShadow: C.shadow,
            }}
            role="img"
            aria-label={article.titre}
          />
        )}

        {article.extrait && (
          <p style={{ color: C.secondary, fontSize: 18, lineHeight: 1.7, margin: "0 0 36px", fontStyle: "italic" }}>
            {article.extrait}
          </p>
        )}
      </div>

      <article style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 20px 64px" }}>
        <ArticleBody contenu={article.contenu} />

        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: isMobile ? "28px 20px" : "36px 32px",
            textAlign: "center",
            boxShadow: C.shadow,
            marginTop: 40,
          }}
        >
          <h3 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>
            Passe à l&apos;entraînement structuré
          </h3>
          <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.65, margin: "0 0 22px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Crée ton plan natation personnalisé en 2 minutes — adapté à ton niveau et à ton objectif.
          </p>
          <Link
            to="/app"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.accent,
              color: C.accentText,
              fontWeight: 700,
              fontSize: 15,
              padding: "12px 24px",
              borderRadius: 100,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
            }}
          >
            Créer mon plan <ArrowRight size={15} />
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "0 16px 72px" : "0 20px 80px" }}>
          <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 16 }}>À lire aussi</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {related.map((p) => (
              <LocalizedLink key={p.slug} to={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    overflow: "hidden",
                    height: "100%",
                    boxShadow: C.shadow,
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      height: 100,
                      background: p.image_url
                        ? `center / cover no-repeat url(${p.image_url})`
                        : `linear-gradient(135deg, ${C.primaryFix}, ${C.accent})`,
                      backgroundColor: C.bgSoft,
                    }}
                  />
                  <div style={{ padding: "14px 16px 16px" }}>
                    <span
                      style={{
                        background: C.primaryFix,
                        color: C.primary,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 100,
                      }}
                    >
                      {p.categorie}
                    </span>
                    <h4 style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.ink, margin: "10px 0 6px", lineHeight: 1.3 }}>
                      {p.titre}
                    </h4>
                    <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Lire l&apos;article <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </LocalizedLink>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
