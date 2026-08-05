import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";

export type VerificationEmailProps = {
  confirmUrl: string;
};

export function VerificationEmail({ confirmUrl }: VerificationEmailProps) {
  return (
    <EmailLayout
      preview="Confirme ton email pour activer ton compte MySWYM."
      ctaLabel="Confirmer mon email"
      ctaUrl={confirmUrl}
    >
      <Text style={emailText.h1}>Confirme ton adresse email</Text>
      <Text style={emailText.p}>
        Un dernier clic pour activer ton compte MySWYM et accéder à ton plan.
      </Text>
      <Text style={emailText.p}>
        Si tu n’as pas créé de compte, tu peux ignorer ce message.
      </Text>
      <Text style={emailText.muted}>
        Le lien expire après un délai de sécurité. Tu pourras en demander un
        nouveau depuis l’écran de connexion.
      </Text>
    </EmailLayout>
  );
}

export default VerificationEmail;
