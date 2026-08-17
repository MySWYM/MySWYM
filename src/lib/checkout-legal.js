export function checkoutGatesReady(acceptTerms, acceptWithdrawal) {
  return Boolean(acceptTerms && acceptWithdrawal);
}

/** Message d’erreur ciblé pour le checkout (null si tout est coché). */
export function checkoutGatesError(acceptTerms, acceptWithdrawal) {
  if (!acceptTerms && !acceptWithdrawal) {
    return "Consentement requis : accepte les CGV/CGU et confirme la demande d’accès immédiat (L221-28).";
  }
  if (!acceptTerms) {
    return "Consentement requis : acceptation des CGV et CGU.";
  }
  if (!acceptWithdrawal) {
    return "Consentement requis : demande d’exécution immédiate et renonciation au droit de rétractation (L221-28).";
  }
  return null;
}
