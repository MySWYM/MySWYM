import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

export type SubscriptionConfirmationEmailProps = {
  planLabel: string;
  manageUrl?: string;
  firstName?: string;
};

export function SubscriptionConfirmationEmail({
  planLabel,
  manageUrl = `${emailBrand.site}/app`,
  firstName,
}: SubscriptionConfirmationEmailProps) {
  const greeting = firstName?.trim() ? `Merci, ${firstName.trim()} !` : "Merci !";
  return (
    <EmailLayout
      preview={`Ton abonnement MySWYM (${planLabel}) est confirmé.`}
      ctaLabel="Gérer mon abonnement"
      ctaUrl={manageUrl}
    >
      <Text style={emailText.h1}>{greeting}</Text>
      <Text style={emailText.p}>
        Ton abonnement <strong style={emailText.strong}>{planLabel}</strong> est
        actif. Tu as accès aux plans complets, au multi-plans et aux départs
        chronométrés.
      </Text>
      <Text style={emailText.p}>
        Un reçu Stripe t’a été (ou va t’être) envoyé séparément. Tu peux gérer
        ton abonnement à tout moment depuis l’app.
      </Text>
      <Text style={emailText.muted}>
        Besoin d’aide ? {emailBrand.support}
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionConfirmationEmail;
