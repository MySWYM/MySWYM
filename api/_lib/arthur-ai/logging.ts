/**
 * Logging Arthur AI, utile, sans secrets ni transcripts complets.
 */

export function arthurLog(
  level: "info" | "warn" | "error",
  event: string,
  meta: Record<string, unknown> = {},
): void {
  const safe: Record<string, unknown> = { event, ...meta };
  delete safe.apiKey;
  delete safe.token;
  delete safe.authorization;
  delete safe.content;
  delete safe.message;
  delete safe.prompt;
  delete safe.messages;
  delete safe.history;

  const line = JSON.stringify({
    scope: "arthur-ai",
    level,
    ...safe,
    at: new Date().toISOString(),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
