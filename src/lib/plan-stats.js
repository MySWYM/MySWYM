/**
 * Stats plan + badges.
 */
import {
  Droplets, Ruler, Waves, Flame, Star, Zap, Target, TrendingUp, Trophy,
} from "lucide-react";
import { G } from "../theme/palette.js";
import { isSessionResolved } from "./plan-progress-merge.js";

export const BADGE_DEFS = [
  { id: "km1",    group: "km",       target: 1000,   label: "1 km",        desc: "1 000 m au compteur",           icon: Ruler,     color: G.blue },
  { id: "km5",    group: "km",       target: 5000,   label: "5 km",        desc: "5 000 m parcourus",             icon: Waves,     color: G.blueDeep },
  { id: "km10",   group: "km",       target: 10000,  label: "10 km",       desc: "10 000 m",                      icon: Waves,     color: G.purple },
  { id: "km25",   group: "km",       target: 25000,  label: "25 km",       desc: "25 000 m",                      icon: Waves,     color: G.blue },
  { id: "km50",   group: "km",       target: 50000,  label: "50 km",       desc: "50 000 m",                      icon: Trophy,    color: G.gold },
  { id: "km100",  group: "km",       target: 100000, label: "100 km",      desc: "100 000 m",                     icon: Trophy,    color: G.gold },
  { id: "km250",  group: "km",       target: 250000, label: "250 km",      desc: "250 000 m",                     icon: Trophy,    color: G.gold },
  { id: "sess10", group: "sessions", target: 10,     label: "10 séances",  desc: "10 séances complétées",         icon: Droplets,  color: G.water },
  { id: "sess25", group: "sessions", target: 25,     label: "25 séances",  desc: "25 séances complétées",         icon: Droplets,  color: G.blue },
  { id: "sess50", group: "sessions", target: 50,     label: "50 séances",  desc: "50 séances complétées",         icon: Star,      color: G.gold },
  { id: "sess100",group: "sessions", target: 100,    label: "100 séances", desc: "100 séances complétées",        icon: Trophy,    color: G.gold },
  { id: "streak3", group: "streak",  target: 3,      label: "Série 3",     desc: "3 séances d'affilée",           icon: Flame,     color: G.coral },
  { id: "streak7", group: "streak",  target: 7,      label: "Série 7",     desc: "7 séances d'affilée",           icon: Flame,     color: G.coral },
  { id: "streak14",group: "streak",  target: 14,     label: "Série 14",    desc: "14 séances d'affilée",          icon: Flame,     color: G.gold },
  { id: "first_session", group: "flavor", target: 1, label: "Premier plongeon", desc: "1re séance complétée",     icon: Droplets,  color: G.water },
  { id: "week_perfect",  group: "flavor", target: 1, label: "Semaine parfaite", desc: "Toutes les séances d'une semaine", icon: Star, color: G.gold },
  { id: "speed_demon",   group: "flavor", target: 1, label: "Flash aquatique", desc: "1re séance de vitesse",    icon: Zap,       color: G.coral },
  { id: "technique_pro", group: "flavor", target: 3, label: "Maître technicien", desc: "3 séances de technique", icon: Target,    color: G.mint },
  { id: "halfway",       group: "flavor", target: 0, label: "À mi-chemin", desc: "50 % du plan complété",         icon: TrendingUp, color: G.blueMid },
  { id: "finisher",      group: "flavor", target: 0, label: "Finisher",    desc: "Plan 100 % bouclé",             icon: Trophy,    color: G.gold },
];

export function computeStats(plan)  {
  const empty = {
    totalSessions: 0, totalMeters: 0, streak: 0, currentStreak: 0,
    perfectWeeks: 0, speedSessions: 0, techniqueSessions: 0, planTotal: 0, weeklyData: [],
  };
  if (!plan?.weeks) return empty;
  let totalSessions = 0, totalMeters = 0, currentStreak = 0, maxStreak = 0, perfectWeeks = 0, speedSessions = 0, techniqueSessions = 0;
  if (plan.isSessionLoop) {
    const hist = plan.history || [];
    hist.forEach((s) => {
      if (s.completed) {
        totalSessions++;
        totalMeters += parseInt(s.distance, 10) || 0;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        if (s.type === "VITESSE") speedSessions++;
        if (s.type === "TECHNIQUE") techniqueSessions++;
      } else {
        currentStreak = 0;
      }
    });
    const cur = plan.weeks?.[0]?.sessions?.[0];
    if (cur?.completed) {
      totalSessions++;
      totalMeters += parseInt(cur.distance, 10) || 0;
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    return {
      totalSessions,
      totalMeters,
      streak: maxStreak,
      currentStreak,
      perfectWeeks: 0,
      speedSessions,
      techniqueSessions,
      planTotal: Math.max(totalSessions + (cur && !isSessionResolved(cur) ? 1 : 0), 1),
      weeklyData: [],
    };
  }
  const planTotal = plan.weeks.reduce((a, w) => a + w.sessions.length, 0);
  const weeklyData = plan.weeks.map(w => ({
    label: `S${w.number}`,
    done: w.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
    total: w.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
  }));
  plan.weeks.forEach(week => {
    if (week.sessions.length > 0 && week.sessions.every(s => s.completed && !s.skipped)) perfectWeeks++;
    week.sessions.forEach(s => {
      if (s.completed) {
        totalSessions++; totalMeters += parseInt(s.distance) || 0; currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        if (s.type === "VITESSE") speedSessions++;
        if (s.type === "TECHNIQUE") techniqueSessions++;
      } else { currentStreak = 0; }
    });
  });
  return {
    totalSessions, totalMeters, streak: maxStreak, currentStreak,
    perfectWeeks, speedSessions, techniqueSessions, planTotal, weeklyData,
  };
};

export function isBadgeEarned(def, stats) {
  if (!def || !stats) return false;
  if (def.group === "km") return (stats.totalMeters || 0) >= def.target;
  if (def.group === "sessions") return (stats.totalSessions || 0) >= def.target;
  if (def.group === "streak") return (stats.streak || 0) >= def.target;
  if (def.id === "first_session") return (stats.totalSessions || 0) >= 1;
  if (def.id === "week_perfect") return (stats.perfectWeeks || 0) >= 1;
  if (def.id === "speed_demon") return (stats.speedSessions || 0) >= 1;
  if (def.id === "technique_pro") return (stats.techniqueSessions || 0) >= 3;
  if (def.id === "halfway") {
    return stats.planTotal > 0 && stats.totalSessions >= stats.planTotal / 2;
  }
  if (def.id === "finisher") {
    return stats.planTotal > 0 && stats.totalSessions >= stats.planTotal;
  }
  return false;
}

export function checkBadges(stats)  {
  return BADGE_DEFS.filter((def) => isBadgeEarned(def, stats)).map((def) => def.id);
};
