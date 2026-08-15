/**
 * Merge de progression au niveau séance (hotfix persistance 2026-08-15).
 * Usage : node src/lib/plan-progress-merge.test.js
 */
import {
  isSessionResolved,
  shouldPreserveWeek,
  mergePreservingProgress,
} from "./plan-progress-merge.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

{
  assert(isSessionResolved({ completed: true }) === true, "completed");
  assert(isSessionResolved({ skipped: "missed" }) === true, "skipped");
  assert(isSessionResolved({ completed: false }) === false, "open");
  assert(isSessionResolved(null) === false, "null");
  console.log("isSessionResolved PASS");
}

{
  const oldS1 = { title: "Validée A", completed: true, details: ["ancien A"] };
  const oldS2 = { title: "Validée B", skipped: "missed", details: ["ancien B"] };
  const oldS3 = { title: "À nager", completed: false, details: ["ancien C"] };
  const newS1 = { title: "Nouveau A", completed: false, details: ["nouveau A"] };
  const newS2 = { title: "Nouveau B", completed: false, details: ["nouveau B"] };
  const newS3 = { title: "Nouveau C", completed: false, details: ["nouveau C"] };
  const oldWeeks = [{ number: 1, sessions: [oldS1, oldS2, oldS3] }];
  const newWeeks = [{ number: 1, phase: "dev", sessions: [newS1, newS2, newS3] }];
  const merged = mergePreservingProgress(oldWeeks, newWeeks);
  assert(merged[0].sessions[0] === oldS1, "s1 same object");
  assert(merged[0].sessions[1] === oldS2, "s2 same object");
  assert(merged[0].sessions[2] === newS3, "s3 regenerated");
  assert(merged[0].sessions[2].title === "Nouveau C", "s3 new title");
  assert(merged[0].phase === "dev", "week metadata from new");
  console.log("merge validated+open PASS");
}

{
  const oldWeek = {
    number: 1,
    feedback: { rating: "good" },
    sessions: [{ title: "Old", completed: false }],
  };
  const newWeek = { number: 1, sessions: [{ title: "New", completed: false }] };
  const merged = mergePreservingProgress([oldWeek], [newWeek]);
  assert(merged[0] === oldWeek, "feedback keeps whole week");
  console.log("merge feedback week PASS");
}

{
  const oldWeek = {
    number: 1,
    satisfaction: 4,
    sessions: [{ title: "Old", completed: false }],
  };
  const newWeek = { number: 1, sessions: [{ title: "New" }] };
  const merged = mergePreservingProgress([oldWeek], [newWeek]);
  assert(merged[0] === oldWeek, "satisfaction keeps whole week");
  console.log("merge satisfaction week PASS");
}

{
  const oldWeek = {
    number: 1,
    sessions: [
      { title: "Done", completed: true },
      { title: "Open", completed: false },
    ],
  };
  const newWeek = {
    number: 1,
    sessions: [
      { title: "N1" },
      { title: "N2" },
      { title: "N3" },
    ],
  };
  const warnings = [];
  const orig = console.warn;
  console.warn = (...args) => { warnings.push(args.join(" ")); };
  let merged;
  try {
    merged = mergePreservingProgress([oldWeek], [newWeek]);
  } finally {
    console.warn = orig;
  }
  assert(merged[0] === oldWeek, "length mismatch + progress → keep old week");
  assert(warnings.some((w) => w.includes("structure incompatible")), "mismatch is logged");
  console.log("merge length mismatch fallback PASS");
}

{
  const oldWeek = { number: 1, sessions: [{ title: "Old", completed: false }] };
  const newWeek = { number: 1, sessions: [{ title: "N1" }, { title: "N2" }] };
  const orig = console.warn;
  console.warn = () => {};
  let merged;
  try {
    merged = mergePreservingProgress([oldWeek], [newWeek]);
  } finally {
    console.warn = orig;
  }
  assert(merged[0] === newWeek, "length mismatch without progress → new week");
  assert(shouldPreserveWeek(oldWeek) === false, "open week not preserved");
  console.log("merge length mismatch no progress PASS");
}

{
  const merged = mergePreservingProgress([], [{ sessions: [{ title: "New" }] }]);
  assert(merged[0].sessions[0].title === "New", "no old week → new");
  console.log("merge missing old week PASS");
}

console.log("\n✅ plan-progress-merge tests passed");
