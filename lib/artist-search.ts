import { artists, slugifyArtist } from '@/lib/artists'
import { cachedJson, itunesSearch } from '@/lib/apple'
import { normalizeGuess } from '@/lib/game'

export type ArtistHit = {
  id: string
  name: string
  artwork?: string | null
}

type ItunesArtist = {
  artistId?: number
  artistName?: string
  artistType?: string
}

type DeezerArtist = {
  id?: number
  name?: string
  picture_medium?: string
  picture_small?: string
  nb_fan?: number
}

function slug(name: string) {
  return slugifyArtist(name)
}

function isBandOrSinger(name: string) {
  const value = name.trim()
  if (!value) return false
  if (/^various artists$/i.test(value)) return false
  if (/tribute|karaoke|feat\.|ft\./i.test(value)) return false
  return true
}

function keyOf(name: string) {
  return normalizeGuess(name)
}

function matchesQuery(name: string, query: string) {
  const needle = normalizeGuess(query)
  const value = normalizeGuess(name)
  return value.includes(needle) || needle.includes(value)
}

export async function searchArtists(query: string): Promise<ArtistHit[]> {
  const term = query.trim()
  const local = artists
    .filter((artist) => !term || artist.name.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 12)
    .map((artist) => ({ id: artist.id, name: artist.name }))

  if (term.length < 2) return local

  const [itunes, deezer] = await Promise.allSettled([
    itunesSearch(term, { entity: 'musicArtist', limit: '12' }),
    cachedJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(term)}&limit=12`),
  ])

  const apple =
    itunes.status === 'fulfilled'
      ? ((itunes.value as ItunesArtist[]) ?? [])
          .filter((row) => {
            if (!row.artistName || !isBandOrSinger(row.artistName)) return false
            if (!matchesQuery(row.artistName, term)) return false
            return !row.artistType || row.artistType === 'Artist'
          })
          .map((row) => ({
            id: slug(row.artistName ?? '') || `it-${row.artistId}`,
            name: row.artistName ?? '',
          }))
      : []

  const dzRows =
    deezer.status === 'fulfilled'
      ? (((deezer.value as { data?: DeezerArtist[] }).data ?? []) as DeezerArtist[])
          .filter((row) => row.name && isBandOrSinger(row.name) && matchesQuery(row.name, term))
          .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))
          .map((row) => ({
            id: slug(row.name ?? '') || `dz-${row.id}`,
            name: row.name ?? '',
            artwork: row.picture_small || row.picture_medium || null,
          }))
      : []

  const seen = new Set<string>()
  const out: ArtistHit[] = []
  for (const hit of [...local, ...dzRows, ...apple]) {
    const key = keyOf(hit.name)
    if (!key || seen.has(key)) {
      const existing = out.find((item) => keyOf(item.name) === key)
      if (existing && !existing.artwork && hit.artwork) existing.artwork = hit.artwork
      continue
    }
    seen.add(key)
    out.push(hit)
  }
  return out.slice(0, 16)
}
