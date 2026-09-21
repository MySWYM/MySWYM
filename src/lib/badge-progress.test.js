import {
  nextLadderBadge,
  ladderBadgeDefs,
  ladderSummary,
  filterLadderDefs,
  ladderCardProgress,
} from "./badge-progress.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("badge-progress");

const mid = {
  totalMeters: 3200,
  totalSessions: 12,
  streak: 4,
  currentStreak: 2,
};

const next = nextLadderBadge(mid);
assert(next?.def?.id === "km5", "prochain = 5 km");
assert(next.homeValue === "3,2 / 5 km", next.homeValue);
assert(Math.abs(next.ratio - 0.55) < 0.01, "barre 55 % depuis 1 km");

const none = nextLadderBadge({
  totalMeters: 250000,
  totalSessions: 100,
  streak: 14,
  currentStreak: 14,
});
assert(none == null, "échelles finies = pas de prochain");

assert(ladderBadgeDefs().every((d) => d.group !== "flavor"), "iOS = paliers seulement");

const streakNext = nextLadderBadge({
  totalMeters: 12000,
  totalSessions: 12,
  streak: 8,
  currentStreak: 2,
});
assert(streakNext?.def?.group !== "streak" || streakNext.def.id === "streak3", "série vise la courante");

const sum = ladderSummary(mid);
assert(sum.total === ladderBadgeDefs().length, "total = paliers");
assert(sum.earned >= 3, "km1 + sess10 + streak3");
assert(filterLadderDefs("km").every((d) => d.group === "km"), "filtre distance");
assert(ladderCardProgress(ladderBadgeDefs().find((d) => d.id === "km5"), mid).fracLabel === "3,2 / 5 km", "carte 5 km");

console.log("badge-progress ok");
