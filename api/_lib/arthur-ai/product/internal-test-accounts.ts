/**
 * Comptes internes / de test : exclus des agrégats admin (KPI, funnel, donuts).
 * La fiche nageur et la recherche les gardent (debug).
 *
 * Les +alias (arthur.no+test@outlook.fr) matchent l’adresse canonique.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const INTERNAL_TEST_EMAILS = [
  "arthur.no@outlook.fr",
  "j.wiackowska@outlook.fr",
  "admin@myswym.app",
] as const;

const CANONICAL = new Set<string>(INTERNAL_TEST_EMAILS);

export function canonicalizeEmail(raw: unknown): string {
  const s = String(raw || "").trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at <= 0) return s;
  let local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  return `${local}@${domain}`;
}

export function isInternalTestEmail(raw: unknown): boolean {
  const canon = canonicalizeEmail(raw);
  return Boolean(canon) && CANONICAL.has(canon);
}

export function dropInternalUsers<T extends { user_id?: string | null }>(
  rows: T[],
  skip: Set<string>,
): T[] {
  if (!skip.size) return rows;
  return rows.filter((r) => !r.user_id || !skip.has(String(r.user_id)));
}

async function idsFromDirectory(admin: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>();
  let from = 0;
  const page = 1000;
  while (from < 20000) {
    const { data, error } = await admin
      .from("admin_user_directory")
      .select("user_id, email")
      .range(from, from + page - 1);
    if (error) throw error;
    const batch = data || [];
    for (const r of batch) {
      if (r.user_id && isInternalTestEmail(r.email)) ids.add(String(r.user_id));
    }
    if (batch.length < page) break;
    from += page;
  }
  return ids;
}

async function idsFromAuthExact(admin: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>();
  const authAdmin = admin.auth?.admin as
    | { getUserByEmail?: (email: string) => Promise<{ data?: { user?: { id?: string } } }> }
    | undefined;
  if (!authAdmin?.getUserByEmail) return ids;
  for (const email of INTERNAL_TEST_EMAILS) {
    try {
      const { data } = await authAdmin.getUserByEmail(email);
      if (data?.user?.id) ids.add(String(data.user.id));
    } catch {
      /* ignore */
    }
  }
  return ids;
}

export async function loadInternalTestUserIds(
  admin: SupabaseClient,
): Promise<{ ids: Set<string>; source: "directory" | "auth" | "none" }> {
  try {
    const ids = await idsFromDirectory(admin);
    if (ids.size) return { ids, source: "directory" };
  } catch {
    /* table absente ou illisible */
  }
  const fromAuth = await idsFromAuthExact(admin);
  if (fromAuth.size) return { ids: fromAuth, source: "auth" };
  return { ids: new Set(), source: "none" };
}
