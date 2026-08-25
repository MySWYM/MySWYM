/** Conteneur app mobile-first → colonne centrée sur tablette/PC */
export default function AppShell({ children, flush = false, style = {} }) {
  return (
    <div className={flush ? "app-shell app-shell--flush" : "app-shell"} style={style}>
      {flush ? <div className="app-shell-inner">{children}</div> : children}
    </div>
  );
}
