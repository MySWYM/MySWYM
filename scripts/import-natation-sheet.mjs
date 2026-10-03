/**
 * Publie le Google Sheet dans Supabase (staging, .env.local).
 * Nouvelle version à chaque lancement. L'ancienne version live est désactivée.
 * Les plans nageur ne sont pas touchés.
 *
 * Usage : node scripts/import-natation-sheet.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  EDUCATIFS_SHEET,
  SHEET_FAMILIES,
  isEventFamilyId,
  parseEducatifsCsv,
  parseSessionsCsv,
} from "../src/lib/natation-sheet/parse.js";
import { educatifsToCsv, sessionsToCsv } from "../src/lib/natation-sheet/catalogue-csv.js";

const PROD_REF = "ssdygzqwvoqcyzbtbrbp";
const ENV_FILE = ".env.local";
const MIGRATION = "supabase/migrations/20261003140000_sheet_catalogue.sql";

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
  return out;
}

function sameSession(a, b) {
  return (
    a.n === b.n &&
    (a.phase || null) === (b.phase || null) &&
    a.bande === b.bande &&
    a.total_m === b.total_m &&
    a.echauffement === b.echauffement &&
    a.bloc === b.bloc &&
    a.rac === b.rac
  );
}

function sameEducatif(a, b) {
  return (
    a.nom === b.nom &&
    a.nage === b.nage &&
    a.debutant === b.debutant &&
    a.intermediaire === b.intermediaire &&
    a.avance === b.avance &&
    a.utilite === b.utilite &&
    a.comment === b.comment &&
    a.materielRaw === b.materielRaw &&
    a.garder === b.garder &&
    a.notes === b.notes &&
    JSON.stringify(a.materiel) === JSON.stringify(b.materiel)
  );
}

async function fetchCsv(sheetId, sheet) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${sheet}: Google ${res.status}`);
  return res.text();
}

function sqlStatements(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function queryDb(dbUrl, sql, password, userPass) {
  try {
    execFileSync(
      "supabase",
      ["db", "query", "--db-url", dbUrl, sql, "-o", "json", "--agent", "no"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (err) {
    const detail = String(err.stderr || err.stdout || err.message || err)
      .replaceAll(password, "***")
      .replaceAll(userPass, "***")
      .slice(0, 500);
    throw new Error(detail);
  }
}

function applyMigration(ref, password) {
  const userPass = encodeURIComponent(password);
  const urls = [
    `postgresql://postgres.${ref}:${userPass}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`,
  ];
  const statements = sqlStatements(MIGRATION);
  let last = "";
  for (const dbUrl of urls) {
    const host = dbUrl.split("@")[1]?.split("/")[0] || "db";
    try {
      queryDb(dbUrl, "select 1", password, userPass);
      for (const sql of statements) queryDb(dbUrl, sql, password, userPass);
      console.log(`migration ok via ${host} (${statements.length} requêtes)`);
      return;
    } catch (err) {
      last = String(err.message || err);
    }
  }
  throw new Error(`migration impossible: ${last}`);
}

async function insertBatches(sb, table, rows) {
  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await sb.from(table).insert(chunk);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const env = loadEnv(ENV_FILE);
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const sheetId = env.NATATION_SHEET_ID;
const dbPassword = env.SUPABASE_DB_PASSWORD;
if (!supabaseUrl || !serviceKey || !sheetId || !dbPassword) {
  throw new Error(`${ENV_FILE}: SUPABASE_URL, SERVICE_ROLE, NATATION_SHEET_ID ou SUPABASE_DB_PASSWORD manquant`);
}
const ref = new URL(supabaseUrl).hostname.split(".")[0];
if (ref === PROD_REF) {
  throw new Error("refus: .env.local pointe vers la prod. Import staging seulement.");
}
console.log(`cible ${ref} (pas la prod)`);

const families = [];
for (const familyId of SHEET_FAMILIES) {
  const csv = await fetchCsv(sheetId, familyId);
  const hasPhase = isEventFamilyId(familyId);
  const sessions = parseSessionsCsv(csv, { hasPhase }).map((s, i) => ({ ...s, row_index: i + 1 }));
  const seen = new Set();
  for (const s of sessions) {
    if (seen.has(s.n)) throw new Error(`${familyId}: n° ${s.n} en double`);
    seen.add(s.n);
  }
  const again = parseSessionsCsv(sessionsToCsv(sessions, { hasPhase }), { hasPhase });
  if (again.length !== sessions.length || again.some((s, i) => !sameSession(s, sessions[i]))) {
    throw new Error(`${familyId}: aller-retour CSV cassé`);
  }
  families.push({ familyId, sessions });
  console.log(`${familyId}: ${sessions.length} séances`);
}

const eduCsv = await fetchCsv(sheetId, EDUCATIFS_SHEET);
const educatifs = parseEducatifsCsv(eduCsv).map((row, i) => ({ ...row, row_index: i + 1 }));
const eduAgain = parseEducatifsCsv(educatifsToCsv(educatifs));
if (eduAgain.length !== educatifs.length || eduAgain.some((row, i) => !sameEducatif(row, educatifs[i]))) {
  throw new Error("Éducatifs: aller-retour CSV cassé");
}
console.log(`${EDUCATIFS_SHEET}: ${educatifs.length} fiches`);

applyMigration(ref, dbPassword);

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const sessionCount = families.reduce((n, f) => n + f.sessions.length, 0);
const label = `import ${new Date().toISOString().slice(0, 16)}`;
const { data: version, error: vErr } = await sb
  .from("sheet_catalogue_versions")
  .insert({
    label,
    is_live: false,
    session_count: sessionCount,
    educatif_count: educatifs.length,
  })
  .select("id")
  .single();
if (vErr || !version?.id) throw new Error(vErr?.message || "version insert");

try {
  const sessionRows = families.flatMap((f) =>
    f.sessions.map((s) => ({
      version_id: version.id,
      family_id: f.familyId,
      row_index: s.row_index,
      n: s.n,
      phase: s.phase,
      bande: s.bande,
      total_m: s.total_m,
      echauffement: s.echauffement,
      bloc: s.bloc,
      rac: s.rac,
    })),
  );
  await insertBatches(sb, "sheet_sessions", sessionRows);
  await insertBatches(
    sb,
    "sheet_educatifs",
    educatifs.map((row) => ({
      version_id: version.id,
      row_index: row.row_index,
      nom: row.nom,
      nage: row.nage,
      debutant: row.debutant,
      intermediaire: row.intermediaire,
      avance: row.avance,
      utilite: row.utilite,
      comment: row.comment,
      materiel: row.materiel,
      materiel_raw: row.materielRaw,
      garder: row.garder,
      notes: row.notes,
    })),
  );

  const { error: offErr } = await sb
    .from("sheet_catalogue_versions")
    .update({ is_live: false })
    .eq("is_live", true);
  if (offErr) throw new Error(offErr.message);
  const { error: onErr } = await sb
    .from("sheet_catalogue_versions")
    .update({ is_live: true })
    .eq("id", version.id);
  if (onErr) throw new Error(onErr.message);
} catch (err) {
  await sb.from("sheet_catalogue_versions").delete().eq("id", version.id);
  throw err;
}

console.log(`publié ${version.id} · ${sessionCount} séances · ${educatifs.length} éducatifs`);
