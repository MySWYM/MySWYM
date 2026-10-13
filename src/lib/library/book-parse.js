/**
 * Parse les fiches savoir (markdown livre) → items bibliothèque.
 * Format livre ForSwim :
 * `### ID · Titre · niveau`
 * `- **Objectif :** …`
 * `- **Consignes :** …` (ou plusieurs lignes `- **Consigne :**`)
 * `- **Critère :** …` / `- **Évaluation :** …`
 * `- **Attention :** …` / `- **Transformations :** …`
 */

/**
 * @param {string} md
 * @param {{ source: string, nage?: string }} meta
 * @returns {import("./catalog.js").LibraryItem[]}
 */
export function parseBookMarkdown(md, meta) {
  const source = String(meta.source || "livre");
  const defaultNage = String(meta.nage || "toutes").toLowerCase();
  const text = String(md || "");
  /** @type {import("./catalog.js").LibraryItem[]} */
  const out = [];
  const parts = text.split(/\n(?=###\s+)/);

  for (const part of parts) {
    const m = part.match(/^###\s+([^\n]+)\n([\s\S]*)$/);
    if (!m) continue;
    const heading = m[1].trim();
    const body = m[2] || "";
    const hm =
      heading.match(/^([A-Za-z0-9]+)\s*·\s*(.+?)\s*·\s*(.+)$/) ||
      heading.match(/^([A-Za-z0-9]+)\s*·\s*(.+)$/);
    if (!hm) continue;
    const code = hm[1].trim();
    const title = hm[2].replace(/\s*\([^)]*\)\s*$/, "").replace(/\s*`[^`]+`\s*$/, "").trim();
    const levelRaw = (hm[3] || "tous").trim().toLowerCase().replace(/`/g, "");

    /** @type {{ key: string, text: string }[]} */
    const fields = [];
    /** @type {string[]} */
    const plainBullets = [];
    for (const line of body.split("\n")) {
      const sm =
        line.match(/^-\s+\*\*([^*:]+?)\s*:\*\*\s*(.+)$/) ||
        line.match(/^-\s+\*\*([^*]+)\*\*\s*:\s*(.+)$/);
      if (sm) {
        fields.push({ key: sm[1].trim().toLowerCase(), text: sm[2].trim() });
        continue;
      }
      const plain = line.match(/^-\s+(.+)$/);
      if (plain) plainBullets.push(plain[1].replace(/\*\*/g, "").trim());
    }

    const getAll = (...keys) =>
      fields.filter((f) => keys.some((k) => f.key.includes(k))).map((f) => f.text);
    const get = (...keys) => getAll(...keys)[0] || "";

    const objective =
      get("objectif", "but", "pourquoi") ||
      get("action") ||
      get("règle", "regle") ||
      "";

    const cueParts = getAll("consigne", "fix");
    const cue =
      cueParts.join(" ") ||
      get("action") ||
      get("règle", "regle") ||
      fields[0]?.text ||
      plainBullets[0] ||
      "";
    if (!title || !cue) continue;

    const successCriteria =
      get("critère", "critere", "évaluation", "evaluation", "bon si") || "";

    const watchPoints = [
      ...getAll("attention", "transformation", "automatisation", "éviter", "erreur"),
      ...plainBullets.filter((b) => /^ne pas\b/i.test(b)),
    ].filter(Boolean);

    const mistakes = watchPoints.filter((w) => /ne pas|éviter|erreur/i.test(w));
    const equipment = get("matériel", "materiel", "équipement", "equipement") || null;

    const levels = [];
    if (/début|debut|decouverte|découverte|tous/.test(levelRaw)) levels.push("Débutant");
    if (/inter|moyen|tous|confirm/.test(levelRaw)) levels.push("Intermédiaire");
    if (/avanc|confirm|tous/.test(levelRaw)) levels.push("Avancé");
    if (!levels.length) levels.push("Débutant");

    const stimulus = objective || successCriteria || cue.slice(0, 140);

    const item = {
      id: `livre:${source}:${code.toLowerCase()}`,
      name: title,
      code,
      nage: defaultNage,
      nages: [defaultNage],
      levels,
      levelLabel: levels.join(" · "),
      stimulus,
      cue,
      objective: objective || stimulus,
      shortDescription: stimulus,
      successCriteria: successCriteria || null,
      watchPoints,
      equipment,
      equipmentTags: equipment ? ["none"] : ["none"],
      zones: /** @type {string[]} */ ([]),
      mistakes: mistakes.length ? mistakes : watchPoints.slice(0, 3),
      source: "livre",
      sourceLabel: source,
      ficheSource: "livre",
      thumbUrl: null,
      motionUrl: null,
      videoUrl: null,
      isNew: false,
      sheetName: null,
    };
    out.push(item);
  }
  return out;
}
