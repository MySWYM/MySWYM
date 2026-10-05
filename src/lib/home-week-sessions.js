/**
 * Séances de la semaine courante pour le carrousel Nager iOS.
 */
import i18n from "../i18n/index.js";
import { findNextSession, sessionCardModel } from "./plan-reveal.js";
import { isSessionResolved } from "./plan-progress-merge.js";
import {
  formatLoopSessionTitle,
  formatLoopWeekSessionTitle,
  loopSessionOrdinalIndex,
  withLoopSessionTitle,
} from "./swim-plan-bridge.js";

const TYPE_I18N = {
  ENDURANCE: "strava.focusEndurance",
  SEUIL: "strava.focusThreshold",
  VITESSE: "strava.focusSpeed",
  TECHNIQUE: "strava.focusTechnique",
  RECUPERATION: "strava.focusEasy",
  REPOS: "strava.focusEasy",
  TEST: "strava.focusThreshold",
};

const TYPE_COVERS = {
  ENDURANCE: [
    "/hero-pool.webp",
    "/session-covers/endurance-2.webp",
    "/session-covers/endurance-3.webp",
  ],
  SEUIL: ["/session-covers/seuil.webp"],
  VITESSE: ["/session-covers/vitesse.webp"],
  TECHNIQUE: ["/session-covers/technique.webp"],
  RECUPERATION: ["/session-covers/recup.webp"],
};

function allCoverSrcs() {
  return Object.values(TYPE_COVERS).flat();
}

const TYPE_ACCENT = {
  ENDURANCE: { bg: "blueLight", color: "blue" },
  SEUIL: { bg: "goldLight", color: "gold" },
  VITESSE: { bg: "coralLight", color: "coral" },
  TECHNIQUE: { bg: "waterLight", color: "water" },
  RECUPERATION: { bg: "mintLight", color: "mint" },
};

export function sessionTypeKey(type) {
  return String(type || "")
    .trim()
    .toUpperCase()
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[^A-Z]/g, "");
}

export function humanSessionType(type) {
  const key = sessionTypeKey(type);
  const i18nKey = TYPE_I18N[key];
  if (!i18nKey) return type ? String(type).trim() : "";
  const label = i18n.t(i18nKey, { ns: "app", defaultValue: "" });
  if (!label || label === i18nKey) return String(type).trim();
  return label.charAt(0).toLocaleUpperCase(i18n.language) + label.slice(1);
}

export function sessionCoverSrc(type, sessionIndex = 0) {
  const list = TYPE_COVERS[sessionTypeKey(type)] || TYPE_COVERS.ENDURANCE;
  const i = Math.abs(Number(sessionIndex) || 0);
  return list[i % list.length];
}

/** Évite deux cartes de la même semaine avec la même photo. */
export function uniquifyWeekCovers(cards) {
  if (!Array.isArray(cards) || cards.length < 2) return cards || [];
  const used = new Set();
  const bank = allCoverSrcs();
  return cards.map((card, i) => {
    let cover = card.cover || sessionCoverSrc(card.type, card.sessionIndex ?? i);
    if (used.has(cover)) {
      const alt = bank.find((src) => !used.has(src));
      if (alt) cover = alt;
    }
    used.add(cover);
    return { ...card, cover };
  });
}

export function sessionTypeAccent(type, palette) {
  const spec = TYPE_ACCENT[sessionTypeKey(type)] || TYPE_ACCENT.ENDURANCE;
  if (!palette) return spec;
  return { bg: palette[spec.bg], color: palette[spec.color] };
}

function toCard({ weekIndex, sessionIndex, session, title, resolved }) {
  const preview = sessionCardModel(session);
  const typeLabel = humanSessionType(session?.type);
  const line = [typeLabel, preview.distanceLabel].filter(Boolean).join(" · ");
  return {
    key: `${weekIndex}-${sessionIndex}`,
    weekIndex,
    sessionIndex,
    session,
    title,
    line,
    cover: sessionCoverSrc(session?.type, sessionIndex),
    resolved,
    type: session?.type || "",
  };
}

/** Cartes de la semaine en cours (ou dernière si tout est fait). */
export function currentWeekSessionCards(plan) {
  const weeks = plan?.weeks;
  if (!Array.isArray(weeks) || weeks.length === 0) return [];

  if (plan.isSessionLoop) {
    const sessions = weeks[0]?.sessions || [];
    if (!sessions.length) return [];
    const histLen = loopSessionOrdinalIndex(plan);
    if (sessions.length === 1) {
      const next = findNextSession(plan);
      const raw = sessions[next?.sessionIndex ?? 0] || sessions[0];
      const ordinal = next?.resolved ? Math.max(0, histLen - 1) : histLen;
      return uniquifyWeekCovers([
        toCard({
          weekIndex: 0,
          sessionIndex: next?.sessionIndex ?? 0,
          session: withLoopSessionTitle(raw, ordinal),
          title: formatLoopSessionTitle(ordinal),
          resolved: !!(next?.resolved || isSessionResolved(raw)),
        }),
      ]);
    }
    return uniquifyWeekCovers(
      sessions.map((session, i) =>
        toCard({
          weekIndex: 0,
          sessionIndex: i,
          session,
          title: formatLoopWeekSessionTitle(i),
          resolved: isSessionResolved(session),
        }),
      ),
    );
  }

  const openWeek = weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved));
  const weekIndex = openWeek < 0 ? weeks.length - 1 : openWeek;
  const sessions = weeks[weekIndex]?.sessions || [];
  return uniquifyWeekCovers(
    sessions.map((session, i) =>
      toCard({
        weekIndex,
        sessionIndex: i,
        session,
        title: formatLoopWeekSessionTitle(i),
        resolved: isSessionResolved(session),
      }),
    ),
  );
}

export function initialWeekCardIndex(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return 0;
  const open = cards.findIndex((c) => !c.resolved);
  return open >= 0 ? open : cards.length - 1;
}
