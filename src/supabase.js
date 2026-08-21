import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[MySWYM] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY absents au build. " +
      "Sur Vercel, copie-les depuis le projet myswym (Production + Preview), puis Redeploy.",
  );
}

// createClient(undefined) throw → écran Loading figé (index.html). Placeholder = l’UI boot.
export const supabase = createClient(
  supabaseUrl || "https://unavailable.supabase.co",
  supabaseKey || "public-anon-key",
);
