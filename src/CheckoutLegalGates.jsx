import { LEGAL_LINKS, CHECKOUT_RENEWAL_NOTICE, CHECKOUT_WITHDRAWAL_LABEL, CHECKOUT_CGV_LABEL_PREFIX } from "./lib/legal-copy.js";

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
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: "#5d5e61", lineHeight: 1.45, margin: "0 0 10px" }}>
        {CHECKOUT_RENEWAL_NOTICE}
      </p>
      <label style={boxStyle}>
        <input
          type="checkbox"
          checked={!!acceptTerms}
          onChange={(e) => onAcceptTerms(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span>
          {CHECKOUT_CGV_LABEL_PREFIX}{" "}
          <a href={LEGAL_LINKS.cgv} target="_blank" rel="noopener noreferrer" style={linkStyle}>CGV</a>
          {" "}et les{" "}
          <a href={LEGAL_LINKS.cgu} target="_blank" rel="noopener noreferrer" style={linkStyle}>CGU</a>.
        </span>
      </label>
      <label style={boxStyle}>
        <input
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

export function checkoutGatesReady(acceptTerms, acceptWithdrawal) {
  return Boolean(acceptTerms && acceptWithdrawal);
}
