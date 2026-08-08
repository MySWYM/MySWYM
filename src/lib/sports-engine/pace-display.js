/**
 * Affichage d'effort Sportif — zones + allures uniquement si T100 fiable.
 */
import { paceTagFromT100, formatPaceRange } from "../swim-pace.js";

/**
 * @returns {{ allowPaces: boolean, pace100Sec: number|null }}
 */
export function resolvePaceContext(brief = {}) {
  const raw = brief.pace100Sec ?? brief.pace100 ?? brief.capacity?.pace100 ?? null;
  const pace100Sec = Number(raw) > 0 ? Number(raw) : null;
  // Donnée fiable + Premium (ou flag explicite allowPaces)
  const allowPaces = !!(pace100Sec && (brief.allowPaces === true || brief.isPremium === true));
  return { allowPaces, pace100Sec };
}

/**
 * Consigne d'intensité pour une série.
 * Avec T100 : `(Z3 @1:42-1:48)` ; sinon label humain.
 */
export function effortCue({ zone = "Z2", distancePerRep = 100, brief = {}, rpeFallback = null } = {}) {
  const { allowPaces, pace100Sec } = resolvePaceContext(brief);
  if (allowPaces && pace100Sec) {
    return paceTagFromT100(pace100Sec, zone, distancePerRep);
  }
  if (rpeFallback) return rpeFallback;
  switch (zone) {
    case "Z1":
      return "très facile";
    case "Z2":
      return "aérobie";
    case "Z3":
      return "seuil / soutenu";
    case "Z4":
      return "rapide";
    default:
      return "facile";
  }
}

/** Allure cible unique (milieu de bande) pour une distance — ou null. */
export function targetPaceLabel(pace100Sec, zone, distanceM) {
  if (!pace100Sec || !zone) return null;
  const tag = paceTagFromT100(pace100Sec, zone, distanceM);
  const m = tag.match(/@([\d:]+)-([\d:]+)/);
  if (!m) return null;
  return `@${m[1]}-${m[2]}`;
}

export { formatPaceRange };
