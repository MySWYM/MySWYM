/**
 * Flags pédagogiques, un seul générateur (session-composer).
 * Rollback d’une bascule : MYSWYM_PEDAGOGY_<NAME>=0
 * Ne bump pas PLAN_VERSION ; ne régénère pas les séances persistées.
 */

/** @typedef {{
 *  displayD9: boolean,
 *  warmups: boolean,
 *  cooldowns: boolean,
 *  drills: boolean,
 *  funMainSets: boolean,
 * }} PedagogyFlags */

function envOff(key) {
  return (
    typeof process !== "undefined" &&
    process.env &&
    String(process.env[key] || "").trim() === "0"
  );
}

/** @type {PedagogyFlags} */
export const PEDAGOGY_FLAGS = {
  displayD9: true,
  warmups: envOff("MYSWYM_PEDAGOGY_WARMUPS") ? false : true,
  cooldowns: envOff("MYSWYM_PEDAGOGY_COOLDOWNS") ? false : true,
  drills: envOff("MYSWYM_PEDAGOGY_DRILLS") ? false : true,
  funMainSets: envOff("MYSWYM_PEDAGOGY_FUN_MAIN") ? false : true,
};

export function pedagogyFlags() {
  return { ...PEDAGOGY_FLAGS };
}
