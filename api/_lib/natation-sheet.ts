/**
 * Proxy lecture Google Sheet cahier natation (CSV gviz).
 * Monté sur /api/contact?kind=natation-sheet (Hobby = 12 fonctions max).
 * Rewrite public : /api/natation-sheet → contact.
 * Env : NATATION_SHEET_ID
 */
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

  const id = sheetId();
  if (!id) {
    res.status(500).json({ error: "missing_NATATION_SHEET_ID" });
    return;
  }

  const rawSheet = req.query?.sheet;
  const sheet = String(Array.isArray(rawSheet) ? rawSheet[0] : rawSheet || "").trim();
  if (!sheet) {
    res.status(400).json({ error: "missing_sheet" });
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  try {
    const upstream = await fetch(url, { redirect: "follow" });
    if (!upstream.ok) {
      res.status(502).json({ error: "upstream", status: upstream.status });
      return;
    }
    const csv = await upstream.text();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({ sheet, csv, bytes: csv.length });
  } catch (err) {
    res.status(502).json({
      error: "fetch_failed",
      message: (err as Error)?.message || String(err),
    });
  }
}
