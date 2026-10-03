/**
 * Lecture serveur du snapshot Sheet (service_role).
 * null = pas de version live, ou tables absentes : l'appelant retombe sur Google.
 */
import { createClient } from "@supabase/supabase-js";
import { educatifsToCsv, sessionsToCsv } from "../../src/lib/natation-sheet/catalogue-csv.js";
import { EDUCATIFS_SHEET, isEventFamilyId } from "../../src/lib/natation-sheet/parse.js";

function clientFromEnv() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function missingTable(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || "");
  return code === "42P01" || code === "PGRST205" || /schema cache|does not exist|relation/i.test(msg);
}

/**
 * @param {string} sheetName
 * @returns {Promise<{ csv: string, source: "supabase" } | null>}
 */
export async function readLiveSheetCsv(sheetName) {
  const sheet = String(sheetName || "").trim();
  if (!sheet) return null;
  const sb = clientFromEnv();
  if (!sb) return null;

  const { data: version, error: vErr } = await sb
    .from("sheet_catalogue_versions")
    .select("id")
    .eq("is_live", true)
    .maybeSingle();
  if (vErr) {
    if (missingTable(vErr)) return null;
    throw new Error(vErr.message || "sheet_catalogue_versions");
  }
  if (!version?.id) return null;

  if (sheet === EDUCATIFS_SHEET) {
    const { data, error } = await sb
      .from("sheet_educatifs")
      .select(
        "row_index, nom, nage, debutant, intermediaire, avance, utilite, comment, materiel_raw, garder, notes",
      )
      .eq("version_id", version.id)
      .order("row_index", { ascending: true });
    if (error) throw new Error(error.message || "sheet_educatifs");
    if (!data?.length) {
      const err = new Error("sheet_not_in_catalogue");
      err.code = "sheet_not_in_catalogue";
      throw err;
    }
    return { csv: educatifsToCsv(data), source: "supabase" };
  }

  const { data, error } = await sb
    .from("sheet_sessions")
    .select("row_index, n, phase, bande, total_m, echauffement, bloc, rac")
    .eq("version_id", version.id)
    .eq("family_id", sheet)
    .order("row_index", { ascending: true });
  if (error) {
    if (missingTable(error)) return null;
    throw new Error(error.message || "sheet_sessions");
  }
  if (!data?.length) {
    const err = new Error("sheet_not_in_catalogue");
    err.code = "sheet_not_in_catalogue";
    throw err;
  }
  return {
    csv: sessionsToCsv(data, { hasPhase: isEventFamilyId(sheet) }),
    source: "supabase",
  };
}
