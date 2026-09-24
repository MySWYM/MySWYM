import { createClient } from "@supabase/supabase-js";
import { isNativeApp } from "./lib/native-platform.js";

const FALLBACK_URL = "https://unavailable.supabase.co";
const FALLBACK_KEY = "public-anon-key";

function usableSupabaseEnv(url, key) {
  if (!url || !key) return false;
  if (url === "[SENSITIVE]" || key === "[SENSITIVE]") return false;
  return /^https?:\/\//i.test(String(url).trim());
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeClient() {
  try {
    if (!usableSupabaseEnv(rawUrl, rawKey)) {
      console.error(
        "[MySWYM] VITE_SUPABASE_* absent, [SENSITIVE], ou URL invalide au build. " +
          "Sur Vercel, les variables client ne doivent pas être Sensitive.",
      );
      return createClient(FALLBACK_URL, FALLBACK_KEY, nativeAuthOptions());
    }
    return createClient(rawUrl, rawKey, nativeAuthOptions());
  } catch (err) {
    console.error("[MySWYM] createClient a échoué", err);
    return createClient(FALLBACK_URL, FALLBACK_KEY, nativeAuthOptions());
  }
}

function nativeAuthOptions() {
  if (!isNativeApp()) return undefined;
  return {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
    },
  };
}

export const supabase = makeClient();
