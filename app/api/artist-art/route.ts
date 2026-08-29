import { fetchArtistPortrait } from '@/lib/artist-art'

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name')?.trim()
  if (!name) return Response.json({ url: null }, { status: 400 })

  try {
    const url = await fetchArtistPortrait(name)
    return Response.json(
      { url },
      {
        headers: {
          'Cache-Control': url
            ? 'public, max-age=86400, stale-while-revalidate=604800'
            : 'public, max-age=60',
        },
      },
    )
  } catch {
    return Response.json({ url: null }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }
}
