import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";

export type ContactNotificationEmailProps = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactNotificationEmail({
  name,
  email,
  subject,
  message,
}: ContactNotificationEmailProps) {
  return (
    <EmailLayout preview={`Contact MySWYM — ${subject}`}>
      <Text style={emailText.h1}>Nouveau message contact</Text>
      <Text style={emailText.p}>
        <strong style={emailText.strong}>De :</strong> {name} ({email})
      </Text>
      <Text style={emailText.p}>
        <strong style={emailText.strong}>Objet :</strong> {subject}
      </Text>
      <Text style={emailText.p}>
        <strong style={emailText.strong}>Message :</strong>
      </Text>
      <Text style={{ ...emailText.p, whiteSpace: "pre-wrap" as const }}>
        {message}
      </Text>
      <Text style={emailText.muted}>
        Réponds directement à cet e-mail pour écrire à {email}.
      </Text>
    </EmailLayout>
  );
}

export default ContactNotificationEmail;
