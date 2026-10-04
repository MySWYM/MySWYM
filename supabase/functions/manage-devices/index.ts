/**
 * Appareils connectés : heartbeat, liste, révocation (un / autres / tous).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type Action = "heartbeat" | "list" | "revoke" | "revoke_others" | "revoke_all";

type Body = {
  action?: Action;
  device_key?: string;
  platform?: string;
  label?: string;
  user_agent?: string;
  target_device_key?: string;
};

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  const first = xf.split(",")[0]?.trim();
  if (first) return first.slice(0, 64);
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "";
}

function countryCode(req: Request): string {
  const raw = (
    req.headers.get("cf-ipcountry")
    || req.headers.get("x-vercel-ip-country")
    || req.headers.get("x-country-code")
    || ""
  ).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(raw) ? raw : "";
}

function normalizePlatform(p: unknown): "ios" | "web" | "android" {
  const s = String(p || "").toLowerCase();
  if (s === "ios") return "ios";
  if (s === "android") return "android";
  return "web";
}

function json(cors: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const cors = corsHeaders(reqOrigin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(cors, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(cors, { error: "Non authentifié" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json(cors, { error: "Utilisateur introuvable" }, 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = (body.action || "list") as Action;
    const deviceKey = String(body.device_key || "").trim().slice(0, 80);
    const ip = clientIp(req);
    const country = countryCode(req);
    const now = new Date().toISOString();

    if (action === "heartbeat") {
      if (!deviceKey || deviceKey.length < 8) {
        return json(cors, { error: "device_key invalide" }, 400);
      }

      const { data: existing } = await admin
        .from("user_devices")
        .select("id, revoked_at")
        .eq("user_id", user.id)
        .eq("device_key", deviceKey)
        .maybeSingle();

      if (existing?.revoked_at) {
        return json(cors, { ok: true, revoked: true, force_logout: true });
      }

      const platform = normalizePlatform(body.platform);
      const label = String(body.label || (platform === "ios" ? "iPhone" : "Web")).trim().slice(0, 80) || "Appareil";
      const userAgent = String(body.user_agent || "").trim().slice(0, 400);

      const row = {
        user_id: user.id,
        device_key: deviceKey,
        platform,
        label,
        user_agent: userAgent || null,
        country_code: country || null,
        last_ip: ip || null,
        last_seen_at: now,
        revoked_at: null,
      };

      const { error: upErr } = await admin.from("user_devices").upsert(row, {
        onConflict: "user_id,device_key",
      });
      if (upErr) throw upErr;

      return json(cors, { ok: true, revoked: false });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("user_devices")
        .select("id, device_key, platform, label, country_code, last_ip, last_seen_at, created_at, revoked_at")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("last_seen_at", { ascending: false })
        .limit(40);
      if (error) throw error;

      const devices = (data || []).map((d) => ({
        ...d,
        is_current: Boolean(deviceKey) && d.device_key === deviceKey,
      }));

      return json(cors, { ok: true, devices, current_device_key: deviceKey || null });
    }

    if (action === "revoke") {
      const target = String(body.target_device_key || "").trim();
      if (!target) return json(cors, { error: "target_device_key requis" }, 400);

      const { error } = await admin
        .from("user_devices")
        .update({ revoked_at: now })
        .eq("user_id", user.id)
        .eq("device_key", target)
        .is("revoked_at", null);
      if (error) throw error;

      const self = Boolean(deviceKey) && target === deviceKey;
      if (self) {
        try {
          await admin.auth.admin.signOut(user.id, "local");
        } catch {
          /* best-effort */
        }
      }

      return json(cors, { ok: true, self_revoked: self });
    }

    if (action === "revoke_others") {
      if (!deviceKey) return json(cors, { error: "device_key requis" }, 400);

      const { error } = await admin
        .from("user_devices")
        .update({ revoked_at: now })
        .eq("user_id", user.id)
        .neq("device_key", deviceKey)
        .is("revoked_at", null);
      if (error) throw error;

      try {
        await admin.auth.admin.signOut(user.id, "others");
      } catch {
        /* best-effort si API absente */
      }

      return json(cors, { ok: true });
    }

    if (action === "revoke_all") {
      const { error } = await admin
        .from("user_devices")
        .update({ revoked_at: now })
        .eq("user_id", user.id)
        .is("revoked_at", null);
      if (error) throw error;

      try {
        await admin.auth.admin.signOut(user.id, "global");
      } catch {
        /* best-effort */
      }

      return json(cors, { ok: true, force_logout: true });
    }

    return json(cors, { error: "action inconnue" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[manage-devices]", message);
    return json(cors, { error: message }, 400);
  }
});
