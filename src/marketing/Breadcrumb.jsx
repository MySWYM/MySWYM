import { Link } from "react-router-dom";
import { BRAND, FONT } from "../theme/brand.js";

/**
 * Fil d’Ariane — pages à plus d’un niveau (blog article, légal).
 * La landing marketing est plate : pas de fil d’Ariane là-bas.
 */
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ marginBottom: 20, fontFamily: FONT, fontSize: 13 }}>
      <ol style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", margin: 0, padding: 0, color: BRAND.inkLight }}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 ? <span aria-hidden>/</span> : null}
              {last || !item.href ? (
                <span style={{ color: BRAND.ink, fontWeight: 600 }}>{item.label}</span>
              ) : (
                <Link to={item.href} style={{ color: BRAND.primaryDeep, textDecoration: "none", fontWeight: 600 }}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
