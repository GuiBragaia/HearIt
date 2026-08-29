const FALLBACK_PREVIEW =
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ed/23/1f/ed231f7c-78cb-3b4d-f312-fc6b7ec09063/mzaf_14579022326895349191.plus.aac.p.m4a'

export type DailyTrack = {
  previewUrl: string
  artworkUrl: string | null
}

const cache = new Map<string, DailyTrack>()

export function upsizeArt(url?: string) {
  if (!url) return null
  return url.replace(/\d+x\d+bb/, '600x600bb')
}

export async function resolveDailyTrack(song?: { id: string; title: string; artist: string }): Promise<DailyTrack> {
  const title = song?.title ?? 'Everybody Wants to Rule the World'
  const artist = song?.artist ?? 'Tears for Fears'
  const key = song?.id ?? `${title}-${artist}`
  const hit = cache.get(key)
  if (hit) return hit
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&entity=song&limit=8`,
      { cache: 'force-cache' },
    )
    const data = (await response.json()) as {
      results?: Array<{
        trackName?: string
        artistName?: string
        previewUrl?: string
        artworkUrl100?: string
      }>
    }
    const original = data.results?.find(
      (row) =>
        (row.trackName ?? '').toLowerCase() === title.toLowerCase() &&
        (row.artistName ?? '').toLowerCase() === artist.toLowerCase() &&
        row.previewUrl,
    )
    const row = original ?? data.results?.find((item) => item.previewUrl)
    const track = {
      previewUrl: row?.previewUrl ?? FALLBACK_PREVIEW,
      artworkUrl: upsizeArt(row?.artworkUrl100),
    }
    cache.set(key, track)
    return track
  } catch {
    const track = { previewUrl: FALLBACK_PREVIEW, artworkUrl: null }
    cache.set(key, track)
    return track
  }
}
