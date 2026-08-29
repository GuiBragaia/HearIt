import { catalog } from '@/lib/mock'
import { normalizeGuess } from '@/lib/game'
import { itunesSearch, itunesThumb } from '@/lib/apple'

export type GuessHit = {
  id: string
  title: string
  artist: string
  album?: string
  artwork?: string | null
}

type ItunesSong = {
  wrapperType?: string
  kind?: string
  trackId?: number
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl60?: string
  artworkUrl100?: string
}

function coverSrc(url?: string | null) {
  const src = itunesThumb(url ?? undefined)
  if (!src) return null
  return `/api/cover?u=${encodeURIComponent(src)}`
}

function hitKey(hit: Pick<GuessHit, 'title' | 'artist'>) {
  return `${normalizeGuess(hit.title)}:${normalizeGuess(hit.artist)}`
}

function fromItunes(rows: ItunesSong[]): GuessHit[] {
  return rows
    .filter((row) => {
      if (!row.trackName || !row.artistName) return false
      if (row.kind && row.kind !== 'song') return false
      const album = (row.collectionName ?? '').toLowerCase()
      if (album.includes('karaoke') || album.includes('tribute')) return false
      return true
    })
    .map((row) => ({
      id: `it-${row.trackId ?? `${row.trackName}-${row.artistName}`}`,
      title: row.trackName ?? '',
      artist: row.artistName ?? '',
      album: row.collectionName,
      artwork: coverSrc(row.artworkUrl60 || row.artworkUrl100),
    }))
}

function fromCatalog(query: string): GuessHit[] {
  const needle = normalizeGuess(query)
  if (needle.length < 2) return []
  return catalog
    .filter((song) => {
      const title = normalizeGuess(song.title)
      const artist = normalizeGuess(song.artist)
      const aliases = song.aliases.map(normalizeGuess)
      return title.includes(needle) || artist.includes(needle) || aliases.some((alias) => alias.includes(needle))
    })
    .map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
    }))
}

function mergeHits(groups: GuessHit[][]) {
  const seen = new Set<string>()
  const out: GuessHit[] = []
  for (const group of groups) {
    for (const hit of group) {
      const key = hitKey(hit)
      if (seen.has(key)) {
        const existing = out.find((item) => hitKey(item) === key)
        if (existing && !existing.artwork && hit.artwork) existing.artwork = hit.artwork
        continue
      }
      seen.add(key)
      out.push(hit)
    }
  }
  return out
}

function rankSongs(hits: GuessHit[], query: string) {
  const needle = normalizeGuess(query)
  return hits
    .map((hit) => {
      const title = normalizeGuess(hit.title)
      const artist = normalizeGuess(hit.artist)
      let score = 0
      if (artist === needle) score += 8
      if (artist.startsWith(needle)) score += 6
      if (title === needle) score += 7
      if (title.startsWith(needle)) score += 5
      if (artist.includes(needle)) score += 4
      if (title.includes(needle)) score += 3
      if (hit.artwork) score += 1
      return { hit, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.hit)
}

export async function searchGuesses(query: string): Promise<GuessHit[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const local = fromCatalog(term)
  try {
    const rows = await itunesSearch(term, { entity: 'song', limit: '20' })
    const itunesSongs = fromItunes(rows as ItunesSong[])
    return rankSongs(mergeHits([local, itunesSongs]), term).slice(0, 16)
  } catch {
    return local.slice(0, 16)
  }
}

export function catalogHits(query: string) {
  return fromCatalog(query)
}
