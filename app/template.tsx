'use client'

import { useReducedMotion } from 'motion/react'
import { useRouteMotion } from '@/components/layout/route-motion'
import { cn } from '@/lib/utils'

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const { direction } = useRouteMotion()
  const sliding = !reduce && direction !== 0

  return (
    <div className={cn('route-page', sliding && (direction > 0 ? 'is-forward' : 'is-back'))}>
      {children}
    </div>
  )
}
