import { Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '../motion'
import { Button } from './Button'

interface Props {
  weekNumber: number
  sessionCount?: number
  metersHint?: string
  onUnlock: () => void
}

/** Soft-locked week, visible outline, no dark pattern blur spam */
export function LockedWeek({ weekNumber, sessionCount = 3, metersHint = '~6-8 km', onUnlock }: Props) {
  return (
    <motion.div
      variants={fadeUp}
      className="cv:relative cv:overflow-hidden cv:rounded-cv-lg cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:p-4"
    >
      <div className="cv:flex cv:items-start cv:justify-between cv:gap-3">
        <div>
          <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
            Semaine {weekNumber}
          </p>
          <p className="cv-display cv:mt-1 cv:text-[22px] cv:text-cv-ink">Suite du plan</p>
          <p className="cv:mt-1 cv:text-[13px] cv:text-cv-ink-secondary">
            {sessionCount} séances · {metersHint}
          </p>
        </div>
        <div className="cv:flex cv:h-10 cv:w-10 cv:items-center cv:justify-center cv:rounded-cv-sm cv:bg-cv-blue-soft">
          <Lock size={18} className="cv:text-cv-blue" aria-hidden />
        </div>
      </div>
      <div className="cv:mt-4 cv:flex cv:items-center cv:gap-2">
        <div className="cv:h-1.5 cv:flex-1 cv:rounded-full cv:bg-black/5">
          <div className="cv:h-full cv:w-0 cv:rounded-full cv:bg-cv-blue" />
        </div>
        <span className="cv:text-[12px] cv:font-medium cv:text-cv-ink-tertiary">Premium</span>
      </div>
      <Button fullWidth variant="secondary" className="cv:mt-4" onClick={onUnlock}>
        Continuer mon plan
      </Button>
    </motion.div>
  )
}
