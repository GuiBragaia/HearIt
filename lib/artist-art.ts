import { itunesSearch } from '@/lib/apple'

const artCache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | null>>()
const waiters: Array<() => void> = []
let active = 0
const MAX = 2
const EMPTY_HASH = 'd41d8cd98f00b204e9800998ecf8427e'

export type ArtKind = 'portrait' | 'banner'

function runQueued<T>(work: () => Promise<T>) {
  if (active >= MAX) {
    return new Promise<T>((resolve, reject) => {
      waiters.push(() => {
        void runQueued(work).then(resolve, reject)
      })
    })
  }
  active += 1
  return work().finally(() => {
    active -= 1
    waiters.shift()?.()
  })
}

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function isRealPic(url?: string | null) {
  if (!url) return false
  if (url.includes(EMPTY_HASH)) return false
  if (url.includes('/images/artist//')) return false
  return true
}

function firstHttp(...urls: Array<string | null | undefined>) {
  return urls.find((url) => url && url.startsWith('http') && isRealPic(url)) ?? null
}

function deezerHiRes(url?: string | null) {
  if (!url || !isRealPic(url)) return null
  return url.replace(/\/\d+x\d+(-)/, '/1200x1200$1')
}

function itunesHiRes(url?: string | null) {
  if (!url || !url.startsWith('http')) return null
  return url.replace(/\d+x\d+bb/, '1000x1000bb')
}

async function safeArt(work: () => Promise<string | null>) {
  try {
    return await work()
  } catch {
    return null
  }
}

async function fromDeezer(name: string) {
  const response = await fetch(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=12`,
    { cache: 'force-cache' },
  )
  const data = (await response.json()) as {
    data?: Array<{
      name?: string
      nb_fan?: number
      picture_medium?: string
      picture_big?: string
      picture_xl?: string
    }>
  }
  const rows = (data.data ?? []).filter((row) =>
    isRealPic(row.picture_xl || row.picture_big || row.picture_medium),
  )
  const exact = rows.filter((row) => sameName(row.name ?? '', name))
  const pool = (exact.length ? exact : rows).slice().sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))
  const match = pool[0]
  return deezerHiRes(match?.picture_xl || match?.picture_big || match?.picture_medium)
}

async function fromDeezerAlbum(name: string) {
  const response = await fetch(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(name)}&limit=10`,
    { cache: 'force-cache' },
  )
  const data = (await response.json()) as {
    data?: Array<{
      artist?: { name?: string }
      cover_xl?: string
      cover_big?: string
      cover_medium?: string
    }>
  }
  const rows = data.data ?? []
  const match = rows.find((row) => sameName(row.artist?.name ?? '', name))
  if (!match) return null
  return deezerHiRes(match.cover_xl || match.cover_big || match.cover_medium)
}

type AudioArtist = {
  strArtist?: string
  strArtistThumb?: string
  strArtistFanart?: string
  strArtistFanart2?: string
  strArtistFanart3?: string
  strArtistWideThumb?: string
}

async function audioArtist(name: string) {
  const response = await fetch(
    `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(name)}`,
    { cache: 'force-cache' },
  )
  const data = (await response.json()) as { artists?: AudioArtist[] }
  const rows = data.artists ?? []
  return rows.find((row) => sameName(row.strArtist ?? '', name)) ?? rows[0] ?? null
}

async function fromAudioDb(name: string) {
  const match = await audioArtist(name)
  const url = match?.strArtistThumb || null
  return url && url.startsWith('http') ? url : null
}

async function fromAudioDbBanner(name: string) {
  const match = await audioArtist(name)
  if (!match) return null
  return firstHttp(
    match.strArtistFanart,
    match.strArtistFanart2,
    match.strArtistFanart3,
    match.strArtistWideThumb,
  )
}

async function fromItunesAlbum(name: string) {
  const results = (await itunesSearch(name, { entity: 'album', limit: '8' })) as Array<{
    artistName?: string
    artworkUrl100?: string
  }>
  const match = results.find((row) => sameName(row.artistName ?? '', name)) ?? results[0]
  return itunesHiRes(match?.artworkUrl100)
}

export async function fetchArtistPortrait(name: string) {
  return (await safeArt(() => fromDeezer(name))) || (await safeArt(() => fromAudioDb(name)))
}

export async function fetchArtistBanner(name: string) {
  return (
    (await safeArt(() => fromAudioDbBanner(name))) ||
    (await safeArt(() => fromDeezer(name))) ||
    (await safeArt(() => fromDeezerAlbum(name))) ||
    (await safeArt(() => fromItunesAlbum(name)))
  )
}

export function resolveArtistArt(name: string, kind: ArtKind = 'portrait') {
  const key = `${kind}:${name.toLowerCase()}`
  if (artCache.has(key) && artCache.get(key)) return Promise.resolve(artCache.get(key) ?? null)
  if (artCache.get(key) === null) artCache.delete(key)
  const running = pending.get(key)
  if (running) return running

  const request = runQueued(async () => {
    try {
      const params = new URLSearchParams({ name, kind, v: '3' })
      const response = await fetch(`/api/artist-art?${params}`)
      const data = (await response.json()) as { url?: string | null }
      const url = data.url ?? null
      const next = isRealPic(url) ? url : null
      artCache.set(key, next)
      return next
    } catch {
      artCache.set(key, null)
      return null
    } finally {
      pending.delete(key)
    }
  })

  pending.set(key, request)
  return request
}
