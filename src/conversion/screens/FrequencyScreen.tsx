import { tokens } from '../tokens'
import { ScreenShell } from '../ui/ScreenShell'
import { Button } from '../ui/Button'

interface Props {
  value: number
  onChange: (n: number) => void
  onNext: () => void
  onBack: () => void
  step: number
  total: number
}

const OPTIONS = [2, 3, 4, 5]

export function FrequencyScreen({ value, onChange, onNext, onBack, step, total }: Props) {
  const freeMax = tokens.freemium.freeFreqMax

  return (
    <ScreenShell
      step={step}
      total={total}
      onBack={onBack}
      title="Combien de fois par semaine ?"
      subtitle={`Gratuit jusqu’à ${freeMax}×. Au-delà, Premium débloque la charge complète, sans te bloquer maintenant.`}
      footer={
        <Button fullWidth onClick={onNext}>
          Continuer
        </Button>
      }
    >
      <div className="cv:grid cv:grid-cols-4 cv:gap-2.5">
        {OPTIONS.map((n) => {
          const selected = value === n
          const premiumOnly = n > freeMax
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={[
                'cv:relative cv:flex cv:aspect-square cv:flex-col cv:items-center cv:justify-center cv:rounded-cv-lg cv:border cv:cursor-pointer',
                selected
                  ? 'cv:border-cv-blue cv:bg-cv-blue-soft'
                  : 'cv:border-cv-border cv:bg-cv-bg-elevated',
              ].join(' ')}
            >
              <span className="cv-display cv:text-[32px] cv:leading-none cv:text-cv-ink">{n}</span>
              {premiumOnly ? (
                <span className="cv:mt-1 cv:text-[9px] cv:font-bold cv:uppercase cv:tracking-wider cv:text-cv-gold">
                  Premium
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="cv:mt-4 cv:text-[13px] cv:leading-relaxed cv:text-cv-ink-secondary">
        {value > freeMax
          ? `Tu vises ${value}× : on génère ton plan complet. Les semaines 1-4 restent accessibles ; la suite se débloque avec Premium.`
          : `Parfait pour construire l’habitude. Tu pourras augmenter plus tard.`}
      </p>
    </ScreenShell>
  )
}
