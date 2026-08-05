import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";

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
  const who = firstName?.trim() ? `${firstName.trim()}, l` : "L";
  const metersLine =
    typeof meters === "number" && meters > 0
      ? ` · ~${meters.toLocaleString("fr-FR")} m`
      : "";

  return (
    <EmailLayout
      preview={`L’eau t’attend — ${sessionTitle}${metersLine}`}
      ctaLabel="Voir ma séance"
      ctaUrl={ctaUrl}
    >
      <Text style={emailText.h1}>L’eau t’attend</Text>
      <Text style={emailText.p}>
        {who}a séance du jour :{" "}
        <strong style={emailText.strong}>{sessionTitle}</strong>
        {metersLine}. Quelques dizaines de minutes et tu coches la case.
      </Text>
      <Text style={emailText.p}>
        Pas de pression — juste le prochain coup de bras.
      </Text>
    </EmailLayout>
  );
}

export default WorkoutReminderEmail;
