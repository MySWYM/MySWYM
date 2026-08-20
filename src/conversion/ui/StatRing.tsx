import { motion } from 'framer-motion'
import { ringDraw } from '../motion'

interface Props {
  value: number
  max: number
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
  color?: string
}

export function StatRing({
  value,
  max,
  size = 120,
  stroke = 8,
  label,
  sublabel,
  color = '#006bfd',
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0

  return (
    <div className="cv:relative cv:inline-flex cv:items-center cv:justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="cv:-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,20,25,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          variants={ringDraw}
          initial="hidden"
          animate="show"
          style={{ strokeDashoffset: c * (1 - pct) }}
        />
      </svg>
      <div className="cv:absolute cv:inset-0 cv:flex cv:flex-col cv:items-center cv:justify-center cv:text-center cv:px-2">
        {label ? (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="cv-display cv:text-[28px] cv:leading-none cv:text-cv-ink"
          >
            {label}
          </motion.span>
        ) : null}
        {sublabel ? (
          <span className="cv:mt-1 cv:text-[11px] cv:font-medium cv:text-cv-ink-tertiary cv:uppercase cv:tracking-[0.06em]">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
