'use client'

import { DevBadge } from '@/components/profile/DevBadge'
import { StreamerBadge } from '@/components/profile/StreamerBadge'
import { isGameDev, streamerUrl } from '@/lib/session'

export function NameBadges({ handle, compact = false }: { handle?: string | null; compact?: boolean }) {
  const twitch = streamerUrl(handle)
  return (
    <>
      {isGameDev(handle) ? <DevBadge compact={compact} /> : null}
      {twitch ? <StreamerBadge compact={compact} href={twitch} /> : null}
    </>
  )
}
