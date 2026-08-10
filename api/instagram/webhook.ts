/**
 * GET/POST /api/instagram/webhook — Meta Instagram Messaging.
 *
 * Handlers Web Request/Response (pas @vercel/node helpers) pour que
 * `request.text()` fournisse le corps brut exact signé par Meta
 * (HMAC X-Hub-Signature-256). `api.bodyParser: false` est Next-only
 * et n’est pas fiable sur un projet Vite.
 */
export const config = {
  maxDuration: 60,
};

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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Validation Meta webhook (GET).
 * Succès : body = challenge brut (texte), status 200.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
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
    return jsonResponse(400, {
      ok: false,
      error: "Paramètres Meta manquants",
      required: ["hub.mode", "hub.verify_token", "hub.challenge"],
      hint: "GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…",
    });
  }

  if (!expected) {
    log("error", "meta_verify_token_env_missing", {});
    return jsonResponse(503, {
      ok: false,
      error: "META_VERIFY_TOKEN non configuré sur Vercel",
    });
  }

  if (mode !== "subscribe") {
    log("warn", "meta_verify_bad_mode", { mode });
    return jsonResponse(403, {
      ok: false,
      error: "hub.mode invalide (attendu: subscribe)",
    });
  }

  if (!challenge) {
    log("warn", "meta_verify_missing_challenge", {});
    return jsonResponse(400, {
      ok: false,
      error: "hub.challenge manquant",
    });
  }

  if (token !== expected) {
    log("warn", "meta_verify_token_mismatch", {
      received_prefix: token.slice(0, 6),
    });
    return jsonResponse(403, {
      ok: false,
      error: "verify_token invalide",
    });
  }

  log("info", "meta_verify_ok", { challenge_len: challenge.length });
  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Bytes exacts signés par Meta (arrayBuffer > text pour HMAC)
    const rawBuf = Buffer.from(await request.arrayBuffer());
    const rawBody = rawBuf.toString("utf8");
    let parsed: unknown;
    try {
      parsed = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      log("warn", "instagram_post_invalid_json", { raw_len: rawBuf.length });
      return jsonResponse(400, { ok: false, error: "Invalid JSON body" });
    }

    const { handleInstagramWebhookPostWeb } = await import(
      "../_lib/arthur-ai/instagram/webhook-post.js"
    );
    return handleInstagramWebhookPostWeb(request, parsed, rawBody, rawBuf);
  } catch (err) {
    log("error", "instagram_post_handler_load_failed", {
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
    // Meta préfère 200 pour éviter storm de retries sur erreurs internes
    return jsonResponse(200, { ok: false, error: "handler_unavailable" });
  }
}

/** Compat builders qui attendent `export default { fetch }` */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") return GET(request);
    if (request.method === "POST") return POST(request);
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  },
};

