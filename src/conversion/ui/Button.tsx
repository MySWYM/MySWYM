import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { springSnappy } from '../motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'premium'

interface Props {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

const styles: Record<Variant, string> = {
  primary:
    'cv:bg-cv-blue cv:text-white cv:shadow-cv-md hover:cv:bg-cv-blue-deep active:cv:scale-[0.98]',
  secondary:
    'cv:bg-cv-blue-soft cv:text-cv-blue-deep hover:cv:bg-cv-blue-glow active:cv:scale-[0.98]',
  ghost:
    'cv:bg-transparent cv:text-cv-ink-secondary hover:cv:bg-white/8 active:cv:scale-[0.98]',
  premium:
    'cv:bg-cv-blue cv:text-white cv:shadow-cv-lg hover:cv:bg-cv-blue-deep active:cv:scale-[0.98]',
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  loading,
  className = '',
  disabled,
  type = 'button',
  onClick,
}: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={springSnappy}
      disabled={disabled || loading}
      className={[
        'cv:inline-flex cv:items-center cv:justify-center cv:gap-2',
        'cv:min-h-12 cv:px-6 cv:rounded-cv-md cv:font-cv-body',
        'cv:text-[15px] cv:font-semibold cv:tracking-[-0.01em]',
        'cv:transition-colors cv:duration-200 cv:cursor-pointer',
        'cv:disabled:opacity-50 cv:disabled:cursor-not-allowed',
        'cv:focus-visible:outline cv:focus-visible:outline-2 cv:focus-visible:outline-offset-2 cv:focus-visible:outline-cv-blue',
        fullWidth ? 'cv:w-full' : '',
        styles[variant],
        className,
      ].join(' ')}
    >
      {loading ? (
        <span className="cv:inline-block cv:h-4 cv:w-4 cv:rounded-full cv:border-2 cv:border-white/40 cv:border-t-white cv:animate-spin" />
      ) : null}
      {children}
    </motion.button>
  )
}
