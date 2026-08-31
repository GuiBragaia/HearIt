import { resolveDailyTrack } from '@/lib/deezer'
import { songForDay } from '@/lib/songs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')?.trim() ?? ''
  const title = url.searchParams.get('title')?.trim() ?? ''
  const artist = url.searchParams.get('artist')?.trim() ?? ''
  const today = songForDay()
  const song =
    id && title && artist
      ? { id, title, artist, deezerId: today.id === id ? today.deezerId : undefined }
      : today

  try {
    const track = await resolveDailyTrack(song)
    if (!track.previewUrl) {
      return Response.json({ previewUrl: '', artworkUrl: null }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(track, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json({ previewUrl: '', artworkUrl: null }, { status: 502 })
  }
}
