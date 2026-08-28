import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailBrand as B, emailFonts } from "./brand";

export type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
  /** Small label above the title (e.g. Essai · Jour 3) */
  eyebrow?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Optional text link under the primary CTA */
  secondaryLabel?: string;
  secondaryUrl?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
};

export function EmailLayout({
  preview,
  children,
  eyebrow,
  ctaLabel,
  ctaUrl,
  secondaryLabel,
  secondaryUrl,
  showUnsubscribe = false,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={B.logoOnDark}
              alt={B.logoText}
              width={140}
              height={36}
              style={styles.logoImg}
            />
            <Text style={styles.tagline}>{B.tagline}</Text>
          </Section>

          <Section style={styles.card}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {children}

            {ctaLabel && ctaUrl ? (
              <Section style={styles.ctaWrap}>
                <Button href={ctaUrl} style={styles.cta}>
                  {ctaLabel}
                </Button>
              </Section>
            ) : null}

            {secondaryLabel && secondaryUrl ? (
              <Text style={styles.secondaryWrap}>
                <Link href={secondaryUrl} style={styles.secondaryLink}>
                  {secondaryLabel}
                </Link>
              </Text>
            ) : null}
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>
              {B.logoText} · {B.tagline}
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

/** Highlight box (session card, price block, etc.) */
export function EmailHighlight({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <Section style={dark ? styles.highlightDark : styles.highlight}>
      {children}
    </Section>
  );
}

/** Simple benefit lines with blue accent */
export function EmailBullets({ items }: { items: string[] }) {
  return (
    <Section style={styles.bullets}>
      {items.map((item) => (
        <Text key={item} style={styles.bullet}>
          <span style={styles.bulletMark}>→</span> {item}
        </Text>
      ))}
    </Section>
  );
}

const styles = {
  body: {
    backgroundColor: B.bg,
    fontFamily: emailFonts.body,
    margin: "0",
    padding: "24px 12px",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
  },
  header: {
    backgroundColor: B.headerBg,
    background: `linear-gradient(165deg, ${B.headerBg} 0%, ${B.headerBgEnd} 100%)`,
    borderRadius: "14px 14px 0 0",
    padding: "28px 24px 24px",
    textAlign: "center" as const,
    borderBottom: `3px solid ${B.primary}`,
  },
  logoImg: {
    display: "block",
    margin: "0 auto 8px",
    maxWidth: "140px",
    height: "auto",
  },
  tagline: {
    color: B.mutedOnDark,
    fontSize: "12px",
    letterSpacing: "0.04em",
    margin: "0",
    textTransform: "uppercase" as const,
  },
  card: {
    backgroundColor: B.card,
    borderRadius: "0 0 14px 14px",
    border: `1px solid ${B.borderSoft}`,
    borderTop: "none",
    padding: "28px 24px 32px",
  },
  eyebrow: {
    color: B.primary,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    margin: "0 0 10px",
    textTransform: "uppercase" as const,
  },
  ctaWrap: {
    marginTop: "28px",
    textAlign: "center" as const,
  },
  cta: {
    backgroundColor: B.primary,
    borderRadius: "10px",
    color: B.primaryFg,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "14px 28px",
    textDecoration: "none",
  },
  secondaryWrap: {
    margin: "14px 0 0",
    textAlign: "center" as const,
  },
  secondaryLink: {
    color: B.muted,
    fontSize: "13px",
    textDecoration: "underline",
  },
  footer: {
    padding: "24px 8px 8px",
    textAlign: "center" as const,
  },
  footerBrand: {
    color: B.ink,
    fontSize: "12px",
    fontWeight: 600,
    margin: "0 0 6px",
  },
  footerText: {
    color: B.muted,
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0 0 4px",
  },
  footerMuted: {
    color: B.muted,
    fontSize: "11px",
    lineHeight: "16px",
    margin: "12px 0 0",
  },
  footerLink: {
    color: B.primary,
    textDecoration: "underline",
  },
  highlight: {
    backgroundColor: B.bg,
    border: `1px solid ${B.border}`,
    borderRadius: "10px",
    margin: "16px 0 4px",
    padding: "16px 18px",
  },
  highlightDark: {
    backgroundColor: B.cardDark,
    borderRadius: "10px",
    margin: "16px 0 4px",
    padding: "18px 18px",
  },
  bullets: {
    margin: "8px 0 4px",
  },
  bullet: {
    color: B.inkSoft,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 8px",
  },
  bulletMark: {
    color: B.primary,
    fontWeight: 700,
    marginRight: "6px",
  },
};

/** Shared paragraph / heading styles for email bodies */
export const emailText = {
  h1: {
    color: B.ink,
    fontFamily: emailFonts.display,
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: "30px",
    margin: "0 0 14px",
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
    color: B.muted,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "16px 0 0",
  },
  highlightTitle: {
    color: B.ink,
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: "22px",
    margin: "0 0 4px",
  },
  highlightMeta: {
    color: B.muted,
    fontSize: "13px",
    lineHeight: "18px",
    margin: "0",
  },
  highlightTitleOnDark: {
    color: B.fgOnDark,
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: "22px",
    margin: "0 0 4px",
  },
  highlightMetaOnDark: {
    color: B.mutedOnDark,
    fontSize: "13px",
    lineHeight: "18px",
    margin: "0",
  },
};
