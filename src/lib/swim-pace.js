/**
 * Allures MySWYM : référence unique : T100 (temps 100 m crawl).
 * Pas de T400 : ni demandé, ni utilisé dans les formules.
 */

/** Ancres T100 (secondes) : elite ↔ découverte. */
const T100_FAST = 50;  // ~0:50, nageur très rapide
const T100_SLOW = 130; // ~2:10, nageur débutant / lent

/**
 * 0 = lent, 1 = rapide. Borné.
 * Plus le T100 est bas, plus le facteur est élevé.
 */
export function speedFactorFromT100(t100) {
  if (!t100 || t100 <= 0) return 0.35; // neutre si inconnu
  const t = Math.min(T100_SLOW, Math.max(T100_FAST, t100));
  return (T100_SLOW - t) / (T100_SLOW - T100_FAST);
}

/**
 * Multiplicateurs de zone (plage [lo, hi] × T100) pour le moteur coaching.
 *
 * Base = nageur « moyen ». Pour un T100 rapide :
 * - on relève les mults aérobie (allures plus tolérantes / moins dures)
 * - on resserre la largeur de bande [lo, hi]
 *
 * Z1 endurance · Z2 confort · Z3 seuil/résistance · Z4 vitesse
 */
const ZONE_BASE = {
  Z1: [1.18, 1.28],
  Z2: [1.08, 1.17],
  Z3: [1.01, 1.07],
  Z4: [0.92, 1.00],
};

function boostShrinkBand([lo, hi], boost, shrink) {
  const mid = (lo + hi) / 2;
  const half = ((hi - lo) / 2) * shrink;
  const shifted = mid + boost;
  return [
    Math.round((shifted - half) * 1000) / 1000,
    Math.round((shifted + half) * 1000) / 1000,
  ];
}

/** Plages Z1–Z4 adaptées au T100. */
export function zoneBandsForT100(t100) {
  const f = speedFactorFromT100(t100); // 0 lent → 1 rapide
  // Jusqu'à +4 % de tolérance sur l'endurance pour les rapides
  const boostZ1 = f * 0.04;
  const boostZ2 = f * 0.035;
  const boostZ3 = f * 0.025;
  const boostZ4 = f * 0.01;
  // Bandes jusqu'à 30 % plus étroites chez les rapides
  const shrink = 1 - f * 0.30;

  return {
    Z1: boostShrinkBand(ZONE_BASE.Z1, boostZ1, shrink),
    Z2: boostShrinkBand(ZONE_BASE.Z2, boostZ2, shrink),
    Z3: boostShrinkBand(ZONE_BASE.Z3, boostZ3, shrink),
    Z4: boostShrinkBand(ZONE_BASE.Z4, boostZ4, shrink),
  };
}

/**
 * Multiplicateurs simples (App : départs D… / preview onboarding).
 * easy / threshold / sprint, plus tolérants si T100 rapide.
 */
export function appZoneMultForT100(t100) {
  const f = speedFactorFromT100(t100);
  return {
    easy: 1.35 + f * 0.05, // 1.35 → ~1.40
    threshold: 1.08 + f * 0.04, // 1.08 → ~1.12
    sprint: 0.95 + f * 0.02, // 0.95 → ~0.97
  };
}

/**
 * Gain max relatif réaliste sur un plan (temps ↓), selon T100 de départ.
 * Rendements décroissants : log entre ~10 % (lent) et ~2.5 % (très rapide).
 */
export function maxPaceGainFromT100(t100) {
  if (!t100 || t100 <= 0) return 0.06;
  const t = Math.min(T100_SLOW, Math.max(T100_FAST, t100));
  // log : progression plus forte côté lent
  const tNorm = (Math.log(t) - Math.log(T100_FAST)) / (Math.log(T100_SLOW) - Math.log(T100_FAST));
  return 0.025 + tNorm * 0.075; // 2.5 % … 10 %
}

/**
 * Plafond de gain « carrière » (multi-années), conservateur.
 * ~3 % (très rapide) … ~12 % (lent), plus bas qu’un fantasme marketing.
 */
export function maxCareerPaceGainFromT100(t100) {
  if (!t100 || t100 <= 0) return 0.07;
  const t = Math.min(T100_SLOW, Math.max(T100_FAST, t100));
  const tNorm = (Math.log(t) - Math.log(T100_FAST)) / (Math.log(T100_SLOW) - Math.log(T100_FAST));
  return 0.03 + tNorm * 0.09; // 3 % … 12 %
}

/**
 * Projection indicative semaine → temps 100 m.
 * Courbe asymptotique ; le plafond de gain dépend du T100 (pas d'un % fixe).
 */
export function projectedPaceAtWeek(pace0, week, totalWeeks, maxGain = null) {
  if (!pace0 || totalWeeks <= 0) return pace0;
  const gain = maxGain ?? maxPaceGainFromT100(pace0);
  const w = Math.max(0, Math.min(week, totalWeeks));
  // ~95 % du gain potentiel atteint en fin de plan
  const progress = 1 - Math.exp((-3 * w) / totalWeeks);
  return pace0 * (1 - gain * progress);
}

/**
 * Projection indicative années → temps 100 m (entraînement régulier).
 * k ≈ 0.5 : ~63 % du plafond à 2 ans, ~92 % à 5 ans, réaliste, pas trop clément.
 */
export function projectedPaceAtYears(pace0, years, maxCareerGain = null) {
  if (!pace0 || pace0 <= 0) return pace0;
  const y = Math.max(0, Number(years) || 0);
  const gain = maxCareerGain ?? maxCareerPaceGainFromT100(pace0);
  const progress = 1 - Math.exp(-0.5 * y);
  return pace0 * (1 - gain * progress);
}

/**
 * Projection distance : T(d) = a · d^e, e fixe (plus de T400 pour caler l'exposant).
 */
export function calcDistanceProjection(pace100) {
  if (!pace100) return null;
  const exp = 1.065;
  const a = pace100 / Math.pow(100, exp);
  return { exp, predict: (d) => a * Math.pow(d, exp) };
}

export function formatPaceRange(sec) {
  sec = Math.max(1, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Tag d'allure pour une ligne de séance : (Z2 @1:05-1:12)
 * Base = T100 uniquement.
 */
export function paceTagFromT100(ref100Seconds, zoneKey, distance) {
  if (!ref100Seconds) return `(${zoneKey})`;
  const bands = zoneBandsForT100(ref100Seconds);
  const mult = bands[zoneKey];
  if (!mult) return `(${zoneKey})`;
  const [lo, hi] = mult;
  const low = ref100Seconds * lo * (distance / 100);
  const high = ref100Seconds * hi * (distance / 100);
  return `(${zoneKey} @${formatPaceRange(low)}-${formatPaceRange(high)})`;
}
