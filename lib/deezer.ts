import { cachedJson } from '@/lib/apple'
import { artistsMatch, isJunkArtist, isStudioTrack, titlesMatch } from '@/lib/catalog-quality'
import { songCoreTitle } from '@/lib/game'

export type HearTrack = {
  id: string
  title: string
  artist: string
  previewUrl: string
  artworkUrl: string | null
  aliases: string[]
}

type DeezerArtist = {
  id?: number
  name?: string
  nb_fan?: number
}

type DeezerAlbum = {
  cover_medium?: string
  cover_xl?: string
  title?: string
}

type DeezerTrack = {
  id?: number
  title?: string
  preview?: string
  duration?: number
  artist?: DeezerArtist
  album?: DeezerAlbum
}

type DeezerList<T> = { data?: T[] }

const SKIP_TOP = 2
const TAKE_TOP = 10
const MIN_FANS = 400_000
const GENRE_CHARTS = [152, 116, 106, 85, 165]

export type DailyTrack = {
  previewUrl: string
  artworkUrl: string | null
}

const dailyCache = new Map<string, DailyTrack>()

export function proxiedPreview(url: string, trackId?: number) {
  if (trackId) return `/api/preview?id=${trackId}`
  try {
    const host = new URL(url).hostname
    if (!/(^|\.)dzcdn\.net$/i.test(host)) return url
  } catch {
    return url
  }
  return `/api/preview?u=${encodeURIComponent(url)}`
}

export function toHearTrack(row: DeezerTrack): HearTrack | null {
  const title = row.title?.trim()
  const artist = row.artist?.name?.trim()
  const previewUrl = row.preview?.trim()
  if (!title || !artist || !previewUrl) return null
  if (!row.id) return null
  if (!isStudioTrack({ title, artist, album: row.album?.title })) return null
  if ((row.duration ?? 0) > 0 && (row.duration ?? 0) < 60) return null
  const core = songCoreTitle(title)
  return {
    id: `dz-${row.id}`,
    title,
    artist,
    previewUrl: proxiedPreview(previewUrl, row.id),
    artworkUrl: row.album?.cover_xl || row.album?.cover_medium || null,
    aliases: core && core !== title ? [core] : [],
  }
}

export async function deezerJson<T>(path: string): Promise<T | null> {
  try {
    return (await cachedJson(`https://api.deezer.com${path}`, 5000)) as T
  } catch {
    return null
  }
}

export async function deezerFresh<T>(path: string, ms = 8000): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(`https://api.deezer.com${path}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const KEEP_GENRES = new Set([132, 116, 122, 152, 113, 165, 85, 106, 144, 129, 464, 169, 153])

export async function deezerGenres() {
  const data = await deezerJson<{ data?: Array<{ id?: number; name?: string }> }>('/genre')
  return (data?.data ?? []).flatMap((row) => {
    if (!row.id || !KEEP_GENRES.has(row.id) || !row.name) return []
    return [{ id: row.id, name: row.name }]
  })
}

export async function deezerChartTracks(chartId: number, limit = 50) {
  const data = await deezerFresh<DeezerList<DeezerTrack>>(`/chart/${chartId}/tracks?limit=${limit}`)
  return (data?.data ?? []).map(toHearTrack).filter((row): row is HearTrack => Boolean(row))
}

export async function deezerEditorialTracks(editorialId: number) {
  const data = await deezerFresh<{ tracks?: DeezerList<DeezerTrack> }>(`/editorial/${editorialId}/charts`)
  return (data?.tracks?.data ?? []).map(toHearTrack).filter((row): row is HearTrack => Boolean(row))
}

export async function deezerPlaylistTracks(playlistId: number, limit = 80) {
  const data = await deezerFresh<DeezerList<DeezerTrack>>(`/playlist/${playlistId}/tracks?limit=${limit}`)
  return (data?.data ?? []).map(toHearTrack).filter((row): row is HearTrack => Boolean(row))
}

function takeArtists(rows: DeezerArtist[] | undefined, out: Array<{ id: number; name: string }>, seen: Set<number>) {
  for (const row of rows ?? []) {
    if (!row.id || !row.name || seen.has(row.id) || isJunkArtist(row.name)) continue
    if (typeof row.nb_fan === 'number' && row.nb_fan < MIN_FANS) continue
    seen.add(row.id)
    out.push({ id: row.id, name: row.name })
  }
}

export async function deezerChartArtists() {
  const genres = [...GENRE_CHARTS].sort(() => Math.random() - 0.5).slice(0, 2)
  const [world, us, ...rest] = await Promise.all([
    deezerJson<{ artists?: DeezerList<DeezerArtist> }>('/editorial/0/charts'),
    deezerJson<{ artists?: DeezerList<DeezerArtist> }>('/editorial/8/charts'),
    ...genres.map((id) => deezerJson<DeezerList<DeezerArtist>>(`/chart/${id}/artists?limit=10`)),
  ])
  const seen = new Set<number>()
  const out: Array<{ id: number; name: string }> = []
  takeArtists(world?.artists?.data, out, seen)
  takeArtists(us?.artists?.data, out, seen)
  for (const genre of rest) takeArtists(genre?.data, out, seen)
  return out
}

export async function deezerFindArtist(name: string, minFans = 0) {
  const data = await deezerJson<DeezerList<DeezerArtist>>(
    `/search/artist?q=${encodeURIComponent(name)}&limit=8`,
  )
  const hit = (data?.data ?? []).find((row) => {
    if (!row.id || !row.name || isJunkArtist(row.name) || !artistsMatch(name, row.name)) return false
    if (minFans > 0 && (row.nb_fan ?? 0) < minFans) return false
    return true
  })
  if (!hit?.id || !hit.name) return null
  return { id: hit.id, name: hit.name }
}

export async function deezerArtistHits(artistId: number, take = 12) {
  const data = await deezerJson<DeezerList<DeezerTrack>>(`/artist/${artistId}/top?limit=25`)
  return (data?.data ?? [])
    .map(toHearTrack)
    .filter((row): row is HearTrack => Boolean(row))
    .slice(0, take)
}

export async function deezerArtistTop(artistId: number) {
  const data = await deezerJson<DeezerList<DeezerTrack>>(`/artist/${artistId}/top?limit=25`)
  return (data?.data ?? [])
    .map(toHearTrack)
    .filter((row): row is HearTrack => Boolean(row))
    .slice(SKIP_TOP, SKIP_TOP + TAKE_TOP)
}

export async function resolveDailyTrack(song?: { id: string; title: string; artist: string }): Promise<DailyTrack> {
  const title = song?.title ?? 'Everybody Wants to Rule the World'
  const artist = song?.artist ?? 'Tears for Fears'
  const key = song?.id ?? `${title}-${artist}`
  const hit = dailyCache.get(key)
  if (hit) return hit

  const core = songCoreTitle(title)
  const queries = [
    `/search/track?q=${encodeURIComponent(`track:"${core}" artist:"${artist}"`)}&limit=12`,
    `/search/track?q=${encodeURIComponent(`${core} ${artist}`)}&limit=15`,
  ]

  for (const path of queries) {
    const data = await deezerJson<DeezerList<DeezerTrack>>(path)
    const track = (data?.data ?? [])
      .map(toHearTrack)
      .find((row): row is HearTrack => Boolean(row) && titlesMatch(title, row.title) && artistsMatch(artist, row.artist))
    if (!track) continue
    const resolved = { previewUrl: track.previewUrl, artworkUrl: track.artworkUrl }
    dailyCache.set(key, resolved)
    return resolved
  }

  return { previewUrl: '', artworkUrl: null }
}

export async function deezerArtistPicks(artistId: number, skipIds: Set<string>, take = 2) {
  const tracks = (await deezerArtistTop(artistId)).filter((track) => !skipIds.has(track.id))
  return shuffle(tracks).slice(0, take)
}

function shuffle<T>(list: T[]) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = next[i]
    const b = next[j]
    if (a === undefined || b === undefined) continue
    next[i] = b
    next[j] = a
  }
  return next
}
