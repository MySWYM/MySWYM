import { motion } from 'framer-motion'
import { Waves } from 'lucide-react'
import { fadeUp, stagger } from '../motion'
import { Button } from '../ui/Button'

interface Props {
  onStart: () => void
  onSignIn?: () => void
}

export function WelcomeScreen({ onStart, onSignIn }: Props) {
  return (
    <div className="cv:relative cv:mx-auto cv:flex cv:min-h-dvh cv:w-full cv:max-w-lg cv:flex-col cv:overflow-hidden cv:px-5 cv:pb-[max(24px,env(safe-area-inset-bottom))] cv:pt-[max(24px,env(safe-area-inset-top))]">
      {/* Atmosphere, water gradient plane, full-bleed */}
      <div
        aria-hidden
        className="cv:pointer-events-none cv:absolute cv:inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(0, 107, 253, 0.28), transparent 42%), linear-gradient(180deg, #000514 0%, #06101f 70%, #000514 100%)',
        }}
      />
      <motion.div
        aria-hidden
        className="cv:pointer-events-none cv:absolute cv:-right-16 cv:top-24 cv:h-64 cv:w-64 cv:rounded-full cv:bg-cv-blue/10 cv:blur-3xl"
        animate={{ y: [0, 12, 0], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="cv:relative cv:z-10 cv:flex cv:flex-1 cv:flex-col">
        <motion.div variants={fadeUp} className="cv:flex cv:items-center cv:gap-2.5">
          <span className="cv:flex cv:h-9 cv:w-9 cv:items-center cv:justify-center cv:rounded-cv-sm cv:bg-cv-blue cv:text-white">
            <Waves size={18} />
          </span>
          <span className="cv-display cv:text-[22px] cv:tracking-tight cv:text-cv-ink">mySWYM</span>
        </motion.div>

        <div className="cv:mt-auto cv:pb-8">
          <motion.h1
            variants={fadeUp}
            className="cv-display cv:max-w-[12ch] cv:text-[44px] cv:leading-[0.98] cv:text-cv-ink md:cv:text-[52px]"
          >
            Ton coach natation, chaque longueur.
          </motion.h1>
          <motion.p variants={fadeUp} className="cv:mt-4 cv:max-w-[32ch] cv:text-[16px] cv:leading-relaxed cv:text-cv-ink-secondary">
            Un plan clair. Des séances qui progressent. La sensation d’avancer, dès la première semaine.
          </motion.p>
        </div>

        <motion.div variants={fadeUp} className="cv:relative cv:z-10 cv:space-y-3">
          <Button fullWidth onClick={onStart}>
            Créer mon plan
          </Button>
          {onSignIn ? (
            <Button fullWidth variant="ghost" onClick={onSignIn}>
              J’ai déjà un compte
            </Button>
          ) : null}
          <p className="cv:text-center cv:text-[12px] cv:text-cv-ink-tertiary">
            Essai Premium 7 jours · sans carte · puis dès 4,99€/mois
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
