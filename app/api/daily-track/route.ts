import { resolveDailyTrack } from '@/lib/deezer'
import { songForDay } from '@/lib/songs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')?.trim() ?? ''
  const title = url.searchParams.get('title')?.trim() ?? ''
  const artist = url.searchParams.get('artist')?.trim() ?? ''
  const song = id && title && artist ? { id, title, artist } : songForDay()

  try {
    const track = await resolveDailyTrack(song)
    if (!track.previewUrl) {
      return Response.json({ previewUrl: '', artworkUrl: null }, { status: 404 })
    }
    return Response.json(track, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    })
  } catch {
    return Response.json({ previewUrl: '', artworkUrl: null }, { status: 502 })
  }
}
