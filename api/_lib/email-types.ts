/** Shared email payload + result types (server-only). */

export type EmailSendSuccess = { ok: true; id: string };
export type EmailSendFailure = {
  ok: false;
  error: string;
  code?: string;
};
export type EmailSendResult = EmailSendSuccess | EmailSendFailure;

export type WelcomeEmailInput = {
  to: string;
  firstName?: string;
  userId?: string;
};

export type VerificationEmailInput = {
  to: string;
  confirmUrl: string;
  userId?: string;
};

export type ResetPasswordEmailInput = {
  to: string;
  resetUrl: string;
  userId?: string;
};

export type SubscriptionConfirmationEmailInput = {
  to: string;
  planLabel: string;
  manageUrl?: string;
  firstName?: string;
  userId?: string;
};

export type WorkoutReminderEmailInput = {
  to: string;
  sessionTitle: string;
  ctaUrl: string;
  meters?: number;
  firstName?: string;
  userId?: string;
};

export type NewsletterSectionInput = {
  title: string;
  body: string;
};

export type NewsletterEmailInput = {
  to: string;
  subject: string;
  previewText: string;
  sections: NewsletterSectionInput[];
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
  userId?: string;
};

/** Public contact form → inbox (to is filled server-side). */
export type ContactEmailInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ReactivationEmailInput = {
  to: string;
  firstName?: string;
  ctaUrl?: string;
  userId?: string;
};

export type EmailKind =
  | "welcome"
  | "verification"
  | "reset_password"
  | "subscription_confirmation"
  | "workout_reminder"
  | "newsletter"
  | "contact"
  | "reactivation";

export type EmailPayloadByKind = {
  welcome: WelcomeEmailInput;
  verification: VerificationEmailInput;
  reset_password: ResetPasswordEmailInput;
  subscription_confirmation: SubscriptionConfirmationEmailInput;
  workout_reminder: WorkoutReminderEmailInput;
  newsletter: NewsletterEmailInput;
  contact: ContactEmailInput;
  reactivation: ReactivationEmailInput;
};
