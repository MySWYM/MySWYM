/**
 * Récupération variable — le repos est une variable de charge / densité.
 * Pas de R20 systématique.
 */

/**
 * @param {object} ctx
 * @param {'facile'|'modere'|'soutenu'|string} [ctx.intensity]
 * @param {number} [ctx.distancePerRep]
 * @param {string} [ctx.setFormat]
 * @param {string} [ctx.intentId]
 * @param {boolean} [ctx.qualitySession]
 * @param {string} [ctx.level]
 * @param {'technique'|'corps'|'depart'|'fin'} [ctx.block]
 */
export function restSecFor(ctx = {}) {
  const intensity = String(ctx.intensity || "facile").toLowerCase();
  const dist = Number(ctx.distancePerRep) || 50;
  const format = ctx.setFormat || "repeated";
  const intent = ctx.intentId || "";
  const quality = !!ctx.qualitySession;
  const block = ctx.block || "corps";
  const level = ctx.level || "regulier";

  if (ctx.continuous) return 0;

  // Technique : densités pédagogiques
  if (block === "technique") {
    if (dist <= 25) return 15;
    if (dist <= 50) return intent === "reprise" ? 20 : 15;
    return 20;
  }

  // Récupération / reprise : densités basses → repos un peu plus longs, jamais précipités
  if (intent === "recuperation") {
    if (dist >= 100) return 25;
    return 20;
  }
  if (intent === "reprise") {
    if (dist >= 100) return 30;
    return 25;
  }

  // Sportif : densités selon zone physiologique
  if (level === "sportif") {
    const zone = String(ctx.zone || "").toUpperCase();
    if (intent === "vitesse" || intent === "vo2" || zone === "Z4" || intensity.includes("rapide") || intensity === "soutenu") {
      // Qualité vitesse : récup longue
      if (dist <= 50) return 40;
      if (dist <= 100) return 50;
      return 60;
    }
    if (intent === "seuil" || intent === "allure_specifique" || zone === "Z3") {
      if (dist >= 400) return 45;
      if (dist >= 200) return 35;
      return 30;
    }
    if (intent === "test") return dist >= 400 ? 180 : 90;
    if (zone === "Z1" || intent === "recuperation") {
      return dist >= 100 ? 20 : 15;
    }
    // Z2 aérobie
    if (dist >= 200) return 25;
    if (dist >= 100) return 20;
    return 15;
  }

  // Qualité / progression d'allure
  if (quality || intent === "qualite" || intent === "allure_progressive") {
    if (intensity.includes("soutenu") || intensity === "soutenu") {
      return dist >= 100 ? 35 : 30;
    }
    if (intensity.includes("mod") || intensity === "modere") {
      return dist >= 100 ? 30 : 25;
    }
    return dist >= 100 ? 25 : 20;
  }

  // Formats
  if (format === "pyramid") {
    return dist >= 150 ? 30 : dist >= 100 ? 25 : 20;
  }
  if (format === "broken") {
    return dist >= 100 ? 30 : 25; // densifier un peu moins : repos entre blocs
  }
  if (format === "mixed") {
    return dist >= 100 ? 25 : 15;
  }
  if (format === "block") {
    return intensity.includes("mod") ? 30 : 25;
  }
  if (format === "alternating") {
    return 20;
  }
  if (format === "continuous") {
    return 0;
  }

  // Endurance / eau libre / triathlon / 4n — selon distance
  if (dist >= 200) return 35;
  if (dist >= 100) {
    if (intent === "eau_libre" || intent === "triathlon") return 25;
    return 20;
  }
  if (dist <= 25) return 15;

  // Défaut non-systématique : 15–25 selon niveau
  if (level === "decouverte") return 20;
  return intensity.includes("soutenu") ? 25 : 15;
}
