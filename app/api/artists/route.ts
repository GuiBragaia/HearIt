import { searchArtists } from '@/lib/artist-search'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  try {
    const hits = await searchArtists(query)
    return Response.json(
      { hits },
      { headers: { 'Cache-Control': 'public, max-age=180, stale-while-revalidate=600' } },
    )
  } catch {
    return Response.json({ hits: [] }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  }
}
