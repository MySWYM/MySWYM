import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { articleCoverUrl, fetchPublishedArticles } from "./blogData.js";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { getStoredLanguage } from "./i18n/index.js";

const FONT = "Geist, ui-sans-serif, system-ui, sans-serif";

/** Couleurs via tokens DA dark (--myswym-*). */
function useAppColors() {
  const cs = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const v = (name, fallback) => cs?.getPropertyValue(name)?.trim() || fallback;
  return {
    surface: v("--myswym-surface", "#06101f"),
    ink: v("--myswym-ink", "#f4f8fa"),
    blue: v("--myswym-blue", "#006bfd"),
    greyLight: v("--myswym-grey-light", "rgba(0, 107, 253, 0.22)"),
    blueLight: "#0a162c",
    grey: "#b4c6db",
    greyMid: "#8a9bb0",
    inkLight: "#b4c6db",
    greyXLight: "#0a162c",
  };
}

function BlogCard({ article, colors, width }) {
  const href = withLocalePrefix(`/blog/${article.slug}`, getStoredLanguage());
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: `0 0 ${width}px`,
        width,
        scrollSnapAlign: "start",
        textDecoration: "none",
        display: "block",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <article
        style={{
          background: colors.surface,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${colors.greyLight}`,
          boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 8px 20px rgba(53,93,163,0.05)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            aspectRatio: "16 / 9",
            backgroundColor: colors.greyXLight,
            overflow: "hidden",
          }}
        >
          <img
            src={articleCoverUrl(article)}
            alt=""
            width={640}
            height={360}
            loading="lazy"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
          <span
            style={{
              alignSelf: "flex-start",
              background: colors.blueLight,
              color: colors.blue,
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 100,
              letterSpacing: "0.02em",
            }}
          >
            {article.categorie}
          </span>
          <h3
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 800,
              color: colors.ink,
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.titre}
          </h3>
          <span
            style={{
              marginTop: "auto",
              paddingTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: colors.blue,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Lire l&apos;article <ArrowRight size={13} />
          </span>
        </div>
      </article>
    </a>
  );
}

/**
 * Carrousel swipeable des 3 derniers articles blog — Accueil app.
 * Clic → ouvre /blog/:slug dans un nouvel onglet.
 */
export default function HomeBlogCarousel() {
  const colors = useAppColors();
  const scrollerRef = useRef(null);
  const [articles, setArticles] = useState([]);
  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(280);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedArticles({ page: 1 }).then((res) => {
      if (cancelled) return;
      setArticles((res.articles || []).slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      // Carte ~82% de la largeur visible, peek de la suivante
      const w = Math.min(300, Math.max(240, Math.round(el.clientWidth * 0.82)));
      setCardW(w);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [articles.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || articles.length === 0) return;
    const onScroll = () => {
      const gap = 12;
      const idx = Math.round(el.scrollLeft / (cardW + gap));
      setActive(Math.max(0, Math.min(articles.length - 1, idx)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [articles.length, cardW]);

  if (articles.length === 0) {
    return (
      <section
        aria-label="Blog"
        style={{
          marginBottom: 12,
          padding: "16px 14px",
          borderRadius: 16,
          border: `1px solid ${colors.greyLight || "rgba(0,107,253,0.22)"}`,
          background: colors.surface || colors.codeBg || "#06101f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <BookOpen size={16} color={colors.blue} />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: colors.grey,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Blog
          </div>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: colors.grey, lineHeight: 1.5 }}>
          Les articles technique arrivent bientôt. En attendant, ouvre le blog MySWYM.
        </p>
        <a
          href={withLocalePrefix("/blog", getStoredLanguage())}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 44,
            fontSize: 13,
            fontWeight: 700,
            color: colors.blue,
            textDecoration: "none",
          }}
        >
          Lire le blog <ArrowRight size={14} />
        </a>
      </section>
    );
  }

  const scrollTo = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (cardW + 12), behavior: "smooth" });
  };

  return (
    <section
      aria-label="Derniers articles du blog"
      style={{
        marginBottom: 12,
        marginLeft: -4,
        marginRight: -4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 12px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <BookOpen size={16} color={colors.blue} />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: colors.grey,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Blog
          </div>
        </div>
        <a
          href={withLocalePrefix("/blog", getStoredLanguage())}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.blue,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
            minHeight: 44,
            padding: "0 2px",
          }}
        >
          Voir tout <ArrowRight size={13} />
        </a>
      </div>

      <div
        ref={scrollerRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "0 4px 4px",
          // laisser respirer le peek
          scrollPaddingLeft: 4,
        }}
        className="home-blog-scroll"
      >
        <style>{`.home-blog-scroll::-webkit-scrollbar{display:none}`}</style>
        {articles.map((a) => (
          <BlogCard key={a.slug || a.id} article={a} colors={colors} width={cardW} />
        ))}
      </div>

      {articles.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            paddingTop: 12,
          }}
          role="tablist"
          aria-label="Articles"
        >
          {articles.map((a, i) => (
            <button
              key={a.slug || a.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Article ${i + 1}`}
              onClick={() => scrollTo(i)}
              style={{
                width: i === active ? 18 : 7,
                height: 7,
                borderRadius: 100,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: i === active ? colors.blue : colors.greyLight,
                transition: "width 0.2s, background 0.2s",
                minHeight: 7,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
