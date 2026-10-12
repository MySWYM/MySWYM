/** Même empreinte, autre compte : l'essai est déjà pris. */
export function trialCardReuseDecision(
  existingUserId: string | null | undefined,
  currentUserId: string,
) {
  if (!existingUserId) return "new" as const;
  if (existingUserId === currentUserId) return "same" as const;
  return "reuse" as const;
}

type FingerprintRow = { user_id?: string | null };

type AdminLike = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, value: string) => {
        maybeSingle: () => Promise<{ data: FingerprintRow | null }>;
      };
    };
    insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string } | null }>;
  };
};

export async function recordTrialCardFingerprint(
  admin: AdminLike,
  fingerprint: string,
  userId: string,
  subscriptionId: string | null,
) {
  const { data: existing } = await admin
    .from("trial_card_fingerprints")
    .select("user_id")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  const first = trialCardReuseDecision(existing?.user_id, userId);
  if (first !== "new") return first;

  const { error } = await admin.from("trial_card_fingerprints").insert({
    fingerprint,
    user_id: userId,
    stripe_subscription_id: subscriptionId,
  });
  if (error?.code !== "23505") return "new" as const;

  const { data: again } = await admin
    .from("trial_card_fingerprints")
    .select("user_id")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  const second = trialCardReuseDecision(again?.user_id, userId);
  return second === "new" ? "same" as const : second;
}
