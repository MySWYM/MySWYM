/**
 * Vérification numéro buddy : envoi OTP (SMS Twilio si configuré, sinon e-mail)
 * + confirmation → phone_verified = true.
 */
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

function normalizeE164(raw: string): string | null {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 10) digits = `33${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("7"))) digits = `33${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

function randomOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendTwilioSms(toE164: string, body: string): Promise<boolean> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");
  if (!sid || !token || !from) return false;
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `+${toE164}`,
        From: from,
        Body: body,
      }),
    },
  );
  return res.ok;
}

async function sendResendEmail(to: string, code: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "MySWYM <noreply@myswym.app>";
  if (!key || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Code MySWYM : vérifier ton numéro",
      text: `Ton code MySWYM pour confirmer ton numéro Binômes : ${code}\nValable 10 minutes.\n`,
    }),
  });
  return res.ok;
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "send") {
      const phone = normalizeE164(body.phone || "");
      if (!phone) throw new Error("Numéro invalide");

      const code = randomOtp();
      const codeHash = await sha256Hex(`${user.id}:${phone}:${code}`);
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upsertErr } = await admin.from("buddy_phone_otps").upsert({
        user_id: user.id,
        phone_e164: phone,
        code_hash: codeHash,
        expires_at: expires,
        attempts: 0,
        created_at: new Date().toISOString(),
      });
      if (upsertErr) throw new Error(upsertErr.message);

      const msg = `MySWYM : ton code Binômes est ${code} (valable 10 min).`;
      let channel: "sms" | "email" | "none" = "none";
      if (await sendTwilioSms(phone, msg)) {
        channel = "sms";
      } else if (user.email && await sendResendEmail(user.email, code)) {
        channel = "email";
      } else {
        throw new Error("Envoi du code impossible (SMS/e-mail non configurés).");
      }

      // Aligne le numéro stocké (privé) avant vérif
      await admin.from("buddy_profiles").upsert({
        user_id: user.id,
        whatsapp_e164: phone,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ ok: true, channel }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm") {
      const phone = normalizeE164(body.phone || "");
      const code = String(body.code || "").replace(/\D/g, "");
      if (!phone || code.length !== 6) throw new Error("Code ou numéro invalide");

      const { data: row, error: rowErr } = await admin
        .from("buddy_phone_otps")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (rowErr || !row) throw new Error("Aucun code en cours, renvoie un code.");
      if (row.phone_e164 !== phone) throw new Error("Numéro différent de celui du code.");
      if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Code expiré, renvoie un code.");
      if ((row.attempts || 0) >= 5) throw new Error("Trop d’essais, renvoie un code.");

      const expect = await sha256Hex(`${user.id}:${phone}:${code}`);
      if (expect !== row.code_hash) {
        await admin.from("buddy_phone_otps").update({ attempts: (row.attempts || 0) + 1 }).eq("user_id", user.id);
        throw new Error("Code incorrect");
      }

      const { error: updErr } = await admin.from("buddy_profiles").update({
        whatsapp_e164: phone,
        phone_verified: true,
        phone_share_ready: true,
        consent_whatsapp: true,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
      if (updErr) throw new Error(updErr.message);

      await admin.from("buddy_phone_otps").delete().eq("user_id", user.id);

      return new Response(JSON.stringify({ ok: true, verified: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throw new Error("Action inconnue");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
