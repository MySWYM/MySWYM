/** Design tokens — mySWYM Conversion UX (Apple HIG inspired) */
export const tokens = {
  color: {
    bg: '#000514',
    elevated: '#06101f',
    ink: '#f4f8fa',
    secondary: '#9bb0c8',
    tertiary: '#6b7c90',
    blue: '#006bfd',
    blueDeep: '#3d8fff',
    blueMid: '#3d8fff',
    blueSoft: '#0a162c',
    blueGlow: 'rgba(0, 107, 253, 0.22)',
    mint: '#1aad7a',
    mintSoft: '#e6f8f1',
    coral: '#e85d4c',
    gold: '#d4a017',
    goldSoft: '#fbf3dc',
    border: 'rgba(0, 107, 253, 0.22)',
    overlay: 'rgba(0, 5, 20, 0.55)',
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
    trialDays: 7,
    freeWeeks: 0,
    freeFreqMax: 5,
    softPaywallAfterSessions: 1,
    hardPaywallAtWeek: 0,
    trialRequiresCard: false,
  },
  pricing: {
    monthly: { label: '4,99 €', period: '/ mois', trialNote: '7 jours offerts · sans carte' },
    annual: { label: '39,99 €', period: '/ an', perMonth: '3,33 €' },
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
  'Après 7 jours, l’app est gelée',
  'Plus aucun plan ni séance visible',
  'Abonnement requis pour tout revoir',
] as const

export const PREMIUM_FEATURES = [
  'Coach personnel et programme adaptatif',
  'Allures T100 et projection de progression',
  'Adaptation après chaque feedback',
  'Strava, badges, adaptation et stats',
  'Toutes les futures nouveautés Premium incluses',
] as const
