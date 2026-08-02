import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../motion'
import { StatRing } from '../ui/StatRing'

export interface ProgressSnapshot {
  totalMeters: number
  sessionsDone: number
  streak: number
  weeksCompleted: number
  consistencyPct: number
  bestWeekMeters: number
}

interface Props {
  stats: ProgressSnapshot
}

/** Profile / home stats — progression sensation without overwhelm */
export function ProgressStats({ stats }: Props) {
  const km = (stats.totalMeters / 1000).toFixed(1)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="cv:space-y-4">
      <motion.div
        variants={fadeUp}
        className="cv:flex cv:items-center cv:justify-between cv:rounded-cv-xl cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:p-5"
      >
        <div>
          <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
            Distance totale
          </p>
          <p className="cv-display cv:mt-1 cv:text-[40px] cv:leading-none cv:text-cv-ink">{km}</p>
          <p className="cv:mt-1 cv:text-[13px] cv:text-cv-ink-secondary">kilomètres nagés</p>
        </div>
        <StatRing
          value={stats.consistencyPct}
          max={100}
          label={`${stats.consistencyPct}%`}
          sublabel="assiduité"
          size={96}
          stroke={7}
          color="#1aad7a"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="cv:grid cv:grid-cols-3 cv:gap-2.5">
        <MiniStat label="Séances" value={String(stats.sessionsDone)} />
        <MiniStat label="Série" value={`${stats.streak}j`} />
        <MiniStat label="Semaines" value={String(stats.weeksCompleted)} />
      </motion.div>

      <motion.div variants={fadeUp} className="cv:rounded-cv-lg cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:p-4">
        <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
          Meilleure semaine
        </p>
        <p className="cv-display cv:mt-1 cv:text-[24px] cv:text-cv-ink">{stats.bestWeekMeters} m</p>
        <p className="cv:mt-1 cv:text-[12px] cv:text-cv-ink-secondary">
          Volume record — un signal clair de progression.
        </p>
      </motion.div>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cv:rounded-cv-md cv:border cv:border-cv-border cv:bg-cv-bg-elevated cv:px-3 cv:py-3 cv:text-center">
      <p className="cv-display cv:text-[22px] cv:text-cv-ink">{value}</p>
      <p className="cv:mt-0.5 cv:text-[10px] cv:font-semibold cv:uppercase cv:tracking-wider cv:text-cv-ink-tertiary">
        {label}
      </p>
    </div>
  )
}
