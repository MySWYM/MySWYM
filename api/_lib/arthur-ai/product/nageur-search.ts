/**
 * Recherche nageur via admin_user_directory (pas de scan Auth 8×1000).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";

export type NageurHit = {
  user_id: string;
  email: string | null;
  firstname: string | null;
  created_at: string | null;
};

function sanitizeSearch(raw: string): string {
  return String(raw || "")
    .trim()
    .slice(0, 120)
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchNageurDirectory(
  admin: SupabaseClient,
  raw: string,
): Promise<{ hits: NageurHit[]; source: "directory" | "missing_table"; error?: string }> {
  const q = sanitizeSearch(raw);
  if (!q) return { hits: [], source: "directory" };

  try {
    if (isUuid(q)) {
      const { data, error } = await admin
        .from("admin_user_directory")
        .select("user_id, email, firstname, created_at")
        .eq("user_id", q)
        .maybeSingle();
      if (error) throw error;
      return {
        hits: data ? [data as NageurHit] : [],
        source: "directory",
      };
    }

    const like = `%${q}%`;
    const { data, error } = await admin
      .from("admin_user_directory")
      .select("user_id, email, firstname, created_at")
      .or(`email.ilike."${like}",firstname.ilike."${like}"`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return { hits: (data || []) as NageurHit[], source: "directory" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/admin_user_directory|schema cache|does not exist/i.test(msg)) {
      return {
        hits: [],
        source: "missing_table",
        error: "Index nageurs pas encore en base. Relance la migration admin_user_directory.",
      };
    }
    return { hits: [], source: "directory", error: "Recherche indisponible." };
  }
}

export async function lookupDirectoryUser(
  admin: SupabaseClient,
  raw: string,
): Promise<NageurHit | null> {
  const q = sanitizeSearch(raw);
  if (!q) return null;
  const { hits } = await searchNageurDirectory(admin, q);
  if (hits.length === 1) return hits[0];
  if (isUuid(q)) return hits[0] || null;
  const email = q.toLowerCase();
  return hits.find((h) => String(h.email || "").toLowerCase() === email) || null;
}
