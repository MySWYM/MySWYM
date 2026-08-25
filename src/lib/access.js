export const ACCESS_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  CANCELED: "canceled",
  EXPIRED: "expired",
};

const ENTITLED_STATUSES = new Set([
  ACCESS_STATUS.TRIAL,
  ACCESS_STATUS.ACTIVE,
  ACCESS_STATUS.CANCELED,
]);

function parseMs(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    // app_metadata.subscription_end est en secondes Unix ; ms si > 1e12
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.trim() !== "") {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const isoMs = Date.parse(value);
    if (Number.isFinite(isoMs)) return isoMs;
  }
  return null;
}

export function getAccessState(user) {
  const meta = user?.app_metadata ?? {};
  const status = meta.subscription_status || (meta.subscription === "premium" ? ACCESS_STATUS.ACTIVE : ACCESS_STATUS.EXPIRED);
  const trialEndsMs = parseMs(meta.trial_ends_at);
  const subscriptionEndMs = parseMs(meta.subscription_end);
  const cancelAtPeriodEnd = meta.cancel_at_period_end === true;
  const trialUsed = meta.trial_used === true;
  const trialStartedAt = meta.trial_started_at || null;
  const subscriptionStartedAt = meta.subscription_started_at || null;
  const now = Date.now();

  const entitledByStatus = ENTITLED_STATUSES.has(status);
  let accessEndsMs = null;
  if (status === ACCESS_STATUS.TRIAL) accessEndsMs = trialEndsMs;
  else if (status === ACCESS_STATUS.CANCELED || status === ACCESS_STATUS.ACTIVE) accessEndsMs = subscriptionEndMs;

  // Aligné sur hasEntitlement serveur : active/canceled = fin de période ; trial = fin d'essai.
  // Ne jamais traiter "active" comme premium à vie si subscription_end est passé (metadata stale).
  const hasPremiumAccess = status === ACCESS_STATUS.ACTIVE
    ? (subscriptionEndMs == null || subscriptionEndMs > now)
    : status === ACCESS_STATUS.CANCELED
      ? (subscriptionEndMs != null && subscriptionEndMs > now)
      : status === ACCESS_STATUS.TRIAL
        ? (trialEndsMs != null && trialEndsMs > now)
        : false;

  const trialDaysLeft = trialEndsMs != null
    ? Math.max(0, Math.ceil((trialEndsMs - now) / 86400000))
    : 0;

  return {
    status,
    trialStartedAt,
    trialEndsAt: trialEndsMs ? new Date(trialEndsMs).toISOString() : null,
    subscriptionStartedAt,
    subscriptionEndsAt: subscriptionEndMs ? new Date(subscriptionEndMs).toISOString() : null,
    trialUsed,
    cancelAtPeriodEnd,
    entitledByStatus,
    hasPremiumAccess,
    /** Matching PII (tél., ville, prénom) : abo payant seulement, pas l’essai. */
    canUseBuddies: hasPremiumAccess && status !== ACCESS_STATUS.TRIAL,
    isFrozen: Boolean(user) && !hasPremiumAccess,
    canGenerateProgram: hasPremiumAccess,
    canUpdateProgram: hasPremiumAccess,
    canUseCoach: hasPremiumAccess,
    canSeeAdvancedAnalysis: hasPremiumAccess,
    canUseAdaptiveFeatures: hasPremiumAccess,
    canUsePremiumVideos: hasPremiumAccess,
    // Legacy flag — multi-plans retiré (1 plan actif max). Toujours false.
    canUseMultiPlan: false,
    canUseAdvancedStats: hasPremiumAccess,
    accessEndsMs,
    trialDaysLeft,
  };
}

/** Pas d'essai encore consommé : attendre le sync (il peut accorder 7 jours) avant de mettre l’accès en pause. */
export function isAccessMetadataPending(user) {
  if (!user) return false;
  if (getAccessState(user).hasPremiumAccess) return false;
  const meta = user.app_metadata ?? {};
  if (meta.subscription === "premium" && meta.trial_used !== true) return false;
  if (meta.trial_used === true) {
    const trialEndsMs = parseMs(meta.trial_ends_at);
    if (trialEndsMs == null) return true;
    const createdMs = parseMs(user.created_at);
    if (createdMs != null && trialEndsMs <= createdMs) return true;
    return false;
  }
  return true;
}

export function getAccessLabel(accessState) {
  switch (accessState?.status) {
    case ACCESS_STATUS.TRIAL:
      return accessState.trialDaysLeft > 0
        ? `Essai Premium · ${accessState.trialDaysLeft} jour${accessState.trialDaysLeft > 1 ? "s" : ""} restant${accessState.trialDaysLeft > 1 ? "s" : ""}`
        : "Essai terminé — séances en pause";
    case ACCESS_STATUS.ACTIVE:
      return "Premium actif";
    case ACCESS_STATUS.CANCELED:
      return "Premium annulé";
    default:
      return "Essai terminé — séances en pause";
  }
}
