import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  nowIso,
  stateToAppMetadata,
  stripEntitlementFromUserMeta,
  type AccessStateRow,
  type AuthUser,
} from "./access-policy.ts";

export * from "./access-policy.ts";

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
