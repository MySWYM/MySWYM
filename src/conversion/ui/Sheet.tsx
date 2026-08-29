import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { overlayVariants, sheetVariants } from '../motion'

interface Props {
  open: boolean
  onClose?: () => void
  children: ReactNode
  /** Allow dismiss by tapping overlay, soft paywalls should be dismissible */
  dismissible?: boolean
}

export function Sheet({ open, onClose, children, dismissible = true }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="cv:fixed cv:inset-0 cv:z-50 cv:flex cv:items-end cv:justify-center">
          <motion.button
            type="button"
            aria-label="Fermer"
            className="cv:absolute cv:inset-0 cv:bg-cv-overlay cv:border-0 cv:cursor-pointer"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="cv:relative cv:w-full cv:max-w-lg cv:max-h-[92dvh] cv:overflow-y-auto cv:bg-cv-bg-elevated cv:rounded-t-cv-xl cv:shadow-cv-sheet cv:px-5 cv:pt-3 cv:pb-[max(24px,env(safe-area-inset-bottom))]"
          >
            <div className="cv:mx-auto cv:mb-4 cv:h-1 cv:w-9 cv:rounded-full cv:bg-white/20" />
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
