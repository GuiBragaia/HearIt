'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function shuffle(hints: string[], avoid: string) {
  const next = [...hints]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  if (next[0] === avoid && next.length > 1) {
    const swap = next.findIndex((hint) => hint !== avoid)
    if (swap > 0) [next[0], next[swap]] = [next[swap], next[0]]
  }
  return next
}

export function DevBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const hints = t.profile.devHints
  const bag = useRef<string[]>([])
  const last = useRef('')
  const open = useRef(false)
  const [hot, setHot] = useState(false)
  const [tip, setTip] = useState(hints[0])

  useEffect(() => {
    bag.current = []
  }, [hints])

  const show = () => {
    if (open.current) return
    open.current = true
    if (bag.current.length === 0) bag.current = shuffle(hints, last.current)
    const drawn = bag.current.shift() ?? hints[0]
    last.current = drawn
    setTip(drawn)
    setHot(true)
  }

  const hide = () => {
    open.current = false
    setHot(false)
  }

  return (
    <span
      className={cn('dev-badge shrink-0', compact && 'is-compact', hot && 'is-hot')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
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
            {tip}
          </motion.i>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
