/**
 * Stats nageur par période (semaine de plan / mois / année / total).
 * Attribution calendaire au lundi de semaine de plan via startDate, pas à une
 * date de validation (souvent absente).
 */
import { isSessionResolved } from "./plan-progress-merge.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const PERIODS = ["week", "month", "year", "total"];

export const PERIOD_META = {
  week: {
    chip: "Semaine",
    title: "Cette semaine",
    prevLabel: "vs la semaine d’avant",
  },
  month: {
    chip: "Mois",
    title: "Ce mois",
    prevLabel: "vs le mois d’avant",
  },
  year: {
    chip: "Année",
    title: "Cette année",
    prevLabel: "vs l’année d’avant",
  },
  total: {
    chip: "Total",
    title: "Depuis le début",
    prevLabel: null,
  },
};

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function parseMeters(distance) {
  const n = parseInt(String(distance || "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function sessionDoneMeters(session) {
  if (!session?.completed || session.skipped) return 0;
  return parseMeters(session.distance);
}

function summarizeSessions(sessions) {
  const list = sessions || [];
  return {
    plannedMeters: list.reduce((sum, session) => sum + parseMeters(session.distance), 0),
    doneMeters: list.reduce((sum, session) => sum + sessionDoneMeters(session), 0),
    plannedSessions: list.length,
    doneSessions: list.filter((session) => session?.completed && !session.skipped).length,
  };
}

const emptySum = () => ({
  doneMeters: 0,
  plannedMeters: 0,
  doneSessions: 0,
  plannedSessions: 0,
});

function sumBuckets(buckets, predicate) {
  return buckets.filter(predicate).reduce((acc, bucket) => ({
    doneMeters: acc.doneMeters + bucket.doneMeters,
    plannedMeters: acc.plannedMeters + bucket.plannedMeters,
    doneSessions: acc.doneSessions + bucket.doneSessions,
    plannedSessions: acc.plannedSessions + bucket.plannedSessions,
  }), emptySum());
}

function inCalendarMonth(ms, nowDate) {
  const date = new Date(ms);
  return date.getFullYear() === nowDate.getFullYear() && date.getMonth() === nowDate.getMonth();
}

function inCalendarYear(ms, nowDate) {
  return new Date(ms).getFullYear() === nowDate.getFullYear();
}

function inPreviousMonth(ms, nowDate) {
  const date = new Date(ms);
  const month = nowDate.getMonth();
  const year = nowDate.getFullYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
}

function isEmptyPeriod(sum) {
  return !sum || (sum.plannedSessions === 0 && sum.doneSessions === 0 && sum.doneMeters === 0);
}

function parseStartMs(plan, profile) {
  const raw = plan?.startDate ?? profile?.planStartedAt ?? profile?.createdAt;
  if (raw == null || raw === "") return NaN;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * @returns {Array<{
 *   index: number,
 *   startMs: number,
 *   isCurrent: boolean,
 *   plannedMeters: number,
 *   doneMeters: number,
 *   plannedSessions: number,
 *   doneSessions: number,
 * }>}
 */
export function collectWeekBuckets(plan, profile = {}, now = Date.now()) {
  if (!plan) return [];

  const perWeek = Math.max(1, Math.min(7, Number(profile.sessionsPerWeek) || 3));
  let weeks = [];

  if (plan.isSessionLoop) {
    const history = Array.isArray(plan.history) ? plan.history : [];
    const currentSessions = plan.weeks?.[0]?.sessions || [];
    const expanded = currentSessions.length > 1;

    if (expanded) {
      const histWeeks = [];
      for (let i = 0; i < history.length; i += perWeek) {
        histWeeks.push(history.slice(i, i + perWeek));
      }
      weeks = histWeeks.map((sessions, index) => ({ index, sessions, isCurrent: false }));
      weeks.push({
        index: histWeeks.length,
        sessions: currentSessions,
        isCurrent: true,
      });
    } else {
      const completeWeeks = Math.floor(history.length / perWeek);
      const remainder = history.slice(completeWeeks * perWeek);
      weeks = [];
      for (let i = 0; i < completeWeeks; i += 1) {
        weeks.push({
          index: i,
          sessions: history.slice(i * perWeek, (i + 1) * perWeek),
          isCurrent: false,
        });
      }
      weeks.push({
        index: completeWeeks,
        sessions: [...remainder, ...currentSessions],
        isCurrent: true,
      });
    }
  } else {
    const list = plan.weeks || [];
    if (!list.length) return [];
    let currentIdx = list.findIndex((week) => !(week.sessions || []).every(isSessionResolved));
    if (currentIdx < 0) currentIdx = Math.max(0, list.length - 1);
    weeks = list.map((week, index) => ({
      index,
      sessions: week.sessions || [],
      isCurrent: index === currentIdx,
    }));
  }

  const currentIndex = weeks.find((week) => week.isCurrent)?.index ?? 0;
  let startMs = parseStartMs(plan, profile);
  if (!Number.isFinite(startMs)) startMs = now - currentIndex * WEEK_MS;

  return weeks.map((week) => ({
    index: week.index,
    startMs: startMs + week.index * WEEK_MS,
    isCurrent: !!week.isCurrent,
    ...summarizeSessions(week.sessions),
  }));
}

export function formatKm(meters) {
  const n = Number(meters) || 0;
  if (n <= 0) return "0 km";
  if (n < 1000) return `${n} m`;
  return `${(n / 1000).toFixed(1)} km`;
}

export function formatDeltaLabel(deltaMeters, prevLabel) {
  if (deltaMeters == null || deltaMeters === 0 || !prevLabel) return null;
  const abs = Math.abs(deltaMeters);
  const amount = abs >= 1000 ? formatKm(abs) : `${abs} m`;
  const sign = deltaMeters > 0 ? "+" : "-";
  return `${sign}${amount} ${prevLabel}`;
}

function buildSparkline(buckets, period, nowDate) {
  if (period === "year" || period === "total") {
    const months = new Map();
    for (const bucket of buckets) {
      const date = new Date(bucket.startMs);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = months.get(key) || {
        key,
        label: MONTHS_SHORT[date.getMonth()],
        meters: 0,
        year: date.getFullYear(),
        month: date.getMonth(),
      };
      current.meters += bucket.doneMeters;
      months.set(key, current);
    }
    return [...months.values()].slice(-12).map((row) => ({
      key: row.key,
      label: row.label,
      meters: row.meters,
      active: period === "year" ? row.year === nowDate.getFullYear() : true,
    }));
  }

  return buckets.slice(-8).map((bucket) => ({
    key: `w${bucket.index}`,
    label: `S${bucket.index + 1}`,
    meters: bucket.doneMeters,
    active: period === "week" ? bucket.isCurrent : inCalendarMonth(bucket.startMs, nowDate),
  }));
}

/**
 * @returns {null | {
 *   period: string,
 *   title: string,
 *   chip: string,
 *   doneMeters: number,
 *   plannedMeters: number,
 *   doneSessions: number,
 *   plannedSessions: number,
 *   showPrescribed: boolean,
 *   isEmptyTarget: boolean,
 *   kmLabel: string,
 *   deltaLabel: string | null,
 *   sparkline: Array<{ key: string, label: string, meters: number, active: boolean }>,
 * }}
 */
export function buildPeriodAnalytics(plan, profile = {}, period = "week", now = Date.now()) {
  const key = PERIOD_META[period] ? period : "week";
  const meta = PERIOD_META[key];
  const buckets = collectWeekBuckets(plan, profile, now);
  if (!buckets.length) return null;

  const nowDate = new Date(now);
  const current = buckets.find((bucket) => bucket.isCurrent) || buckets[buckets.length - 1];

  let selected;
  let previous = null;

  if (key === "week") {
    selected = sumBuckets(buckets, (bucket) => bucket.index === current.index);
    const prevWeek = buckets.find((bucket) => bucket.index === current.index - 1);
    previous = prevWeek ? sumBuckets([prevWeek], () => true) : null;
  } else if (key === "month") {
    selected = sumBuckets(buckets, (bucket) => inCalendarMonth(bucket.startMs, nowDate));
    previous = sumBuckets(buckets, (bucket) => inPreviousMonth(bucket.startMs, nowDate));
    if (isEmptyPeriod(previous)) previous = null;
  } else if (key === "year") {
    selected = sumBuckets(buckets, (bucket) => inCalendarYear(bucket.startMs, nowDate));
    previous = sumBuckets(buckets, (bucket) => new Date(bucket.startMs).getFullYear() === nowDate.getFullYear() - 1);
    if (isEmptyPeriod(previous)) previous = null;
  } else {
    selected = sumBuckets(buckets, () => true);
  }

  const hasPrevSignal = previous && (previous.doneMeters > 0 || selected.doneMeters > 0);
  const deltaMeters = hasPrevSignal ? selected.doneMeters - previous.doneMeters : null;

  return {
    period: key,
    title: meta.title,
    chip: meta.chip,
    doneMeters: selected.doneMeters,
    plannedMeters: selected.plannedMeters,
    doneSessions: selected.doneSessions,
    plannedSessions: selected.plannedSessions,
    showPrescribed: key === "week",
    isEmptyTarget: key === "week" && selected.doneSessions === 0 && selected.plannedSessions > 0,
    kmLabel: formatKm(selected.doneMeters),
    deltaLabel: formatDeltaLabel(deltaMeters, meta.prevLabel),
    sparkline: buildSparkline(buckets, key, nowDate),
  };
}
