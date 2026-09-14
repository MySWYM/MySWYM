import * as React from "react";
import { Text } from "@react-email/components";
import {
  EmailBullets,
  EmailLayout,
  emailText,
} from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

/** Keep copy in sync with api/email/send.ts case "account_deleted". */
export type AccountDeletedEmailProps = {
  firstName?: string;
};

export function AccountDeletedEmail({ firstName }: AccountDeletedEmailProps) {
  const who = firstName?.trim();
  return (
    <EmailLayout
      preview="Tes données ont été effacées. Tu peux recréer un compte à tout moment."
      eyebrow="Compte supprimé"
      ctaLabel="Créer un nouveau compte"
      ctaUrl={`${emailBrand.site}/inscription`}
      secondaryLabel="Écrire au support"
      secondaryUrl={`mailto:${emailBrand.support}`}
    >
      <Text style={emailText.h1}>
        {who ? `${who}, c’est fait.` : "C’est fait."}
      </Text>
      <Text style={emailText.p}>Ton compte MySWYM a bien été supprimé.</Text>
      <EmailBullets
        items={[
          "Profil, plans et données associées sont effacés",
          "S’il restait un abonnement sans engagement, il a été arrêté",
          "Recréer un compte, c’est repartir de zéro",
        ]}
      />
      <Text style={emailText.muted}>
        Une question ? Écris-nous à {emailBrand.support}.
      </Text>
    </EmailLayout>
  );
}

export default AccountDeletedEmail;
