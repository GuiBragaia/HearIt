type CacheEntry = { at: number; data: unknown }

const memory = new Map<string, CacheEntry>()
const TTL = 5 * 60_000

export async function cachedJson(url: string, ms = 1400) {
  const hit = memory.get(url)
  if (hit && Date.now() - hit.at < TTL) return hit.data
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error('search failed')
    const data = await response.json()
    memory.set(url, { at: Date.now(), data })
    if (memory.size > 200) {
      const first = memory.keys().next().value
      if (first) memory.delete(first)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

export function itunesThumb(url?: string) {
  if (!url) return null
  return url.replace(/\d+x\d+bb/, '60x60bb')
}

export async function itunesSearch(term: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    term,
    media: 'music',
    limit: '25',
    ...extra,
  })
  const data = (await cachedJson(`https://itunes.apple.com/search?${params}`, 4000)) as {
    results?: unknown[]
  }
  return data.results ?? []
}
