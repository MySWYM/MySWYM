import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { usePageSeo } from "./lib/seo.js";
import { goStoreTarget } from "./lib/store-links.js";
import "./theme/public.css";

/** Lien unique IG : /go et /fr/go. Pas de redirect sur la home. */
export default function GoStoreRedirect() {
  const target = goStoreTarget();
  const external = target.startsWith("http");

  usePageSeo({
    title: "MySWYM",
    description: "Ouvre MySWYM sur iPhone, ou l’essai dans le navigateur.",
    path: "/go",
    noIndex: true,
  });

  useEffect(() => {
    if (!external) return;
    window.location.replace(target);
  }, [external, target]);

  if (!external) return <Navigate to={target} replace />;

  return (
    <div className="ms-root">
      <main className="ms-404">
        <div className="ms-404-card">
          <h1 className="ms-404-h1">App Store</h1>
          <p className="ms-404-lead">Ouverture de l’App Store.</p>
          <a className="ms-btn" href={target}>
            Continuer
          </a>
        </div>
      </main>
    </div>
  );
}
