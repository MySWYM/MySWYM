/**
 * Cohérence mathématique des séances bassin (affichage / construction).
 * Ne touche PAS charge, capacity, readiness, adapt, taper.
 *
 * Chaque bloc nageable doit avoir une distance ; somme = volume annoncé ;
 * sous-consignes par 25 m = distance du rep ; références internes cohérentes ;
 * total finit par 00 ou 50 m.
 */

const TIME_ONLY_BLOCK_RE =
  /^(?:[\s\-–—]*)?(?:échauffement|retour(?:\s+au\s+calme)?|récup(?:ération)?)\s*[—–:-]\s*\d+\s*(?:min|minutes|')\b/i;
const TIME_VOLUME_RE = /\b\d+\s*(?:min|minutes|')\b/i;
const HAS_METERS_RE = /\d+\s*(?:[×x]\s*\d+\s*)?m\b/i;

/** Tokens type 3T / 5T / 7T / crawl libre séparés par / ou · */
const BREATH_TOKEN_RE = /(?:\d+\s*T\b|crawl(?:\s+libre)?|dos|brasse|souple|libre)/i;

/**
 * Snap distance vers multiple du bassin (25 ou 50).
 */
export function snapToPool(meters, pool = 25) {
  const P = pool === 50 ? 50 : 25;
  const n = Math.max(P, Math.round(Number(meters) / P) * P);
  return n;
}

/**
 * Snap total séance : finit par 00 ou 50 (jamais 25/75).
 */
export function snapTotalTo00or50(meters, pool = 25) {
  const min = pool === 50 ? 50 : 25;
  const n = Math.max(0, Math.round(Number(meters) || 0));
  const mod = n % 100;
  if (mod === 0 || mod === 50) return Math.max(min, n);
  const candidates = [n - mod, n - mod + 50, n - mod + 100]
    .filter((c) => c >= min)
    .sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b);
  return candidates[0] ?? Math.max(min, n - mod + 50);
}

/**
 * Parse NxM principal d'une ligne (premier match).
 * Accepte `4×150m`, `4x150 :`, `8×12,5m`.
 * @returns {{ reps: number, dist: number, total: number }|null}
 */
export function parseNxM(line) {
  const text = String(line || "");
  const m =
    text.match(/(\d+)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*m\b/i) ||
    text.match(/(\d+)\s*[×x]\s*(\d+(?:[.,]\d+)?)(?!\s*m)\s*:/i);
  if (!m) return null;
  const reps = parseInt(m[1], 10);
  const dist = parseFloat(String(m[2]).replace(",", "."));
  if (!reps || !(dist > 0)) return null;
  return { reps, dist, total: Math.round(reps * dist) };
}

/**
 * Distance d'une ligne de détail (sans double-compter les cues `par 25m`).
 */
export function lineSwimMeters(line) {
  const text = String(line || "");
  // Ignore pure time blocks
  if (TIME_ONLY_BLOCK_RE.test(text) && !HAS_METERS_RE.test(text)) return 0;

  const nxm = parseNxM(text);
  if (nxm) return nxm.total;

  // Pyramid arrows
  if (/pyramide/i.test(text)) {
    const arrow = text.match(/(\d+(?:\s*→\s*\d+)+)/);
    if (arrow) {
      return arrow[1]
        .split(/\s*→\s*/)
        .map((n) => parseInt(n, 10))
        .filter((n) => Number.isFinite(n))
        .reduce((a, b) => a + b, 0);
    }
  }

  // Strip cue parasites: par 25m / par 50m / dernier 25m / sur 15m
  let rest = text
    .replace(/\bpar\s+\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\bdernier\s+\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\bpremier\s+\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\bau\s+dernier\s+\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\bdu\s+(?:1er|premier)\s+au\s+dernier\s+\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\bsur\s+(?:la\s+)?(?:longueur\s+)?\d+(?:[.,]\d+)?\s*m\b/gi, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*m\s+de\s+coulée\b/gi, "");

  // Header Échauffement : 200m + 100m
  let sum = 0;
  let found = false;
  rest.replace(/\b(\d+(?:[.,]\d+)?)\s*m\b/gi, (_, x) => {
    sum += parseFloat(String(x).replace(",", "."));
    found = true;
    return "";
  });
  return found ? Math.round(sum) : 0;
}

/**
 * Tokens d'une séquence respiration / longueurs (3T/5T/7T…).
 */
export function parseLengthPatternTokens(line) {
  const text = String(line || "");
  // Prefer explicit slash sequences
  const slash = text.match(
    /(\d+\s*T(?:\s*[\/·•]\s*\d+\s*T)+(?:\s*[\/·•]\s*(?:crawl(?:\s+libre)?|dos|brasse|souple|libre))?)/i,
  );
  if (slash) {
    return slash[1]
      .split(/\s*[\/·•]\s*/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Parenthetical (3T/5T/7T/9T par 50m)
  const paren = text.match(/\(([^)]*\d+\s*T[^)]*)\)/i);
  if (paren && /\d+\s*T/i.test(paren[1])) {
    return paren[1]
      .split(/\s*[\/·•,]\s*/)
      .map((t) => t.trim())
      .filter((t) => BREATH_TOKEN_RE.test(t));
  }
  return [];
}

/**
 * Unité sous-jacente de la séquence (par 25m / par 50m).
 */
export function patternUnitMeters(line, fallbackDist) {
  const m = String(line || "").match(/\bpar\s+(\d+)\s*m\b/i);
  if (m) return parseInt(m[1], 10);
  // If dist is multiple of 25 and tokens look like per-length, assume 25
  if (fallbackDist && fallbackDist % 25 === 0 && fallbackDist <= 200) return 25;
  return 25;
}

/**
 * Références « dernier Xm » / « premier au dernier Xm » dans le cue.
 */
export function extractInternalDistanceRefs(line) {
  const text = String(line || "");
  const refs = [];
  const re =
    /(?:du\s+(?:1er|premier)\s+au\s+dernier|au\s+dernier|dernier|premier)\s+(\d+)\s*m\b/gi;
  let m;
  while ((m = re.exec(text))) {
    refs.push(parseInt(m[1], 10));
  }
  return refs;
}

/**
 * La ligne est-elle un bloc échauffement / retour sans mètres ?
 */
export function isTimelessWarmCool(line) {
  const t = String(line || "").trim();
  if (!t) return false;
  if (HAS_METERS_RE.test(t)) return false;
  if (TIME_ONLY_BLOCK_RE.test(t)) return true;
  if (/^(?:échauffement|retour(?:\s+au\s+calme)?)\b/i.test(t) && TIME_VOLUME_RE.test(t)) return true;
  return false;
}

/**
 * Somme des distances nageables des détails.
 */
export function sumDetailsMeters(details = []) {
  return (details || []).reduce((a, line) => a + lineSwimMeters(line), 0);
}

/**
 * Validation bloquante — erreurs dures.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], sum: number, announced: number }}
 */
export function validateSessionCoherence(session, { pool = 25 } = {}) {
  const errors = [];
  const warnings = [];
  const details = Array.isArray(session?.details) ? session.details : [];
  const announced =
    parseInt(String(session?.distance || "").replace(/\D/g, ""), 10) ||
    Number(session?.trainingDistance) ||
    Number(session?.volumeFromSets) ||
    0;

  if (!details.length) {
    errors.push("coherence: aucun bloc");
    return { ok: false, errors, warnings, sum: 0, announced };
  }

  let sum = 0;
  for (const raw of details) {
    const line = String(raw || "").trim();
    if (!line) continue;

    if (isTimelessWarmCool(line)) {
      errors.push(`coherence: bloc sans distance (minutes): ${line}`);
      continue;
    }

    // Skip pure cues / headers without swim work
    if (!HAS_METERS_RE.test(line) && !/×|x\s*\d/i.test(line)) {
      if (/échauffement|retour|calme|éducatif|technique/i.test(line)) {
        errors.push(`coherence: bloc sans distance: ${line}`);
      }
      continue;
    }

    const meters = lineSwimMeters(line);
    if (!(meters > 0)) {
      errors.push(`coherence: distance invalide: ${line}`);
      continue;
    }
    sum += meters;

    const nxm = parseNxM(line);
    if (nxm) {
      // Internal refs must match rep distance
      for (const ref of extractInternalDistanceRefs(line)) {
        if (ref !== nxm.dist) {
          errors.push(
            `coherence: référence ${ref}m incompatible avec ${nxm.reps}×${nxm.dist}m`,
          );
        }
      }

      // Breathing / length pattern must cover exact rep distance
      const tokens = parseLengthPatternTokens(line);
      if (tokens.length >= 3) {
        const unit = patternUnitMeters(line, nxm.dist);
        const covered = tokens.length * unit;
        if (covered !== nxm.dist) {
          errors.push(
            `coherence: séquence ${tokens.length}×${unit}m=${covered}m ≠ rep ${nxm.dist}m (${line})`,
          );
        }
      }
    }
  }

  if (announced > 0 && Math.abs(sum - announced) > 0) {
    errors.push(`coherence: somme blocs ${sum}m ≠ volume annoncé ${announced}m`);
  }

  if (sum > 0) {
    const mod = sum % 100;
    if (mod === 25 || mod === 75) {
      errors.push(`coherence: total ${sum}m finit par ${mod} (interdit)`);
    }
  }

  // Pool alignment soft warning
  if (pool === 50 && sum % 50 !== 0) {
    warnings.push(`coherence: total ${sum}m non multiple de 50 (bassin 50)`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    sum,
    announced: announced || sum,
  };
}

/**
 * Corrige une ligne : séquence par 25m vs distance du rep.
 */
export function fixLengthPatternLine(line) {
  const nxm = parseNxM(line);
  if (!nxm) return line;
  const tokens = parseLengthPatternTokens(line);
  if (tokens.length < 3) return line;
  const unit = patternUnitMeters(line, nxm.dist);
  const covered = tokens.length * unit;
  if (covered === nxm.dist) return line;

  // Prefer adjusting rep distance to match pattern when close
  if (covered > 0 && covered % (unit === 25 ? 25 : 50) === 0 && Math.abs(covered - nxm.dist) <= 50) {
    return String(line).replace(
      /(\d+)\s*[×x]\s*(\d+)\s*m/i,
      `${nxm.reps}×${covered}m`,
    );
  }

  // Or extend pattern with crawl libre to fill
  if (covered < nxm.dist && (nxm.dist - covered) % unit === 0) {
    const missing = (nxm.dist - covered) / unit;
    const extra = Array.from({ length: missing }, () => "crawl libre").join(" / ");
    const seqRe =
      /(\d+\s*T(?:\s*[\/·•]\s*\d+\s*T)+(?:\s*[\/·•]\s*(?:crawl(?:\s+libre)?|dos|brasse|souple|libre))?)/i;
    if (seqRe.test(line)) {
      return String(line).replace(seqRe, (seq) => `${seq} / ${extra}`);
    }
  }

  // Fallback: drop mismatched pattern paren/slash, keep NxM
  return String(line)
    .replace(/\s*\([^)]*\d+\s*T[^)]*\)/gi, "")
    .replace(/\s*:\s*\d+\s*T(?:\s*[\/·•]\s*\d+\s*T)+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Corrige « dernier 200 m » pour coller à la distance du rep.
 */
export function fixInternalDistanceRefs(line) {
  const nxm = parseNxM(line);
  if (!nxm) return line;
  let out = String(line);
  out = out.replace(
    /(du\s+(?:1er|premier)\s+au\s+dernier|au\s+dernier|dernier|premier)\s+(\d+)\s*m\b/gi,
    (full, prefix, num) => {
      const n = parseInt(num, 10);
      if (n === nxm.dist) return full;
      return `${prefix} ${nxm.dist}m`;
    },
  );
  return out;
}

/**
 * Remplace un bloc minutes par une distance souple.
 */
export function replaceTimelessWarmCool(line, { pool = 25, role = "warm" } = {}) {
  const P = pool === 50 ? 50 : 25;
  const meters = role === "cool" ? Math.max(P * 4, 100) : Math.max(P * 8, 200);
  const dist = snapToPool(meters, P);
  if (role === "cool") {
    return `-${dist}m dos très souple — Retour au calme`;
  }
  return `-${dist}m crawl/dos souple — Échauffement`;
}

/**
 * Ajuste le dernier bloc souple / retour pour que le total finisse en 00/50
 * et égale le volume annoncé.
 */
export function adjustTailForTotal(details, targetTotal, { pool = 25 } = {}) {
  const lines = (details || []).map(String);
  const sum = sumDetailsMeters(lines);
  if (sum === targetTotal && targetTotal % 100 !== 25 && targetTotal % 100 !== 75) {
    return lines;
  }

  let desired = snapTotalTo00or50(targetTotal > 0 ? targetTotal : sum, pool);
  // If target was announced and already 00/50, keep it
  if (targetTotal > 0 && targetTotal % 100 !== 25 && targetTotal % 100 !== 75) {
    desired = targetTotal;
  }

  let delta = desired - sumDetailsMeters(lines);
  if (delta === 0) return lines;

  // Find last soft/cool/continuous line to adjust
  const softIdx = [...lines.keys()].reverse().find((i) => {
    const t = lines[i];
    if (parseNxM(t) && parseNxM(t).reps > 1) return false;
    return /souple|calme|récup|retour|échauff|au choix|facile|Z1/i.test(t) || lineSwimMeters(t) > 0;
  });

  if (softIdx == null) {
    if (delta > 0) {
      lines.push(`-${snapToPool(delta, pool)}m crawl souple — Retour au calme`);
    }
    return lines;
  }

  const cur = lineSwimMeters(lines[softIdx]);
  const nxm = parseNxM(lines[softIdx]);
  if (nxm) {
    // Don't mutate multi-rep series; append adjustment
    if (delta > 0) {
      lines.push(`-${snapToPool(delta, pool)}m crawl souple — ajustement volume`);
    } else if (delta < 0 && cur + delta >= (pool === 50 ? 50 : 25)) {
      // try reduce another continuous line
      const contIdx = [...lines.keys()].reverse().find((i) => !parseNxM(lines[i]) && lineSwimMeters(lines[i]) > 0);
      if (contIdx != null) {
        const c = lineSwimMeters(lines[contIdx]);
        const next = snapToPool(Math.max(pool === 50 ? 50 : 25, c + delta), pool);
        lines[contIdx] = lines[contIdx].replace(/\b\d+\s*m\b/i, `${next}m`);
      }
    }
    return lines;
  }

  const next = snapToPool(Math.max(pool === 50 ? 50 : 25, cur + delta), pool);
  lines[softIdx] = lines[softIdx].replace(/\b\d+\s*m\b/i, `${next}m`);
  // Re-check residual
  const residual = desired - sumDetailsMeters(lines);
  if (residual > 0) {
    lines.push(`-${snapToPool(residual, pool)}m crawl souple — ajustement volume`);
  } else if (residual < 0) {
    const c2 = lineSwimMeters(lines[softIdx]);
    const n2 = snapToPool(Math.max(pool === 50 ? 50 : 25, c2 + residual), pool);
    lines[softIdx] = lines[softIdx].replace(/\b\d+\s*m\b/i, `${n2}m`);
  }
  return lines;
}

/**
 * Pipeline correctif + validation.
 * @returns {{ ok: boolean, session: object, errors: string[], warnings: string[], fixed: boolean }}
 */
export function enforceSessionCoherence(session, { pool = 25, strict = true } = {}) {
  if (!session || !Array.isArray(session.details)) {
    return {
      ok: false,
      session,
      errors: ["coherence: séance invalide"],
      warnings: [],
      fixed: false,
    };
  }

  let details = session.details.map(String);
  let fixed = false;

  details = details.map((line) => {
    let next = line;
    if (isTimelessWarmCool(next)) {
      const role = /retour|calme|récup/i.test(next) ? "cool" : "warm";
      next = replaceTimelessWarmCool(next, { pool, role });
      fixed = true;
    }
    const afterPattern = fixLengthPatternLine(next);
    if (afterPattern !== next) {
      next = afterPattern;
      fixed = true;
    }
    const afterRefs = fixInternalDistanceRefs(next);
    if (afterRefs !== next) {
      next = afterRefs;
      fixed = true;
    }
    return next;
  });

  // Ensure every warm/cool-ish line without meters gets meters
  details = details.map((line) => {
    if (/^(?:[\s\-–—]*)?(?:échauffement|retour)/i.test(line) && !HAS_METERS_RE.test(line)) {
      fixed = true;
      const role = /retour/i.test(line) ? "cool" : "warm";
      return replaceTimelessWarmCool(line, { pool, role });
    }
    return line;
  });

  let sum = sumDetailsMeters(details);
  let announced =
    parseInt(String(session.distance || "").replace(/\D/g, ""), 10) ||
    Number(session.trainingDistance) ||
    Number(session.volumeFromSets) ||
    sum;

  // Si on vient d'ajouter des mètres (ex. échauffement/retour qui étaient en minutes),
  // le volume annoncé d'origine est souvent incomplet → privilégier la somme des blocs.
  if (fixed && sum > announced) {
    announced = sum;
    fixed = true;
  }

  // Align announced to legal ending
  const snappedAnnounced = snapTotalTo00or50(announced, pool);
  if (snappedAnnounced !== announced) {
    announced = snappedAnnounced;
    fixed = true;
  }

  if (sum !== announced) {
    details = adjustTailForTotal(details, announced, { pool });
    sum = sumDetailsMeters(details);
    fixed = true;
  }

  // If still illegal ending, snap sum
  if (sum % 100 === 25 || sum % 100 === 75) {
    const legal = snapTotalTo00or50(sum, pool);
    details = adjustTailForTotal(details, legal, { pool });
    sum = sumDetailsMeters(details);
    announced = legal;
    fixed = true;
  }

  const nextSession = {
    ...session,
    details,
    distance: `${sum}m`,
    trainingDistance: sum,
    volumeFromDetails: sum,
    coherenceFixed: fixed || !!session.coherenceFixed,
  };

  const check = validateSessionCoherence(nextSession, { pool });
  if (!check.ok && strict) {
    // Last resort: rebuild announced from sum if only mismatch left
    if (
      check.errors.length === 1 &&
      check.errors[0].startsWith("coherence: somme blocs")
    ) {
      const legal = snapTotalTo00or50(check.sum, pool);
      const details2 = adjustTailForTotal(details, legal, { pool });
      const sum2 = sumDetailsMeters(details2);
      const sess2 = {
        ...nextSession,
        details: details2,
        distance: `${sum2}m`,
        trainingDistance: sum2,
        volumeFromDetails: sum2,
        coherenceFixed: true,
      };
      const check2 = validateSessionCoherence(sess2, { pool });
      return {
        ok: check2.ok,
        session: sess2,
        errors: check2.errors,
        warnings: check2.warnings,
        fixed: true,
      };
    }
  }

  return {
    ok: check.ok,
    session: nextSession,
    errors: check.errors,
    warnings: check.warnings,
    fixed,
  };
}
