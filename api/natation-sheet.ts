/**
 * GET /api/natation-sheet?sheet=Éducatifs
 * Proxy lecture Google Sheet cahier natation (CSV gviz).
 * Env : NATATION_SHEET_ID
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_ID = "";

function sheetId() {
  return String(process.env.NATATION_SHEET_ID || DEFAULT_ID).replace(/"/g, "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const id = sheetId();
  if (!id) {
    return res.status(500).json({ error: "missing_NATATION_SHEET_ID" });
  }

  const sheet = String(req.query.sheet || "").trim();
  if (!sheet) {
    return res.status(400).json({ error: "missing_sheet" });
  }

  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  try {
    const upstream = await fetch(url, { redirect: "follow" });
    if (!upstream.ok) {
      return res.status(502).json({ error: "upstream", status: upstream.status });
    }
    const csv = await upstream.text();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ sheet, csv, bytes: csv.length });
  } catch (err) {
    return res.status(502).json({ error: "fetch_failed", message: (err as Error)?.message || String(err) });
  }
}
