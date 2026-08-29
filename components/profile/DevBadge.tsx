'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function DevBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [hot, setHot] = useState(false)

  return (
    <span
      className={cn('dev-badge shrink-0', compact && 'is-compact', hot && 'is-hot')}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      tabIndex={0}
    >
      {t.profile.dev}
      <AnimatePresence>
        {hot ? (
          <motion.i
            className="dev-badge-tip"
            initial={reduce ? { x: '-50%' } : { opacity: 0, x: '-50%', y: 8 }}
            animate={{ opacity: 1, x: '-50%', y: 0 }}
            exit={reduce ? { opacity: 0, x: '-50%' } : { opacity: 0, x: '-50%', y: 6 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.profile.devHint}
          </motion.i>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
