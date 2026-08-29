import { GOALS, type GoalId } from '../tokens'
import { ChoiceGrid } from '../ui/ChoiceGrid'
import { ScreenShell } from '../ui/ScreenShell'
import { Button } from '../ui/Button'

interface Props {
  value: GoalId | null
  onChange: (id: GoalId) => void
  onNext: () => void
  onBack: () => void
  step: number
  total: number
}

export function GoalScreen({ value, onChange, onNext, onBack, step, total }: Props) {
  return (
    <ScreenShell
      step={step}
      total={total}
      onBack={onBack}
      title="Quel est ton objectif ?"
      subtitle="On construit ton plan autour de ça, pas autour d’une moyenne."
      footer={
        <Button fullWidth disabled={!value} onClick={onNext}>
          Continuer
        </Button>
      }
    >
      <ChoiceGrid
        options={GOALS}
        value={value}
        onChange={(id) => onChange(id as GoalId)}
      />
    </ScreenShell>
  )
}
