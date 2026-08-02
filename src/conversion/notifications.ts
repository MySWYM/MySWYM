/**
 * Notification copy bank — retention without dark patterns.
 * Wire to push / email / in-app later via Supabase + Edge Functions.
 */
export type NotificationKind =
  | 'session_reminder'
  | 'streak_protect'
  | 'week_complete'
  | 'comeback'
  | 'milestone'
  | 'soft_premium'
  | 'race_countdown'

export interface NotificationTemplate {
  id: NotificationKind
  title: string
  body: string
  /** Suggested trigger */
  when: string
  /** Retention goal */
  why: string
}

export const RETENTION_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'session_reminder',
    title: 'L’eau t’attend',
    body: 'Ta séance « {sessionTitle} » · ~{meters} m. 35 min et tu coches la case.',
    when: 'Jour planifié, 17h–19h selon fuseau',
    why: 'Ancrage habitude (Runna/Duolingo)',
  },
  {
    id: 'streak_protect',
    title: 'Ta série de {streak} jours',
    body: 'Encore une séance aujourd’hui pour la garder. Tu es si près.',
    when: 'Si streak ≥ 3 et pas de séance à 20h',
    why: 'Perte aversion douce — pas de culpabilisation',
  },
  {
    id: 'week_complete',
    title: 'Semaine {n} validée 💧',
    body: '{meters} m cette semaine. Semaine {n+1} est prête.',
    when: 'Après dernière séance de la semaine',
    why: 'Clôture positive + anticipation',
  },
  {
    id: 'comeback',
    title: 'On reprend ensemble ?',
    body: '3 jours sans nage — ta semaine {n} t’attend, sans jugement.',
    when: 'J+3 inactivité',
    why: 'Réactivation bienveillante',
  },
  {
    id: 'milestone',
    title: '{km} km nagés',
    body: 'Nouveau palier. Partage ta carte ou enchaîne la prochaine.',
    when: 'Badges 5 / 10 / 25 / 50 km',
    why: 'Dopamine progression + viralité',
  },
  {
    id: 'soft_premium',
    title: 'Ton plan continue après S4',
    body: 'Tu as {pct}% du chemin. Premium ouvre les {remaining} semaines restantes.',
    when: 'Fin semaine 3 ou 4, une fois / user',
    why: 'Conversion au pic de valeur perçue',
  },
  {
    id: 'race_countdown',
    title: 'J-{days} avant {event}',
    body: 'Cette semaine : focus {phase}. Tu es sur les rails.',
    when: 'Triathlon / OW / diplôme, hebdo',
    why: 'Urgence saine liée à un vrai objectif',
  },
]
