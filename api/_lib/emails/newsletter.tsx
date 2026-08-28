import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { EmailLayout, emailText } from "./components/EmailLayout";
import { emailBrand } from "./components/brand";

export type NewsletterSection = {
  title: string;
  body: string;
};

export type NewsletterEmailProps = {
  subject: string;
  previewText: string;
  sections: NewsletterSection[];
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
};

export function NewsletterEmail({
  previewText,
  sections,
  ctaLabel = "Ouvrir MySWYM",
  ctaUrl = `${emailBrand.site}/app`,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <EmailLayout
      preview={previewText}
      eyebrow="MySWYM"
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      showUnsubscribe
      unsubscribeUrl={unsubscribeUrl}
    >
      {sections.map((section, i) => (
        <React.Fragment key={`${section.title}-${i}`}>
          <Heading
            as={i === 0 ? "h1" : "h2"}
            style={i === 0 ? emailText.h1 : styles.h2}
          >
            {section.title}
          </Heading>
          <Text style={emailText.p}>{section.body}</Text>
        </React.Fragment>
      ))}
    </EmailLayout>
  );
}

const styles = {
  h2: {
    color: emailBrand.ink,
    fontSize: "17px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: "24px",
    margin: "22px 0 8px",
    borderLeft: `3px solid ${emailBrand.primary}`,
    paddingLeft: "12px",
  },
};

export default NewsletterEmail;
