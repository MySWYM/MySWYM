import {
  currentWeekSessionCards,
  initialWeekCardIndex,
  humanSessionType,
  sessionCoverSrc,
} from "./home-week-sessions.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("home-week-sessions");

assert(humanSessionType("ENDURANCE") === "Endurance", "type endurance");
assert(humanSessionType("récupération") === "Récupération", "type récup");
assert(sessionCoverSrc("TECHNIQUE").includes("technique"), "cover technique");
assert(sessionCoverSrc("ENDURANCE", 0) !== sessionCoverSrc("ENDURANCE", 1), "endurance tourne");

const week = {
  weeks: [
    {
      sessions: [
        { title: "A", type: "ENDURANCE", distance: 2000, completed: true, details: ["-200 m souple"] },
        { title: "B", type: "TECHNIQUE", distance: 1800, details: ["-200 m éduc"] },
        { title: "C", type: "VITESSE", distance: 1600, details: ["-8 × 50"] },
      ],
    },
  ],
};
const cards = currentWeekSessionCards(week);
assert(cards.length === 3, "3 séances = 3 cartes");
assert(cards[0].title === "Séance 1" && cards[2].title === "Séance 3", "titres 1…n");
assert(cards[0].resolved && !cards[1].resolved, "faite / ouverte");
assert(initialWeekCardIndex(cards) === 1, "focus = prochaine");
assert(cards[1].line.includes("Technique"), "ligne type");
assert(new Set(cards.map((c) => c.cover)).size === 3, "3 photos distinctes");
assert(cards[0].cover.includes("hero-pool"), "séance 1 = hero-pool");
assert(cards[1].cover.includes("technique"), "séance 2 technique");

const tripleEndurance = currentWeekSessionCards({
  weeks: [{ sessions: [
    { type: "ENDURANCE", details: ["-100 m"] },
    { type: "ENDURANCE", details: ["-100 m"] },
    { type: "ENDURANCE", details: ["-100 m"] },
  ] }],
});
assert(new Set(tripleEndurance.map((c) => c.cover)).size === 3, "3 endurances = 3 photos");

const loopOne = {
  isSessionLoop: true,
  history: [{ completed: true }, { completed: true }],
  weeks: [{ sessions: [{ title: "X", type: "ENDURANCE", distance: 1500, details: ["-200 m"] }] }],
};
const loopCards = currentWeekSessionCards(loopOne);
assert(loopCards.length === 1, "boucle 1 slot = 1 carte");
assert(loopCards[0].title === "Séance n°3", loopCards[0].title);

const allDone = {
  weeks: [{ sessions: [
    { type: "ENDURANCE", completed: true, details: ["-100 m"] },
    { type: "SEUIL", completed: true, details: ["-100 m"] },
  ] }],
};
assert(initialWeekCardIndex(currentWeekSessionCards(allDone)) === 1, "semaine finie = dernière");

console.log("home-week-sessions ok");
