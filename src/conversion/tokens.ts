/** Design tokens — mySWYM Conversion UX (Apple HIG inspired) */
export const tokens = {
  color: {
    bg: '#f5f7fb',
    elevated: '#ffffff',
    ink: '#0f1419',
    secondary: '#5b6570',
    tertiary: '#8b95a1',
    blue: '#355da3',
    blueDeep: '#154388',
    blueMid: '#5b82c4',
    blueSoft: '#e8effc',
    blueGlow: '#d0ddf7',
    mint: '#1aad7a',
    mintSoft: '#e6f8f1',
    coral: '#e85d4c',
    gold: '#d4a017',
    goldSoft: '#fbf3dc',
    border: 'rgba(15, 20, 25, 0.08)',
    overlay: 'rgba(15, 20, 25, 0.45)',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  type: {
    /** Display — Barlow Condensed */
    hero: { size: 40, line: 1.05, weight: 600 },
    title1: { size: 32, line: 1.1, weight: 600 },
    title2: { size: 24, line: 1.15, weight: 600 },
    title3: { size: 20, line: 1.2, weight: 600 },
    /** Body — Lexend */
    body: { size: 16, line: 1.5, weight: 400 },
    callout: { size: 15, line: 1.45, weight: 500 },
    footnote: { size: 13, line: 1.4, weight: 400 },
    caption: { size: 11, line: 1.35, weight: 600 },
  },
  freemium: {
    /** Habit formation window — Duolingo/Runna pattern */
    freeWeeks: 4,
    /** Allow real training habit (was 2 — too crippling) */
    freeFreqMax: 3,
    softPaywallAfterSessions: 1,
    hardPaywallAtWeek: 5,
  },
  pricing: {
    monthly: { label: '4,99 €', period: '/ mois' },
    annual: { label: '29,99 €', period: '/ an', perMonth: '2,50 €' },
    biennial: { label: '29,99 €', period: '/ 2 ans' },
  },
} as const

export type GoalId = 'progress' | 'triathlon' | 'openwater' | 'diploma'
export type LevelId = 'decouverte' | 'regulier' | 'sportif' | 'performance'
export type PoolId = 25 | 50

export interface OnboardingState {
  goal: GoalId | null
  subGoal: string | null
  level: LevelId | null
  pool: PoolId
  frequency: number
  eventDate: string | null
  firstName: string
}

export const GOALS: { id: GoalId; title: string; subtitle: string }[] = [
  { id: 'progress', title: 'Nager & progresser', subtitle: 'Technique, endurance, plaisir' },
  { id: 'triathlon', title: 'Triathlon', subtitle: 'De la piscine au jour J' },
  { id: 'openwater', title: 'Eau libre', subtitle: 'Lacs, mer, sighting' },
  { id: 'diploma', title: 'Prépa diplôme', subtitle: 'BNSSA, BPJEPS, pompiers' },
]

export const LEVELS: { id: LevelId; title: string; subtitle: string }[] = [
  { id: 'decouverte', title: 'Découverte', subtitle: 'Je débute ou reprends' },
  { id: 'regulier', title: 'Régulier', subtitle: '1–2× / semaine déjà' },
  { id: 'sportif', title: 'Sportif', subtitle: 'Je m’entraîne sérieusement' },
  { id: 'performance', title: 'Performance', subtitle: 'Je vise un chrono / un chrono' },
]

export const FREE_FEATURES = [
  '4 semaines de plan personnalisé',
  'Jusqu’à 3 séances / semaine',
  'Suivi, badges et séries',
  'Retours après chaque séance',
] as const

export const PREMIUM_FEATURES = [
  'Plan complet jusqu’à ton événement',
  'Jusqu’à 5 séances / semaine',
  'Allures cibles à la seconde (D…)',
  'Ajustement auto selon tes retours',
  'Multi-plans · partage · vidéos technique',
] as const
