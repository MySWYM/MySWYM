import { LEGAL_LINKS, CHECKOUT_RENEWAL_NOTICE, CHECKOUT_WITHDRAWAL_LABEL, CHECKOUT_CGV_LABEL_PREFIX } from "./lib/legal-copy.js";
import { checkoutGatesReady, checkoutGatesError } from "./lib/checkout-legal.js";

export { checkoutGatesReady, checkoutGatesError };

const linkStyle = { color: "#154388", fontWeight: 700, textDecoration: "none" };
const boxStyle = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 10,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#434751",
};

/**
 * Cases à cocher pré-checkout (rétractation + acceptation CGV/CGU).
 * Requis avant redirection Stripe.
 */
export default function CheckoutLegalGates({
  acceptTerms,
  onAcceptTerms,
  acceptWithdrawal,
  onAcceptWithdrawal,
  ink = "#191c1e",
  idPrefix = "checkout-legal",
}) {
  const termsId = `${idPrefix}-terms`;
  const withdrawalId = `${idPrefix}-withdrawal`;

  const stopLinkToggle = (event) => {
    event.stopPropagation();
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: "#5d5e61", lineHeight: 1.45, margin: "0 0 10px" }}>
        {CHECKOUT_RENEWAL_NOTICE}
      </p>
      <label htmlFor={termsId} style={boxStyle}>
        <input
          id={termsId}
          type="checkbox"
          checked={!!acceptTerms}
          onChange={(e) => onAcceptTerms(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span>
          {CHECKOUT_CGV_LABEL_PREFIX}{" "}
          <a href={LEGAL_LINKS.cgv} target="_blank" rel="noopener noreferrer" style={linkStyle} onClick={stopLinkToggle}>CGV</a>
          {" "}et les{" "}
          <a href={LEGAL_LINKS.cgu} target="_blank" rel="noopener noreferrer" style={linkStyle} onClick={stopLinkToggle}>CGU</a>.
        </span>
      </label>
      <label htmlFor={withdrawalId} style={boxStyle}>
        <input
          id={withdrawalId}
          type="checkbox"
          checked={!!acceptWithdrawal}
          onChange={(e) => onAcceptWithdrawal(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span style={{ color: ink }}>{CHECKOUT_WITHDRAWAL_LABEL}</span>
      </label>
    </div>
  );
}
