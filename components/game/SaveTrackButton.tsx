'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useSession } from '@/components/auth/session-context'
import { useI18n } from '@/lib/i18n'
import { isTrackSaved, toggleSavedTrack } from '@/lib/saved-tracks'
import { cn } from '@/lib/utils'

export function SaveTrackButton({
  id,
  title,
  artist,
  artworkUrl,
}: {
  id: string
  title: string
  artist: string
  artworkUrl?: string | null
}) {
  const { t } = useI18n()
  const { user, saveLibrary } = useSession()
  const [busy, setBusy] = useState(false)
  const [pop, setPop] = useState(false)
  const track = { id, title, artist, artworkUrl: artworkUrl ?? null }
  const saved = user ? isTrackSaved(user.savedTracks ?? [], track) : false

  if (!user) return null

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? t.game.savedSong : t.game.saveSong}
      onClick={() => {
        if (busy) return
        setBusy(true)
        setPop(true)
        window.setTimeout(() => setPop(false), 420)
        void saveLibrary(toggleSavedTrack(user.savedTracks ?? [], track)).finally(() => setBusy(false))
      }}
      className={cn('save-heart', saved && 'is-on', pop && 'is-pop')}
    >
      <span className="save-tip">{saved ? t.game.savedTip : t.game.saveTip}</span>
      <Heart size={22} strokeWidth={1.65} fill={saved ? 'currentColor' : 'transparent'} />
    </button>
  )
}
