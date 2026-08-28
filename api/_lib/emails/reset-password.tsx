import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";

export type ResetPasswordEmailProps = {
  resetUrl: string;
};

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview="Choisis un nouveau mot de passe MySWYM."
      eyebrow="Sécurité"
      ctaLabel="Choisir un nouveau mot de passe"
      ctaUrl={resetUrl}
    >
      <Text style={emailText.h1}>Nouveau mot de passe</Text>
      <Text style={emailText.p}>
        Tu as demandé à changer ton mot de passe MySWYM. Clique ci-dessous pour
        en choisir un nouveau.
      </Text>
      <Text style={emailText.p}>
        Si tu n’es pas à l’origine de cette demande, ignore cet email — ton
        compte reste inchangé.
      </Text>
      <Text style={emailText.muted}>
        Pour ta sécurité, le lien n’est valable qu’un temps limité.
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
