import { LEVELS, type LevelId, type PoolId } from '../tokens'
import { ChoiceGrid } from '../ui/ChoiceGrid'
import { ScreenShell } from '../ui/ScreenShell'
import { Button } from '../ui/Button'

interface Props {
  level: LevelId | null
  pool: PoolId
  onLevel: (id: LevelId) => void
  onPool: (pool: PoolId) => void
  onNext: () => void
  onBack: () => void
  step: number
  total: number
}

export function LevelScreen({ level, pool, onLevel, onPool, onNext, onBack, step, total }: Props) {
  return (
    <ScreenShell
      step={step}
      total={total}
      onBack={onBack}
      title="Où en es-tu ?"
      subtitle="Niveau et bassin, pour calibrer distances et intensité."
      footer={
        <Button fullWidth disabled={!level} onClick={onNext}>
          Continuer
        </Button>
      }
    >
      <ChoiceGrid
        options={LEVELS}
        value={level}
        onChange={(id) => onLevel(id as LevelId)}
      />

      <p className="cv:mt-8 cv:mb-3 cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
        Longueur du bassin
      </p>
      <div className="cv:grid cv:grid-cols-2 cv:gap-3">
        {([25, 50] as PoolId[]).map((p) => {
          const selected = pool === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPool(p)}
              className={[
                'cv:rounded-cv-lg cv:border cv:px-4 cv:py-4 cv:text-left cv:cursor-pointer',
                selected
                  ? 'cv:border-cv-blue cv:bg-cv-blue-soft'
                  : 'cv:border-cv-border cv:bg-cv-bg-elevated',
              ].join(' ')}
            >
              <p className="cv-display cv:text-[28px] cv:text-cv-ink">{p}</p>
              <p className="cv:text-[13px] cv:text-cv-ink-secondary">mètres</p>
            </button>
          )
        })}
      </div>
    </ScreenShell>
  )
}
