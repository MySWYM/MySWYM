import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";

export type VerificationEmailProps = {
  confirmUrl: string;
};

export function VerificationEmail({ confirmUrl }: VerificationEmailProps) {
  return (
    <EmailLayout
      preview="1 clic pour activer ton compte MySWYM."
      eyebrow="Sécurité"
      ctaLabel="Confirmer mon email"
      ctaUrl={confirmUrl}
    >
      <Text style={emailText.h1}>Active ton compte</Text>
      <Text style={emailText.p}>
        Un dernier clic pour confirmer ton adresse et accéder à ton plan.
      </Text>
      <Text style={emailText.p}>
        Si tu n’as pas créé de compte, ignore ce message — rien ne se passe.
      </Text>
      <Text style={emailText.muted}>
        Le lien expire après un délai de sécurité. Tu pourras en demander un
        nouveau depuis l’écran de connexion.
      </Text>
    </EmailLayout>
  );
}

export default VerificationEmail;
