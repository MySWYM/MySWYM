/**
 * Termes école (jargon ok) : pop d’explication, même idée que les tips séance.
 * Clés = forme affichée (minuscule) pour matching.
 */

/** @typedef {{ title: string, body: string }} SchoolTerm */

/** @type {Record<string, SchoolTerm>} */
export const SCHOOL_GLOSSARY = {
  coulée: {
    title: "Coulée",
    body: "Tu pousses du mur et tu glisses sans ramer, corps long et à plat. C’est la base de l’équilibre.",
  },
  "demi-vrille": {
    title: "Demi-vrille",
    body: "Tu tournes le corps pour passer ventre → dos (ou l’inverse), sans casser la ligne. Utile pour apprendre à inspirer.",
  },
  rattrapé: {
    title: "Rattrapé",
    body: "Un bras attend (devant ou derrière) pendant que l’autre travaille. C’est un échafaudage pour apprendre : le crawl final n’est plus en rattrapé.",
  },
  opposition: {
    title: "Opposition",
    body: "Pendant qu’un bras pousse, l’autre revient. Les deux actions se croisent. C’est la forme du crawl « vrai ».",
  },
  "3 temps": {
    title: "Respiration 3 temps",
    body: "Tu inspires tous les 3 mouvements de bras (souvent un côté, puis l’autre). Ça garde la tête plus stable.",
  },
  "grand chien": {
    title: "Grand chien",
    body: "Éducatif : tu tires un bras jusqu’à la cuisse, puis tu le ramènes sous l’eau près du corps (pas en l’air). Ça travaille l’appui et la trajectoire avant le vrai retour aérien du crawl.",
  },
  "échange": {
    title: "Échange",
    body: "En dos : tu battes sur un côté, tu changes les deux bras en même temps, puis tu battes de l’autre côté. Ça apprend le roulis avant la nage complète.",
  },
  "battement costal": {
    title: "Battement costal",
    body: "Tu battes sur le côté, un bras devant, l’autre le long de la cuisse, épaule haute sortie de l’eau. Regard vers le haut.",
  },
  fouetté: {
    title: "Fouetté",
    body: "En fin de poussée des bras en dos : les mains finissent vers le bas (pas vers le haut). Ça aide l’épaule à sortir et donne le rythme.",
  },
};

/** Termes triés du plus long au plus court pour le matching. */
export const SCHOOL_GLOSSARY_KEYS = Object.keys(SCHOOL_GLOSSARY).sort((a, b) => b.length - a.length);

/**
 * Découpe un texte en segments { text, termKey? }.
 * @param {string} text
 */
export function splitGlossaryText(text) {
  const src = String(text || "");
  if (!src) return [];
  const lower = src.toLowerCase();
  /** @type {{ text: string, termKey?: string }[]} */
  const parts = [];
  let i = 0;
  while (i < src.length) {
    let hit = null;
    for (const key of SCHOOL_GLOSSARY_KEYS) {
      if (lower.startsWith(key, i)) {
        hit = key;
        break;
      }
    }
    if (hit) {
      parts.push({ text: src.slice(i, i + hit.length), termKey: hit });
      i += hit.length;
      continue;
    }
    const next = SCHOOL_GLOSSARY_KEYS.reduce((best, key) => {
      const at = lower.indexOf(key, i + 1);
      if (at < 0) return best;
      return best < 0 || at < best ? at : best;
    }, -1);
    const end = next < 0 ? src.length : next;
    parts.push({ text: src.slice(i, end) });
    i = end;
  }
  return parts;
}
