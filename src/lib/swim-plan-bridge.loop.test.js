import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  usesSessionLoop,
  buildProgressionLoopSession,
} from "./swim-plan-bridge.js";

describe("usesSessionLoop", () => {
  it("covers progression, triathlon, eau libre and diplôme", () => {
    assert.equal(usesSessionLoop({ goal: "progression", category: "progression" }), true);
    assert.equal(usesSessionLoop({ goal: "triathlon_olympic", category: "triathlon" }), true);
    assert.equal(usesSessionLoop({ goal: "open_water_5k", category: "eau_libre" }), true);
    assert.equal(usesSessionLoop({ goal: "bnssa", category: "diplome" }), true);
    assert.equal(usesSessionLoop({ goal: "bpjeps_aan", category: "diplome" }), true);
    assert.equal(usesSessionLoop({ goal: "tests_pompiers" }), true);
  });

  it("keeps wellness / maître on multi-week plans", () => {
    assert.equal(usesSessionLoop({ goal: "reprendre", category: "progression" }), false);
    assert.equal(usesSessionLoop({ goal: "reprendre" }), false);
    assert.equal(usesSessionLoop({ goal: "perte_de_poids" }), false);
    assert.equal(usesSessionLoop({ goal: "competition_maitre" }), false);
  });
});

describe("buildProgressionLoopSession families", () => {
  it("returns a single session for triathlon", () => {
    const { week, session, focus } = buildProgressionLoopSession(
      { goal: "triathlon_sprint", category: "triathlon", level: "sportif", pool: 25, sessionsPerWeek: 3 },
      0,
      true,
    );
    assert.equal(week.sessions.length, 1);
    assert.ok(session.details?.length > 0);
    assert.ok(focus);
    assert.ok(/triathlon|douce|Sensations|Technique/i.test(focus));
  });

  it("returns eau libre oriented first sessions", () => {
    const { focus, session } = buildProgressionLoopSession(
      { goal: "open_water_1k", category: "eau_libre", level: "régulier", pool: 50 },
      0,
      false,
    );
    assert.ok(/eau libre|douce|Technique|Endurance|Sensations/i.test(focus));
    assert.ok(session.distance);
  });

  it("returns diplôme exam content after easy phase", () => {
    const { session, focus } = buildProgressionLoopSession(
      { goal: "bnssa", category: "diplome", level: "sportif", pool: 25 },
      3,
      true,
    );
    assert.ok(session.details.some((l) => /apnée|remorquage|palmes|mannequin/i.test(l)));
    assert.ok(focus);
  });

  it("shows Jour J when event date is today or past", () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    const { session, focus } = buildProgressionLoopSession(
      {
        goal: "triathlon_sprint",
        category: "triathlon",
        level: "sportif",
        pool: 25,
        eventDate: iso,
        raceDayCompleted: false,
      },
      5,
      true,
    );
    assert.equal(session.type, "RACE");
    assert.equal(session.isRaceDay, true);
    assert.equal(focus, "Jour J");
  });

  it("does not repeat Jour J after it is completed", () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    const { session } = buildProgressionLoopSession(
      {
        goal: "triathlon_sprint",
        category: "triathlon",
        level: "sportif",
        pool: 25,
        eventDate: iso,
        raceDayCompleted: true,
      },
      5,
      true,
    );
    assert.notEqual(session.type, "RACE");
  });
});
