import { Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '../motion'
import { Button } from '../ui/Button'

interface Props {
  meters: number
  weeksCompleted: number
  streak: number
  goalLabel: string
  shareUrl?: string
  onShare: () => void
}

/** Viral share card, Strava-style wrap, Apple aesthetic */
export function ShareProgressCard({
  meters,
  weeksCompleted,
  streak,
  goalLabel,
  shareUrl = 'https://myswym.app',
  onShare,
}: Props) {
  const km = (meters / 1000).toFixed(1)

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="cv:w-full">
      <div
        className="cv:relative cv:overflow-hidden cv:rounded-cv-xl cv:p-5 cv:text-white"
        style={{
          background: 'linear-gradient(145deg, #003d99 0%, #006bfd 45%, #3d8fff 100%)',
        }}
      >
        <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.12em] cv:text-white/60">
          mySWYM
        </p>
        <p className="cv-display cv:mt-3 cv:text-[36px] cv:leading-none">{km} km</p>
        <p className="cv:mt-2 cv:text-[14px] cv:text-white/80">{goalLabel}</p>

        <div className="cv:mt-6 cv:grid cv:grid-cols-2 cv:gap-3">
          <Stat label="Semaines" value={String(weeksCompleted)} />
          <Stat label="Série" value={`${streak} j`} />
        </div>

        <p className="cv:mt-5 cv:text-[11px] cv:text-white/45">{shareUrl.replace('https://', '')}</p>
      </div>

      <Button fullWidth className="cv:mt-4" variant="secondary" onClick={onShare}>
        <Share2 size={16} />
        Partager ma progression
      </Button>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cv:rounded-cv-md cv:bg-white/10 cv:px-3 cv:py-2.5">
      <p className="cv:text-[10px] cv:font-semibold cv:uppercase cv:tracking-wider cv:text-white/55">{label}</p>
      <p className="cv-display cv:mt-0.5 cv:text-[22px]">{value}</p>
    </div>
  )
}
