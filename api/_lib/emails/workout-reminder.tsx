import * as React from "react";
import { Text } from "@react-email/components";
import {
  EmailHighlight,
  EmailLayout,
  emailText,
} from "./components/EmailLayout";

export type WorkoutReminderEmailProps = {
  sessionTitle: string;
  meters?: number;
  ctaUrl: string;
  firstName?: string;
};

export function WorkoutReminderEmail({
  sessionTitle,
  meters,
  ctaUrl,
  firstName,
}: WorkoutReminderEmailProps) {
  const who = firstName?.trim();
  const metersLine =
    typeof meters === "number" && meters > 0
      ? `~${meters.toLocaleString("fr-FR")} m`
      : null;

  return (
    <EmailLayout
      preview={`L’eau t’attend : ${sessionTitle}${metersLine ? ` · ${metersLine}` : ""}`}
      eyebrow="Séance du jour"
      ctaLabel="Ouvrir la séance"
      ctaUrl={ctaUrl}
    >
      <Text style={emailText.h1}>
        {who ? `${who}, l’eau t’attend` : "L’eau t’attend"}
      </Text>
      <Text style={emailText.p}>
        Quelques dizaines de minutes et tu coches la case. Pas de pression,
        juste le prochain coup de bras.
      </Text>
      <EmailHighlight dark>
        <Text style={emailText.highlightTitleOnDark}>{sessionTitle}</Text>
        {metersLine ? (
          <Text style={emailText.highlightMetaOnDark}>{metersLine}</Text>
        ) : null}
      </EmailHighlight>
    </EmailLayout>
  );
}

export default WorkoutReminderEmail;
