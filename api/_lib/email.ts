/**
 * @server-only, ne pas importer depuis le client Vite.
 * Service d’envoi centralisé (Resend + React Email).
 */
import type { ReactNode } from "react";
import { getContactInbox, getEmailFrom, getEmailReplyTo, getResend } from "./resend";
import type {
  ContactEmailInput,
  EmailKind,
  EmailPayloadByKind,
  EmailSendResult,
  NewsletterEmailInput,
  ResetPasswordEmailInput,
  SubscriptionConfirmationEmailInput,
  VerificationEmailInput,
  WelcomeEmailInput,
  WorkoutReminderEmailInput,
} from "./email-types";
import { WelcomeEmail } from "./emails/welcome";
import { VerificationEmail } from "./emails/verification";
import { ResetPasswordEmail } from "./emails/reset-password";
import { SubscriptionConfirmationEmail } from "./emails/subscription-confirmation";
import { WorkoutReminderEmail } from "./emails/workout-reminder";
import { NewsletterEmail } from "./emails/newsletter";
import { ContactNotificationEmail } from "./emails/contact-notification";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function tagsFor(category: string, userId?: string) {
  const tags: { name: string; value: string }[] = [
    { name: "category", value: category },
  ];
  if (userId) {
    tags.push({
      name: "user_id",
      value: userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 256),
    });
  }
  return tags;
}

async function sendReactEmail(options: {
  category: string;
  to: string;
  subject: string;
  react: ReactNode;
  userId?: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: [options.to],
      replyTo: options.replyTo || getEmailReplyTo(),
      subject: options.subject,
      react: options.react,
      tags: tagsFor(options.category, options.userId),
    });

    if (error) {
      console.error(
        `[email] ${options.category} failed → ${maskEmail(options.to)}:`,
        error.message,
      );
      return { ok: false, error: error.message, code: error.name };
    }

    const id = data?.id ?? "unknown";
    console.log(
      `[email] ${options.category} sent → ${maskEmail(options.to)} id=${id}`,
    );
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[email] ${options.category} error → ${maskEmail(options.to)}:`,
      message,
    );
    return { ok: false, error: message };
  }
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<EmailSendResult> {
  const firstName = input.firstName?.trim() || undefined;
  return sendReactEmail({
    category: "welcome",
    to: input.to,
    subject: firstName
      ? `${firstName}, ton bassin t’attend`
      : "Ton bassin t’attend, MySWYM",
    react: WelcomeEmail({ firstName }),
    userId: input.userId,
  });
}

export async function sendVerificationEmail(
  input: VerificationEmailInput,
): Promise<EmailSendResult> {
  return sendReactEmail({
    category: "verification",
    to: input.to,
    subject: "1 clic pour activer MySWYM",
    react: VerificationEmail({ confirmUrl: input.confirmUrl }),
    userId: input.userId,
  });
}

export async function sendResetPasswordEmail(
  input: ResetPasswordEmailInput,
): Promise<EmailSendResult> {
  return sendReactEmail({
    category: "reset_password",
    to: input.to,
    subject: "Réinitialise ton mot de passe",
    react: ResetPasswordEmail({ resetUrl: input.resetUrl }),
    userId: input.userId,
  });
}

export async function sendSubscriptionConfirmationEmail(
  input: SubscriptionConfirmationEmailInput,
): Promise<EmailSendResult> {
  return sendReactEmail({
    category: "subscription_confirmation",
    to: input.to,
    subject: `C’est parti, Premium actif (${input.planLabel})`,
    react: SubscriptionConfirmationEmail({
      planLabel: input.planLabel,
      manageUrl: input.manageUrl,
      firstName: input.firstName,
    }),
    userId: input.userId,
  });
}

export async function sendWorkoutReminderEmail(
  input: WorkoutReminderEmailInput,
): Promise<EmailSendResult> {
  return sendReactEmail({
    category: "workout_reminder",
    to: input.to,
    subject: `L’eau t’attend : ${input.sessionTitle}`,
    react: WorkoutReminderEmail({
      sessionTitle: input.sessionTitle,
      meters: input.meters,
      ctaUrl: input.ctaUrl,
      firstName: input.firstName,
    }),
    userId: input.userId,
  });
}

export async function sendNewsletterEmail(
  input: NewsletterEmailInput,
): Promise<EmailSendResult> {
  if (!input.sections?.length) {
    return { ok: false, error: "newsletter requires at least one section" };
  }
  return sendReactEmail({
    category: "newsletter",
    to: input.to,
    subject: input.subject,
    react: NewsletterEmail({
      subject: input.subject,
      previewText: input.previewText,
      sections: input.sections,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
    userId: input.userId,
  });
}

export async function sendContactEmail(
  input: ContactEmailInput,
): Promise<EmailSendResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim() || "Contact MySWYM";
  const message = input.message.trim();

  if (!name || !email.includes("@") || !message) {
    return { ok: false, error: "Invalid contact payload" };
  }

  return sendReactEmail({
    category: "contact",
    to: getContactInbox(),
    subject: `[Contact] ${subject}`,
    replyTo: email,
    react: ContactNotificationEmail({ name, email, subject, message }),
  });
}

export async function sendEmail<K extends EmailKind>(
  kind: K,
  payload: EmailPayloadByKind[K],
): Promise<EmailSendResult> {
  switch (kind) {
    case "welcome":
      return sendWelcomeEmail(payload as WelcomeEmailInput);
    case "verification":
      return sendVerificationEmail(payload as VerificationEmailInput);
    case "reset_password":
      return sendResetPasswordEmail(payload as ResetPasswordEmailInput);
    case "subscription_confirmation":
      return sendSubscriptionConfirmationEmail(
        payload as SubscriptionConfirmationEmailInput,
      );
    case "workout_reminder":
      return sendWorkoutReminderEmail(payload as WorkoutReminderEmailInput);
    case "newsletter":
      return sendNewsletterEmail(payload as NewsletterEmailInput);
    case "contact":
      return sendContactEmail(payload as ContactEmailInput);
    default:
      return { ok: false, error: `Unknown email kind: ${String(kind)}` };
  }
}
