/**
 * Libellés admin (IDs onboarding → texte lisible).
 * Copie données, sans React / lucide (l’API Vercel ne charge pas le catalogue JSX).
 */

const LEVEL_LABELS: Record<string, string> = {
  découverte: "Découverte",
  beginner: "Découverte",
  régulier: "Débutant",
  regulier: "Débutant",
  sportif: "Intermédiaire",
  intermediate: "Intermédiaire",
  performance: "Avancé",
  advanced: "Avancé",
};

const GOAL_LABELS: Record<string, string> = {
  triathlon_xs: "Triathlon XS",
  triathlon_sprint: "Triathlon Sprint",
  triathlon_olympic: "Triathlon Olympique",
  triathlon_half: "Triathlon Half",
  triathlon_ironman: "Triathlon Full",
  open_water_short: "Eau libre courte",
  open_water_mid: "Eau libre moyenne",
  open_water_long: "Eau libre longue",
  bnssa: "Prépa BNSSA",
  bpjeps_aan: "Prépa BPJEPS AAN",
  caepmns: "Prépa CAEPMNS",
  tests_pompiers: "Tests Pompiers",
  competition_maitre: "Compétition Maître",
  reprendre: "Reprendre la natation",
  perte_de_poids: "Activité physique",
  progression: "Nager et progresser",
  triathlon: "Triathlon",
  eau_libre: "Eau libre",
  forme: "Forme",
  "5km": "5 km",
};

const SWIM_LABELS: Record<string, string> = {
  crawl: "Crawl",
  "4_nages": "4 nages",
  quatre_nages: "4 nages",
};

export function levelLabelFr(raw: unknown): string {
  const id = String(raw || "").trim();
  if (!id) return "Non renseigné";
  return LEVEL_LABELS[id] || LEVEL_LABELS[id.toLowerCase()] || id;
}

export function goalLabelFr(raw: unknown): string {
  const id = String(raw || "").trim();
  if (!id) return "Non renseigné";
  return GOAL_LABELS[id] || GOAL_LABELS[id.toLowerCase()] || id;
}

export function swimStyleLabelFr(raw: unknown): string {
  const id = String(raw || "").trim();
  if (!id) return "Non renseigné";
  return SWIM_LABELS[id] || id;
}

export function poolLabelFr(raw: unknown): string {
  const n = Number(raw);
  if (n === 50) return "50 m";
  if (n === 25) return "25 m";
  return "Non renseigné";
}

export function frequencyLabelFr(raw: unknown): string {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= 7) return `${Math.round(n)}×/sem`;
  return "Non renseigné";
}

export function accessLabelFr(raw: unknown): string {
  const s = String(raw || "").trim();
  if (s === "trial") return "Essai";
  if (s === "active") return "Payant";
  if (s === "canceled") return "Annulé";
  if (s === "expired") return "Expiré";
  return "Sans accès";
}
