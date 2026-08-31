import type { HearTrack } from '@/lib/deezer'

export async function loadNonstopQueue(input: { favs: string[]; exclude: string; seen: string[] }) {
  const params = new URLSearchParams()
  if (input.exclude) params.set('exclude', input.exclude)
  if (input.favs.length) params.set('favs', input.favs.join(','))
  if (input.seen.length) params.set('seen', input.seen.slice(-200).join(','))
  const response = await fetch(`/api/nonstop?${params}`, { cache: 'no-store' })
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

export async function prepareNonstopQueue(input: { favs: string[]; exclude: string; seen?: string[] }) {
  const tracks = await loadNonstopQueue({ ...input, seen: input.seen ?? [] })
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
