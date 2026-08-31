import { normalizeGuess, songCoreTitle } from '@/lib/game'

export type SavedTrack = {
  id: string
  title: string
  artist: string
  artworkUrl: string | null
  savedAt: number
}

const MAX = 48

function trackKey(track: Pick<SavedTrack, 'id' | 'title' | 'artist'>) {
  const core = `${normalizeGuess(songCoreTitle(track.title))}:${normalizeGuess(track.artist)}`
  return core.length > 3 ? core : track.id
}

export function sanitizeSavedTracks(raw: unknown) {
  if (!Array.isArray(raw)) return [] as SavedTrack[]
  const seenId = new Set<string>()
  const seenKey = new Set<string>()
  const next: SavedTrack[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<SavedTrack>
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const artist = typeof row.artist === 'string' ? row.artist.trim() : ''
    if (!id || !title || !artist) continue
    const key = trackKey({ id, title, artist })
    if (seenId.has(id) || seenKey.has(key)) continue
    seenId.add(id)
    seenKey.add(key)
    next.push({
      id,
      title,
      artist,
      artworkUrl: typeof row.artworkUrl === 'string' && row.artworkUrl ? row.artworkUrl : null,
      savedAt: typeof row.savedAt === 'number' && Number.isFinite(row.savedAt) ? row.savedAt : 0,
    })
    if (next.length >= MAX) break
  }
  return next
}

export function isTrackSaved(list: SavedTrack[], track: Pick<SavedTrack, 'id' | 'title' | 'artist'>) {
  const key = trackKey(track)
  return list.some((item) => item.id === track.id || trackKey(item) === key)
}

export function toggleSavedTrack(list: SavedTrack[], track: Omit<SavedTrack, 'savedAt'>) {
  if (isTrackSaved(list, track)) {
    const key = trackKey(track)
    return list.filter((item) => item.id !== track.id && trackKey(item) !== key)
  }
  return sanitizeSavedTracks([{ ...track, savedAt: Date.now() }, ...list])
}
