import { artistsMatch, guessFitsQuery, isJunkArtist, isStudioTrack, suggestionFitsQuery } from '@/lib/catalog-quality'
import { deezerArtistHits, deezerFindArtist, deezerJson, type HearTrack } from '@/lib/deezer'
import { normalizeGuess, songCoreTitle } from '@/lib/game'

export type GuessHit = {
  id: string
  title: string
  artist: string
  album?: string
  artwork?: string | null
}

type DeezerSong = {
  id?: number
  title?: string
  rank?: number
  artist?: { name?: string }
  album?: { title?: string; cover_small?: string; cover_medium?: string }
}

const MIN_TRACK_RANK = 150_000

function hitKey(hit: Pick<GuessHit, 'title' | 'artist'>) {
  return `${normalizeGuess(songCoreTitle(hit.title))}:${normalizeGuess(hit.artist)}`
}

function fromDeezer(rows: DeezerSong[]): Array<GuessHit & { rank: number }> {
  return rows.flatMap((row) => {
    const title = row.title?.trim()
    const artist = row.artist?.name?.trim()
    const rank = row.rank ?? 0
    if (!title || !artist || !row.id || rank < MIN_TRACK_RANK) return []
    if (!isStudioTrack({ title, artist, album: row.album?.title }) || isJunkArtist(artist)) return []
    return [
      {
        id: `dz-${row.id}`,
        title,
        artist,
        album: row.album?.title,
        artwork: row.album?.cover_small || row.album?.cover_medium || null,
        rank,
      },
    ]
  })
}

function keepCanonical(hits: Array<GuessHit & { rank: number }>): GuessHit[] {
  const best = new Map<string, number>()
  for (const hit of hits) {
    const key = normalizeGuess(songCoreTitle(hit.title))
    best.set(key, Math.max(best.get(key) ?? 0, hit.rank))
  }
  return hits
    .filter((hit) => {
      const key = normalizeGuess(songCoreTitle(hit.title))
      const top = best.get(key) ?? 0
      return hit.rank >= Math.max(MIN_TRACK_RANK, top * 0.8)
    })
    .map(({ rank: _rank, ...hit }) => hit)
}

function preferExactTitle(hits: GuessHit[], needle: string) {
  const coreOf = (title: string) => normalizeGuess(songCoreTitle(title))
  const exact = hits.filter((hit) => coreOf(hit.title) === needle)
  if (exact.length) return exact
  return hits.filter((hit) => {
    const core = coreOf(hit.title)
    return core === needle || core.startsWith(needle)
  })
}

function asGuessHit(track: HearTrack): GuessHit {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artwork: track.artworkUrl,
  }
}

function artistLooksLikeQuery(query: string, artist: string) {
  const needle = normalizeGuess(query)
  const name = normalizeGuess(artist)
  if (!needle || !name) return false
  if (artistsMatch(query, artist)) return true
  return needle.length >= 4 && name.startsWith(needle)
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
      const core = normalizeGuess(songCoreTitle(hit.title))
      if (`${core} ${artist}` === needle || `${artist} ${core}` === needle) score += 22
      if (core === needle) score += 16
      if (artist === needle) score += 10
      if (artist.startsWith(needle)) score += 8
      if (title === needle) score += 7
      if (title.startsWith(needle)) score += 5
      if (needle.includes(core) && needle.includes(artist)) score += 14
      if (artist.includes(needle)) score += 4
      if (title.includes(needle) || core.includes(needle)) score += 3
      if (hit.artwork) score += 1
      return { hit, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.hit)
}

function asSuggestions(hits: GuessHit[], term: string) {
  return rankSongs(hits, term).filter((hit) => suggestionFitsQuery(term, hit))
}

export async function searchGuesses(query: string): Promise<GuessHit[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const needle = normalizeGuess(term)
  const [trackData, named] = await Promise.all([
    deezerJson<{ data?: DeezerSong[] }>(`/search/track?q=${encodeURIComponent(term)}&limit=25`),
    needle.length >= 3 ? deezerFindArtist(term, 200_000) : Promise.resolve(null),
  ])

  const searched = fromDeezer(trackData?.data ?? [])
  const fitted = searched.filter((hit) => guessFitsQuery(term, hit))
  const combo = fitted.filter((hit) => {
    const core = normalizeGuess(songCoreTitle(hit.title))
    const artist = normalizeGuess(hit.artist)
    return core.length >= 3 && artist.length >= 3 && needle.includes(core) && needle.includes(artist)
  })
  if (combo.length) return asSuggestions(keepCanonical(combo), term).slice(0, 8)

  const byArtist = fitted.filter((hit) => artistLooksLikeQuery(term, hit.artist))
  const titleExact = fitted.filter((hit) => normalizeGuess(songCoreTitle(hit.title)) === needle)
  const titleFromOthers = titleExact.filter((hit) => !artistLooksLikeQuery(term, hit.artist))
  const otherTitleRank = Math.max(0, ...titleFromOthers.map((hit) => hit.rank))
  const artistRank = Math.max(0, ...byArtist.map((hit) => hit.rank))
  const artistQuery =
    (Boolean(named && artistLooksLikeQuery(term, named.name)) || byArtist.length >= 3) &&
    !(otherTitleRank > artistRank && otherTitleRank >= 250_000)

  const fromArtist =
    artistQuery && named && artistLooksLikeQuery(term, named.name)
      ? (await deezerArtistHits(named.id)).map(asGuessHit)
      : []

  const byTitle = preferExactTitle(
    keepCanonical(fitted.filter((hit) => normalizeGuess(hit.title).includes(needle))),
    needle,
  )

  const remote = artistQuery ? mergeHits([fromArtist, keepCanonical(byArtist)]) : mergeHits([keepCanonical(fitted), byTitle])
  return asSuggestions(remote, term).slice(0, 16)
}
