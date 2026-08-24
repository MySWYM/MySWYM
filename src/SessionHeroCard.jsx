export default function SessionHeroCard({ preview, kicker, children, className = "", tip = null, wrapCta = true }) {
  if (!preview) return null;
  return (
    <article className={["ms-session-card", className].filter(Boolean).join(" ")}>
      <div className="ms-session-card-head">
        <span className="ms-session-card-kicker">{kicker || preview.type}</span>
        <h2>{preview.title}</h2>
        <p>
          {[preview.distanceLabel, preview.durationLabel].filter(Boolean).join(" · ") || preview.meta}
        </p>
      </div>
      {(preview.blocks || []).map((b) => (
        <div key={b.label} className="ms-session-card-block">
          <strong>{b.label}</strong>
          <p>{b.detail || b.content}</p>
        </div>
      ))}
      {tip ? <p className="ms-session-card-tip">{tip}</p> : null}
      {children ? (wrapCta ? <div className="ms-session-card-cta">{children}</div> : children) : null}
    </article>
  );
}
