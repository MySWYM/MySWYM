import { Link } from "react-router-dom";

const FONT = "'Lexend', sans-serif";

/**
 * Fil d’Ariane — pages à plus d’un niveau (blog article, légal).
 * La landing marketing est plate : pas de fil d’Ariane là-bas.
 */
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ marginBottom: 20, fontFamily: FONT, fontSize: 13 }}>
      <ol style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", margin: 0, padding: 0, color: "#5d5e61" }}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 ? <span aria-hidden>/</span> : null}
              {last || !item.href ? (
                <span style={{ color: "#191c1e", fontWeight: 600 }}>{item.label}</span>
              ) : (
                <Link to={item.href} style={{ color: "#154388", textDecoration: "none", fontWeight: 600 }}>
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
