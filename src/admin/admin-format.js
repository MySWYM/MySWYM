export function dash(v) {
  if (v == null || v === "") return "-";
  if (typeof v === "number" && Number.isNaN(v)) return "-";
  return v;
}

export function pct(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  const x = Number(n);
  const ratio = x > 1 ? x / 100 : x;
  return `${Math.round(ratio * 100)} %`;
}

export function euros(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return `${Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

export function hoursLabel(h) {
  if (h == null || Number.isNaN(Number(h))) return "-";
  const x = Number(h);
  if (x < 1) return `${Math.round(x * 60)} min`;
  if (x < 48) return `${Math.round(x)} h`;
  return `${Math.round(x / 24)} j`;
}

export function deltaPct(current, previous) {
  if (previous == null || previous === "" || Number(previous) === 0) return null;
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
  return (c - p) / p;
}

export function deltaLabel(current, previous) {
  const d = deltaPct(current, previous);
  if (d == null) return "";
  const sign = d > 0 ? "+" : "";
  return `${sign}${Math.round(d * 100)} % vs période précédente`;
}

export function insuffisant(available, value) {
  if (!available) return "Données insuffisantes";
  return dash(value);
}

export const cardBox = {
  background: "#fff",
  border: "1px solid #d8dee6",
  borderRadius: 14,
  padding: 16,
  minHeight: 108,
  textDecoration: "none",
  color: "inherit",
  display: "block",
};

export const btnPrimary = {
  minHeight: 44,
  padding: "10px 16px",
  border: 0,
  borderRadius: 10,
  background: "#154388",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 15,
};
