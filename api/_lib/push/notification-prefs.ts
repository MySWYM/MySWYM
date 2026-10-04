/**
 * Préférences push (miroir client) pour filtrer APNs.
 */

export type PushPrefKey = "session" | "streak" | "badges" | "buddy" | "support" | "news" | "product_tips";

const DEFAULTS: Record<PushPrefKey, boolean> = {
  session: true,
  streak: true,
  badges: true,
  buddy: true,
  support: true,
  news: true,
  product_tips: true,
};

export function parsePushPrefsFromMeta(meta: Record<string, unknown> | null | undefined): Record<PushPrefKey, boolean> {
  const raw = meta && typeof meta === "object" ? (meta as { notification_prefs?: { push?: Record<string, unknown> } }).notification_prefs : null;
  const pushRaw = raw && typeof raw === "object" ? raw.push : null;
  const out = { ...DEFAULTS };
  (Object.keys(DEFAULTS) as PushPrefKey[]).forEach((key) => {
    if (pushRaw && typeof pushRaw === "object" && key in pushRaw) {
      const v = pushRaw[key];
      if (v === true || v === false) out[key] = v;
    }
  });
  return out;
}

export function allowsPushCategory(
  meta: Record<string, unknown> | null | undefined,
  category: PushPrefKey | "billing" | "security",
): boolean {
  if (category === "billing" || category === "security") return true;
  const prefs = parsePushPrefsFromMeta(meta);
  return prefs[category] !== false;
}
