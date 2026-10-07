/**
 * Merge de progression au niveau séance (hotfix persistance 2026-08-15).
 * Usage : node src/lib/plan-progress-merge.test.js
 */
import {
  isSessionResolved,
  shouldPreserveWeek,
  mergePreservingProgress,
  planProgressScore,
  loopSessionNeedsAdvance,
  loopSessionKey,
  isInLoopHistory,
  dedupeLoopHistory,
} from "./plan-progress-merge.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

{
  // Celia : même séance en semaine (« Séance 1 ») et en historique (« Séance n°9 »)
  const week = { title: "Séance 1", distance: "1500m", completed: true, completedAt: "2026-10-07T10:00:00.000Z", sheetMeta: { familyId: "01", n: 82 } };
  const hist = [{ ...week, title: "Séance n°9", archivedAt: "2026-10-07T10:00:01.000Z" }];
  assert(isInLoopHistory(hist, week), "séance validée reconnue malgré un titre différent");
  assert(!isInLoopHistory(hist, { ...week, completedAt: "2026-10-09T10:00:00.000Z" }), "autre validation du même contenu = autre séance");
  const withId = { ...week, loopId: "abc" };
  assert(loopSessionKey(withId) === "id:abc", "loopId prioritaire");
  assert(isInLoopHistory([{ ...withId, title: "Séance n°3" }], withId), "loopId reconnu");

  const done = (n, at, ref) => ({ title: `Séance n°${n}`, distance: "1500m", completed: true, completedAt: at, sheetMeta: { familyId: "01", n: ref } });
  const dirty = [
    done(5, "2026-10-01T10:00:00.000Z", 42), { ...done(6, "2026-10-01T10:00:00.000Z", 42), title: "Séance 1" },
    done(7, "2026-10-03T10:00:00.000Z", 91), done(8, "2026-10-03T10:00:00.000Z", 91),
    done(9, "2026-10-05T10:00:00.000Z", 82), done(10, "2026-10-05T10:00:00.000Z", 82),
  ];
  const clean = dedupeLoopHistory(dirty);
  assert(clean.length === 3, `doublons retirés (${clean.length})`);
  assert(clean.map((s) => s.sheetMeta.n).join(",") === "42,91,82", "ordre gardé");
  assert(dedupeLoopHistory(clean) === clean, "rien à retirer : même référence");

  const skip = (at) => ({ title: "x", distance: "1500m", skipped: "missed", archivedAt: at, sheetMeta: { familyId: "01", n: 12 } });
  assert(dedupeLoopHistory([skip("2026-10-01T10:00:00.000Z"), skip("2026-10-01T10:00:02.000Z")]).length === 1, "séance manquée archivée 2× à la suite");
  assert(dedupeLoopHistory([skip("2026-10-01T10:00:00.000Z"), skip("2026-10-20T10:00:00.000Z")]).length === 2, "même ligne manquée 3 semaines plus tard = 2 séances");

  const plan = { isSessionLoop: true, sessionCursor: 9, history: dirty, weeks: [{ sessions: [] }] };
  assert(planProgressScore({ plan }) === 9 * 1000 + 3 * 10, "score sur l'historique dédoublonné");
  console.log("loop history dedupe PASS");
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

{
  const classic = {
    plan: {
      weeks: [{ sessions: [{ completed: true }, { completed: false }] }],
    },
  };
  assert(planProgressScore(classic) === 1, "classic weeks only");
  assert(planProgressScore({ plan: null }) === 0, "no plan");
  console.log("planProgressScore classic PASS");
}

{
  const stuck = {
    plan: {
      isSessionLoop: true,
      sessionCursor: 0,
      history: [],
      weeks: [{ sessions: [{ title: "A", distance: "1500m", completed: true }] }],
    },
  };
  const advanced = {
    plan: {
      isSessionLoop: true,
      sessionCursor: 1,
      history: [{ title: "A", distance: "1500m", completed: true }],
      weeks: [{ sessions: [{ title: "B", distance: "1600m", completed: false }] }],
    },
  };
  assert(planProgressScore(stuck) === 1, "stuck = current resolved only");
  assert(planProgressScore(advanced) === 1010, "advanced = cursor 1 + hist 1");
  assert(planProgressScore(advanced) > planProgressScore(stuck), "advanced beats stuck on merge");
  assert(loopSessionNeedsAdvance(stuck.plan) === true, "stuck needs advance");
  assert(loopSessionNeedsAdvance(advanced.plan) === false, "open next session does not");
  console.log("planProgressScore loop stuck vs advanced PASS");
}

console.log("\n✅ plan-progress-merge tests passed");
