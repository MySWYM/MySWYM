import { Check, Sparkles, X } from 'lucide-react'
import { PREMIUM_FEATURES, tokens } from '../tokens'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'

interface Props {
  open: boolean
  onClose: () => void
  onSubscribe: (plan: 'monthly' | 'annual') => void
  context?: 'after_first_session' | 'streak' | 'week_unlock' | 'generic'
}

const COPY: Record<NonNullable<Props['context']>, { title: string; subtitle: string }> = {
  after_first_session: {
    title: 'Analyse terminée.',
    subtitle: 'Essai 7 jours sans carte, puis 4,99 €/mois sans engagement. Après l’essai, l’app se gèle.',
  },
  streak: {
    title: 'Ta progression est prête.',
    subtitle: 'Garde ton coach : 4,99 €/mois après l’essai sans carte.',
  },
  week_unlock: {
    title: 'Tes prochaines recommandations sont prêtes.',
    subtitle: 'Débloque l’analyse complète : 4,99 €/mois après l’essai.',
  },
  generic: {
    title: 'Garde ton coach personnel.',
    subtitle: 'Essai 7 jours · sans carte · puis 4,99 €/mois. Après l’essai, l’app se gèle.',
  },
}

/** Soft paywall — dismissible, value-first, no countdown dark patterns */
export function SoftPaywall({ open, onClose, onSubscribe, context = 'generic' }: Props) {
  const copy = COPY[context]
  const { annual, monthly } = tokens.pricing

  return (
    <Sheet open={open} onClose={onClose} dismissible>
      <div className="cv:flex cv:items-start cv:justify-between">
        <div className="cv:flex cv:h-10 cv:w-10 cv:items-center cv:justify-center cv:rounded-cv-sm cv:bg-cv-gold-soft">
          <Sparkles size={18} className="cv:text-cv-gold" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="cv:flex cv:h-10 cv:w-10 cv:items-center cv:justify-center cv:rounded-full cv:text-cv-ink-tertiary cv:cursor-pointer hover:cv:bg-black/5"
        >
          <X size={18} />
        </button>
      </div>

      <h2 className="cv-display cv:mt-4 cv:text-[28px] cv:leading-tight cv:text-cv-ink">{copy.title}</h2>
      <p className="cv:mt-2 cv:text-[14px] cv:leading-relaxed cv:text-cv-ink-secondary">{copy.subtitle}</p>

      <div className="cv:mt-6 cv:grid cv:grid-cols-2 cv:gap-2.5">
        <PlanCard
          title="Mensuel"
          price={monthly.label}
          period="/ mois · après l'essai"
          badge="Recommandé"
          highlight
          onClick={() => onSubscribe('monthly')}
        />
        <PlanCard
          title="Annuel"
          price={annual.label}
          period="/ an · pas de remboursement"
          onClick={() => onSubscribe('annual')}
        />
      </div>

      <ul className="cv:mt-6 cv:space-y-2.5">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="cv:flex cv:items-start cv:gap-2.5">
            <Check size={16} className="cv:mt-0.5 cv:shrink-0 cv:text-cv-blue" strokeWidth={2.5} />
            <span className="cv:text-[13px] cv:font-medium cv:text-cv-ink">{f}</span>
          </li>
        ))}
      </ul>

      <Button fullWidth variant="premium" className="cv:mt-6" onClick={() => onSubscribe('monthly')}>
        Continuer — {monthly.label}/mois
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="cv:mt-3 cv:w-full cv:py-3 cv:text-center cv:text-[13px] cv:font-medium cv:text-cv-ink-secondary cv:cursor-pointer"
      >
        Plus tard
      </button>
    </Sheet>
  )
}

function PlanCard({
  title,
  price,
  period,
  badge,
  highlight,
  onClick,
}: {
  title: string
  price: string
  period: string
  badge?: string
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'cv:relative cv:rounded-cv-lg cv:border cv:px-3 cv:py-3.5 cv:text-left cv:cursor-pointer',
        highlight ? 'cv:border-cv-blue cv:bg-cv-blue-soft' : 'cv:border-cv-border cv:bg-cv-bg',
      ].join(' ')}
    >
      {badge ? (
        <span className="cv:absolute cv:-top-2 cv:right-2 cv:rounded-full cv:bg-cv-blue cv:px-2 cv:py-0.5 cv:text-[10px] cv:font-bold cv:text-white">
          {badge}
        </span>
      ) : null}
      <div className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-wide cv:text-cv-ink-tertiary">{title}</div>
      <div className="cv:mt-1 cv:text-[20px] cv:font-bold cv:text-cv-ink">{price}</div>
      <div className="cv:mt-0.5 cv:text-[11px] cv:text-cv-ink-secondary">{period}</div>
    </button>
  )
}
