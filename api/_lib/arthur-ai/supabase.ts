/**
 * Clients Supabase pour Arthur AI (serveur uniquement).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
}

function anonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();
}

function serviceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

/** Client admin — contourne RLS. Toujours filtrer par user_id / conversation dans le code. */
export function createArthurAdminClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client scoped JWT utilisateur (vérif auth + lectures RLS). */
export function createArthurUserClient(accessToken: string): SupabaseClient {
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY manquants");
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSupabaseAdminConfig(): boolean {
  return Boolean(supabaseUrl() && serviceRoleKey());
}
