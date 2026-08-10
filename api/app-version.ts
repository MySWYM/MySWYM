/**
 * GET /api/app-version
 * Source de vérité serveur pour la version minimale supportée.
 * Changer MIN_SUPPORTED_APP_VERSION (env Vercel) puis redéployer / republier
 * la fonction suffit pour forcer une mise à jour — sans republier le code client
 * si le nouveau bundle est déjà en ligne.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_MIN = "1.0.0";
const DEFAULT_LATEST = "1.0.0";

function asSemverish(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return /^\d+\.\d+(\.\d+)?/.test(v) ? v : fallback;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Jamais de cache long : le force-update doit être réactif.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  const minSupportedAppVersion = asSemverish(
    process.env.MIN_SUPPORTED_APP_VERSION,
    DEFAULT_MIN,
  );
  const latestAppVersion = asSemverish(
    process.env.LATEST_APP_VERSION || process.env.VITE_APP_VERSION,
    DEFAULT_LATEST,
  );

  const body = {
    minSupportedAppVersion,
    latestAppVersion,
    message:
      process.env.FORCE_UPDATE_MESSAGE ||
      "Une nouvelle version de MySWYM est disponible.",
    checkedAt: new Date().toISOString(),
  };

  if (req.method === "HEAD") {
    return res.status(200).end();
  }
  return res.status(200).json(body);
}
