import { Check, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { PREMIUM_FEATURES, tokens } from '../tokens'
import { fadeUp, stagger } from '../motion'
import { Button } from '../ui/Button'

interface Props {
  weekReached: number
  totalWeeks: number
  onSubscribe: (plan: 'monthly' | 'annual') => void
  onRestore?: () => void
}

export function HardPaywall({ weekReached, totalWeeks, onSubscribe, onRestore }: Props) {
  const remaining = Math.max(0, totalWeeks - weekReached + 1)
  const { monthly, annual } = tokens.pricing

  return (
    <div className="cv:mx-auto cv:flex cv:min-h-dvh cv:w-full cv:max-w-lg cv:flex-col cv:px-5 cv:pt-[max(32px,env(safe-area-inset-top))] cv:pb-[max(24px,env(safe-area-inset-bottom))]">
      <motion.div variants={stagger} initial="hidden" animate="show" className="cv:flex cv:flex-1 cv:flex-col">
        <motion.div
          variants={fadeUp}
          className="cv:flex cv:h-14 cv:w-14 cv:items-center cv:justify-center cv:rounded-2xl cv:bg-cv-ink"
        >
          <Lock size={24} className="cv:text-cv-gold" />
        </motion.div>

        <motion.h1 variants={fadeUp} className="cv-display cv:mt-6 cv:text-[34px] cv:leading-[1.05] cv:text-cv-ink">
          Active ton essai Premium
        </motion.h1>
        <motion.p variants={fadeUp} className="cv:mt-3 cv:text-[15px] cv:leading-relaxed cv:text-cv-ink-secondary">
          Essai 7 jours avec carte requise, puis {monthly.label}/mois sans engagement
          {remaining > 0 ? ` · encore ${remaining} semaine${remaining > 1 ? 's' : ''} de plan à débloquer` : ''}.
        </motion.p>

        <motion.div variants={fadeUp} className="cv:mt-8 cv:rounded-cv-lg cv:bg-cv-ink cv:p-5 cv:text-white">
          <p className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.1em] cv:text-white/50">
            Premium mensuel
          </p>
          <p className="cv-display cv:mt-2 cv:text-[36px] cv:leading-none">
            {monthly.label}
            <span className="cv:text-[16px] cv:font-cv-body cv:font-medium cv:text-white/60"> / mois</span>
          </p>
          <p className="cv:mt-1 cv:text-[13px] cv:text-white/55">sans engagement · annule quand tu veux</p>

          <ul className="cv:mt-5 cv:space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="cv:flex cv:gap-2.5">
                <Check size={16} className="cv:mt-0.5 cv:shrink-0 cv:text-cv-gold" />
                <span className="cv:text-[13px] cv:text-white/90">{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="cv:mt-auto cv:space-y-3 cv:pt-10">
          <p className="cv:text-[11px] cv:leading-relaxed cv:text-cv-ink-tertiary">
            Abonnement à reconduction tacite. En continuant tu acceptes les{' '}
            <a href="/cgv" className="cv:font-semibold cv:text-cv-ink" target="_blank" rel="noopener noreferrer">CGV</a>
            {' '}et{' '}
            <a href="/cgu" className="cv:font-semibold cv:text-cv-ink" target="_blank" rel="noopener noreferrer">CGU</a>
            . L’accès immédiat peut faire perdre le droit de rétractation (voir CGV).
          </p>
          <Button fullWidth variant="premium" onClick={() => onSubscribe('monthly')}>
            Continuer — {monthly.label}/mois
          </Button>
          <Button fullWidth variant="secondary" onClick={() => onSubscribe('annual')}>
            Annuel — {annual.label} · pas de remboursement*
          </Button>
          {onRestore ? (
            <button
              type="button"
              onClick={onRestore}
              className="cv:w-full cv:py-2 cv:text-center cv:text-[12px] cv:font-medium cv:text-cv-ink-tertiary cv:cursor-pointer"
            >
              Restaurer un achat
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
