import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../motion'

interface Option {
  id: string
  title: string
  subtitle?: string
}

interface Props {
  options: Option[]
  value: string | null
  onChange: (id: string) => void
  columns?: 1 | 2
}

export function ChoiceGrid({ options, value, onChange, columns = 1 }: Props) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={
        columns === 2
          ? 'cv:grid cv:grid-cols-2 cv:gap-3'
          : 'cv:flex cv:flex-col cv:gap-3'
      }
    >
      {options.map((opt) => {
        const selected = value === opt.id
        return (
          <motion.button
            key={opt.id}
            type="button"
            variants={fadeUp}
            onClick={() => onChange(opt.id)}
            className={[
              'cv:relative cv:text-left cv:rounded-cv-lg cv:border cv:px-4 cv:py-4',
              'cv:transition-colors cv:duration-200 cv:cursor-pointer',
              'cv:focus-visible:outline cv:focus-visible:outline-2 cv:focus-visible:outline-offset-2 cv:focus-visible:outline-cv-blue',
              selected
                ? 'cv:border-cv-blue cv:bg-cv-blue-soft cv:shadow-cv-sm'
                : 'cv:border-cv-border cv:bg-cv-bg-elevated hover:cv:border-cv-border-strong',
            ].join(' ')}
          >
            <div className="cv:flex cv:items-start cv:justify-between cv:gap-3">
              <div>
                <p className="cv:text-[15px] cv:font-semibold cv:text-cv-ink cv:leading-snug">{opt.title}</p>
                {opt.subtitle ? (
                  <p className="cv:mt-1 cv:text-[13px] cv:text-cv-ink-secondary cv:leading-snug">{opt.subtitle}</p>
                ) : null}
              </div>
              <span
                className={[
                  'cv:mt-0.5 cv:flex cv:h-5 cv:w-5 cv:shrink-0 cv:items-center cv:justify-center cv:rounded-full cv:border',
                  selected ? 'cv:border-cv-blue cv:bg-cv-blue' : 'cv:border-cv-border-strong cv:bg-transparent',
                ].join(' ')}
              >
                {selected ? <Check size={12} className="cv:text-white" strokeWidth={3} /> : null}
              </span>
            </div>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
