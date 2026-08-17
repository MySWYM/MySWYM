import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPlanPhases,
  withPostRacePhases,
  POST_RACE_PHASES,
} from "./plan-phases.js";
import { isRaceDaySession, buildRaceDaySession } from "../taper-load.js";
import { buildCompetitionSessions } from "../../swim-plan-bridge.js";

describe("post-race phases", () => {
  it("appends récup + reprise after competition without stealing pre-race weeks", () => {
    const base = buildPlanPhases(8);
    assert.equal(base.at(-1).phase, "competition");
    const withPost = withPostRacePhases(base);
    assert.equal(withPost.length, base.length + POST_RACE_PHASES.length);
    assert.equal(withPost[base.length - 1].phase, "competition");
    assert.equal(withPost.at(-2).isPostRace, true);
    assert.equal(withPost.at(-1).isPostRace, true);
  });

  it("is idempotent", () => {
    const once = withPostRacePhases(buildPlanPhases(6));
    const twice = withPostRacePhases(once);
    assert.equal(twice.length, once.length);
  });
});

describe("race day session", () => {
  it("is a celebration warmup, not training volume", () => {
    const s = buildRaceDaySession({ pool: 25, raceTarget: { distance: 400, stroke: "crawl" } });
    assert.equal(isRaceDaySession(s), true);
    assert.equal(s.trainingDistance, 0);
    assert.equal(s.volumeFromSets, 0);
    assert.match(s.distance, /800m/);
    assert.ok(s.details.some((d) => /nage facile/i.test(d)));
    assert.ok(!s.details.some((d) => /\bZ1\b|souple/i.test(d)));
  });

  it("uses last competition slot as Jour J", () => {
    const sessions = buildCompetitionSessions(50, 2, 8, "Semaine de compétition", true);
    assert.equal(sessions.length, 2);
    assert.equal(isRaceDaySession(sessions[0]), false);
    assert.equal(isRaceDaySession(sessions[1]), true);
    assert.equal(sessions[1].title, "Jour J");
  });
});
