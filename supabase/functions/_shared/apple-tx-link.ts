/** Lien d'une transaction Apple déjà rattachée à un autre user.id. */
export function appleTxOwnerDecision(input: {
  currentUserId: string;
  linkedUserId: string | null;
  linkedUserIsAnonymous: boolean;
}): "ok" | "transfer" | "conflict" {
  if (!input.linkedUserId || input.linkedUserId === input.currentUserId) return "ok";
  if (input.linkedUserIsAnonymous) return "transfer";
  return "conflict";
}
