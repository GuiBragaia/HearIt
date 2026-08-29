'use client'

import { useRef, type ReactNode } from 'react'
import { resetDailyRun } from '@/lib/daily-run'
import { useSession } from '@/components/auth/session-context'

export function SecretReset({ children, className }: { children: ReactNode; className?: string }) {
  const taps = useRef<number[]>([])
  const { user } = useSession()

  const onClick = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((stamp) => now - stamp < 1600), now]
    if (taps.current.length < 5) return
    taps.current = []
    void resetDailyRun(user?.id)
  }

  return (
    <button type="button" className={className} onClick={onClick} tabIndex={-1}>
      {children}
    </button>
  )
}
