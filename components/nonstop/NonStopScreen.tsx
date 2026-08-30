'use client'

import { useState } from 'react'
import { NonStopBoard } from '@/components/nonstop/NonStopBoard'
import { NonStopGate } from '@/components/nonstop/NonStopGate'
import { NonStopLobby } from '@/components/nonstop/NonStopLobby'
import { useSession } from '@/components/auth/session-context'
import { HearLoading } from '@/components/states/HearLoading'
import type { HearTrack } from '@/lib/deezer'

export function NonStopScreen() {
  const { user, ready } = useSession()
  const [queue, setQueue] = useState<HearTrack[] | null>(null)

  if (!ready) return <HearLoading />
  if (!user) return <NonStopGate />
  if (!queue) return <NonStopLobby onPlay={setQueue} />
  return <NonStopBoard initialQueue={queue} />
}
