import type { HearTrack } from '@/lib/deezer'

const SEEN_CAP = 600

function clip(list: string[]) {
  return [...new Set(list.filter(Boolean))].slice(-SEEN_CAP)
}

export async function loadNonstopQueue(input: {
  favs: string[]
  exclude: string
  seenIds: string[]
  seenKeys: string[]
}) {
  const response = await fetch('/api/nonstop', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exclude: input.exclude,
      favs: input.favs,
      seenIds: clip(input.seenIds),
      seenKeys: clip(input.seenKeys),
    }),
  })
  if (!response.ok) throw new Error('queue')
  const data = (await response.json()) as { tracks?: HearTrack[] }
  return data.tracks ?? []
}

export async function previewReady(url: string) {
  if (!url) return false
  try {
    const response = await fetch(url, { cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

export async function prepareNonstopQueue(input: {
  favs: string[]
  exclude: string
  seenIds?: string[]
  seenKeys?: string[]
}) {
  const tracks = await loadNonstopQueue({
    ...input,
    seenIds: input.seenIds ?? [],
    seenKeys: input.seenKeys ?? [],
  })
  const head = tracks.slice(0, 6)
  const tail = tracks.slice(6)
  const checks = await Promise.all(head.map(async (track) => ({ track, ok: await previewReady(track.previewUrl) })))
  const ready = checks.filter((row) => row.ok).map((row) => row.track)
  if (ready.length) return [...ready, ...tail]

  for (let i = 0; i < tail.length; i += 4) {
    const batch = await Promise.all(
      tail.slice(i, i + 4).map(async (track) => ({ track, ok: await previewReady(track.previewUrl) })),
    )
    const hit = batch.filter((row) => row.ok).map((row) => row.track)
    if (hit[0]) return [...hit, ...tail.slice(i + 4)]
  }
  return []
}
