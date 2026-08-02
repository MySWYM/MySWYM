import { motion } from 'framer-motion'
import { Flame, Trophy, Waves } from 'lucide-react'
import { fadeUp, stagger } from '../motion'
import { StatRing } from '../ui/StatRing'
import { LockedWeek } from '../ui/LockedWeek'
import { Button } from '../ui/Button'

interface SessionTeaser {
  id: string
  title: string
  meters: number
  done?: boolean
}

interface Props {
  firstName?: string
  streak: number
  weekMeters: number
  weekGoalMeters: number
  weekNumber: number
  sessions: SessionTeaser[]
  showLockedPreview?: boolean
  onOpenSession: (id: string) => void
  onUpgrade: () => void
}

export function HomeHabitScreen({
  firstName = '',
  streak,
  weekMeters,
  weekGoalMeters,
  weekNumber,
  sessions,
  showLockedPreview,
  onOpenSession,
  onUpgrade,
}: Props) {
  const greeting = firstName ? `Salut ${firstName}` : 'Salut'
  const next = sessions.find((s) => !s.done) ?? sessions[0]

  return (
    <div className="cv:mx-auto cv:w-full cv:max-w-lg cv:px-5 cv:pb-28 cv:pt-[max(20px,env(safe-area-inset-top))]">
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="cv:flex cv:items-start cv:justify-between">
          <div>
            <p className="cv:text-[13px] cv:font-medium cv:text-cv-ink-secondary">{greeting}</p>
            <h1 className="cv-display cv:mt-0.5 cv:text-[28px] cv:text-cv-ink">Prêt à nager ?</h1>
          </div>
          {streak > 0 ? (
            <div className="cv:flex cv:items-center cv:gap-1.5 cv:rounded-cv-full cv:bg-cv-gold-soft cv:px-3 cv:py-1.5">
              <Flame size={14} className="cv:text-cv-gold" />
              <span className="cv:text-[13px] cv:font-bold cv:text-cv-ink">{streak}</span>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="cv:mt-6 cv:flex cv:items-center cv:gap-5 cv:rounded-cv-xl cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:p-5 cv:shadow-cv-sm"
        >
          <StatRing
            value={weekMeters}
            max={weekGoalMeters}
            label={`${Math.round((weekMeters / Math.max(weekGoalMeters, 1)) * 100)}%`}
            sublabel="semaine"
            size={100}
            stroke={7}
          />
          <div>
            <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
              Semaine {weekNumber}
            </p>
            <p className="cv-display cv:mt-1 cv:text-[26px] cv:text-cv-ink">
              {weekMeters}
              <span className="cv:text-[14px] cv:font-cv-body cv:font-medium cv:text-cv-ink-tertiary"> / {weekGoalMeters} m</span>
            </p>
            <p className="cv:mt-1 cv:text-[13px] cv:text-cv-ink-secondary">
              {sessions.filter((s) => s.done).length}/{sessions.length} séances
            </p>
          </div>
        </motion.div>

        {next ? (
          <motion.div variants={fadeUp} className="cv:mt-5">
            <p className="cv:mb-2 cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
              Prochaine séance
            </p>
            <button
              type="button"
              onClick={() => onOpenSession(next.id)}
              className="cv:flex cv:w-full cv:items-center cv:gap-3 cv:rounded-cv-lg cv:border cv:border-cv-blue/20 cv:bg-cv-blue-soft cv:p-4 cv:text-left cv:cursor-pointer"
            >
              <span className="cv:flex cv:h-11 cv:w-11 cv:items-center cv:justify-center cv:rounded-cv-sm cv:bg-cv-blue cv:text-white">
                <Waves size={20} />
              </span>
              <div className="cv:flex-1">
                <p className="cv:text-[15px] cv:font-semibold cv:text-cv-ink">{next.title}</p>
                <p className="cv:text-[13px] cv:text-cv-ink-secondary">{next.meters} m</p>
              </div>
            </button>
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="cv:mt-6 cv:space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenSession(s.id)}
              className="cv:flex cv:w-full cv:items-center cv:justify-between cv:rounded-cv-md cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:px-4 cv:py-3.5 cv:text-left cv:cursor-pointer"
            >
              <div className="cv:flex cv:items-center cv:gap-3">
                <span
                  className={[
                    'cv:h-2.5 cv:w-2.5 cv:rounded-full',
                    s.done ? 'cv:bg-cv-mint' : 'cv:bg-cv-blue/30',
                  ].join(' ')}
                />
                <span className="cv:text-[14px] cv:font-medium cv:text-cv-ink">{s.title}</span>
              </div>
              <span className="cv:text-[12px] cv:text-cv-ink-tertiary">{s.meters} m</span>
            </button>
          ))}
        </motion.div>

        {showLockedPreview ? (
          <motion.div variants={fadeUp} className="cv:mt-6">
            <LockedWeek weekNumber={5} onUnlock={onUpgrade} />
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="cv:mt-6 cv:rounded-cv-lg cv:border cv:border-dashed cv:border-cv-border-strong cv:p-4">
          <div className="cv:flex cv:items-center cv:gap-2">
            <Trophy size={16} className="cv:text-cv-gold" />
            <p className="cv:text-[13px] cv:font-semibold cv:text-cv-ink">Badges cette semaine</p>
          </div>
          <p className="cv:mt-1 cv:text-[12px] cv:text-cv-ink-secondary">
            Valide 2 séances pour débloquer « Régulier ».
          </p>
        </motion.div>

        <div className="cv:mt-4">
          <Button fullWidth variant="ghost" onClick={onUpgrade}>
            Voir Premium
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
