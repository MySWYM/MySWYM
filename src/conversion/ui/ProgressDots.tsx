import { motion } from 'framer-motion'

interface Props {
  step: number
  total: number
  label?: string
}

export function ProgressDots({ step, total, label }: Props) {
  return (
    <div className="cv:flex cv:items-center cv:justify-between cv:gap-4 cv:w-full">
      {label ? (
        <span className="cv:text-[11px] cv:font-semibold cv:uppercase cv:tracking-[0.08em] cv:text-cv-ink-tertiary">
          {label}
        </span>
      ) : (
        <span className="cv:text-[13px] cv:font-medium cv:text-cv-ink-secondary">
          {step}/{total}
        </span>
      )}
      <div className="cv:flex cv:items-center cv:gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, i) => {
          const active = i < step
          return (
            <motion.span
              key={i}
              animate={{
                width: active && i === step - 1 ? 20 : 6,
                backgroundColor: active ? '#355da3' : 'rgba(15,20,25,0.12)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="cv:h-1.5 cv:rounded-full"
            />
          )
        })}
      </div>
    </div>
  )
}
