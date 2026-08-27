/**
 * Provenance d'une séance : d'où vient le contenu affiché au nageur.
 *
 * Sert au support : quand un nageur signale un souci sur sa séance, on veut
 * retrouver en un coup d'œil l'onglet et la ligne du Google Sheet (ou le
 * composeur si le Sheet n'a pas répondu).
 *
 * Attention : « Séance n°6 » côté nageur = compteur de validations, ce n'est
 * PAS le n° de ligne du Sheet. Les deux sont exposés séparément.
 */

const SOURCE_LABELS = {
  "natation-sheet": "Sheet",
  "session-composer": "Composeur",
  "arthur-bank": "Banque Arthur",
  "legacy-generator": "Moteur legacy",
};

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {object} session
 * @param {{ loopOrdinal?: number|null, profile?: object|null, planId?: string|number|null, appVersion?: string|null }} [ctx]
 */
export function buildSessionProvenance(session, ctx = {}) {
  if (!session) return null;

  const source = String(session.composedBy || "inconnu");
  const sheet = session.sheetMeta || null;
  const familyId = sheet?.familyId || session.composerWhy?.familyId || null;
  const sheetN = toInt(sheet?.n ?? session.composerWhy?.sessionN);
  const isSheet = source === "natation-sheet" && Boolean(familyId);

  const volume =
    toInt(sheet?.total_m) ?? toInt(session.trainingDistance) ?? toInt(session.distance);
  const uiOrdinal =
    ctx.loopOrdinal != null && Number.isFinite(Number(ctx.loopOrdinal))
      ? Number(ctx.loopOrdinal) + 1
      : null;

  const profile = ctx.profile || null;
  const educatif = sheet?.educatif || session.sheetEducatif?.name || null;

  const shortLabel = isSheet
    ? `Sheet · ${familyId}${sheetN != null ? ` · ligne n°${sheetN}` : ""}`
    : `${SOURCE_LABELS[source] || source} · pas de ligne Sheet`;

  // Code court affiché au nageur : « 01-42 » = onglet 01, ligne 42.
  const familyCode = isSheet ? (String(familyId).match(/^\d+/)?.[0] || familyId) : null;
  const refCode = isSheet
    ? `${familyCode}-${sheetN ?? "?"}`
    : source === "natation-sheet"
      ? "sheet-?"
      : `C${volume != null ? `-${volume}` : ""}`;

  const supportLine = [
    "MySWYM séance",
    uiOrdinal != null ? `UI n°${uiOrdinal}` : null,
    isSheet
      ? `Sheet «${familyId}» ligne n°${sheetN ?? "?"}`
      : `source: ${SOURCE_LABELS[source] || source} (pas de ligne Sheet)`,
    volume != null ? `${volume}m` : null,
    educatif ? `éducatif: ${educatif}` : null,
    sheet?.phase ? `phase: ${sheet.phase}` : null,
    sheet?.bande ? `bande: ${sheet.bande}` : null,
    profile?.level ? `niveau: ${profile.level}` : null,
    profile?.swimStyle ? `nage: ${profile.swimStyle}` : null,
    profile?.pool ? `bassin: ${profile.pool}m` : null,
    Array.isArray(profile?.equipment)
      ? `matos: ${profile.equipment.length ? profile.equipment.join(",") : "aucun"}`
      : null,
    profile?.goal ? `objectif: ${profile.goal}` : null,
    ctx.planId ? `plan: ${ctx.planId}` : null,
    ctx.appVersion ? `v${ctx.appVersion}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    source,
    sourceLabel: SOURCE_LABELS[source] || source,
    isSheet,
    familyId,
    sheetN,
    educatif,
    volume,
    uiOrdinal,
    refCode,
    shortLabel,
    supportLine,
  };
}

/** Ligne prête à coller dans Telegram (chaîne vide si séance inconnue). */
export function formatSessionSupportRef(session, ctx = {}) {
  return buildSessionProvenance(session, ctx)?.supportLine || "";
}
