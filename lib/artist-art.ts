const artCache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | null>>()
const waiters: Array<() => void> = []
let active = 0
const MAX = 2
const EMPTY_HASH = 'd41d8cd98f00b204e9800998ecf8427e'

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
    isRealPic(row.picture_big || row.picture_xl || row.picture_medium),
  )
  const exact = rows.filter((row) => sameName(row.name ?? '', name))
  const pool = (exact.length ? exact : rows).slice().sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))
  const match = pool[0]
  const url = match?.picture_big || match?.picture_xl || match?.picture_medium || null
  return isRealPic(url) ? url : null
}

async function fromAudioDb(name: string) {
  const response = await fetch(
    `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(name)}`,
    { cache: 'force-cache' },
  )
  const data = (await response.json()) as { artists?: Array<{ strArtist?: string; strArtistThumb?: string }> }
  const rows = data.artists ?? []
  const match = rows.find((row) => sameName(row.strArtist ?? '', name)) ?? rows[0]
  const url = match?.strArtistThumb || null
  return url && url.startsWith('http') ? url : null
}

export async function fetchArtistPortrait(name: string) {
  return (await safeArt(() => fromDeezer(name))) || (await safeArt(() => fromAudioDb(name)))
}

export function resolveArtistArt(name: string) {
  const key = name.toLowerCase()
  if (artCache.has(key) && artCache.get(key)) return Promise.resolve(artCache.get(key) ?? null)
  if (artCache.get(key) === null) artCache.delete(key)
  const running = pending.get(key)
  if (running) return running

  const request = runQueued(async () => {
    try {
      const response = await fetch(`/api/artist-art?name=${encodeURIComponent(name)}&v=2`)
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
