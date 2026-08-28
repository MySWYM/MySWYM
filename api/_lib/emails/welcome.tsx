import * as React from "react";
import { Text } from "@react-email/components";
import {
  EmailBullets,
  EmailLayout,
  emailText,
} from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

export type WelcomeEmailProps = {
  firstName?: string;
};

export function WelcomeEmail({ firstName = "nageur" }: WelcomeEmailProps) {
  const name = firstName.trim() || "nageur";
  return (
    <EmailLayout
      preview="Ouvre ton plan — la 1ʳᵉ séance est déjà là."
      eyebrow="Compte créé"
      ctaLabel="Ouvrir ma 1ʳᵉ séance"
      ctaUrl={`${emailBrand.site}/app`}
    >
      <Text style={emailText.h1}>
        {name !== "nageur" ? `${name}, on nage.` : "On nage."}
      </Text>
      <Text style={emailText.p}>
        Ton compte MySWYM est prêt. Ton plan est déjà structuré — clair,
        progressif, adapté à ton niveau.
      </Text>
      <EmailBullets
        items={[
          "Ouvre l’app et lance ta 1ʳᵉ séance",
          "Coche-la après — le coach s’ajuste à ton ressenti",
          "Essai 7 jours sans carte : tu testes, tu décides",
        ]}
      />
      <Text style={emailText.muted}>
        Une question ? Écris-nous à {emailBrand.contact} — on répond sous
        24–48 h.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
