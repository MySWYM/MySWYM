/**
 * Lecture du cahier natation.
 * Snapshot Supabase (version is_live) si elle existe, sinon Google Sheet.
 * Monté sur /api/contact?kind=natation-sheet (Hobby = 12 fonctions max).
 * Rewrite public : /api/natation-sheet → contact.
 * Env : NATATION_SHEET_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readLiveSheetCsv } from "./sheet-catalogue-read.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function sheetId() {
  return String(process.env.NATATION_SHEET_ID || "").replace(/"/g, "").trim();
}

export function isNatationSheetRequest(req: VercelRequest): boolean {
  const raw = req.query?.kind;
  const kind = String(Array.isArray(raw) ? raw[0] : raw || "").trim();
  return kind === "natation-sheet";
}

export async function handleNatationSheet(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const rawSheet = req.query?.sheet;
  const sheet = String(Array.isArray(rawSheet) ? rawSheet[0] : rawSheet || "").trim();
  if (!sheet) {
    res.status(400).json({ error: "missing_sheet" });
    return;
  }

  try {
    let csv = "";
    let source = "google";
    try {
      const live = await readLiveSheetCsv(sheet);
      if (live?.csv) {
        csv = live.csv;
        source = "supabase";
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "sheet_not_in_catalogue") {
        res.status(404).json({ error: "sheet_not_in_catalogue", sheet });
        return;
      }
      throw err;
    }

    if (!csv) {
      const id = sheetId();
      if (!id) {
        res.status(500).json({ error: "missing_NATATION_SHEET_ID" });
        return;
      }
      const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
      const upstream = await fetch(url, { redirect: "follow" });
      if (!upstream.ok) {
        res.status(502).json({ error: "upstream", status: upstream.status });
        return;
      }
      csv = await upstream.text();
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({ sheet, csv, bytes: csv.length, source });
  } catch (err) {
    res.status(502).json({
      error: "fetch_failed",
      message: (err as Error)?.message || String(err),
    });
  }
}
