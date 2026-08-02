import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { fadeUp } from '../motion'
import { ProgressDots } from './ProgressDots'

interface Props {
  children: ReactNode
  step?: number
  total?: number
  onBack?: () => void
  title: string
  subtitle?: string
  footer?: ReactNode
  progressLabel?: string
}

export function ScreenShell({
  children,
  step,
  total,
  onBack,
  title,
  subtitle,
  footer,
  progressLabel,
}: Props) {
  return (
    <div className="cv:mx-auto cv:flex cv:min-h-dvh cv:w-full cv:max-w-lg cv:flex-col cv:px-5 cv:pt-[max(16px,env(safe-area-inset-top))] cv:pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="cv:flex cv:min-h-11 cv:items-center cv:gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="cv:flex cv:h-11 cv:w-11 cv:-ml-2 cv:items-center cv:justify-center cv:rounded-full cv:text-cv-ink cv:cursor-pointer hover:cv:bg-black/5"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="cv:w-11" />
        )}
        {step && total ? (
          <div className="cv:flex-1">
            <ProgressDots step={step} total={total} label={progressLabel} />
          </div>
        ) : (
          <div className="cv:flex-1" />
        )}
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="cv:mt-6 cv:flex-1">
        <h1 className="cv-display cv:text-[32px] cv:leading-[1.08] cv:text-cv-ink md:cv:text-[36px]">{title}</h1>
        {subtitle ? (
          <p className="cv:mt-3 cv:max-w-[34ch] cv:text-[15px] cv:leading-relaxed cv:text-cv-ink-secondary">
            {subtitle}
          </p>
        ) : null}
        <div className="cv:mt-8">{children}</div>
      </motion.div>

      {footer ? <div className="cv:mt-8 cv:pt-2">{footer}</div> : null}
    </div>
  )
}
