import { artists, slugifyArtist } from '@/lib/artists'
import { isJunkArtist } from '@/lib/catalog-quality'
import { deezerJson } from '@/lib/deezer'
import { normalizeGuess } from '@/lib/game'

export type ArtistHit = {
  id: string
  name: string
  artwork?: string | null
}

type DeezerArtist = {
  id?: number
  name?: string
  picture_medium?: string
  picture_small?: string
  nb_fan?: number
}

const MIN_SEARCH_FANS = 80_000

function slug(name: string) {
  return slugifyArtist(name)
}

function isBandOrSinger(name: string) {
  const value = name.trim()
  if (!value) return false
  if (isJunkArtist(value)) return false
  if (/feat\.|ft\./i.test(value)) return false
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
  const local: ArtistHit[] = artists
    .filter((artist) => !term || artist.name.toLowerCase().includes(term.toLowerCase()))
    .filter((artist) => isBandOrSinger(artist.name))
    .slice(0, 12)
    .map((artist) => ({ id: artist.id, name: artist.name }))

  if (term.length < 2) return local

  const data = await deezerJson<{ data?: DeezerArtist[] }>(
    `/search/artist?q=${encodeURIComponent(term)}&limit=15`,
  )
  const remote: ArtistHit[] = (data?.data ?? [])
    .filter((row) => {
      if (!row.name || !isBandOrSinger(row.name) || !matchesQuery(row.name, term)) return false
      return (row.nb_fan ?? 0) >= MIN_SEARCH_FANS
    })
    .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))
    .map((row) => ({
      id: slug(row.name ?? '') || `dz-${row.id}`,
      name: row.name ?? '',
      artwork: row.picture_small || row.picture_medium || null,
    }))

  const seen = new Set<string>()
  const out: ArtistHit[] = []
  for (const hit of [...local, ...remote]) {
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
