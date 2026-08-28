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
  it("returns a single session for triathlon", async () => {
    const { week, session, focus } = await buildProgressionLoopSession(
      { goal: "triathlon_sprint", category: "triathlon", level: "sportif", pool: 25, sessionsPerWeek: 3 },
      0,
      true,
    );
    assert.equal(week.sessions.length, 1);
    assert.ok(session.details?.length > 0);
    assert.equal(session.title, "Séance n°1");
    assert.equal(focus, "Séance n°1");
  });

  it("returns eau libre oriented first sessions", async () => {
    const { focus, session } = await buildProgressionLoopSession(
      { goal: "open_water_1k", category: "eau_libre", level: "régulier", pool: 50 },
      0,
      false,
    );
    assert.equal(focus, "Séance n°1");
    assert.equal(session.title, "Séance n°1");
    assert.ok(session.distance);
  });

  it("returns diplôme exam content after easy phase", async () => {
    const { session, focus } = await buildProgressionLoopSession(
      { goal: "bnssa", category: "diplome", level: "sportif", pool: 25 },
      3,
      true,
      { ordinalIndex: 0 },
    );
    assert.ok(session.details.some((l) => /apnée|remorquage|palmes|mannequin/i.test(l)));
    assert.equal(focus, "Séance n°1");
    assert.equal(session.title, "Séance n°1");
  });

  it("increments Séance n° with validations (ordinal), not variety cursor", async () => {
    const a = await buildProgressionLoopSession(
      { goal: "progression", category: "progression", level: "régulier", pool: 25 },
      6,
      false,
      { ordinalIndex: 0 },
    );
    const b = await buildProgressionLoopSession(
      { goal: "progression", category: "progression", level: "régulier", pool: 25 },
      7,
      false,
      { ordinalIndex: 1 },
    );
    assert.equal(a.session.title, "Séance n°1");
    assert.equal(b.session.title, "Séance n°2");
  });

  it("buildProgressionLoopWeek fills sessionsPerWeek slots", async () => {
    const { buildProgressionLoopWeek, effectiveLoopSessionsPerWeek } = await import("./swim-plan-bridge.js");
    assert.equal(
      effectiveLoopSessionsPerWeek({
        goal: "triathlon_sprint",
        sessionsPerWeek: 4,
        eventDate: "2026-08-30",
      }, { now: new Date("2026-08-26") }),
      2,
    );
    const { week } = await buildProgressionLoopWeek(
      { goal: "progression", category: "progression", level: "régulier", pool: 25, sessionsPerWeek: 3 },
      0,
      false,
      { ordinalIndex: 0, history: [] },
    );
    assert.equal(week.sessions.length, 3);
    assert.equal(week.sessions[0].title, "Séance 1");
    assert.equal(week.sessions[2].title, "Séance 3");
  });

  it("formatLoopSessionTitle mirrors ordinal index", async () => {
    const { formatLoopSessionTitle, loopSessionOrdinalIndex } = await import("./swim-plan-bridge.js");
    assert.equal(formatLoopSessionTitle(0), "Séance n°1");
    assert.equal(formatLoopSessionTitle(7), "Séance n°8");
    assert.equal(loopSessionOrdinalIndex({ isSessionLoop: true, history: [] }), 0);
    assert.equal(loopSessionOrdinalIndex({ isSessionLoop: true, history: [{}, {}] }), 2);
  });

  it("rotates variants so consecutive cursors differ", async () => {
    const a = await buildProgressionLoopSession(
      { goal: "triathlon_olympic", category: "triathlon", level: "sportif", pool: 50 },
      3,
      true,
      { ordinalIndex: 0 },
    );
    const b = await buildProgressionLoopSession(
      { goal: "triathlon_olympic", category: "triathlon", level: "sportif", pool: 50 },
      4,
      true,
      { ordinalIndex: 0 },
    );
    assert.notEqual(a.session.loopVariant, b.session.loopVariant);
    assert.equal(a.session.title, "Séance n°1");
    assert.equal(b.session.title, "Séance n°1");
  });

  it("long open water prefers a continuous block after easy phase", async () => {
    const { session } = await buildProgressionLoopSession(
      { goal: "open_water_long", category: "eau_libre", level: "sportif", pool: 25 },
      3,
      true,
    );
    assert.equal(session.loopVariant, "ow_long");
  });

  it("maps legacy 25k to the long-oriented loop", async () => {
    const { session } = await buildProgressionLoopSession(
      { goal: "open_water_25k", category: "eau_libre", level: "sportif", pool: 25 },
      3,
      true,
    );
    assert.equal(session.loopVariant, "ow_long");
  });

  it("triathlon XS prefers start work after easy phase", async () => {
    const { session } = await buildProgressionLoopSession(
      { goal: "triathlon_xs", category: "triathlon", level: "sportif", pool: 25 },
      3,
      true,
    );
    assert.equal(session.loopVariant, "tri_start");
  });

  it("triathlon Full prefers aero after easy phase", async () => {
    const { session } = await buildProgressionLoopSession(
      { goal: "triathlon_ironman", category: "triathlon", level: "sportif", pool: 25 },
      3,
      true,
    );
    assert.equal(session.loopVariant, "tri_aero");
  });
});
