import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { checkPop, fadeUp, springSnappy } from '../motion'
import { Button } from '../ui/Button'

interface Props {
  meters: number
  streak: number
  onContinue: () => void
  /** Soft invite, never forced */
  onSeePremium?: () => void
}

export function SessionCompleteCelebration({ meters, streak, onContinue, onSeePremium }: Props) {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(12)
      } catch {
        /* ignore */
      }
    }
  }, [])

  return (
    <div className="cv:fixed cv:inset-0 cv:z-40 cv:flex cv:items-center cv:justify-center cv:bg-cv-bg/95 cv:px-5 cv:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springSnappy}
        className="cv:w-full cv:max-w-sm cv:text-center"
      >
        <motion.div
          variants={checkPop}
          initial="hidden"
          animate="show"
          className="cv:mx-auto cv:flex cv:h-16 cv:w-16 cv:items-center cv:justify-center cv:rounded-full cv:bg-cv-mint"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            />
          </svg>
        </motion.div>

        <motion.h2 variants={fadeUp} initial="hidden" animate="show" className="cv-display cv:mt-6 cv:text-[32px] cv:text-cv-ink">
          Séance validée
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="cv:mt-2 cv:text-[15px] cv:text-cv-ink-secondary"
        >
          +{meters} m · série de {streak} jour{streak > 1 ? 's' : ''}
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="cv:mx-auto cv:mt-6 cv:h-1 cv:w-24 cv:origin-left cv:rounded-full cv:bg-cv-mint"
        />

        <div className="cv:mt-8 cv:space-y-3">
          <Button fullWidth onClick={onContinue}>
            Continuer
          </Button>
          {onSeePremium ? (
            <Button fullWidth variant="ghost" onClick={onSeePremium}>
              Garder ce rythme avec Premium
            </Button>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
