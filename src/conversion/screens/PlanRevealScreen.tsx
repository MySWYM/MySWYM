import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Target, Waves } from 'lucide-react'
import { fadeScale, fadeUp, stagger } from '../motion'
import { Button } from '../ui/Button'
import type { GoalId, LevelId } from '../tokens'
import { GOALS, LEVELS } from '../tokens'

interface Props {
  goal: GoalId
  level: LevelId
  frequency: number
  totalWeeks: number
  onContinue: () => void
}

const BUILD_LINES = [
  'Analyse de ton objectif…',
  'Calibrage du volume…',
  'Construction des phases…',
  'Personnalisation des séances…',
]

export function PlanRevealScreen({ goal, level, frequency, totalWeeks, onContinue }: Props) {
  const [phase, setPhase] = useState<'building' | 'ready'>('building')
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    const lineTimer = window.setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, BUILD_LINES.length - 1))
    }, 420)
    const readyTimer = window.setTimeout(() => setPhase('ready'), 1800)
    return () => {
      clearInterval(lineTimer)
      clearTimeout(readyTimer)
    }
  }, [])

  const goalLabel = GOALS.find((g) => g.id === goal)?.title ?? ''
  const levelLabel = LEVELS.find((l) => l.id === level)?.title ?? ''

  return (
    <div className="cv:mx-auto cv:flex cv:min-h-dvh cv:w-full cv:max-w-lg cv:flex-col cv:px-5 cv:pt-[max(32px,env(safe-area-inset-top))] cv:pb-[max(24px,env(safe-area-inset-bottom))]">
      <AnimatePresence mode="wait">
        {phase === 'building' ? (
          <motion.div
            key="building"
            variants={fadeScale}
            initial="hidden"
            animate="show"
            exit="exit"
            className="cv:flex cv:flex-1 cv:flex-col cv:items-center cv:justify-center cv:text-center"
          >
            <motion.div
              className="cv:h-14 cv:w-14 cv:rounded-full cv:border-2 cv:border-cv-blue/20 cv:border-t-cv-blue"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            />
            <p className="cv-display cv:mt-8 cv:text-[28px] cv:text-cv-ink">Préparation de ton plan</p>
            <p className="cv:mt-3 cv:text-[14px] cv:text-cv-ink-secondary">{BUILD_LINES[lineIdx]}</p>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            variants={stagger}
            initial="hidden"
            animate="show"
            className="cv:flex cv:flex-1 cv:flex-col"
          >
            <motion.p variants={fadeUp} className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.1em] cv:text-cv-mint">
              Plan prêt
            </motion.p>
            <motion.h1 variants={fadeUp} className="cv-display cv:mt-2 cv:text-[36px] cv:leading-[1.05] cv:text-cv-ink">
              Voici ton chemin.
            </motion.h1>
            <motion.p variants={fadeUp} className="cv:mt-3 cv:text-[15px] cv:text-cv-ink-secondary">
              {totalWeeks} semaines · {frequency}× / semaine · adapté à ton niveau
            </motion.p>

            <motion.div variants={fadeUp} className="cv:mt-8 cv:space-y-3">
              <MetaRow icon={<Target size={18} />} label="Objectif" value={goalLabel} />
              <MetaRow icon={<Waves size={18} />} label="Niveau" value={levelLabel} />
              <MetaRow icon={<CalendarDays size={18} />} label="Essai Premium" value="7 jours · carte requise" />
            </motion.div>

            {/* Mini timeline — value before paywall */}
            <motion.div variants={fadeUp} className="cv:mt-8 cv:rounded-cv-lg cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:p-4">
              <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
                Aperçu
              </p>
              <div className="cv:mt-4 cv:flex cv:items-end cv:gap-1.5 cv:h-16">
                {Array.from({ length: Math.min(12, totalWeeks) }, (_, i) => {
                  const h = 28 + ((i * 17) % 36)
                  return (
                    <div
                      key={i}
                      className="cv:flex-1 cv:rounded-t-md"
                      style={{
                        height: h,
                        background: '#355da3',
                        opacity: 0.35 + (i / Math.min(12, totalWeeks)) * 0.65,
                      }}
                      title={`Semaine ${i + 1}`}
                    />
                  )
                })}
              </div>
              <div className="cv:mt-3 cv:flex cv:justify-between cv:text-[11px] cv:text-cv-ink-tertiary">
                <span>S1 — base</span>
                <span>S4 — gratuit</span>
                <span>Suite · Premium</span>
              </div>
            </motion.div>

            <div className="cv:mt-auto cv:pt-10">
              <Button fullWidth onClick={onContinue}>
                Voir ma première séance
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="cv:flex cv:items-center cv:gap-3 cv:rounded-cv-md cv:bg-cv-bg-elevated cv:border cv:border-cv-border cv:px-3.5 cv:py-3">
      <span className="cv:flex cv:h-9 cv:w-9 cv:items-center cv:justify-center cv:rounded-cv-sm cv:bg-cv-blue-soft cv:text-cv-blue">
        {icon}
      </span>
      <div>
        <p className="cv:text-[11px] cv:font-medium cv:text-cv-ink-tertiary">{label}</p>
        <p className="cv:text-[14px] cv:font-semibold cv:text-cv-ink">{value}</p>
      </div>
    </div>
  )
}
