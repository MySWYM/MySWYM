import * as React from "react";
import { Text } from "@react-email/components";
import {
  EmailBullets,
  EmailLayout,
  emailText,
} from "./components/EmailLayout";
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
  const name = firstName?.trim();
  return (
    <EmailLayout
      preview={`Premium actif (${planLabel}), ton coach est prêt.`}
      eyebrow={`Premium · ${planLabel}`}
      ctaLabel="Voir mon plan"
      ctaUrl={`${emailBrand.site}/app`}
      secondaryLabel="Gérer mon abonnement"
      secondaryUrl={manageUrl}
    >
      <Text style={emailText.h1}>
        {name ? `Merci, ${name}, coach on.` : "Merci, coach on."}
      </Text>
      <Text style={emailText.p}>
        Ton accès Premium est actif. Tu as maintenant tout ce qu’il faut pour
        progresser sans te perdre.
      </Text>
      <EmailBullets
        items={[
          "Plan jusqu’à ton événement",
          "Allures à la seconde",
          "Adaptation après chaque feedback",
        ]}
      />
      <Text style={emailText.muted}>
        Un reçu Stripe t’a été (ou va t’être) envoyé séparément. Besoin d’aide
        ? {emailBrand.support}
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionConfirmationEmail;
