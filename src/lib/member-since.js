/** « Membre MySWYM depuis novembre 2025 » à partir de user.created_at. */
import { appLocale } from "./app-locale.js";

export function formatMemberSince(createdAt, now = new Date()) {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt || "");
  if (Number.isNaN(d.getTime())) return "Membre MySWYM";
  const label = d.toLocaleDateString(appLocale(), { month: "long", year: "numeric" });
  if (!label || label === "Invalid Date") return "Membre MySWYM";
  void now;
  return `Membre MySWYM depuis ${label}`;
}
