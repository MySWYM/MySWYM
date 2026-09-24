import { formatMemberSince } from "./member-since.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("member-since");
assert(
  formatMemberSince(new Date(2025, 10, 15)) === "Membre MySWYM depuis novembre 2025",
  "novembre 2025",
);
assert(formatMemberSince(null) === "Membre MySWYM", "date absente");
assert(formatMemberSince("nope") === "Membre MySWYM", "date invalide");
console.log("member-since ok");
