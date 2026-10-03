/**
 * Écrans système soft mist : erreur, mise à jour, crash module.
 */
export default function AppStatusScreen({
  title,
  body,
  note = null,
  primaryLabel,
  onPrimary,
  secondaryLabel = null,
  onSecondary = null,
  tertiaryLabel = null,
  onTertiary = null,
  linkLabel = null,
  linkHref = null,
  primaryDisabled = false,
  primaryBusyLabel = null,
  /** false sur l’écran d’erreur : évite qu’un tap fantôme recharge l’app. */
  primaryAutoFocus = true,
  meta = null,
  brand = true,
  role = "alertdialog",
  titleId = "ms-status-title",
}) {
  const busy = primaryDisabled && primaryBusyLabel;

  return (
    <div
      className="ms-status-screen"
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="ms-status-card">
        {brand ? (
          <img
            className="ms-status-wordmark"
            src="/logo-myswym-on-light.png"
            alt="MySWYM"
            height={20}
            width={86}
          />
        ) : null}
        <h1 id={titleId} className="ms-status-title">
          {title}
        </h1>
        {body ? <p className="ms-status-body">{body}</p> : null}
        {note ? (
          <p className="ms-status-body" style={{ marginTop: 8, fontWeight: 600 }}>
            {note}
          </p>
        ) : null}
        {primaryLabel && onPrimary ? (
          <button
            type="button"
            className="ms-status-cta"
            onClick={onPrimary}
            disabled={primaryDisabled}
            autoFocus={primaryAutoFocus}
          >
            {busy ? primaryBusyLabel : primaryLabel}
          </button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className="ms-status-secondary"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
        ) : null}
        {tertiaryLabel && onTertiary ? (
          <button
            type="button"
            className="ms-status-secondary"
            onClick={onTertiary}
          >
            {tertiaryLabel}
          </button>
        ) : null}
        {linkLabel && linkHref ? (
          <a className="ms-status-secondary" href={linkHref}>
            {linkLabel}
          </a>
        ) : null}
        {meta ? <p className="ms-status-meta">{meta}</p> : null}
      </div>
    </div>
  );
}
