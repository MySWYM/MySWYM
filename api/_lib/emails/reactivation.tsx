import * as React from "react";
import { Text } from "@react-email/components";
import {
  EmailBullets,
  EmailLayout,
  emailText,
} from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

/** Keep copy in sync with api/email/send.ts case "reactivation". */
export type ReactivationEmailProps = {
  firstName?: string;
  ctaUrl?: string;
};

export function ReactivationEmail({
  firstName,
  ctaUrl = `${emailBrand.site}/app`,
}: ReactivationEmailProps) {
  const who = firstName?.trim();
  return (
    <EmailLayout
      preview="Ouvre l'app : ta semaine se met à jour. 7 jours pour voir."
      eyebrow="Mise à jour"
      ctaLabel="Rouvrir MySWYM"
      ctaUrl={ctaUrl}
      showUnsubscribe
    >
      <Text style={emailText.h1}>
        {who ? `${who}, tes séances ont changé` : "Tes séances ont changé"}
      </Text>
      <Text style={emailText.p}>On a repris le générateur de séances.</Text>
      <Text style={emailText.p}>
        Plus de structure coach : éducatifs, allures, semaine jusqu'à ton
        objectif.
      </Text>
      <EmailBullets
        items={[
          "Tes séances déjà validées restent",
          "Le reste de la semaine se met à jour à l'ouverture",
          "7 jours pour tout voir, sans carte",
        ]}
      />
    </EmailLayout>
  );
}

export default ReactivationEmail;
