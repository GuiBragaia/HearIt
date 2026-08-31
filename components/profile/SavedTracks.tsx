'use client'

import { useState } from 'react'
import { useSession } from '@/components/auth/session-context'
import { useI18n } from '@/lib/i18n'
import type { SavedTrack } from '@/lib/saved-tracks'

function SavedArt({ src, alt }: { src: string | null; alt: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <span className="saved-track-empty" aria-hidden />
  return <img src={src} alt={alt} onError={() => setBroken(true)} />
}

export function SavedTracks({
  value,
  editable = false,
}: {
  value: SavedTrack[]
  editable?: boolean
}) {
  const { t } = useI18n()
  const { saveLibrary } = useSession()

  if (!value.length && !editable) return null

  return (
    <div className="profile-favs saved-tracks">
      <p className="profile-favs-kicker">
        {t.profile.savedSongs}
        {value.length ? <span>{value.length}</span> : null}
      </p>
      <p className="saved-tracks-private">{t.profile.savedPrivate}</p>
      {value.length === 0 ? (
        <p className="saved-tracks-empty">{t.profile.savedEmpty}</p>
      ) : (
        <ol className="saved-track-list">
          {value.map((track) => (
            <li key={track.id} className="saved-track">
              <span className="saved-track-art">
                <SavedArt src={track.artworkUrl} alt={`${track.title} — ${track.artist}`} />
              </span>
              <span className="saved-track-copy">
                <b>{track.title}</b>
                <em>{track.artist}</em>
              </span>
              {editable ? (
                <button
                  type="button"
                  className="saved-track-drop"
                  onClick={() => {
                    void saveLibrary(value.filter((item) => item.id !== track.id))
                  }}
                >
                  {t.profile.unsaveSong}
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
