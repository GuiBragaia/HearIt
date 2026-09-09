import { normalizeGuess, songCoreTitle } from '@/lib/game'

const KEY = (owner: string) => `hear-it-nonstop-heard:${owner}`
const MAX = 600
const LOCAL = 'local'

export type HeardCatalog = { ids: string[]; keys: string[] }

export function nonstopTrackKey(track: { title: string; artist: string }) {
  return `${normalizeGuess(songCoreTitle(track.title))}:${normalizeGuess(track.artist)}`
}

export function heardOwner(userId?: string | null) {
  return userId?.trim() || LOCAL
}

function emptyHeard(): HeardCatalog {
  return { ids: [], keys: [] }
}

function asStrings(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function parseHeard(raw: string | null): HeardCatalog {
  if (!raw) return emptyHeard()
  try {
    const data = JSON.parse(raw) as unknown
    if (Array.isArray(data)) {
      return { ids: asStrings(data).slice(-MAX), keys: [] }
    }
    if (data && typeof data === 'object') {
      const row = data as { ids?: unknown; keys?: unknown }
      return {
        ids: asStrings(row.ids).slice(-MAX),
        keys: asStrings(row.keys).slice(-MAX),
      }
    }
  } catch {
    return emptyHeard()
  }
  return emptyHeard()
}

function appendUnique(prev: string[], incoming: string[]) {
  const seen = new Set(prev)
  const next = [...prev]
  for (const item of incoming) {
    if (!item || seen.has(item)) continue
    seen.add(item)
    next.push(item)
  }
  return next.slice(-MAX)
}

export function readHeard(owner: string): HeardCatalog {
  if (typeof window === 'undefined') return emptyHeard()
  return parseHeard(window.localStorage.getItem(KEY(owner)))
}

export function rememberHeard(owner: string, tracks: Array<{ id: string; title: string; artist: string }>) {
  if (typeof window === 'undefined' || !tracks.length) return
  const prev = readHeard(owner)
  const next: HeardCatalog = {
    ids: appendUnique(prev.ids, tracks.map((track) => track.id)),
    keys: appendUnique(prev.keys, tracks.map(nonstopTrackKey)),
  }
  window.localStorage.setItem(KEY(owner), JSON.stringify(next))
}
