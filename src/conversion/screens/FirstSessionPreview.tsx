import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Clock, Droplets } from 'lucide-react'
import { fadeUp, stagger } from '../motion'
import { Button } from '../ui/Button'

interface Props {
  title?: string
  distanceM?: number
  durationMin?: number
  blocks?: { label: string; detail: string }[]
  onStart: () => void
  onLater: () => void
}

const DEFAULT_BLOCKS = [
  { label: 'Échauffement', detail: '200 m souple · focus respiration' },
  { label: 'Technique', detail: '4×50 m éducatifs · pause 20″' },
  { label: 'Principal', detail: '6×100 m endurance · R :20' },
  { label: 'Retour au calme', detail: '100 m très souple' },
]

export function FirstSessionPreview({
  title = 'Séance 1 · Pose les bases',
  distanceM = 1100,
  durationMin = 35,
  blocks = DEFAULT_BLOCKS,
  onStart,
  onLater,
}: Props) {
  return (
    <div className="cv:mx-auto cv:flex cv:min-h-dvh cv:w-full cv:max-w-lg cv:flex-col cv:px-5 cv:pt-[max(24px,env(safe-area-inset-top))] cv:pb-[max(24px,env(safe-area-inset-bottom))]">
      <motion.div variants={stagger} initial="hidden" animate="show" className="cv:flex cv:flex-1 cv:flex-col">
        <motion.p variants={fadeUp} className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.1em] cv:text-cv-blue">
          Cette semaine
        </motion.p>
        <motion.h1 variants={fadeUp} className="cv-display cv:mt-2 cv:text-[32px] cv:leading-[1.08] cv:text-cv-ink">
          {title}
        </motion.h1>

        <motion.div variants={fadeUp} className="cv:mt-5 cv:flex cv:gap-3">
          <Pill icon={<Droplets size={14} />} text={`${distanceM} m`} />
          <Pill icon={<Clock size={14} />} text={`~${durationMin} min`} />
        </motion.div>

        <motion.div variants={fadeUp} className="cv:mt-8 cv:space-y-0 cv:overflow-hidden cv:rounded-cv-lg cv:border cv:border-cv-border cv:bg-cv-bg-elevated">
          {blocks.map((b, i) => (
            <div
              key={b.label}
              className={[
                'cv:px-4 cv:py-3.5',
                i < blocks.length - 1 ? 'cv:border-b cv:border-cv-border' : '',
              ].join(' ')}
            >
              <p className="cv:text-[13px] cv:font-semibold cv:text-cv-ink">{b.label}</p>
              <p className="cv:mt-0.5 cv:text-[13px] cv:text-cv-ink-secondary">{b.detail}</p>
            </div>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} className="cv:mt-5 cv:text-[13px] cv:leading-relaxed cv:text-cv-ink-secondary">
          Conseil coach : vise la régularité, pas la perf. Terminer la séance = déjà gagner.
        </motion.p>

        <div className="cv:mt-auto cv:space-y-3 cv:pt-10">
          <Button fullWidth onClick={onStart}>
            C’est parti — je nage
          </Button>
          <Button fullWidth variant="ghost" onClick={onLater}>
            Plus tard, montrer l’accueil
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function Pill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="cv:inline-flex cv:items-center cv:gap-1.5 cv:rounded-cv-full cv:bg-cv-blue-soft cv:px-3 cv:py-1.5 cv:text-[12px] cv:font-semibold cv:text-cv-blue-deep">
      {icon}
      {text}
    </span>
  )
}
