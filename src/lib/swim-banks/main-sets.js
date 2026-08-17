/**
 * Séries principales (corps physio) — endurance / vitesse / mixte / eau_libre / test.
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 */
import { bankMeta } from "./_helpers.js";

/* ---- Corps de séance physio : distances PROPRES (multiples du bassin) ----
   repDist = distance d'une répétition pour le calcul d'allure
   pools = bassins autorisés ([25], [50], ou [25,50] par défaut) */
const CORPS_PHYSIO_RAW = {
  endurance: [
    () => ({ text: `8x100m D2'`, distance: 800, repDist: 100 }),
    () => ({ text: `6x100m R20''`, distance: 600, repDist: 100 }),
    () => ({ text: `10x50 D1'`, distance: 500, repDist: 50 }),
    () => ({ text: `12x50 D1'`, distance: 600, repDist: 50 }),
    () => ({ text: `3x400m R30''`, distance: 1200, repDist: 400 }),
    () => ({ text: `4x200m R20''`, distance: 800, repDist: 200 }),
    () => ({ text: `6x200m R20''`, distance: 1200, repDist: 200 }),
    () => ({ text: `4x150m R20''`, distance: 600, repDist: 150 }),
    () => ({ text: `400m continu (sans pause)`, distance: 400, repDist: 400 }),
    () => ({ text: `800m continu (sans pause)`, distance: 800, repDist: 800 }),
    () => ({ text: `5x100m ↗ progressif R20''`, distance: 500, repDist: 100 }),
    () => ({ text: `8x50m R15''`, distance: 400, repDist: 50 }),
    () => ({ text: `10x100m R15''`, distance: 1000, repDist: 100 }),
    () => ({ text: `4x100m R10''`, distance: 400, repDist: 100 }),
    () => ({ text: `2x400m R45''`, distance: 800, repDist: 400 }),
    () => ({ text: `6x150m R20''`, distance: 900, repDist: 150 }),
    () => ({ text: `8x150m R15''`, distance: 1200, repDist: 150 }),
    () => ({ text: `1200m continu (sans pause)`, distance: 1200, repDist: 1200 }),
    () => ({ text: `5x200m R20''`, distance: 1000, repDist: 200 }),
    () => ({ text: `3x300m R30''`, distance: 900, repDist: 300 }),
    () => ({ text: `6x300m R30''`, distance: 1800, repDist: 300 }),
    () => ({ text: `4x100m ↘ dégressif R20''`, distance: 400, repDist: 100 }),
    () => ({ text: `16x50m R10''`, distance: 800, repDist: 50 }),
    () => ({ text: `2x(4x100m R15'') — R45'' entre séries`, distance: 800, repDist: 100 }),
  ],
  vitesse: [
    () => ({ text: `8x50m R30''`, distance: 400, repDist: 50 }),
    () => ({ text: `6x50m R45'' RAC`, distance: 300, repDist: 50 }),
    // 25m : bassin 25 uniquement (sinon stop au milieu en 50m)
    () => ({ text: `10x25m départ plongé R30''`, distance: 250, repDist: 25, pools: [25] }),
    () => ({ text: `4x(4x25m) R15'' — R1' entre séries`, distance: 400, repDist: 25, pools: [25] }),
    () => ({ text: `6x25m R45'' RAC`, distance: 150, repDist: 25, pools: [25] }),
    // Bassin 50 : même nb de reps, chaque 50 = 25m à bloc + 25m relâché (fini au mur)
    () => ({ text: `10x50m : 25m à bloc + 25m relâché — départ plongé R30''`, distance: 500, repDist: 50, pools: [50] }),
    () => ({ text: `4x(4x50m : 25m à bloc + 25m relâché) R15'' — R1' entre séries`, distance: 800, repDist: 50, pools: [50] }),
    () => ({ text: `6x50m : 25m à bloc + 25m relâché R45'' RAC`, distance: 300, repDist: 50, pools: [50] }),
    () => ({ text: `4x50m progressif : · 1 — lent · 2 — ↗ · 3 — ↗ · 4 — rapide`, distance: 200, repDist: 50 }),
    () => ({ text: `4x50m dégressif : · 1 — rapide · 2 — ↘ · 3 — ↘ · 4 — lent`, distance: 200, repDist: 50 }),
    () => ({ text: `12x50m R30''`, distance: 600, repDist: 50 }),
    () => ({ text: `8x25m départ plongé R45''`, distance: 200, repDist: 25, pools: [25] }),
    () => ({ text: `8x50m : 25m à bloc + 25m relâché — départ plongé R45''`, distance: 400, repDist: 50, pools: [50] }),
    () => ({ text: `5x(3x25m) R10'' — R45'' entre séries`, distance: 375, repDist: 25, pools: [25] }),
    () => ({ text: `5x(3x50m : 25m à bloc + 25m relâché) R10'' — R45'' entre séries`, distance: 750, repDist: 50, pools: [50] }),
    () => ({ text: `4x25m sprint max R1'`, distance: 100, repDist: 25, pools: [25] }),
    () => ({ text: `4x50m : 25m sprint max + 25m relâché R1'`, distance: 200, repDist: 50, pools: [50] }),
    () => ({ text: `6x50m accélération progressive sur la longueur R30''`, distance: 300, repDist: 50 }),
    () => ({ text: `3x100m : 50m rapide + 50m relâché R45''`, distance: 300, repDist: 100 }),
    () => ({ text: `8x50m dégressif par 2 (1-2 modéré, 3-4 ↗, 5-6 ↗, 7-8 rapide) R30''`, distance: 400, repDist: 50 }),
  ],
  mixte: [
    () => ({ text: `4x100m : 50m technique + 50m physio R20''`, distance: 400, repDist: 100 }),
    () => ({ text: `6x75m : 25m éducatif + 50m physio R20''`, distance: 450, repDist: 75, pools: [25] }),
    () => ({ text: `6x100m : 50m éducatif + 50m physio R20''`, distance: 600, repDist: 100, pools: [50] }),
    () => ({ text: `3x(2x100m physio + 2x25m technique) R20''`, distance: 750, repDist: 100, pools: [25] }),
    () => ({ text: `3x(2x100m physio + 1x50m technique) R20''`, distance: 750, repDist: 100, pools: [50] }),
    () => ({ text: `4x50m technique + 4x50m physio R20''`, distance: 400, repDist: 50 }),
    () => ({ text: `5x100m : 25m rattrapé + 75m physio R20''`, distance: 500, repDist: 100, pools: [25] }),
    () => ({ text: `5x100m : 50m rattrapé + 50m physio R20''`, distance: 500, repDist: 100, pools: [50] }),
    () => ({ text: `4x150m : 50m technique + 100m physio R20''`, distance: 600, repDist: 150 }),
    () => ({ text: `6x50m technique + 6x50m physio R15''`, distance: 600, repDist: 50 }),
    () => ({ text: `4x75m : 25m technique + 50m physio R20''`, distance: 300, repDist: 75, pools: [25] }),
    () => ({ text: `4x100m : 50m technique + 50m physio R20''`, distance: 400, repDist: 100, pools: [50] }),
    () => ({ text: `3x200m : 100m technique + 100m physio R30''`, distance: 600, repDist: 200 }),
    () => ({ text: `2x(4x75m : 25m technique + 50m physio) R15'' — R45'' entre séries`, distance: 600, repDist: 75, pools: [25] }),
    () => ({ text: `2x(4x100m : 50m technique + 50m physio) R15'' — R45'' entre séries`, distance: 800, repDist: 100, pools: [50] }),
    () => ({ text: `8x50m alterné technique/physio R20''`, distance: 400, repDist: 50 }),
  ],
  eau_libre: [
    () => ({ text: `8x100m crawl allure tenable R20''`, distance: 800, repDist: 100 }),
    () => ({ text: `6x150m continu, allure régulière R30''`, distance: 900, repDist: 150 }),
    () => ({ text: `4x200m crawl aérobie R30''`, distance: 800, repDist: 200 }),
    () => ({ text: `2x400m allure course R1'`, distance: 800, repDist: 400 }),
    () => ({ text: `5x100m crawl régulier R20''`, distance: 500, repDist: 100 }),
    () => ({ text: `3x300m continu, allure tenable R30''`, distance: 900, repDist: 300 }),
    () => ({ text: `10x100m crawl allure confortable R15''`, distance: 1000, repDist: 100 }),
    () => ({ text: `4x300m continu, rythme régulier R30''`, distance: 1200, repDist: 300 }),
    () => ({ text: `2x600m allure course R1'`, distance: 1200, repDist: 600 }),
    () => ({ text: `6x100m crawl départ franc R15''`, distance: 600, repDist: 100 }),
    () => ({ text: `3x400m continu, allure autonome R45''`, distance: 1200, repDist: 400 }),
    () => ({ text: `8x150m crawl allure régulière R20''`, distance: 1200, repDist: 150 }),
    () => ({ text: `1x800m allure course continue`, distance: 800, repDist: 800 }),
    () => ({ text: `5x200m crawl aérobie R25''`, distance: 1000, repDist: 200 }),
  ],
  /** Chronos de contrôle — noter les temps pour mesurer l'évolution */
  test: [
    () => ({ text: `400m chrono continu — note ton temps (CSS)`, distance: 400, repDist: 400 }),
    () => ({ text: `2x200m chrono R3' — note chaque temps`, distance: 400, repDist: 200 }),
    () => ({ text: `100m chrono max + 300m facile R3' — note le 100m`, distance: 400, repDist: 100 }),
    () => ({ text: `3x100m chrono R2'30 — note chaque 100m (régularité)`, distance: 300, repDist: 100 }),
    () => ({ text: `200m allure course + 100m max R2' — note les 2 temps`, distance: 300, repDist: 100 }),
    () => ({ text: `8x50m D1'15 (Z3) — note le temps moyen /50m`, distance: 400, repDist: 50 }),
    () => ({ text: `500m chrono continu — note ton temps`, distance: 500, repDist: 500 }),
    () => ({ text: `4x100m chrono R2' — note chaque temps (régularité)`, distance: 400, repDist: 100 }),
    () => ({ text: `2x150m chrono R2'30 — note chaque temps`, distance: 300, repDist: 150 }),
    () => ({ text: `300m allure course + 100m max R3' — note les 2 temps`, distance: 400, repDist: 100 }),
  ],
};

export const CORPS_PHYSIO = CORPS_PHYSIO_RAW;

export const MAIN_SET_POOL_KEYS = Object.keys(CORPS_PHYSIO);

export const MAIN_SET_ENTRIES = MAIN_SET_POOL_KEYS.flatMap((poolKey) =>
  CORPS_PHYSIO[poolKey].map((build, index) => ({
    ...bankMeta({
      id: `corps_${poolKey}_${index}`,
      sourceSymbol: `CORPS_PHYSIO.${poolKey}[${index}]`,
      status: "candidate",
    }),
    poolKey,
    index,
    build,
  })),
);
