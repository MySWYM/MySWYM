import { isAnonymousUser } from "./anonymous-auth.js";

export const ACCESS_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  CANCELED: "canceled",
  EXPIRED: "expired",
};

export { isAnonymousUser };

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

const TRIAL_LENGTH_DAYS = 7;

export function getAccessState(user) {
  const meta = user?.app_metadata ?? {};
  const trialEndsMs = parseMs(meta.trial_ends_at);
  const subscriptionEndMs = parseMs(meta.subscription_end);
  const trialStartedMs = parseMs(meta.trial_started_at);
  const cancelAtPeriodEnd = meta.cancel_at_period_end === true;
  const trialUsed = meta.trial_used === true;
  const trialStartedAt = meta.trial_started_at || null;
  const subscriptionStartedAt = meta.subscription_started_at || null;
  const now = Date.now();

  let status = meta.subscription_status
    || (meta.subscription === "premium" ? ACCESS_STATUS.ACTIVE : ACCESS_STATUS.EXPIRED);
  // JWT sans subscription_status : fenêtre d'essai future ⇒ trial (évite ACTIVE à vie).
  if (!meta.subscription_status && trialEndsMs != null && trialEndsMs > now) {
    if (subscriptionEndMs == null || subscriptionEndMs <= now) {
      status = ACCESS_STATUS.TRIAL;
    }
  }
  // subscription=premium + trial_used, sans status ni fin d'abo ⇒ essai (bandeau visible).
  if (
    !meta.subscription_status
    && meta.subscription === "premium"
    && trialUsed
    && (subscriptionEndMs == null || subscriptionEndMs <= now)
    && (trialEndsMs == null || trialEndsMs > now)
  ) {
    status = ACCESS_STATUS.TRIAL;
  }

  const entitledByStatus = ENTITLED_STATUSES.has(status);
  let accessEndsMs = null;
  if (status === ACCESS_STATUS.TRIAL) {
    accessEndsMs = trialEndsMs
      ?? (trialStartedMs != null ? trialStartedMs + TRIAL_LENGTH_DAYS * 86400000 : null);
  } else if (status === ACCESS_STATUS.CANCELED || status === ACCESS_STATUS.ACTIVE) {
    accessEndsMs = subscriptionEndMs;
  }

  // Aligné sur hasEntitlement serveur : active/canceled = fin de période ; trial = fin d'essai.
  // Ne jamais traiter "active" comme premium à vie si subscription_end est passé (metadata stale).
  // Essai sans trial_ends_at : ne pas geler (metadata incomplète) ; le sync rattrape la date.
  const hasPremiumAccess = status === ACCESS_STATUS.ACTIVE
    ? (subscriptionEndMs == null || subscriptionEndMs > now)
    : status === ACCESS_STATUS.CANCELED
      ? (subscriptionEndMs != null && subscriptionEndMs > now)
      : status === ACCESS_STATUS.TRIAL
        ? (trialEndsMs == null || trialEndsMs > now)
        : false;

  let trialDaysLeft = 0;
  if (trialEndsMs != null) {
    trialDaysLeft = Math.max(0, Math.ceil((trialEndsMs - now) / 86400000));
  } else if (status === ACCESS_STATUS.TRIAL && hasPremiumAccess) {
    if (trialStartedMs != null) {
      const endMs = trialStartedMs + TRIAL_LENGTH_DAYS * 86400000;
      trialDaysLeft = Math.max(0, Math.ceil((endMs - now) / 86400000));
    } else {
      trialDaysLeft = TRIAL_LENGTH_DAYS;
    }
  }

  return {
    status,
    trialStartedAt,
    trialEndsAt: (() => {
      const ms = trialEndsMs ?? (status === ACCESS_STATUS.TRIAL ? accessEndsMs : null);
      return ms != null ? new Date(ms).toISOString() : null;
    })(),
    subscriptionStartedAt,
    subscriptionEndsAt: subscriptionEndMs ? new Date(subscriptionEndMs).toISOString() : null,
    trialUsed,
    cancelAtPeriodEnd,
    entitledByStatus,
    billingProvider: meta.billing_provider || null,
    hasPremiumAccess,
    /** Matching PII (tél., ville, prénom) : abo payant seulement, pas l’essai. */
    canUseBuddies: hasPremiumAccess && status !== ACCESS_STATUS.TRIAL,
    /** Abo payant encore couvert (Apple / Stripe). Pas l’essai 7j. */
    canManageSubscription: hasPremiumAccess && status !== ACCESS_STATUS.TRIAL,
    isFrozen: Boolean(user) && !hasPremiumAccess,
    canGenerateProgram: hasPremiumAccess,
    canUpdateProgram: hasPremiumAccess,
    canUseCoach: hasPremiumAccess,
    canSeeAdvancedAnalysis: hasPremiumAccess,
    canUseAdaptiveFeatures: hasPremiumAccess,
    canUsePremiumVideos: hasPremiumAccess,
    // Legacy flag, multi-plans retiré (1 plan actif max). Toujours false.
    canUseMultiPlan: false,
    canUseAdvancedStats: hasPremiumAccess,
    accessEndsMs,
    trialDaysLeft,
  };
}

/**
 * Premium payant Stripe encore couvert. Pas l’essai 7 jours :
 * un nageur en essai peut s’abonner via l’App Store.
 */
export function isLiveStripeBilling(user) {
  if (!user) return false;
  const state = getAccessState(user);
  if (!state.hasPremiumAccess) return false;
  if (state.billingProvider === "apple") return false;
  if (state.status === ACCESS_STATUS.TRIAL) return false;
  const customerId = user.app_metadata?.stripe_customer_id
    || user.user_metadata?.stripe_customer_id;
  return state.billingProvider === "stripe" || Boolean(customerId);
}

/** Pas d'essai encore consommé : attendre le sync (il peut accorder 7 jours) avant de mettre l’accès en pause. */
export function isAccessMetadataPending(user) {
  if (!user) return false;
  if (getAccessState(user).hasPremiumAccess) return false;
  const meta = user.app_metadata ?? {};
  const status = meta.subscription_status
    || (meta.subscription === "premium" ? ACCESS_STATUS.ACTIVE : ACCESS_STATUS.EXPIRED);
  if (meta.subscription === "premium" && meta.trial_used !== true) return false;
  if (meta.trial_used === true) {
    const trialEndsMs = parseMs(meta.trial_ends_at);
    // Essai encore marqué TRIAL sans date : sync en cours. EXPIRED + trial_used = gel (pas pending).
    if (trialEndsMs == null) return status === ACCESS_STATUS.TRIAL;
    const createdMs = parseMs(user.created_at);
    if (createdMs != null && trialEndsMs <= createdMs) return true;
    return false;
  }
  return true;
}

export const FRESH_SIGNUP_GRACE_MS = 15 * 60 * 1000;

export function isFreshSignup(user, nowMs = Date.now()) {
  const createdMs = parseMs(user?.created_at);
  if (createdMs == null) return false;
  return nowMs - createdMs >= 0 && nowMs - createdMs < FRESH_SIGNUP_GRACE_MS;
}

/**
 * Après onboarding / 1er plan : l’essai 7j sans carte doit encore s’écrire
 * (JWT vide ou compte tout neuf). Ne pas payer ni verrouiller les séances.
 */
export function shouldAwaitCardlessTrial(user, nowMs = Date.now()) {
  if (!user) return false;
  if (getAccessState(user).hasPremiumAccess) return false;
  return isAccessMetadataPending(user) || isFreshSignup(user, nowMs);
}

/** Accès produit : essai / abo live, ou attente du grant 7j post-inscription. */
export function hasUnlockedPremiumAccess(user, nowMs = Date.now()) {
  if (!user) return false;
  return getAccessState(user).hasPremiumAccess || shouldAwaitCardlessTrial(user, nowMs);
}

/**
 * Décompte essai à afficher (home / barre Premium).
 * `hasSessionAccess` : séances encore ouvertes (y compris JWT essai incomplet).
 */
export function resolveTrialCountdown(accessState, { hasSessionAccess = false } = {}) {
  if (!accessState) return null;
  // Abo payant : pas de décompte essai.
  if (accessState.canManageSubscription) return null;
  if (accessState.status === ACCESS_STATUS.ACTIVE || accessState.status === ACCESS_STATUS.CANCELED) {
    if (accessState.hasPremiumAccess) return null;
  }

  let days = Number(accessState.trialDaysLeft) || 0;
  const trialLive = accessState.status === ACCESS_STATUS.TRIAL && (days > 0 || accessState.hasPremiumAccess);
  const openWithoutPaid = hasSessionAccess && !accessState.canManageSubscription;
  // Gelé réel (essai consommé, plus d’accès) : pas de pastille « jour X/7 ».
  const trulyFrozen = accessState.trialUsed && !accessState.hasPremiumAccess && !hasSessionAccess;
  if (trulyFrozen) return null;
  if (!trialLive && !openWithoutPaid) return null;

  if (days <= 0) days = TRIAL_LENGTH_DAYS;
  const dayIndex = Math.min(TRIAL_LENGTH_DAYS, Math.max(1, TRIAL_LENGTH_DAYS + 1 - days));
  return {
    daysLeft: days,
    dayIndex,
    /** accessState enrichi pour TrialCountdownBanner */
    viewState: {
      ...accessState,
      status: ACCESS_STATUS.TRIAL,
      trialDaysLeft: days,
      hasPremiumAccess: true,
    },
  };
}

/** Bandeau / pastille décompte essai sur l’accueil. */
export function shouldShowTrialCountdown(accessState, opts = {}) {
  return Boolean(resolveTrialCountdown(accessState, opts));
}

/** Jour courant dans l’essai 7j (1…7), pour pastille « jour 3/7 ». */
export function trialDayIndex(accessState, opts = {}) {
  const resolved = resolveTrialCountdown(accessState, opts);
  if (resolved) return resolved.dayIndex;
  const days = Number(accessState?.trialDaysLeft) || 0;
  if (days <= 0) return 0;
  return Math.min(TRIAL_LENGTH_DAYS, Math.max(1, TRIAL_LENGTH_DAYS + 1 - days));
}

/**
 * Séances visibles / ouvrables : essai 7j ou abo.
 * Après essai sans abo → false (gel).
 * `isPremiumFlag` = accès réel (hasPremiumAccess / unlocked sync), pas un paywall legacy.
 */
export function canAccessSessions(accessState, isPremiumFlag = false) {
  if (!accessState) return !!isPremiumFlag;
  if (accessState.hasPremiumAccess) return true;
  if (accessState.status === ACCESS_STATUS.TRIAL && (Number(accessState.trialDaysLeft) || 0) > 0) {
    return true;
  }
  // Gelé : ne pas rouvrir via un flag stale (ex. shouldAwait encore true à tort).
  if (accessState.isFrozen && accessState.trialUsed) return false;
  return !!isPremiumFlag;
}

/**
 * Prompt « essai terminé » (sheet repliable) seulement quand le sync a tranché
 * et que ce n’est pas un compte tout neuf (JWT encore vide / essai 7j pas encore écrit).
 */
export function shouldShowTrialFreeze(user, {
  accessSynced = false,
  generatingPlan = false,
  revealActive = false,
  nowMs = Date.now(),
} = {}) {
  if (!user) return false;
  if (!accessSynced || generatingPlan || revealActive) return false;
  if (getAccessState(user).hasPremiumAccess) return false;
  if (isAccessMetadataPending(user)) return false;
  if (isFreshSignup(user, nowMs)) return false;
  return true;
}

export function getAccessLabel(accessState) {
  switch (accessState?.status) {
    case ACCESS_STATUS.TRIAL:
      return accessState.trialDaysLeft > 0
        ? `Essai Premium · ${accessState.trialDaysLeft} jour${accessState.trialDaysLeft > 1 ? "s" : ""} restant${accessState.trialDaysLeft > 1 ? "s" : ""}`
        : "Essai terminé, séances en pause";
    case ACCESS_STATUS.ACTIVE:
      return "Premium actif";
    case ACCESS_STATUS.CANCELED:
      return "Premium annulé";
    default:
      return "Essai terminé, séances en pause";
  }
}
