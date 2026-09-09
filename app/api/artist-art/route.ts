import { fetchArtistBanner, fetchArtistPortrait, type ArtKind } from '@/lib/artist-art'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const name = url.searchParams.get('name')?.trim()
  const kind = (url.searchParams.get('kind') === 'banner' ? 'banner' : 'portrait') as ArtKind
  if (!name) return Response.json({ url: null }, { status: 400 })

  try {
    const art = kind === 'banner' ? await fetchArtistBanner(name) : await fetchArtistPortrait(name)
    return Response.json(
      { url: art },
      {
        headers: {
          'Cache-Control': art
            ? 'public, max-age=86400, stale-while-revalidate=604800'
            : 'public, max-age=60',
        },
      },
    )
  } catch {
    return Response.json({ url: null }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }
}
