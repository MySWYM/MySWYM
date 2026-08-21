import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { fetchPublishedArticles } from "./blogData.js";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { getStoredLanguage } from "./i18n/index.js";

const FONT = "'Lexend', sans-serif";

/** Couleurs via tokens thème app (--myswym-*) + fallbacks light. */
function useAppColors() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setTick((n) => n + 1));
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  void tick;
  const cs = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const v = (name, fallback) => cs?.getPropertyValue(name)?.trim() || fallback;
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    surface: v("--myswym-surface", "#FFFFFF"),
    ink: v("--myswym-ink", "#191c1e"),
    blue: v("--myswym-blue", "#006bfd"),
    greyLight: v("--myswym-grey-light", "rgba(0, 107, 253, 0.22)"),
    blueLight: dark ? "#0a162c" : "#d6e7ff",
    grey: dark ? "#9bb0c8" : "#5d6b7d",
    greyMid: dark ? "#6b7c90" : "#9bb0c8",
    inkLight: dark ? "#9bb0c8" : "#3d4f66",
    greyXLight: dark ? "#0a162c" : "#eef3f8",
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
            background: article.image_url
              ? `center / cover no-repeat url(${article.image_url})`
              : `linear-gradient(135deg, ${colors.blueLight}, ${colors.blue}55)`,
            backgroundColor: colors.greyXLight,
          }}
          role="img"
          aria-label={article.titre}
        />
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

  if (articles.length === 0) return null;

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
