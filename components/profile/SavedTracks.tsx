'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/components/auth/session-context'
import { useI18n } from '@/lib/i18n'
import type { SavedTrack } from '@/lib/saved-tracks'
import { Pager } from './Pager'

const LIBRARY_PAGE = 6

function SavedArt({ src, alt }: { src: string | null; alt: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <span className="saved-track-empty" aria-hidden />
  return <img src={src} alt={alt} onError={() => setBroken(true)} />
}

function matchesTrack(track: SavedTrack, query: string) {
  const token = query.trim().toLowerCase()
  if (!token) return true
  return track.title.toLowerCase().includes(token) || track.artist.toLowerCase().includes(token)
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
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const filtered = useMemo(() => value.filter((track) => matchesTrack(track, query)), [value, query])
  const pages = Math.max(1, Math.ceil(filtered.length / LIBRARY_PAGE))
  const safePage = Math.min(page, pages - 1)
  const visible = filtered.slice(safePage * LIBRARY_PAGE, safePage * LIBRARY_PAGE + LIBRARY_PAGE)

  useEffect(() => {
    setPage(0)
  }, [query])

  if (!value.length && !editable) return null

  return (
    <div className="profile-favs saved-tracks">
      <p className="profile-favs-kicker">
        {t.profile.savedSongs}
        {value.length ? <span>{value.length}</span> : null}
      </p>
      <p className="saved-tracks-private">{t.profile.savedPrivate}</p>
      {value.length > 0 ? (
        <input
          className="friend-find"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.profile.searchLibraryPh}
          aria-label={t.profile.searchLibrary}
        />
      ) : null}
      {value.length === 0 ? (
        <p className="saved-tracks-empty">{t.profile.savedEmpty}</p>
      ) : filtered.length === 0 ? (
        <p className="saved-tracks-empty">{t.profile.searchLibraryEmpty}</p>
      ) : (
        <>
          <ol className="saved-track-list">
            {visible.map((track) => (
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
          <Pager page={safePage} pages={pages} onPage={setPage} />
        </>
      )}
    </div>
  )
}