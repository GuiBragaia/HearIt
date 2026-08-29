'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export function ScoreDisplay({
  value,
  size = 'sm',
}: {
  value: number
  size?: 'sm' | 'lg'
}) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    const start = performance.now()
    const from = 0
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200)
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(from + (value - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduce])

  if (size === 'lg') {
    return <span className="display text-[64px] text-primary sm:text-[80px]">+{shown}</span>
  }

  return <span className="mono text-[11px] text-muted-foreground">{shown}</span>
}
