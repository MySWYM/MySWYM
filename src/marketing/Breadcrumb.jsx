import { LocalizedLink } from "../i18n/locale-routing.jsx";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const FONT = "'Lexend', sans-serif";

/**
 * Fil d’Ariane — pages à plus d’un niveau (tarifs, blog, légal, FAQ…).
 * Le dernier cran est la page courante (pas de lien).
 */
export default function Breadcrumb({ items, onDark = false }) {
  const { t } = useTranslation("common");
  const crumbs = items?.length
    ? items
    : [{ label: t("footer.home"), href: "/" }];
  const muted = onDark ? "rgba(255,255,255,0.7)" : "#5d5e61";
  const current = onDark ? "#ffffff" : "#191c1e";
  const link = onDark ? "#d8e2ff" : "#154388";
  const chevron = onDark ? "rgba(255,255,255,0.45)" : "#737782";

  return (
    <nav aria-label={t("breadcrumb.label")} style={{ marginBottom: 20, fontFamily: FONT, fontSize: 13 }}>
      <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, listStyle: "none", margin: 0, padding: 0, color: muted }}>
        {crumbs.map((item, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${item.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 ? <ChevronRight size={14} color={chevron} aria-hidden /> : null}
              {last || !item.href ? (
                <span style={{ color: current, fontWeight: 600 }} aria-current="page">{item.label}</span>
              ) : (
                <LocalizedLink to={item.href} style={{ color: link, textDecoration: "none", fontWeight: 600 }}>
                  {item.label}
                </LocalizedLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
