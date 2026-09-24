/**
 * Objectif nageur (Profil iOS) : famille, cible, date, semaine en cours.
 * Changer l’objectif doit passer par un merge des séances à venir, jamais un wipe.
 */
import { isSessionResolved } from "./plan-progress-merge.js";

const FAMILIES = new Set(["progression", "triathlon", "eau_libre", "diplome"]);

export function familyIdFromProfile(profile) {
  const cat = String(profile?.category || "");
  if (FAMILIES.has(cat)) return cat;
  const goal = String(profile?.goal || "");
  if (goal === "progression" || goal.startsWith("prog_")) return "progression";
  if (goal.startsWith("triathlon")) return "triathlon";
  if (goal.startsWith("open_water")) return "eau_libre";
  if (goal === "bnssa" || goal === "bpjeps_aan" || goal === "caepmns") return "diplome";
  if (goal === "reprendre" || goal === "perte_de_poids") return "progression";
  return "progression";
}

export function familyNeedsSub(familyId) {
  return familyId === "triathlon" || familyId === "eau_libre" || familyId === "diplome";
}

export function familyNeedsDate(familyId) {
  return familyId !== "progression";
}

export function buildGoalPatch({ category, goal, eventDate }) {
  const family = String(category || "progression");
  if (family === "progression") {
    return { category: "progression", goal: "progression", eventDate: "" };
  }
  return {
    category: family,
    goal: String(goal || ""),
    eventDate: String(eventDate || "").slice(0, 10),
  };
}

export function isSameGoalPatch(profile, patch) {
  return String(profile?.category || "") === String(patch?.category || "")
    && String(profile?.goal || "") === String(patch?.goal || "")
    && String(profile?.eventDate || "") === String(patch?.eventDate || "");
}

export function formatEventDateFr(iso) {
  const s = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function daysUntilEvent(iso, now = new Date()) {
  const s = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - start) / 86400000);
}

/** Date d'épreuve + J-n. Jamais de phrase catalogue. */
export function formatEventLine(iso, now = new Date()) {
  const dateLabel = formatEventDateFr(iso);
  if (!dateLabel) return "";
  const days = daysUntilEvent(iso, now);
  if (days == null) return dateLabel;
  if (days < 0) return `${dateLabel} · passée`;
  if (days === 0) return `${dateLabel} · aujourd'hui`;
  return `${dateLabel} · J-${days}`;
}

export function rhythmLine(profile) {
  const n = Math.max(0, Math.min(7, Number(profile?.sessionsPerWeek) || 0));
  if (n <= 0) return "";
  return `${n} séance${n > 1 ? "s" : ""} / semaine`;
}

export function currentWeekLine(plan) {
  const weeks = plan?.weeks;
  if (!Array.isArray(weeks) || weeks.length === 0) return "";
  const idx = weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved));
  const i = idx >= 0 ? idx : weeks.length - 1;
  const focus = String(weeks[i]?.focus || "").trim();
  const n = i + 1;
  const total = weeks.length;
  const showTotal = !plan?.isSessionLoop && total > 1;
  const weekPart = showTotal ? `Semaine ${n} sur ${total}` : `Semaine ${n}`;
  return focus ? `${weekPart} · ${focus}` : weekPart;
}

export function todayIsoDate(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
