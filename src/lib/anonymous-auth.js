/**
 * Compte anonyme Supabase : découvrir l’app avant email / Apple / Google.
 * Conversion = même user.id (updateUser / signInWithIdToken / linkIdentity).
 */

export function isAnonymousUser(user) {
  if (!user) return false;
  if (user.is_anonymous === true) return true;
  const identities = user.identities;
  if (Array.isArray(identities) && identities.length > 0) {
    return identities.every((id) => id?.provider === "anonymous");
  }
  return false;
}

/** Session anonyme si besoin. No-op si déjà connecté (anon ou réel). */
export async function ensureAnonymousSession(supabase) {
  const { data: existing, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  if (existing?.session?.user) return existing.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  const user = data?.user ?? data?.session?.user ?? null;
  if (!user) throw new Error("ANONYMOUS_SIGNIN_FAILED");
  return user;
}

/**
 * Anonyme → email + mot de passe (même user.id).
 * @returns {Promise<object>} user
 */
export async function convertAnonymousWithEmail(supabase, { email, password, data: meta = {} } = {}) {
  const mail = String(email || "").trim().toLowerCase();
  const pass = String(password || "");
  if (!mail || !pass) throw new Error("EMAIL_PASSWORD_REQUIRED");

  const { data: sessionData } = await supabase.auth.getSession();
  const current = sessionData?.session?.user;
  if (!isAnonymousUser(current)) {
    throw new Error("NOT_ANONYMOUS");
  }

  const { data, error } = await supabase.auth.updateUser({
    email: mail,
    password: pass,
    data: meta,
  });
  if (error) throw error;
  return data?.user ?? current;
}
