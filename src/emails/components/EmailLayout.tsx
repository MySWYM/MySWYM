import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailBrand as B } from "./brand";

export type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
  /** Primary CTA */
  ctaLabel?: string;
  ctaUrl?: string;
  /** Show newsletter unsubscribe placeholder */
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
};

export function EmailLayout({
  preview,
  children,
  ctaLabel,
  ctaUrl,
  showUnsubscribe = false,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.logo}>{B.logoText}</Text>
          </Section>

          <Section style={styles.card}>
            {children}

            {ctaLabel && ctaUrl ? (
              <Section style={styles.ctaWrap}>
                <Button href={ctaUrl} style={styles.cta}>
                  {ctaLabel}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              {B.logoText} · plans de natation structurés
            </Text>
            <Text style={styles.footerText}>
              <Link href={`mailto:${B.contact}`} style={styles.footerLink}>
                {B.contact}
              </Link>
              {" · "}
              <Link href={`mailto:${B.support}`} style={styles.footerLink}>
                {B.support}
              </Link>
            </Text>
            <Text style={styles.footerText}>
              <Link href={B.site} style={styles.footerLink}>
                {B.site.replace("https://", "")}
              </Link>
            </Text>
            {showUnsubscribe ? (
              <Text style={styles.footerMuted}>
                Tu ne souhaites plus recevoir ces emails ?{" "}
                <Link
                  href={unsubscribeUrl || `${B.site}/contact`}
                  style={styles.footerLink}
                >
                  Se désabonner
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: B.bg,
    fontFamily:
      "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: "0",
    padding: "24px 12px",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
  },
  header: {
    padding: "8px 0 20px",
  },
  logo: {
    color: B.primary,
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: "0",
  },
  card: {
    backgroundColor: B.card,
    borderRadius: "12px",
    border: `1px solid ${B.border}`,
    padding: "28px 24px",
  },
  ctaWrap: {
    marginTop: "24px",
    textAlign: "center" as const,
  },
  cta: {
    backgroundColor: B.primary,
    borderRadius: "10px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 22px",
    textDecoration: "none",
  },
  hr: {
    borderColor: B.border,
    margin: "28px 0 16px",
  },
  footer: {
    padding: "0 4px 8px",
  },
  footerText: {
    color: B.secondary,
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0 0 4px",
  },
  footerMuted: {
    color: B.secondary,
    fontSize: "11px",
    lineHeight: "16px",
    margin: "12px 0 0",
  },
  footerLink: {
    color: B.accentText,
    textDecoration: "underline",
  },
};

/** Shared paragraph / heading styles for email bodies */
export const emailText = {
  h1: {
    color: B.ink,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "28px",
    margin: "0 0 12px",
  },
  p: {
    color: B.inkSoft,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 12px",
  },
  strong: {
    color: B.ink,
    fontWeight: 600,
  },
  muted: {
    color: B.secondary,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "16px 0 0",
  },
};
