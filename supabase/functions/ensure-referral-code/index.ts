import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  "https://myswym.app",
  "https://www.myswym.app",
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.some((o) => origin === o)
    || origin.endsWith(".vercel.app")
    || origin.endsWith(".myswym.app");
}

function corsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I/O/0/1

function randomCode(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

async function codeExists(
  supabaseAdmin: ReturnType<typeof createClient>,
  code: string,
): Promise<boolean> {
  let page = 1;
  while (true) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    if (batch.some((u) => String(u.app_metadata?.referral_code ?? "").toUpperCase() === code)) {
      return true;
    }
    if (batch.length < 1000) break;
    page += 1;
  }
  return false;
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilisateur introuvable");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const source = adminUser ?? user;

    const isPremium = source.app_metadata?.subscription === "premium";
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Réservé aux membres Premium" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let code = String(source.app_metadata?.referral_code ?? "").toUpperCase();

    if (!code) {
      for (let i = 0; i < 12; i++) {
        const candidate = randomCode(6);
        if (!(await codeExists(supabaseAdmin, candidate))) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Impossible de générer un code parrain");

      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...(source.app_metadata ?? {}),
          referral_code: code,
        },
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "https://myswym.app";
    const shareUrl = `${appUrl.replace(/\/$/, "")}/inscription?ref=${code}`;

    return new Response(JSON.stringify({ code, shareUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ensure-referral-code] ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
