/**
 * GET/POST /api/instagram/webhook — Meta Instagram Messaging.
 *
 * GET  : hub challenge (léger, zéro import lourd — critique pour Meta Verify)
 * POST : messages → Arthur AI (import dynamique)
 *
 * Vercel Serverless : ce fichier DOIT être versionné dans git pour être déployé.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 60,
};

function asQueryString(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return String(value[0] || "");
  return value == null ? "" : String(value);
}

function log(level: "info" | "warn" | "error", event: string, meta: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      scope: "instagram-webhook",
      level,
      event,
      ...meta,
      at: new Date().toISOString(),
    }),
  );
}

/**
 * Validation Meta webhook (GET).
 * Succès : body = challenge brut (texte), status 200.
 */
function handleMetaVerify(req: VercelRequest, res: VercelResponse) {
  const mode = asQueryString(req.query["hub.mode"]);
  const token = asQueryString(req.query["hub.verify_token"]);
  const challenge = asQueryString(req.query["hub.challenge"]);
  const expected = (process.env.META_VERIFY_TOKEN || "").trim();

  log("info", "meta_verify_attempt", {
    mode,
    has_token: Boolean(token),
    has_challenge: Boolean(challenge),
    has_expected_env: Boolean(expected),
    token_len: token.length,
    expected_len: expected.length,
  });

  if (!mode && !token && !challenge) {
    log("warn", "meta_verify_missing_params", {});
    return res.status(400).json({
      ok: false,
      error: "Paramètres Meta manquants",
      required: ["hub.mode", "hub.verify_token", "hub.challenge"],
      hint: "GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…",
    });
  }

  if (!expected) {
    log("error", "meta_verify_token_env_missing", {});
    return res.status(503).json({
      ok: false,
      error: "META_VERIFY_TOKEN non configuré sur Vercel",
    });
  }

  if (mode !== "subscribe") {
    log("warn", "meta_verify_bad_mode", { mode });
    return res.status(403).json({
      ok: false,
      error: "hub.mode invalide (attendu: subscribe)",
    });
  }

  if (!challenge) {
    log("warn", "meta_verify_missing_challenge", {});
    return res.status(400).json({
      ok: false,
      error: "hub.challenge manquant",
    });
  }

  if (token !== expected) {
    log("warn", "meta_verify_token_mismatch", {
      received_prefix: token.slice(0, 6),
    });
    return res.status(403).json({
      ok: false,
      error: "verify_token invalide",
    });
  }

  log("info", "meta_verify_ok", { challenge_len: challenge.length });
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end(challenge);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return handleMetaVerify(req, res);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Import dynamique : le GET Meta ne charge jamais le gros graphe Arthur
  try {
    const { handleInstagramWebhookPost } = await import("./webhook-post.js");
    return handleInstagramWebhookPost(req, res);
  } catch (err) {
    log("error", "instagram_post_handler_load_failed", {
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
    // Meta préfère 200 pour éviter storm de retries sur erreurs internes
    return res.status(200).json({ ok: false, error: "handler_unavailable" });
  }
}
