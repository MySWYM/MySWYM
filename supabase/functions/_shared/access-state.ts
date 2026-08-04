import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const ACCESS_STATUS = {
  trial: "trial",
  active: "active",
  canceled: "canceled",
  expired: "expired",
} as const;

export type AccessStatus = typeof ACCESS_STATUS[keyof typeof ACCESS_STATUS];

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export type AccessStateRow = {
  user_id: string;
  access_status: AccessStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  updated_at?: string;
};

export const ENTITLEMENT_KEYS = [
  "subscription",
  "subscription_status",
  "subscription_end",
  "cancel_at_period_end",
  "stripe_customer_id",
  "trial_started_at",
  "trial_ends_at",
  "trial_used",
  "subscription_started_at",
];

export const TRIAL_LENGTH_DAYS = 7;

export function stripEntitlementFromUserMeta(meta: Record<string, unknown> | undefined) {
  const next = { ...(meta ?? {}) };
  for (const key of ENTITLEMENT_KEYS) delete next[key];
  return next;
}

export function addDaysIso(fromMs: number, days: number) {
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}

export function nowIso() {
  return new Date().toISOString();
}

export function isoFromUnixSeconds(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(Number(seconds))) return null;
  return new Date(Number(seconds) * 1000).toISOString();
}

export function unixSecondsFromIso(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

export function isIsoFuture(iso: string | null | undefined, refMs = Date.now()) {
  if (!iso) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms > refMs;
}

export function hasEntitlement(state: Pick<AccessStateRow, "access_status" | "trial_ends_at" | "subscription_ends_at">) {
  if (state.access_status === ACCESS_STATUS.trial) return isIsoFuture(state.trial_ends_at);
  if (state.access_status === ACCESS_STATUS.active) return isIsoFuture(state.subscription_ends_at) || state.subscription_ends_at == null;
  if (state.access_status === ACCESS_STATUS.canceled) return isIsoFuture(state.subscription_ends_at);
  return false;
}

export function stateToAppMetadata(state: AccessStateRow) {
  const entitled = hasEntitlement(state);
  const endIso = state.access_status === ACCESS_STATUS.trial
    ? state.trial_ends_at
    : state.subscription_ends_at;
  return {
    subscription: entitled ? "premium" : "free",
    subscription_status: state.access_status,
    subscription_end: unixSecondsFromIso(endIso),
    cancel_at_period_end: state.cancel_at_period_end,
    stripe_customer_id: state.stripe_customer_id,
    trial_started_at: state.trial_started_at,
    trial_ends_at: state.trial_ends_at,
    trial_used: state.trial_used,
    subscription_started_at: state.subscription_started_at,
  };
}

export async function getAccessState(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<AccessStateRow | null> {
  const { data, error } = await supabaseAdmin
    .from("user_access_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as AccessStateRow | null;
}

export async function persistAccessState(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: AuthUser,
  state: AccessStateRow,
) {
  const row = {
    ...state,
    updated_at: nowIso(),
  };
  const { error } = await supabaseAdmin
    .from("user_access_state")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw error;

  const meta = stateToAppMetadata(row);
  const authError = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      ...meta,
    },
    user_metadata: stripEntitlementFromUserMeta(user.user_metadata),
  });
  if (authError.error) throw authError.error;
  return row;
}

export function buildTrialState(userId: string, current?: Partial<AccessStateRow> | null) {
  const start = nowIso();
  return {
    user_id: userId,
    access_status: ACCESS_STATUS.trial,
    trial_started_at: current?.trial_started_at ?? start,
    trial_ends_at: current?.trial_ends_at ?? addDaysIso(Date.now(), TRIAL_LENGTH_DAYS),
    trial_used: true,
    subscription_started_at: current?.subscription_started_at ?? null,
    subscription_ends_at: current?.subscription_ends_at ?? null,
    cancel_at_period_end: false,
    stripe_customer_id: current?.stripe_customer_id ?? null,
  } satisfies AccessStateRow;
}

export function buildExpiredState(userId: string, current?: Partial<AccessStateRow> | null) {
  return {
    user_id: userId,
    access_status: ACCESS_STATUS.expired,
    trial_started_at: current?.trial_started_at ?? null,
    trial_ends_at: current?.trial_ends_at ?? null,
    trial_used: current?.trial_used ?? false,
    subscription_started_at: current?.subscription_started_at ?? null,
    subscription_ends_at: current?.subscription_ends_at ?? null,
    cancel_at_period_end: false,
    stripe_customer_id: current?.stripe_customer_id ?? null,
  } satisfies AccessStateRow;
}
