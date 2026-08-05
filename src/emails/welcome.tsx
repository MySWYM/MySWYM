import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

export type WelcomeEmailProps = {
  firstName?: string;
};

export function WelcomeEmail({ firstName = "nageur" }: WelcomeEmailProps) {
  const name = firstName.trim() || "nageur";
  return (
    <EmailLayout
      preview={`Bienvenue sur MySWYM, ${name} — ton plan t’attend.`}
      ctaLabel="Ouvrir mon plan"
      ctaUrl={`${emailBrand.site}/app`}
    >
      <Text style={emailText.h1}>Bienvenue, {name}</Text>
      <Text style={emailText.p}>
        Ton compte MySWYM est prêt. On a conçu un générateur de séances clair,
        progressif, adapté à ton niveau et à ton objectif — sans blabla.
      </Text>
      <Text style={emailText.p}>
        Prochaine étape : ouvre l’app, vérifie ton profil, et lance ta première
        semaine.
      </Text>
      <Text style={emailText.muted}>
        Une question ? Écris-nous à {emailBrand.contact} — on répond sous 24–48 h.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
