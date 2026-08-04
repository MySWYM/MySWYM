import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GoalId, LevelId, OnboardingState, PoolId } from './tokens'
import { tokens } from './tokens'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { GoalScreen } from './screens/GoalScreen'
import { LevelScreen } from './screens/LevelScreen'
import { FrequencyScreen } from './screens/FrequencyScreen'
import { PlanRevealScreen } from './screens/PlanRevealScreen'
import { FirstSessionPreview } from './screens/FirstSessionPreview'
import { HomeHabitScreen } from './screens/HomeHabitScreen'
import { SoftPaywall } from './screens/SoftPaywall'
import { HardPaywall } from './screens/HardPaywall'
import { SessionCompleteCelebration } from './screens/SessionCompleteCelebration'
import { ShareProgressCard } from './screens/ShareProgressCard'
import { ProgressStats } from './screens/ProgressStats'
import './conversion.css'

type Step =
  | 'welcome'
  | 'goal'
  | 'level'
  | 'frequency'
  | 'reveal'
  | 'first_session'
  | 'home'
  | 'hard_paywall'
  | 'stats'

const ONBOARDING_TOTAL = 3

const DEMO_SESSIONS = [
  { id: 's1', title: 'Pose les bases', meters: 1100, done: false },
  { id: 's2', title: 'Endurance douce', meters: 1400, done: false },
  { id: 's3', title: 'Technique crawl', meters: 1200, done: false },
]

/**
 * Prototype interactif du parcours conversion mySWYM.
 * Route: /prototype/conversion
 *
 * Ne remplace pas encore App.jsx — sert de référence produit + UI à brancher.
 */
export function ConversionFlow() {
  const [step, setStep] = useState<Step>('welcome')
  const [state, setState] = useState<OnboardingState>({
    goal: null,
    subGoal: null,
    level: null,
    pool: 25,
    frequency: 3,
    eventDate: null,
    firstName: '',
  })
  const [sessions, setSessions] = useState(DEMO_SESSIONS)
  const [streak, setStreak] = useState(0)
  const [weekMeters, setWeekMeters] = useState(0)
  const [showSoftPaywall, setShowSoftPaywall] = useState(false)
  const [softContext, setSoftContext] = useState<'after_first_session' | 'streak' | 'week_unlock' | 'generic'>('generic')
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastMeters, setLastMeters] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  const totalWeeks = useMemo(() => {
    if (state.goal === 'progress') return 12
    return 16
  }, [state.goal])

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }))

  const completeSession = (id: string) => {
    const session = sessions.find((s) => s.id === id)
    if (!session || session.done) return
    setSessions((list) => list.map((s) => (s.id === id ? { ...s, done: true } : s)))
    setWeekMeters((m) => m + session.meters)
    setStreak((n) => n + 1)
    setLastMeters(session.meters)
    setCompletedCount((c) => c + 1)
    setShowCelebration(true)
  }

  const afterCelebration = () => {
    setShowCelebration(false)
    // Soft paywall after first validated session — value already felt
    if (completedCount === 1) {
      setSoftContext('after_first_session')
      setShowSoftPaywall(true)
    }
  }

  return (
    <div className="cv-root">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 'welcome' && (
            <WelcomeScreen
              onStart={() => setStep('goal')}
              onSignIn={() => {
                window.location.href = '/connexion'
              }}
            />
          )}

          {step === 'goal' && (
            <GoalScreen
              step={1}
              total={ONBOARDING_TOTAL}
              value={state.goal}
              onChange={(goal: GoalId) => patch({ goal })}
              onBack={() => setStep('welcome')}
              onNext={() => setStep('level')}
            />
          )}

          {step === 'level' && (
            <LevelScreen
              step={2}
              total={ONBOARDING_TOTAL}
              level={state.level}
              pool={state.pool}
              onLevel={(level: LevelId) => patch({ level })}
              onPool={(pool: PoolId) => patch({ pool })}
              onBack={() => setStep('goal')}
              onNext={() => setStep('frequency')}
            />
          )}

          {step === 'frequency' && (
            <FrequencyScreen
              step={3}
              total={ONBOARDING_TOTAL}
              value={state.frequency}
              onChange={(frequency) => patch({ frequency })}
              onBack={() => setStep('level')}
              onNext={() => setStep('reveal')}
            />
          )}

          {step === 'reveal' && state.goal && state.level && (
            <PlanRevealScreen
              goal={state.goal}
              level={state.level}
              frequency={Math.min(state.frequency, tokens.freemium.freeFreqMax)}
              totalWeeks={totalWeeks}
              onContinue={() => setStep('first_session')}
            />
          )}

          {step === 'first_session' && (
            <FirstSessionPreview
              onStart={() => {
                completeSession('s1')
                setStep('home')
              }}
              onLater={() => setStep('home')}
            />
          )}

          {step === 'home' && (
            <div>
              <HomeHabitScreen
                streak={streak}
                weekMeters={weekMeters}
                weekGoalMeters={3700}
                weekNumber={1}
                sessions={sessions}
                showLockedPreview
                onOpenSession={completeSession}
                onUpgrade={() => {
                  setSoftContext('week_unlock')
                  setShowSoftPaywall(true)
                }}
              />
              <div className="cv:mx-auto cv:max-w-lg cv:space-y-6 cv:px-5 cv:pb-10">
                <ShareProgressCard
                  meters={weekMeters || 2400}
                  weeksCompleted={0}
                  streak={streak || 1}
                  goalLabel={state.goal === 'triathlon' ? 'Triathlon' : 'Nager & progresser'}
                  onShare={() => {
                    if (navigator.share) {
                      void navigator.share({
                        title: 'mySWYM',
                        text: `Je progresse avec mySWYM — ${weekMeters} m cette semaine.`,
                        url: 'https://myswym.app',
                      })
                    }
                  }}
                />
                <button
                  type="button"
                  className="cv:w-full cv:text-center cv:text-[12px] cv:font-medium cv:text-cv-ink-tertiary cv:cursor-pointer"
                  onClick={() => setStep('stats')}
                >
                  Voir mes stats →
                </button>
                <button
                  type="button"
                  className="cv:w-full cv:text-center cv:text-[12px] cv:font-medium cv:text-cv-blue cv:cursor-pointer"
                  onClick={() => setStep('hard_paywall')}
                >
                  Simuler fin d'essai
                </button>
              </div>
            </div>
          )}

          {step === 'stats' && (
            <div className="cv:mx-auto cv:max-w-lg cv:px-5 cv:pt-8 cv:pb-10">
              <button
                type="button"
                onClick={() => setStep('home')}
                className="cv:mb-6 cv:text-[13px] cv:font-medium cv:text-cv-blue cv:cursor-pointer"
              >
                ← Accueil
              </button>
              <h1 className="cv-display cv:mb-6 cv:text-[28px] cv:text-cv-ink">Progression</h1>
              <ProgressStats
                stats={{
                  totalMeters: weekMeters || 5400,
                  sessionsDone: sessions.filter((s) => s.done).length || 4,
                  streak: streak || 3,
                  weeksCompleted: 1,
                  consistencyPct: 78,
                  bestWeekMeters: 4200,
                }}
              />
            </div>
          )}

          {step === 'hard_paywall' && (
            <HardPaywall
              weekReached={5}
              totalWeeks={totalWeeks}
              onSubscribe={() => {
                window.location.href = '/tarifs'
              }}
              onRestore={() => setStep('home')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <SoftPaywall
        open={showSoftPaywall}
        context={softContext}
        onClose={() => setShowSoftPaywall(false)}
        onSubscribe={() => {
          setShowSoftPaywall(false)
          window.location.href = '/tarifs'
        }}
      />

      {showCelebration ? (
        <SessionCompleteCelebration
          meters={lastMeters}
          streak={Math.max(1, streak)}
          onContinue={afterCelebration}
          onSeePremium={() => {
            setShowCelebration(false)
            setSoftContext('after_first_session')
            setShowSoftPaywall(true)
          }}
        />
      ) : null}
    </div>
  )
}

export default ConversionFlow
