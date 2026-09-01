/**
 * Catalogue d’événements produit (cockpit).
 * Ne jamais y mettre email, UUID, date de naissance, genre.
 * PostHog : passer par track() (sanitize déjà en place).
 * Funnel interne : conversion_events via trackEvent().
 */
export const PRODUCT_EVENTS = {
  signup_completed: { dest: "ok", note: "conversion_events" },
  onboarding_completed: { dest: "missing", note: "À émettre après le dernier step questionnaire." },
  plan_created: { dest: "proxy", note: "plan_generated existe déjà." },
  workout_generated: { dest: "proxy", note: "planned_sessions.created_at" },
  workout_opened: { dest: "missing", note: "À émettre à l’ouverture de la séance." },
  workout_started: { dest: "missing", note: "À émettre au premier chrono / premier bloc." },
  workout_completed: { dest: "proxy", note: "planned_sessions.status=completed" },
  workout_abandoned: { dest: "proxy", note: "skipped/missed seulement" },
  workout_regenerated: { dest: "missing", note: "À émettre si une séance est régénérée." },
  workout_feedback_submitted: { dest: "proxy", note: "session_feedback" },
  trial_started: { dest: "ok", note: "conversion_events" },
  subscription_started: { dest: "proxy", note: "payment_succeeded" },
  subscription_cancelled: { dest: "proxy", note: "cancel_survey + access_status" },
};
